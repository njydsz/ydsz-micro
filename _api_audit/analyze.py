# -*- coding: utf-8 -*-
"""分析各 app 的 API 层 diff：提取端点级实质差异（函数消失/新增/路径变更）。"""
import re
import sys
import os

BASE = os.path.dirname(os.path.abspath(__file__))
APPS = ["agent", "cronjob", "literule", "message", "nextwiki", "system", "userinfo", "workflow"]

FUNC_RE = re.compile(r"^([+-])export (?:async )?function (\w+)")
PATH_RE = re.compile(r"requestClient\.(get|post|put|delete|patch)(?:<[^>]*>)?\(\s*[`'\"]([^`'\"]+)")

for app in APPS:
    path = os.path.join(BASE, f"d_{app}.diff")
    if not os.path.exists(path):
        continue
    with open(path, encoding="utf-8", errors="ignore") as f:
        lines = f.read().splitlines()
    cur = None
    sign = None
    cur_file = ""
    funcs = {}  # name -> {file, "+": path, "-": path}
    for line in lines:
        dm = re.match(r"^\+\+\+ b/(.+)$", line) or re.match(r"^diff --git a/(.+) b/", line)
        if dm:
            cur_file = dm.group(1)
            cur = None
            continue
        m = FUNC_RE.match(line)
        if m:
            sign = "+" if m.group(1) == "+" else "-"
            cur = m.group(2)
            funcs.setdefault(cur, {"file": cur_file, "+": None, "-": None})
            continue
        if cur:
            pm = PATH_RE.search(line)
            if pm and line[0] in "+-":
                s = line[0]
                ent = funcs.setdefault(cur, {"file": cur_file, "+": None, "-": None})
                if ent[s] is None:
                    ent[s] = f"{pm.group(1).upper()} {pm.group(2)}"
            if line.startswith("@@") or line.startswith("diff --git"):
                cur = None
    removed, added, changed = [], [], []
    for n, v in sorted(funcs.items()):
        if v["-"] and not v["+"]:
            removed.append((n, v["-"], v["file"]))
        elif v["+"] and not v["-"]:
            added.append((n, v["+"], v["file"]))
        elif v["+"] and v["-"] and v["+"] != v["-"]:
            changed.append((n, v["-"], v["+"], v["file"]))
    print(f"########## {app}-web ##########")
    if removed:
        print("  [HEAD有/重生成消失 → 后端删除或重构]")
        for n, p, fl in removed:
            print(f"    - {n}: {p}   ({os.path.basename(fl)})")
    if added:
        print("  [重生成新增 → 后端新增、前端未接入]")
        for n, p, fl in added:
            print(f"    + {n}: {p}   ({os.path.basename(fl)})")
    if changed:
        print("  [路径变更]")
        for n, o, p, fl in changed:
            print(f"    ~ {n}: {o}  =>  {p}   ({os.path.basename(fl)})")
    if not (removed or added or changed):
        print("  (仅类型/注释差异)")
