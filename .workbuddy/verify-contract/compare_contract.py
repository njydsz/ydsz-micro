#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""三方 URL 契约比对：后端实际端点 / 前端 openapi.json 快照 / 前端 api 层实际调用。

输出漂移清单，量化前后端贯通的真实缺口。
"""
from __future__ import annotations

import json
import os
import re

MICRO_ROOT = r"D:\Code\open\ydsz-micro"
HERE = os.path.dirname(os.path.abspath(__file__))

APP2SVC = {
    "userinfo-web": "ydsz-userinfo",
    "system-web": "ydsz-system",
    "message-web": "ydsz-message",
    "cronjob-web": "ydsz-cronjob",
    "workflow-web": "ydsz-workflow",
    "nextwiki-web": "ydsz-nextwiki",
    "literule-web": "ydsz-literule",
    "agent-web": "ydsz-agent",
}


def norm(p: str) -> str:
    if not p.startswith("/"):
        p = "/" + p
    # 路径变量统一归一：{id}/{userId}/{tenant-id} -> {}
    p = re.sub(r"\{[^}]*\}", "{}", p)
    p = p.rstrip("/") or "/"
    return p


def unwrap_result(d):
    """后端统一响应体：某些契约把 data 包在 Result 里，这里只取 paths。"""
    return d.get("paths", {})


def load_backend():
    with open(os.path.join(HERE, "backend_urls.json"), encoding="utf-8") as f:
        return json.load(f)


def backend_endpoint_set(mod_controllers):
    """返回 set of (HTTP, path)"""
    s = set()
    for c in mod_controllers:
        for e in c["endpoints"]:
            s.add((e["http"], norm(e["path"])))
    return s


def load_snapshot(app):
    fp = os.path.join(MICRO_ROOT, "apps", app, "src", "api", "sdk", "openapi.json")
    if not os.path.exists(fp):
        return None
    with open(fp, encoding="utf-8") as f:
        d = json.load(f)
    paths = unwrap_result(d)
    s = set()
    for p, ops in paths.items():
        for method in ops.keys():
            if method.lower() in ("get", "post", "put", "delete", "patch"):
                s.add((method.upper(), norm(p)))
    return s


# 前端 api 层调用：requestClient.get(`/api/v1/xxx`) 或 requestClient.post('/api/..')
CALL_RE = re.compile(
    r"requestClient\s*\.\s*(get|post|put|delete|patch|request)\s*<[^>]*>\s*\(\s*[`'\"]"
    r"(?P<url>/[^`'\"]*)[`'\"]",
    re.S,
)
# 也匹配无泛型写法
CALL_RE2 = re.compile(
    r"requestClient\s*\.\s*(get|post|put|delete|patch)\s*\(\s*[`'\"]"
    r"(?P<url>/[^`'\"]*)[`'\"]"
)
# axios 直连
AXIOS_RE = re.compile(r"axios\s*\.\s*(get|post|put|delete|patch)\s*\(\s*[`'\"]" r"(?P<url>/[^`'\"]*)[`'\"]")

M_UP = {"get": "GET", "post": "POST", "put": "PUT", "delete": "DELETE", "patch": "PATCH"}


def load_frontend_calls(app):
    api_dir = os.path.join(MICRO_ROOT, "apps", app, "src", "api")
    s = set()
    files = 0
    for root, dirs, files_ in os.walk(api_dir):
        if "sdk" in root.split(os.sep) or ".generated-archived" in root:
            continue
        for fn in files_:
            if not fn.endswith((".ts", ".vue")):
                continue
            fp = os.path.join(root, fn)
            try:
                with open(fp, encoding="utf-8", errors="replace") as f:
                    src = f.read()
            except OSError:
                continue
            files += 1
            for rx in (CALL_RE, CALL_RE2, AXIOS_RE):
                for m in rx.finditer(src):
                    verb = m.group(1).lower()
                    if verb not in M_UP:
                        continue
                    url = m.group("url")
                    # 模板字面量里的 ${} 变量 -> 占位
                    url = re.sub(r"\$\{[^}]*\}", "{}", url)
                    s.add((M_UP[verb], norm(url)))
    return s, files


def main():
    backend = load_backend()
    rows = []
    for app, svc in APP2SVC.items():
        be = backend_endpoint_set(backend.get(svc, []))
        snap = load_snapshot(app)
        fe, nfiles = load_frontend_calls(app)

        only_backend = be - (snap or set())
        only_snap = (snap or set()) - be
        # 前端调用是否落在后端端点里（路径占位归一化后比对）
        be_paths = {(m, p) for (m, p) in be}
        fe_not_in_be = {x for x in fe if x not in be_paths}
        be_not_used = be - fe

        rows.append({
            "app": app, "svc": svc,
            "backend_endpoints": len(be),
            "snapshot_paths": len(snap) if snap is not None else None,
            "frontend_calls": len(fe),
            "api_files": nfiles,
            "backend_not_in_snapshot": sorted(only_backend),
            "snapshot_not_in_backend": sorted(only_snap),
            "frontend_call_missing_in_backend": sorted(fe_not_in_be),
            "backend_endpoint_unused": len(be_not_used),
        })

    print("=" * 78)
    print(f"{'应用':<16}{'后端端点':>8}{'快照path':>9}{'前端调用':>9}{'未使用':>7}{'漂移':>7}")
    print("=" * 78)
    tot = {"b": 0, "s": 0, "f": 0, "d": 0}
    for r in rows:
        drift = len(r["backend_not_in_snapshot"]) + len(r["snapshot_not_in_backend"])
        print(f"{r['app']:<16}{r['backend_endpoints']:>8}"
              f"{str(r['snapshot_paths']):>9}{r['frontend_calls']:>9}"
              f"{r['backend_endpoint_unused']:>7}{drift:>7}")
        tot["b"] += r["backend_endpoints"]
        tot["s"] += r["snapshot_paths"] or 0
        tot["f"] += r["frontend_calls"]
        tot["d"] += drift
    print("=" * 78)
    print(f"{'合计':<16}{tot['b']:>8}{tot['s']:>9}{tot['f']:>9}{'':>7}{tot['d']:>7}")

    with open(os.path.join(HERE, "contract_drift.json"), "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=1)

    # 打印明细（限量）
    print("\n\n### 明细：后端有但契约快照缺失（前 12 条/应用）")
    for r in rows:
        if r["backend_not_in_snapshot"]:
            print(f"\n-- {r['app']} ({len(r['backend_not_in_snapshot'])} 条)")
            for m, p in r["backend_not_in_snapshot"][:12]:
                print(f"   {m:<7}{p}")

    print("\n\n### 明细：前端调用了但后端无此端点（前 12 条/应用）")
    for r in rows:
        if r["frontend_call_missing_in_backend"]:
            print(f"\n-- {r['app']} ({len(r['frontend_call_missing_in_backend'])} 条)")
            for m, p in r["frontend_call_missing_in_backend"][:12]:
                print(f"   {m:<7}{p}")

    print(f"\n完整结果: {os.path.join(HERE, 'contract_drift.json')}")


if __name__ == "__main__":
    main()
