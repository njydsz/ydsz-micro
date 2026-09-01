#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""校验「后端端点前缀」是否被网关路由表覆盖。

网关路由表是手工维护的第三份契约副本（Nacos gateway-routes.json，
模板在 ydsz-gateway/src/main/resources/routes-nacos.yaml）。
后端新增 Controller 前缀若忘记登记，前端调用会 404，
而现有的 gen-contract --check 只比对后端源码↔前端 api，感知不到。
"""
from __future__ import annotations

import json
import os
import re
import fnmatch

CLOUD = r"D:\Code\open\ydsz-cloud"
HERE = os.path.dirname(os.path.abspath(__file__))
ROUTES = os.path.join(CLOUD, "ydsz-gateway", "src", "main", "resources", "routes-nacos.yaml")

with open(os.path.join(HERE, "backend_urls.json"), encoding="utf-8") as f:
    BK = json.load(f)

# ---------- 1. 解析网关路由表 ----------
raw = open(ROUTES, encoding="utf-8").read()
# 去掉头部注释块，只保留 JSON 数组
arr_start = raw.index("[")
routes = json.loads(raw[arr_start:])

patterns = []  # (route_id, uri, pattern)
for r in routes:
    uri = r.get("uri", "")
    for p in r.get("predicates", []):
        if p.get("name") == "Path":
            pat = p.get("args", {}).get("pattern", "")
            for seg in pat.split(","):
                seg = seg.strip()
                if seg:
                    patterns.append((r.get("id", "?"), uri, seg))

print(f"网关路由条目: {len(routes)}  路径 pattern 段: {len(patterns)}")


def covered(path: str) -> tuple[bool, str]:
    """判断后端端点路径是否被任一 pattern 覆盖"""
    for rid, uri, pat in patterns:
        # Spring Path pattern: /api/v1/role/**  -> 前缀匹配
        if pat.endswith("/**"):
            if path.startswith(pat[:-3]) or path + "/" == pat[:-3]:
                # 端点路径去掉尾部 id 段再比对：/api/v1/role/{id} -> /api/v1/role/
                return True, f"{rid}"
        if pat.endswith("**"):
            if path.startswith(pat[:-2]):
                return True, f"{rid}"
        if fnmatch.fnmatch(path, pat):
            return True, f"{rid}"
    return False, ""


# 规范化：把 /api/v1/role/{id} 归约成前缀 /api/v1/role/
def prefix_of(path: str) -> str:
    parts = [p for p in path.split("/") if p]
    if not parts:
        return "/"
    # 去掉末尾的路径变量段
    if parts[-1].startswith("{"):
        parts = parts[:-1]
    if not parts:
        return "/"
    return "/" + "/".join(parts) + "/"


# ---------- 2. 收集后端端点，按前缀归并 ----------
prefix_hits: dict[str, list] = {}
for mod, ctrls in BK.items():
    if mod == "ydsz-common":
        continue
    for c in ctrls:
        for e in c["endpoints"]:
            p = prefix_of(e["path"])
            prefix_hits.setdefault(p, []).append((mod, e["http"], e["path"], c["controller"]))

missing: dict[str, list] = {}
for pfx, items in prefix_hits.items():
    ok, rid = covered(pfx)
    if not ok:
        missing[pfx] = items

print(f"后端端点前缀（归约后）: {len(prefix_hits)}")
print(f"未被网关路由覆盖: {len(missing)}")
print()
if missing:
    print("=" * 74)
    print("【未被网关路由表覆盖的后端前缀】—— 前端调用此类接口将 404")
    print("=" * 74)
    by_mod: dict[str, list] = {}
    for pfx, items in sorted(missing.items()):
        mod = items[0][0]
        by_mod.setdefault(mod, []).append((pfx, len(items), items[0][3]))
    for mod, rows in sorted(by_mod.items(), key=lambda x: -sum(r[1] for r in x[1])):
        n = sum(r[1] for r in rows)
        print(f"\n-- {mod}: {len(rows)} 个前缀 / {n} 个端点")
        for pfx, cnt, ctrl in rows[:12]:
            print(f"     {pfx:<46} {cnt:>3} 端点   eg. {ctrl}")
else:
    print(">>> 全部后端端点前缀均被网关路由表覆盖 <<<")
