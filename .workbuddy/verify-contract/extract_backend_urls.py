#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""从 ydsz-cloud 后端 Controller 静态提取 REST 端点全路径。

目的：与前端契约快照(openapi.json)、前端 api 层调用做三方比对，
实测前后端 URL 契约漂移规模。
"""
from __future__ import annotations

import os
import re
import json

CLOUD_ROOT = r"D:\Code\open\ydsz-cloud"

# 方法级映射注解
METHOD_ANNOS = {
    "GetMapping": "GET",
    "PostMapping": "POST",
    "PutMapping": "PUT",
    "DeleteMapping": "DELETE",
    "PatchMapping": "PATCH",
}

# 匹配 @GetMapping/@PostMapping/@PutMapping/@DeleteMapping/@PatchMapping/@RequestMapping
# 注意：显式排除 MapStruct 的 @Mapping（target=/source=），只认 HTTP 映射注解
MAPPING_RE = re.compile(r"@(?P<anno>Get|Post|Put|Delete|Patch|Request)Mapping(?P<lp>\s*\()?")
# 方法签名：public 返回类型 方法名(
SIG_RE = re.compile(r"\bpublic\s+(?P<ret>[\w.$<>?,\s\[\]]+?)\s+(?P<name>\w+)\s*\(")
CLASS_RE = re.compile(r"\b(?:public\s+|abstract\s+|final\s+)*(?:class|interface)\s+(\w+)")


def strip_comments(src: str) -> str:
    src = re.sub(r"/\*.*?\*/", "", src, flags=re.S)
    src = re.sub(r"^\s*//.*$", "", src, flags=re.M)
    return src


def first_path_value(text: str) -> str | None:
    """从注解括号内提取第一个字符串字面量（value/path）。"""
    m = re.search(r'["\']([^"\']*)["\']', text)
    return m.group(1) if m else None


def balanced_paren(src: str, open_idx: int) -> int:
    """给定 '(' 的下标，返回匹配的 ')' 下标。"""
    depth = 0
    i = open_idx
    n = len(src)
    while i < n:
        c = src[i]
        if c == "(":
            depth += 1
        elif c == ")":
            depth -= 1
            if depth == 0:
                return i
        elif c == '"':
            i += 1
            while i < n and src[i] != '"':
                if src[i] == "\\":
                    i += 1
                i += 1
        i += 1
    return -1


def join_path(base: str, sub: str | None) -> str:
    if not sub:
        return base or "/"
    if not base:
        return sub
    return (base.rstrip("/") + "/" + sub.lstrip("/"))


def normalize(path: str) -> str:
    # 占位符统一：{id} 保留，但 ${xxx} 配置占位还原为空
    path = re.sub(r"\$\{[\w.\-]+:\s*([^}]+)\}", r"\1", path)
    path = re.sub(r"\$\{[\w.\-]+\}", "", path)
    if not path.startswith("/"):
        path = "/" + path
    return path


def parse_controller(path: str) -> list[dict]:
    with open(path, encoding="utf-8", errors="replace") as f:
        raw = f.read()
    src = strip_comments(raw)

    # 类声明位置：用于区分类级/方法级注解
    cm = CLASS_RE.search(src)
    class_pos = cm.start() if cm else 0
    class_name = cm.group(1) if cm else os.path.basename(path)[:-5]

    endpoints: list[dict] = []
    base_path = ""

    # 遍历所有 @XxxMapping(
    for m in MAPPING_RE.finditer(src):
        anno = m.group("anno") + "Mapping"
        if m.group("lp"):
            open_idx = m.end() - 1  # '(' 的位置
            close_idx = balanced_paren(src, open_idx)
            if close_idx == -1:
                continue
            inner = src[open_idx + 1: close_idx]
        else:
            # 无括号形式，如 @PostMapping
            close_idx = m.end()
            inner = ""

        # 注解之后最近的 public 方法签名（限制窗口，避免跨到下一个方法）
        after = src[close_idx: close_idx + 600]
        sig = SIG_RE.search(after)
        method_name = sig.group("name") if sig else "?"

        if m.start() < class_pos:
            # 类级
            if anno == "RequestMapping":
                p = first_path_value(inner)
                if p:
                    base_path = p
            continue

        # 方法级
        p = first_path_value(inner)
        if anno == "RequestMapping":
            # 方法级 RequestMapping 若无显式 method，按 GET 兜底
            http = "GET"
            mm = re.search(r"method\s*=\s*RequestMethod\.(\w+)", inner)
            if mm:
                http = mm.group(1).upper()
        else:
            http = METHOD_ANNOS.get(anno, "?")

        endpoints.append({
            "http": http,
            "path": normalize(join_path(normalize(base_path), p)),
            "method": method_name,
        })

    return endpoints, class_name


def main():
    results = {}
    total = 0
    for root, dirs, files in os.walk(CLOUD_ROOT):
        if "target" in root.split(os.sep):
            continue
        for fn in files:
            if not fn.endswith("Controller.java"):
                continue
            fp = os.path.join(root, fn)
            mod = fp.replace(CLOUD_ROOT, "").lstrip(os.sep).split(os.sep)[0]
            eps, cname = parse_controller(fp)
            if not eps:
                continue
            results.setdefault(mod, []).append({
                "file": fp.replace(CLOUD_ROOT, "").lstrip(os.sep),
                "controller": cname,
                "endpoints": eps,
            })
            total += len(eps)

    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend_urls.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=1)

    print(f"Controller 文件数: {sum(len(v) for v in results.values())}")
    print(f"端点总数: {total}")
    for mod, ctrls in sorted(results.items(), key=lambda x: -sum(len(c["endpoints"]) for c in x[1])):
        n = sum(len(c["endpoints"]) for c in ctrls)
        print(f"  {mod}: {len(ctrls)} controllers / {n} endpoints")
    print(f"\n输出: {out}")


if __name__ == "__main__":
    main()
