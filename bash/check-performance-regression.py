#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""性能退化门禁 —— 把 .perf-budget.json 的 timings 当作基线，判定本次实测是否退化超阈值。

起因（S8 / B0-7 副产物）：performance.yml 的"性能退化检测"一步调用本脚本，但脚本从未存在。
此前 check-ci 门禁逐行解析 workflow 时把 `run: |` 块误判成一条内容为 `|` 的行内命令，
块内命令全部逃出扫描，所以"引用了不存在的脚本"这件事没人看得见——一个永不执行的门禁，
比没有门禁更糟（本仓第 N 例）。

设计口径：
  * 基线 = 目标分支的 budgets[].timings[].budget（不是另一份手写常量）。
    因此本脚本与 web-vitals.spec.ts 共用同一事实源，杜绝阈值双源漂移。
  * fail-closed：输入缺失 / JSON 不可解析 / 无可对比指标 / 基线预算为 0，一律退出非 0，
    并说明怎么修。绝不因为"没数据"而静默通过——那是把门禁降级成装饰。
  * CLS 是无量纲分数，与 LCP/FCP/TTFB 一样按相对变化率判定，口径统一、不特殊照顾。

用法：
  python bash/check-performance-regression.py --baseline main-budget.json --current metrics.json --threshold 0.20
  python bash/check-performance-regression.py --self-test    # 用反例夹具证明本门禁不是空转

