#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""扫描 gen-contract.py 生成代码中的「写方法参数错位」缺陷。

缺陷模式：requestClient.post/put/delete(url, {params|query...})
—— 第二参是 data(请求体)，但生成器塞入了查询参数对象。
"""
from __future__ import annotations

import os
import re

MICRO_ROOT = r"D:\Code\open\ydsz-micro"

# 捕获 requestClient.<verb><T>(url, <第二参>) 的第二参（括号平衡截取）
CALL = re.compile(r"requestClient\s*\.\s*(post|put|delete)\s*(?:<[^>]*>)?\s*\(")


def read_args(src: str, open_idx: int):
    """返回顶层逗号分隔的参数列表"""
    depth = 0
    args = []
    cur = []
    i = open_idx + 1
    n = len(src)
    while i < n:
        c = src[i]
        if c in "([{":
            depth += 1
        elif c in ")]}":
            if depth == 0:
                break
            depth -= 1
        if c == "," and depth == 0:
            args.append("".join(cur))
            cur = []
        else:
            cur.append(c)
        i += 1
    if cur:
        args.append("".join(cur))
    return args


def main():
    per_app = {}
    samples = []
    for app in sorted(os.listdir(os.path.join(MICRO_ROOT, "apps"))):
        api_dir = os.path.join(MICRO_ROOT, "apps", app, "src", "api")
        if not os.path.isdir(api_dir):
            continue
        hits = []
        for root, dirs, files in os.walk(api_dir):
            if "sdk" in root.split(os.sep) or ".generated-archived" in root:
                continue
            for fn in files:
                if not fn.endswith(".ts"):
                    continue
                fp = os.path.join(root, fn)
                with open(fp, encoding="utf-8", errors="replace") as f:
                    src = f.read()
                for m in CALL.finditer(src):
                    args = read_args(src, src.index("(", m.end() - 1) if False else m.end() - 1)
                    # args[0] 是 url 模板串，args[1] 是 data
                    if len(args) < 2:
                        continue
                    second = args[1].strip()
                    # 形如 { params } 或 { query } 或 { params: {...} }
                    if re.match(r"^\{\s*(params|query)\s*[:,}\s]", second) or second.strip() in ("{ params }", "{ query }"):
                        line = src[: m.start()].count("\n") + 1
                        hits.append((fp.replace(MICRO_ROOT, "").lstrip("\\/"), line, m.group(1), args[0].strip()))
        per_app[app] = hits
        samples.extend(hits[:3])

    total = sum(len(v) for v in per_app.values())
    print("=" * 70)
    print("写方法(post/put/delete) 参数错位统计 —— 第二参应为 data，实为查询参数对象")
    print("=" * 70)
    for app, hits in per_app.items():
        if hits:
            verbs = {}
            for _, _, v, _ in hits:
                verbs[v] = verbs.get(v, 0) + 1
            print(f"{app:<18}{len(hits):>4} 处   {verbs}")
    print("-" * 70)
    print(f"{'合计':<18}{total:>4} 处")

    print("\n样例（前 6 条）:")
    for fp, line, verb, url in samples[:6]:
        print(f"  {fp}:{line}  {verb.upper()} {url}")


if __name__ == "__main__":
    main()
