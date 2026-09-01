#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""排除归档目录/sdk 后，重新精确比对现役前端 api 层与后端端点。"""
import json
import os
import re

MICRO = r"D:\Code\open\ydsz-micro"
HERE = os.path.dirname(os.path.abspath(__file__))

APP2SVC = {
    "userinfo-web": "ydsz-userinfo", "system-web": "ydsz-system",
    "message-web": "ydsz-message", "cronjob-web": "ydsz-cronjob",
    "workflow-web": "ydsz-workflow", "nextwiki-web": "ydsz-nextwiki",
    "literule-web": "ydsz-literule", "agent-web": "ydsz-agent",
}

with open(os.path.join(HERE, "backend_urls.json"), encoding="utf-8") as f:
    BK = json.load(f)


def norm(p):
    if not p.startswith("/"):
        p = "/" + p
    p = re.sub(r"\{[^}]*\}", "{}", p)
    return p.rstrip("/") or "/"


def be_set(svc):
    s = set()
    for c in BK.get(svc, []):
        for e in c["endpoints"]:
            s.add((e["http"], norm(e["path"])))
    return s


# 匹配 requestClient.<verb><T?>(`url`  / 'url' / "url"
CALL = re.compile(
    r"requestClient\s*\.\s*(get|post|put|delete|patch)\s*(?:<[^>]*>)?\s*\(\s*"
    r"[`\"'](?P<url>/[^`\"']*)[`\"']"
)
UP = {"get": "GET", "post": "POST", "put": "PUT", "delete": "DELETE", "patch": "PATCH"}


def fe_set(app):
    fe = set()
    adir = os.path.join(MICRO, "apps", app, "src", "api")
    for root, _dirs, files in os.walk(adir):
        parts = root.replace("/", os.sep).split(os.sep)
        if "sdk" in parts or ".generated-archived" in parts:
            continue
        for fn in files:
            if not fn.endswith(".ts"):
                continue
            src = open(os.path.join(root, fn), encoding="utf-8", errors="replace").read()
            for m in CALL.finditer(src):
                url = re.sub(r"\$\{[^}]*\}", "{}", m.group("url"))
                fe.add((UP[m.group(1).lower()], norm(url)))
    return fe


print("排除 .generated-archived / sdk 后的现役 api 层比对")
print(f"{'应用':<16}{'后端端点':>8}{'前端调用':>9}{'后端缺失':>9}{'后端未用':>9}")
print("-" * 52)
tb = tf = tm = tu = 0
for app, svc in APP2SVC.items():
    be, fe = be_set(svc), fe_set(app)
    miss = sorted(fe - be)
    unused = len(be - fe)
    tb += len(be); tf += len(fe); tm += len(miss); tu += unused
    print(f"{app:<16}{len(be):>8}{len(fe):>9}{len(miss):>9}{unused:>9}")
    for verb, p in miss[:5]:
        print(f"     [后端无此端点] {verb} {p}")
print("-" * 52)
print(f"{'合计':<16}{tb:>8}{tf:>9}{tm:>9}{tu:>9}")
print()
print(f"现役前端调用命中率: {(tf - tm) * 100 // max(tf, 1)}%  ({(tf-tm)}/{tf})")
print(f"后端端点前端覆盖率: {(tb - tu) * 100 // max(tb, 1)}%  ({(tb-tu)}/{tb})")