@path bash/check-performance-regression.py
@author ydsz-team
@since 5.2.0
"""

import argparse
import json
import os
import sys
import tempfile
from pathlib import Path


def read_json(path):
    """读取 JSON 文件；返回 (对象, 错误说明)。错误说明非 None 时调用方须 fail-closed。"""
    if not os.path.exists(path):
        return None, f"文件不存在：{path}"
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle), None
    except json.JSONDecodeError as exc:
        return None, f"JSON 解析失败：{path} —— {exc}"


def load_timings(budget_obj, source, read_error=None):
    """从 budget 配置里取出 {指标名: 预算值}。多个 budgets 项时取第一个含 timings 的。"""
    if budget_obj is None:
        # 读文件那一步已经给过根因，不重复刷一条泛化消息
        return {}, ([] if read_error else [f"基线文件无法读取：{source}"])
    budgets = budget_obj.get("budgets")
    if not isinstance(budgets, list) or not budgets:
        return {}, [f"基线文件缺少 budgets 数组：{source}（CI 里 git show 失败会退化成 {{}}，这种'没有基线'必须判失败）"]
    for entry in budgets:
        timings = entry.get("timings") if isinstance(entry, dict) else None
        if timings:
            out = {}
            for item in timings:
                metric = item.get("metric")
                budget = item.get("budget")
                if not isinstance(metric, str) or not isinstance(budget, (int, float)):
                    continue
                if budget <= 0:
                    return {}, [f"指标 '{metric}' 的基线预算为 {budget}，无法计算变化率（请给出正数预算）"]
                out[metric] = float(budget)
            if out:
                return out, []
    return {}, [f"基线 budgets 里没有任何 timings 条目：{source}"]


def load_measures(metrics_obj, source, read_error=None):
    """从实测 JSON 里取出 {指标名: 数值}，忽略 regression 之类的派生字段。"""
    if metrics_obj is None:
        return {}, ([] if read_error else [f"实测文件无法读取：{source}"])
    if not isinstance(metrics_obj, dict):
        return {}, [f"实测文件顶层不是对象：{source}"]
    out = {}
    for key, value in metrics_obj.items():
        if isinstance(value, bool):
            continue
        if isinstance(value, (int, float)):
            out[key] = float(value)
    if not out:
        return {}, [f"实测文件里没有数值指标：{source}（多半是 Playwright 测试没跑成，指标 JSON 未写出）"]
    return out, []


def compare(baseline, current, threshold):
    """逐指标算相对变化率。返回 (失败原因列表, 表格行, 告警列表)。"""
    failures = []
    rows = []
    warnings = []
    comparable = sorted(set(baseline) & set(current))
    if not comparable:
        failures.append(
            f"基线指标 {sorted(baseline)} 与实测指标 {sorted(current)} 无交集，"
            "无法判定 —— 通常是指标名大小写/命名漂移，或实测 JSON 来自另一套采集逻辑"
        )
        return failures, rows, warnings

    for metric in comparable:
        base = baseline[metric]
        now = current[metric]
        ratio = (now - base) / base
        regressed = ratio > threshold
        rows.append((metric, base, now, ratio, regressed))
        if regressed:
            failures.append(
                f"{metric} 退化 {ratio * 100:.1f}%（基线 {base:g} → 实测 {now:g}，阈值 {threshold * 100:g}%）"
            )

    only_current = sorted(set(current) - set(baseline))
    if only_current:
        warnings.append(f"实测有但基线未定义、本次不判定的指标：{', '.join(only_current)}")
    only_baseline = sorted(set(baseline) - set(current))
    if only_baseline:
        warnings.append(
            f"基线定义但实测缺失、本次不判定的指标：{', '.join(only_baseline)}"
            "（若采集本应覆盖它们，说明测试提前失败）"
        )
    return failures, rows, warnings


def format_table(rows):
    lines = ["| 指标 | 基线 | 实测 | 变化率 | 判定 |", "|------|------|------|--------|------|"]
    for metric, base, now, ratio, regressed in rows:
        verdict = "退化超标" if regressed else "通过"
        lines.append(f"| {metric} | {base:g} | {now:g} | {ratio * 100:+.1f}% | {verdict} |")
    return "\n".join(lines)


def write_summary(text):
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if path:
        try:
            with open(path, "a", encoding="utf-8") as handle:
                handle.write(text + "\n")
        except OSError:
            pass


def run(args):
    baseline_obj, baseline_err = read_json(args.baseline)
    current_obj, current_err = read_json(args.current)

    baseline, failures = load_timings(baseline_obj, args.baseline, baseline_err)
    failures += [e for e in (baseline_err, current_err) if e]
    current, measure_errs = load_measures(current_obj, args.current, current_err)
    failures += measure_errs

    if not failures:
        failures, rows, warnings = compare(baseline, current, args.threshold)
    else:
        rows, warnings = [], []

    write_summary("## 性能退化检测\n\n" + (format_table(rows) if rows else "（未取得可比指标）") + "\n")

    for warn in warnings:
        print(f"⚠️  {warn}", file=sys.stderr)

    if failures:
        print(f"❌ 性能门禁未通过（基线 {args.baseline} / 实测 {args.current} / 阈值 {args.threshold}）：", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
        if rows:
            print(format_table(rows), file=sys.stderr)
        return 1

    print(format_table(rows))
    print(f"✅ 性能门禁通过：{len(rows)} 项指标相对基线变化均未超过 {args.threshold * 100:g}%")
    return 0


def self_test():
    """反例夹具：证明"退化""缺基线""坏 JSON""指标名漂移"四类缺陷都会被判失败。"""
    tmp = Path(tempfile.mkdtemp(prefix="ydsz-perf-selftest-"))
    budget_ok = tmp / "budget.json"
    budget_ok.write_text(
        json.dumps({"budgets": [{"path": "/", "timings": [{"metric": "lcp", "budget": 2500}, {"metric": "cls", "budget": 0.05}]}]}),
        encoding="utf-8",
    )
    budget_empty = tmp / "budget-empty.json"
    budget_empty.write_text("{}", encoding="utf-8")
    budget_zero = tmp / "budget-zero.json"
    budget_zero.write_text(json.dumps({"budgets": [{"timings": [{"metric": "lcp", "budget": 0}]}]}), encoding="utf-8")
    broken = tmp / "broken.json"
    broken.write_text("{ not json", encoding="utf-8")
    metrics_ok = tmp / "metrics-ok.json"
    metrics_ok.write_text(json.dumps({"lcp": 2400, "cls": 0.04, "fcp": 1200}), encoding="utf-8")
    metrics_regressed = tmp / "metrics-bad.json"
    metrics_regressed.write_text(json.dumps({"lcp": 3400, "cls": 0.041}), encoding="utf-8")
    metrics_names_drifted = tmp / "metrics-drift.json"
    metrics_names_drifted.write_text(json.dumps({"LCP": 2400, "CLS": 0.04}), encoding="utf-8")
    metrics_empty = tmp / "metrics-empty.json"
    metrics_empty.write_text(json.dumps({"regression": {"lcp": 0.1}}), encoding="utf-8")

    class Args:
        def __init__(self, baseline, current, threshold=0.20):
            self.baseline = str(baseline)
            self.current = str(current)
            self.threshold = threshold
        # run() 里读取 env 兜底，避免污染 CI summary
    os.environ.pop("GITHUB_STEP_SUMMARY", None)

    cases = [
        ("退化超阈值必须失败", Args(budget_ok, metrics_regressed), 1, "lcp 退化"),
        ("基线为空对象必须失败（fail-closed）", Args(budget_empty, metrics_ok), 1, "budgets"),
        ("基线预算为 0 必须失败", Args(budget_zero, metrics_ok), 1, "无法计算变化率"),
        ("实测 JSON 坏掉必须失败", Args(budget_ok, broken), 1, "JSON 解析失败"),
        ("实测文件不存在必须失败", Args(budget_ok, tmp / "nope.json"), 1, "文件不存在"),
        ("指标名漂移必须失败", Args(budget_ok, metrics_names_drifted), 1, "无交集"),
        ("实测无数值指标必须失败", Args(budget_ok, metrics_empty), 1, "没有数值指标"),
        ("正向：未退化必须通过", Args(budget_ok, metrics_ok), 0, "性能门禁通过"),
    ]

    # 捕获脚本自身打印，避免自检输出被当成结果
    import io
    from contextlib import redirect_stderr, redirect_stdout

    missed = []
    for name, args, expected_code, needle in cases:
        buf_out, buf_err = io.StringIO(), io.StringIO()
        with redirect_stdout(buf_out), redirect_stderr(buf_err):
            code = run(args)
        text = buf_out.getvalue() + buf_err.getvalue()
        if code != expected_code:
            missed.append(f"{name}：退出码 {code}，期望 {expected_code}")
        elif expected_code != 0 and needle not in text:
            missed.append(f"{name}：判失败了但原因里没有 '{needle}'（消息不可定位）")

    if missed:
        print("❌ 性能门禁自检失败，以下反例未被正确捕获：", file=sys.stderr)
        for item in missed:
            print(f"  - {item}", file=sys.stderr)
        return 1
    print(f"✅ 性能门禁自检通过：{len(cases)}/{len(cases)} 条正反例全部符合预期")
    return 0


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="对比实测 Web Vitals 与基线 budgets，退化超阈值即失败（未知参数一律报错，不静默通过）",
    )
    parser.add_argument("--baseline", help="基线 budget 配置 JSON（budgets[].timings[]）")
    parser.add_argument("--current", help="实测指标 JSON（{lcp, cls, fcp, ttfb}）")
    parser.add_argument("--threshold", type=float, default=0.20, help="允许的最大相对退化（默认 0.20）")
    parser.add_argument("--self-test", action="store_true", help="运行反例夹具自检")
    args = parser.parse_args(argv)
    if args.self_test:
        return self_test()
    if not args.baseline or not args.current:
        # 不能靠 argparse 的 required：那样 --self-test 也会被同样的校验挡住
        print("❌ 必须同时提供 --baseline 与 --current（缺输入即失败，不做'没数据就通过'的兜底）", file=sys.stderr)
        return 2
    if args.threshold < 0:
        print("❌ --threshold 不能为负", file=sys.stderr)
        return 2
    return run(args)


if __name__ == "__main__":
    sys.exit(main())
