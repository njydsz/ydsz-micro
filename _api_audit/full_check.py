# -*- coding: utf-8 -*-
"""解析 git grep 原始输出 → 前端调用清单，与后端端点双向比对。"""
import os
import re
from collections import defaultdict

BASE = os.path.dirname(os.path.abspath(__file__))
CLOUD = r"D:\Code\open\ydsz-cloud"

VERB_MAP = {
    "GetMapping": "GET", "PostMapping": "POST", "PutMapping": "PUT",
    "DeleteMapping": "DELETE", "PatchMapping": "PATCH", "RequestMapping": "ANY",
}

# ---------------- 后端 ----------------
def extract_backend():
    endpoints = []
    for root, dirs, files in os.walk(CLOUD):
        dirs[:] = [d for d in dirs if d not in ("target", ".git", ".meituan-catpaw", "data")]
        for fn in files:
            if not fn.endswith("Controller.java"):
                continue
            fp = os.path.join(root, fn)
            rel = os.path.relpath(fp, CLOUD).replace("\\", "/")
            module = rel.split("/")[0].replace("ydsz-", "")
            try:
                src = open(fp, encoding="utf-8", errors="ignore").read()
            except Exception:
                continue
            m = re.search(r'@RequestMapping\s*\(\s*(?:value\s*=\s*)?"([^"]+)"', src)
            base = m.group(1) if m else ""
            for mm in re.finditer(
                r'@(Get|Post|Put|Delete|Patch)Mapping\s*(?:\(\s*(?:value\s*=\s*)?(\{[^}]*\}|"[^"]*")?)?\s*\)?',
                src,
            ):
                verb = mm.group(1).upper()
                arg = (mm.group(2) or "").strip()
                if arg.startswith("{"):
                    paths = re.findall(r'"([^"]*)"', arg)
                elif arg.startswith('"'):
                    paths = [arg.strip('"')]
                else:
                    paths = [""]
                for p in paths:
                    full = (base + p) if p else base
                    if not full.startswith("/"):
                        full = "/" + full
                    endpoints.append((module, fn[:-5], verb, full))
    return endpoints

def norm_path(p):
    p = re.sub(r"\$\{[^}]+\}", "{}", p)
    segs = [s for s in p.split("/") if s]
    return "/" + "/".join("{}" if (s == "{}" or re.fullmatch(r"\{[^}]+\}", s)) else s for s in segs)

# ---------------- 前端 ----------------
LINE_RE = re.compile(r"^HEAD:([^:]+):(\d+)([:-])(.*)$")
URL_RE = re.compile(r"[`'\"](/api/[^`'\"]*)")
VERB_RE = re.compile(r"requestClient\.(\w+)|\b(get|post|put|delete|patch)\s*[<(]")

def extract_frontend():
    calls = []
    raw = open(os.path.join(BASE, "frontend_calls_raw.txt"), encoding="utf-8", errors="ignore").read()
    blocks = raw.split("\n--\n")
    for block in blocks:
        lines = block.splitlines()
        if len(lines) >= 2:
            prev, cur = lines[0], lines[-1]
        else:
            prev, cur = "", lines[0] if lines else ""
        mc = LINE_RE.match(cur)
        if not mc:
            continue
        f, _, _, content = mc.group(1), mc.group(2), mc.group(3), mc.group(4)
        # 过滤
        if any(x in f for x in ("node_modules", ".generated-archived", "/dist/", "mock/", ".test.", ".spec.", "/conf/", ".md")):
            continue
        mu = URL_RE.search(content)
        if not mu:
            continue
        url = mu.group(1)
        # method：本行或前一行
        text = content
        mp = re.search(r"requestClient\.(\w+)", text) or re.search(r"requestClient\.(\w+)", prev.split(":", 2)[-1] if prev.startswith("HEAD:") else "")
        verb = mp.group(1).upper() if mp else "?"
        # URL 在模板串里被截断的情况：raw 里 URL_RE 匹配到引号闭合为止，模板串 `${...}` 内若含引号会截断 —— 基本可接受
        app = f.split("/")[1] if f.startswith(("apps/", "main/")) else f
        calls.append((app, f, verb, url))
    return calls

def main():
    be = extract_backend()
    be_index = defaultdict(set)
    be_paths = set()
    for module, ctrl, verb, path in be:
        be_index[(verb, norm_path(path))].add(module)
        be_index[("ANY", norm_path(path))].add(module)
        be_paths.add(norm_path(path))

    fe = extract_frontend()
    # 去重（同一调用可能出现在多行）
    fe_uniq = sorted(set((a, v, u) for a, f, v, u in fe))

    print(f"后端端点总数: {len(be)}")
    print(f"前端调用(去重): {len(fe_uniq)}")

    broken = []
    ok = 0
    for app, verb, url in fe_uniq:
        p = norm_path(url.split("?")[0])
        v = "GET" if verb in ("DOWNLOAD", "REQUEST") else verb
        hit = (v, p) in be_index or ("ANY", p) in be_index or p in be_paths
        if hit:
            ok += 1
        else:
            broken.append((app, verb, url))
    print(f"\n=== 正向: 前端调用 → 后端 ===")
    print(f"命中 {ok}/{len(fe_uniq)}")
    if broken:
        print(f"断链 {len(broken)} 处:")
        for app, verb, url in broken:
            print(f"  [{app}] {verb} {url}")

    fe_norm = set()
    for app, verb, url in fe_uniq:
        p = norm_path(url.split("?")[0])
        fe_norm.add(p)  # 路径级：只要前端调过该路径（不论 method）即视为接入

    print(f"\n=== 反向: 后端端点 → 前端接入（路径级） ===")
    be_by_mod = defaultdict(list)
    for module, ctrl, verb, path in be:
        be_by_mod[module].append((ctrl, verb, path))
    detail = []
    total_unlinked = 0
    for mod in sorted(be_by_mod):
        unlinked = [(c, v, p) for c, v, p in be_by_mod[mod] if norm_path(p) not in fe_norm]
        non_internal = [u for u in unlinked if "/internal/" not in u[2]]
        total_unlinked += len(non_internal)
        print(f"  {mod:10} 总 {len(be_by_mod[mod]):3} | 未接 {len(non_internal):3} | internal不计 {len(unlinked)-len(non_internal)}")
        for c, v, p in non_internal:
            detail.append(f"  {mod:10} {v:6} {p}   ({c})")
    with open(os.path.join(BASE, "unlinked_detail.txt"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(detail))
    print(f"\n未接入端点总数（除 internal）: {total_unlinked}")

if __name__ == "__main__":
    main()
