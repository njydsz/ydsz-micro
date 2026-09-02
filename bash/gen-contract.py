#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
ydsz-micro 静态契约提取器 + API 层生成器。

从 ydsz-cloud 后端源码（Controller/DTO/VO）静态提取 OpenAPI 契约，
生成：
  1. apps/<app>/src/api/sdk/openapi.json      —— OpenAPI 3.0 契约基线（CI 校验用）
  2. apps/<app>/src/api/sdk/schema.d.ts       —— openapi-typescript 类型（由 gen-api.mjs 复用）
  3. apps/<app>/src/api/generated/<C>.ts      —— 符合云顶编码规范的类型化 API 封装（自动生成，勿手改）
  4. apps/<app>/src/api/generated/index.ts    —— 统一导出入口

用法:
  python bash/gen-contract.py                # 生成全部 8 个服务
  python bash/gen-contract.py workflow        # 仅生成指定服务

说明: 后端服务未运行时（无法拉取 /v3/api-docs）以此静态提取为契约事实源，
     服务运行后可无缝切换 gen-api.mjs（其 openapi.json 将被运行时 spec 覆盖）。

@path bash\gen-contract.py
@author ydsz-team
@since 1.0.0
"""

from __future__ import annotations

import json
import os
import re
import sys
from collections import OrderedDict
from typing import Any, Dict, List, Optional, Tuple

# ======================================================================
# 常量
# ======================================================================

# 后端仓库根目录：支持通过环境变量 YDSZ_CLOUD_ROOT 覆盖（CI checkout 到
# 同级目录后注入该变量即可），默认指向本机开发路径，保持向后兼容。
CLOUD_ROOT = os.environ.get("YDSZ_CLOUD_ROOT", r"D:\Code\open\ydsz-cloud")
MICRO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 后端服务 -> 前端 app
SERVICE_MAP: Dict[str, str] = {
    "userinfo": "userinfo-web",
    "system": "system-web",
    "message": "message-web",
    "cronjob": "cronjob-web",
    "workflow": "workflow-web",
    "nextwiki": "nextwiki-web",
    "literule": "literule-web",
    "agent": "agent-web",
}

# 基础类型映射: Java -> OpenAPI schema
BASIC_TYPES: Dict[str, Dict[str, Any]] = {
    "String": {"type": "string"},
    "Character": {"type": "string"},
    "char": {"type": "string"},
    "Long": {"type": "integer", "format": "int64"},
    "long": {"type": "integer", "format": "int64"},
    "Integer": {"type": "integer", "format": "int32"},
    "int": {"type": "integer", "format": "int32"},
    "Short": {"type": "integer", "format": "int32"},
    "short": {"type": "integer", "format": "int32"},
    "Byte": {"type": "integer", "format": "int32"},
    "byte": {"type": "integer", "format": "int32"},
    "BigDecimal": {"type": "number"},
    "BigInteger": {"type": "number"},
    "Double": {"type": "number"},
    "double": {"type": "number"},
    "Float": {"type": "number"},
    "float": {"type": "number"},
    "Boolean": {"type": "boolean"},
    "boolean": {"type": "boolean"},
    "LocalDate": {"type": "string", "format": "date"},
    "LocalDateTime": {"type": "string", "format": "date-time"},
    "LocalTime": {"type": "string", "format": "time"},
    "Instant": {"type": "string", "format": "date-time"},
    "Date": {"type": "string", "format": "date-time"},
    "Timestamp": {"type": "string", "format": "date-time"},
    "OffsetDateTime": {"type": "string", "format": "date-time"},
    "UUID": {"type": "string", "format": "uuid"},
    "Object": {"type": "object"},
    "JsonNode": {"type": "object"},
    "void": {"type": "object", "nullable": True},
    "Void": {"type": "object", "nullable": True},
}

CONTAINER_TYPES = {"List", "Set", "Collection", "Iterable", "ArrayList", "LinkedList", "HashSet", "TreeSet"}
MAP_TYPES = {"Map", "HashMap", "LinkedHashMap", "TreeMap", "ConcurrentHashMap"}

# 需要从后端加载 Java 源文件的目录（查找 DTO/VO）
JAVA_ROOTS = [
    CLOUD_ROOT,
]

HTTP_VERBS = {"GetMapping": "get", "PostMapping": "post", "PutMapping": "put", "DeleteMapping": "delete", "PatchMapping": "patch"}

# 前端基础响应类型（与后端 YdszResponse 对齐）
BASE_RESPONSE_TS = """/**
 * 后端统一响应结构（对齐 {@code YdszResponse<T>}）
 * <p>注意: requestClient 拦截器已按 successCode='A00000' 解包 data，
 * 业务调用处泛型直接写 data 类型；此处类型仅供契约说明使用。
 */
export interface YdszResponse<T = unknown> {
  /** 业务成功码（A00000 表示成功） */
  code: string;
  /** 提示信息 */
  msg: string;
  /** 业务数据 */
  data: T;
  /** 链路追踪 ID */
  traceId?: string;
  requestId?: string;
  spanId?: string;
  timestamp?: number;
  extensions?: Record<string, unknown>;
}

/** 分页响应（对齐后端 {@code PageResponse<T>}：total/pageNum/pageSize 平铺 + data 分页数据） */
export interface PageResponse<T = unknown> {
  /** 总记录数 */
  total?: number;
  /** 当前页码（从 1 开始） */
  pageNum?: number;
  /** 每页记录数 */
  pageSize?: number;
  /** 分页数据（由后端工厂方法填充） */
  data: T;
}

/** 分页查询参数（前端通用约定） */
export interface PageQuery {
  pageNum?: number;
  pageSize?: number;
}
"""


# ======================================================================
# Java 源码解析
# ======================================================================

class JavaTypeRef:
    """解析后的 Java 类型引用"""

    def __init__(self, raw: str, args: Optional[List["JavaTypeRef"]] = None):
        self.raw = raw.strip()
        self.name = self.raw.split("<")[0].strip()
        self.args = args or []
        # 简单名（去掉包名前缀）
        self.simple = self.name.split(".")[-1]

    def __repr__(self):
        return self.raw


def parse_type(raw: str, _depth: int = 0) -> Optional[JavaTypeRef]:
    if _depth > 12:
        return None
    raw = raw.strip()
    # 去掉数组后缀
    is_array = raw.endswith("[]")
    if is_array:
        raw = raw[:-2].strip()
    # 泛型
    m = re.match(r"^([\w.$]+)\s*<(.+)>$", raw, re.S)
    if m:
        outer = m.group(1).strip()
        inner_raw = split_top_level(m.group(2))
        args = []
        for x in inner_raw:
            r = parse_type(x, _depth + 1)
            if r:
                args.append(r)
        ref = JavaTypeRef(outer, args)
    else:
        ref = JavaTypeRef(raw)
    if is_array:
        # List<X> 语义
        return JavaTypeRef("List", [ref])
    return ref


def split_top_level(s: str) -> List[str]:
    parts, depth, cur = [], 0, []
    for ch in s:
        if ch in "<(":
            depth += 1
        elif ch in ")>":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append("".join(cur).strip())
            cur = []
        else:
            cur.append(ch)
    if cur:
        parts.append("".join(cur).strip())
    return parts


class JavaSource:
    """单个 Java 文件缓存"""

    _cache: Dict[str, "JavaSource"] = {}
    _not_found: set = set()
    # P0-4 优化：全仓 Java 文件名 -> 路径 索引（懒构建一次，替代逐类全树 os.walk）
    _index: Optional[Dict[str, str]] = None

    @classmethod
    def _build_index(cls) -> Dict[str, str]:
        """单次遍历 JAVA_ROOTS 构建 {类名: 文件路径} 索引，查找降为 O(1)。"""
        index: Dict[str, str] = {}
        for root in JAVA_ROOTS:
            for dp, dn, fn in os.walk(root):
                # 原地剪枝构建产物目录，防止 Maven target 膨胀后遍历退化
                dn[:] = [d for d in dn if d not in ("target", "node_modules", ".git", "build", "dist")]
                for name in fn:
                    if name.endswith(".java") and name not in index:
                        index[name[: -len(".java")]] = os.path.join(dp, name)
        return index

    def __init__(self, path: str):
        self.path = path
        with open(path, encoding="utf-8", errors="ignore") as f:
            self.src = f.read()
        self.pkg = ""
        m = re.search(r"package\s+([\w.]+);", self.src)
        if m:
            self.pkg = m.group(1)
        # 类名
        m = re.search(r"\b(?:public\s+)?(?:final\s+)?class\s+(\w+)", self.src)
        self.cls_name = m.group(1) if m else os.path.basename(path)[:-5]
        self.imports = re.findall(r"^import\s+(?:static\s+)?([\w.]+);", self.src, re.M)
        self._record_fields: Optional[List[Tuple[str, str]]] = None
        self._class_fields: Optional[List[Tuple[str, str, List[str]]]] = None
        self._enum_values: Optional[List[str]] = None
        self._class_doc: Optional[str] = None
        self._field_docs: Optional[Dict[str, str]] = None

    @classmethod
    def load(cls, simple_name: str, hint_pkg: Optional[str] = None) -> Optional["JavaSource"]:
        """按简单类名查找（带缓存 + 负缓存）"""
        if simple_name in cls._cache:
            return cls._cache[simple_name]
        if simple_name in cls._not_found:
            return None
        if simple_name in BASIC_TYPES or simple_name in ("Object", "String", "Integer", "Long", "Boolean", "Double", "Float", "BigDecimal", "BigInteger", "Character", "Short", "Byte", "UUID", "LocalDate", "LocalDateTime", "LocalTime", "Instant", "OffsetDateTime", "Date", "Timestamp", "JsonNode", "List", "Set", "Map", "Collection", "Iterable", "ArrayList", "LinkedList", "HashSet", "TreeSet", "HashMap", "LinkedHashMap", "TreeMap", "ConcurrentHashMap", "Optional", "Map.Entry"):
            cls._not_found.add(simple_name)
            return None
        found = None
        if cls._index is None:
            cls._index = cls._build_index()
        path = cls._index.get(simple_name)
        if path:
            found = JavaSource(path)
        if found:
            cls._cache[simple_name] = found
        else:
            cls._not_found.add(simple_name)
        return found

    # ---- record ----
    @property
    def record_fields(self) -> List[Tuple[str, str]]:
        if self._record_fields is None:
            m = re.search(r"\brecord\s+\w+\s*\(([^)]*)\)", self.src)
            fields = []
            if m:
                for seg in split_top_level(m.group(1)):
                    if not seg.strip():
                        continue
                    parts = seg.strip().split()
                    if len(parts) >= 2:
                        fields.append((parts[-1], parts[0]))
            self._record_fields = fields
        return self._record_fields

    # ---- class fields (Lombok @Data/@Getter 或手写 getter) ----
    @property
    def class_fields(self) -> List[Tuple[str, str, List[str]]]:
        """返回 (fieldName, javaType, annotations) 列表"""
        if self._class_fields is None:
            fields = []
            # 1) @JsonProperty("x") private Type name; —— 属性名以注解为准
            jp_pat = re.compile(
                r'@JsonProperty\(\s*"([\w-]+)"\s*\)\s*\n?\s*(?:public\s+|private\s+)?(?:final\s+)?([\w.$<>?,\s]+?)\s+(\w+)\s*(?:=|;)',
                re.S,
            )
            for m in jp_pat.finditer(self.src):
                fname, ftype = m.group(1), m.group(2).strip()
                if ftype:
                    fields.append((fname, ftype, ["JsonProperty"]))
            # 2) private [final] Type name;
            pat = re.compile(
                r"\bprivate\s+(?:final\s+|static\s+final\s+|transient\s+)*([\w.$<>?,\s]+?)\s+(\w+)\s*(?:=|;)",
                re.S,
            )
            for m in pat.finditer(self.src):
                ftype = m.group(1).strip()
                fname = m.group(2)
                if ftype in ("static", "final"):
                    continue
                if any(f[0] == fname for f in fields):
                    continue
                fields.append((fname, ftype, []))
            # 3) getter 推导（Lombok @Data/@Getter 场景补充）
            for m in re.finditer(r"public\s+[\w.$<>?,\s]+\s+get(\w+)\s*\(\)", self.src):
                fname = m.group(1)[0].lower() + m.group(1)[1:]
                if not any(f[0] == fname for f in fields):
                    fields.append((fname, "String", []))
            self._class_fields = fields
        return self._class_fields

    @property
    def enum_values(self) -> List[str]:
        if self._enum_values is None:
            m = re.search(r"\benum\s+\w+\s*\{([^}]*)\}", self.src, re.S)
            vals = []
            if m:
                # 只提取大写常量标识符（INFO / YELLOW / RED），忽略构造参数与方法体
                for seg in re.split(r"[;,]", m.group(1)):
                    seg = re.sub(r"/\*.*?\*/", "", seg, flags=re.S).strip()
                    mm = re.match(r"^([A-Z][A-Z0-9_]{1,})$", seg)
                    if mm and mm.group(1) not in vals:
                        vals.append(mm.group(1))
            self._enum_values = vals
        return self._enum_values

    @property
    def is_enum(self) -> bool:
        return bool(re.search(r"\benum\s+\w+", self.src))

    @property
    def is_record(self) -> bool:
        return bool(re.search(r"\brecord\s+\w+", self.src))

    # ---- Java 注释提取（用于生成 TS 契约的 TSDoc，实现「契约即文档」）----
    @staticmethod
    def clean_javadoc(raw: str) -> str:
        """Javadoc / 行注释 -> 纯文本：去 '*' 前缀、去 @tag 行、<p> 转空行、{@code x} 转 `x`"""
        lines = []
        for ln in raw.splitlines():
            ln = ln.strip()
            # 先去尾部结束标记，再去各行前缀，避免单行注释残留 '*/'
            ln = re.sub(r"\*/\s*$", "", ln)
            if ln.startswith("/**"):
                ln = ln[3:]
            elif ln.startswith("*"):
                ln = ln[1:]
            elif ln.startswith("//"):
                ln = ln[2:]
            lines.append(ln.strip())
        while lines and not lines[0]:
            lines.pop(0)
        while lines and not lines[-1]:
            lines.pop()
        out = []
        for ln in lines:
            # 剥离 @author/@since/@see 等与前端无关的标签行
            if re.match(r"^@(author|since|version|date|see|deprecated|serial)\b", ln):
                continue
            ln = re.sub(r"</?p>|</?br\s*/?>", "", ln)
            ln = re.sub(r"\{@code\s+([^}]*)\}", r"`\1`", ln)
            ln = re.sub(r"\{@link\s+([^}]*)\}", r"\1", ln)
            ln = re.sub(r"</?(b|i|em|strong|code|ul|li)>", "", ln)
            out.append(ln.strip())
        return "\n".join(out).strip()

    def doc_before(self, pos: int) -> str:
        """向上回溯提取紧邻 pos 的注释（允许间隔注解行与空行）"""
        head = self.src[:pos]
        # 1) Javadoc 块：与声明之间只允许注解 / 空行，出现其它声明语句则视为非紧邻
        blocks = list(re.finditer(r"/\*\*(.*?)\*/", head, re.S))
        if blocks:
            blk = blocks[-1]
            between = head[blk.end():]
            if not re.search(r"\b(private|public|protected|class|record|enum|interface|void|return|if|for|static)\b", between):
                return self.clean_javadoc(blk.group(0))
        # 2) 连续行注释（可穿插注解行）
        src_lines = head.splitlines()
        i = len(src_lines) - 1
        while i >= 0 and not src_lines[i].strip():
            i -= 1
        buf = []
        while i >= 0:
            t = src_lines[i].strip()
            if t.startswith("//"):
                buf.insert(0, t)
            elif not t or t.startswith("@") or t.endswith(")"):
                pass  # 空行与注解行：继续上溯
            else:
                break
            i -= 1
        return self.clean_javadoc("\n".join(buf)) if buf else ""

    @property
    def class_doc(self) -> str:
        """类 / record / enum 声明之上的 Javadoc"""
        if self._class_doc is None:
            m = re.search(
                r"\b(?:public\s+)?(?:final\s+)?(?:abstract\s+)?(?:class|record|enum|interface)\s+"
                + re.escape(self.cls_name) + r"\b", self.src)
            self._class_doc = self.doc_before(m.start()) if m else ""
        return self._class_doc

    @property
    def field_docs(self) -> Dict[str, str]:
        """字段名 -> 字段注释（源自字段之上的 Javadoc 或行注释）"""
        if self._field_docs is None:
            docs: Dict[str, str] = {}
            pat = re.compile(
                r"^[ \t]*(?:(?:private|public|protected)\s+)?(?:final\s+|static\s+final\s+|transient\s+)*"
                r"(?:@\w+(?:\([^)]*\))?\s*)*([\w.$<>?,\s\[\]]+?)\s+(\w+)\s*(?:=|;)", re.M)
            for m in pat.finditer(self.src):
                fname = m.group(2)
                if fname in docs:
                    continue
                d = self.doc_before(m.start())
                if d:
                    docs[fname] = d
            self._field_docs = docs
        return self._field_docs


def resolve_import(src: JavaSource, simple: str) -> str:
    """把简单类名解析为完整限定名（用于 schema 引用去重）"""
    for imp in src.imports:
        if imp.endswith("." + simple):
            return imp
    if src.pkg:
        return src.pkg + "." + simple
    return simple


# ======================================================================
# Schema 转换
# ======================================================================

class SchemaBuilder:
    """Java 类型 -> OpenAPI schema（带组件去重）"""

    def __init__(self):
        self.components: Dict[str, Dict[str, Any]] = OrderedDict()
        self._ref_stack: List[str] = []

    def convert(self, jt: JavaTypeRef, owner: Optional[JavaSource] = None) -> Dict[str, Any]:
        name = jt.simple
        # 基础类型
        if name in BASIC_TYPES:
            return dict(BASIC_TYPES[name])
        # 容器
        if name in CONTAINER_TYPES and jt.args:
            item = self.convert(jt.args[0], owner)
            return {"type": "array", "items": item}
        if name in MAP_TYPES:
            val = self.convert(jt.args[1], owner) if len(jt.args) >= 2 else {"type": "object"}
            return {"type": "object", "additionalProperties": val}
        if name == "Optional" and jt.args:
            return self.convert(jt.args[0], owner)
        if name in ("void", "Void", "Object", "JsonNode"):
            return {"type": "object", "nullable": True} if name in ("void", "Void") else {"type": "object"}
        # 枚举
        src = JavaSource.load(name, owner.pkg if owner else None)
        if src and src.is_enum:
            return {"type": "string", "enum": src.enum_values,
                    "description": src.class_doc or f"枚举 {name}"}
        # 自定义类 -> $ref（先占位防循环引用）
        if src:
            ref_name = name
            if ref_name not in self.components:
                self.components[ref_name] = {"type": "object", "description": f"building {ref_name}"}
                self.components[ref_name] = self._build_object_schema(src)
            return {"$ref": f"#/components/schemas/{ref_name}"}
        # 未知 -> object
        return {"type": "object"}

    def _build_object_schema(self, src: JavaSource) -> Dict[str, Any]:
        # 类级 Javadoc 作为 interface 的 TSDoc；字段级注释经 x-field-docs 透出
        # （OpenAPI 允许 x- 前缀扩展字段，$ref 同级 description 在 3.0 会被忽略，故不用它承载字段注释）
        cdoc = src.class_doc
        fdocs = src.field_docs
        if src.is_record:
            props = OrderedDict()
            required = []
            for fname, ftype in src.record_fields:
                jt = parse_type(ftype)
                sch = self.convert(jt, src)
                if fdocs.get(fname) and "$ref" not in sch:
                    sch = dict(sch, description=fdocs[fname])
                props[fname] = sch
                required.append(fname)
            return {"type": "object", "properties": props, "required": required,
                    "description": cdoc or f"record {src.cls_name}",
                    "x-field-docs": fdocs}
        props = OrderedDict()
        for fname, ftype, _ann in src.class_fields:
            jt = parse_type(ftype)
            sch = self.convert(jt, src)
            if fdocs.get(fname) and "$ref" not in sch:
                sch = dict(sch, description=fdocs[fname])
            props[fname] = sch
        return {"type": "object", "properties": props, "description": cdoc or f"class {src.cls_name}",
                "x-field-docs": fdocs}


# ======================================================================
# Controller 解析
# ======================================================================

def strip_comments(src: str) -> str:
    src = re.sub(r"/\*.*?\*/", "", src, flags=re.S)
    src = re.sub(r"^\s*//.*$", "", src, flags=re.M)
    return src


def extract_param_name(annot: str, decl: str, idx: int) -> Tuple[str, str]:
    """从参数注解 + 声明提取 (参数名, 位置 in query/path/body)"""
    m = re.search(r'@(Path|Request|RequestPart|RequestHeader)Variable\s*(?:\(\s*"([\w-]+)"\s*\))?', annot)
    if m:
        kind = {"Path": "path", "Request": "query", "RequestHeader": "header", "RequestPart": "form"}.get(m.group(1), "query")
        name = m.group(2) or _param_name(decl)
        return name, kind
    if "@RequestBody" in annot:
        return _param_name(decl), "body"
    if "@PathVariable" in annot:
        return _param_name(decl), "path"
    if "@RequestParam" in annot:
        return _param_name(decl), "query"
    return _param_name(decl), "query"


def _param_name(decl: str) -> str:
    decl = decl.strip()
    # 去掉注解部分
    decl = re.sub(r"@\w+(?:\([^)]*\))?\s*", "", decl).strip()
    parts = decl.split()
    return parts[-1] if parts else "arg"


def match_paren(s: str, open_idx: int) -> int:
    """从 open_idx（指向 '('）配平找到匹配的 ')' 下标"""
    depth = 0
    i = open_idx
    while i < len(s):
        ch = s[i]
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return len(s) - 1


def split_paren_top(s: str) -> List[str]:
    """顶层逗号拆分（配平 ()<>），用于参数列表拆分"""
    parts, depth, cur = [], 0, []
    for ch in s:
        if ch in "(<":
            depth += 1
        elif ch in ")>":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append("".join(cur).strip())
            cur = []
        else:
            cur.append(ch)
    if cur:
        parts.append("".join(cur).strip())
    return parts


def parse_controller(path: str) -> Tuple[Optional[str], List[Dict[str, Any]]]:
    """解析一个 Controller，返回 (service, endpoints)"""
    rel = os.path.relpath(path, CLOUD_ROOT).replace("\\", "/")
    svc = rel.split("/")[0].replace("ydsz-", "")
    src = strip_comments(open(path, encoding="utf-8", errors="ignore").read())
    # 类级映射
    cm = re.search(r'@RequestMapping\s*\(\s*(?:value\s*=\s*)?["\']([^"\']+)["\']', src)
    base = cm.group(1) if cm else ""
    # Spring 占位符（${prop:/default}）替换为默认值，避免破坏路径与参数解析
    base = re.sub(r"\$\{[\w.\-]+:\s*([^}]+)\}", r"\1", base)
    base = re.sub(r"\$\{[\w.\-]+\}", "", base)
    endpoints = []
    for m in re.finditer(r'@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping)\b', src):
        pos = m.start()
        verb = HTTP_VERBS[m.group(1)]
        # 方法路径
        pm = re.match(r'@\w+Mapping\s*\(\s*(?:value\s*=\s*)?["\']([^"\']*)["\']', src[pos:])
        sub = pm.group(1) if pm else ""
        # 方法签名: public Type name(
        sig_m = re.search(r"\bpublic\s+([\w.$<>?,\s\[\]]+?)\s+(\w+)\s*\(", src[pos:])
        if not sig_m:
            continue
        ret_raw = sig_m.group(1).strip()
        method_name = sig_m.group(2)
        open_idx = pos + sig_m.end() - 1
        close_idx = match_paren(src, open_idx)
        params_raw = src[open_idx + 1 : close_idx]
        # 返回类型
        ret_ref = parse_type(ret_raw)
        # 参数
        params = []
        for pseg in split_paren_top(params_raw):
            if not pseg.strip():
                continue
            ann_text = " ".join(re.findall(r"@\w+(?:\([^)]*\))?", pseg))
            decl = re.sub(r"@\w+(?:\([^)]*\))?", "", pseg).strip()
            jt = None
            m2 = re.match(r"^([\w.$<>?,\s\[\]]+?)\s+(\w+)$", decl)
            if m2:
                jt = parse_type(m2.group(1))
            name = _param_name(decl)
            kind = "query"
            if "@RequestBody" in ann_text:
                kind = "body"
            elif "@PathVariable" in ann_text:
                kind = "path"
                pm2 = re.search(r'@PathVariable\s*\(\s*"([\w-]+)"\s*\)', ann_text)
                if pm2:
                    name = pm2.group(1)
            elif "@RequestParam" in ann_text:
                kind = "query"
                pm2 = re.search(r'@RequestParam\s*\(\s*"([\w-]+)"\s*\)', ann_text)
                if pm2:
                    name = pm2.group(1)
            elif "@RequestPart" in ann_text:
                kind = "form"
            elif "@RequestHeader" in ann_text:
                kind = "header"
            if jt:
                params.append({"name": name, "kind": kind, "type": jt, "annot": ann_text})
        path = ("/" + base + "/" + sub).replace("//", "/").rstrip("/") or "/"
        endpoints.append({
            "method": verb,
            "path": path,
            "operationId": method_name,
            "returns": ret_ref,
            "params": params,
        })
    return svc, endpoints


# ======================================================================
# OpenAPI 生成
# ======================================================================

def build_openapi(svc: str, endpoints: List[Dict[str, Any]], builder: SchemaBuilder) -> Dict[str, Any]:
    paths: Dict[str, Any] = OrderedDict()
    for ep in endpoints:
        path_item = paths.setdefault(ep["path"], {})
        op: Dict[str, Any] = {
            "operationId": ep["operationId"],
            "tags": [svc],
            "responses": {
                "200": {
                    "description": "OK",
                    "content": {
                        "application/json": {
                            "schema": builder.convert(ep["returns"])
                        }
                    }
                }
            },
        }
        # 参数
        parameters = []
        req_body = None
        for p in ep["params"]:
            if p["kind"] == "body":
                req_body = {"required": True, "content": {"application/json": {"schema": builder.convert(p["type"])}}}
            elif p["kind"] == "path":
                parameters.append({"name": p["name"], "in": "path", "required": True, "schema": builder.convert(p["type"])})
            elif p["kind"] == "query":
                parameters.append({"name": p["name"], "in": "query", "required": False, "schema": builder.convert(p["type"])})
            elif p["kind"] == "header":
                parameters.append({"name": p["name"], "in": "header", "required": False, "schema": builder.convert(p["type"])})
        if parameters:
            op["parameters"] = parameters
        if req_body:
            op["requestBody"] = req_body
        path_item[ep["method"]] = op
    spec = {
        "openapi": "3.0.3",
        "info": {"title": f"ydsz-{svc}", "version": "1.0.0", "description": f"static contract extracted from ydsz-cloud {svc}"},
        "paths": paths,
        "components": {"schemas": builder.components},
    }
    return spec


# ======================================================================
# TS API 层生成
# ======================================================================

def java_to_ts(jschema: Dict[str, Any], builder: SchemaBuilder, depth: int = 0) -> str:
    """把 OpenAPI schema 转为 TS 类型表达式"""
    if "$ref" in jschema:
        return jschema["$ref"].split("/")[-1]
    t = jschema.get("type")
    if t == "array":
        item = java_to_ts(jschema.get("items", {}), builder, depth + 1)
        return f"{item}[]"
    if t == "object":
        # Map<K, V> 的 value 类型承载在 additionalProperties 中。
        # 旧实现一律退化为 Record<string, unknown>，导致 Map<String, Long>、
        # Map<String, Boolean> 等值类型信息在前端全部丢失。此处按真实 value 类型展开。
        ap = jschema.get("additionalProperties")
        if isinstance(ap, dict) and ap:
            value_ts = java_to_ts(ap, builder, depth + 1)
            if value_ts and value_ts != "unknown":
                return f"Record<string, {value_ts}>"
        return "Record<string, unknown>"
    if t == "integer":
        return "number"
    if t == "number":
        return "number"
    if t == "boolean":
        return "boolean"
    if t == "string":
        if "enum" in jschema:
            return " | ".join(f"'{v}'" for v in jschema["enum"]) if jschema["enum"] else "string"
        return "string"
    return "unknown"


# 占位描述（生成器早期写入的英文标记），出现时视为「后端无注释」
_PLACEHOLDER_DOC = re.compile(r"^(class|record|building|enum)\s+\w+$")

# 类型名后缀 -> 中文语义（后端未提供类注释时用于中性说明，避免产出裸类型）
_SUFFIX_DOC = (
    ("PageQuery", "分页查询条件"),
    ("PageVO", "分页视图对象"),
    ("DTO", "数据传输对象"),
    ("VO", "视图对象"),
    ("BO", "业务对象"),
    ("DO", "数据对象"),
    ("Query", "查询条件"),
    ("Request", "请求参数"),
    ("Response", "响应结果"),
    ("Entity", "实体"),
    ("Event", "事件"),
    ("Config", "配置"),
    ("Enum", "枚举"),
    ("Item", "条目"),
)


def infer_type_doc(name: str) -> str:
    """后端未提供类注释时的中性说明：只标注类型语义，不臆测业务含义"""
    for suf, zh in _SUFFIX_DOC:
        if name.endswith(suf) and len(name) > len(suf):
            return f"{name}（{zh}）：后端未提供类注释，建议在 Java 侧补充 Javadoc"
    return f"{name}：后端未提供类注释，建议在 Java 侧补充 Javadoc"


def tsdoc_lines(doc: str) -> List[str]:
    """文档文本 -> TSDoc 行（首行为概要，其余归入详情段）"""
    body = [ln.rstrip() for ln in doc.splitlines() if ln.strip()]
    if not body:
        return ["/**", " * TODO(ydsz-team): 补充类型说明", " */"]
    if len(body) == 1:
        return ["/**", f" * {body[0]}", " */"]
    out = ["/**", f" * {body[0]}", " *"]
    for ln in body[1:]:
        out.append(f" * {ln}".rstrip())
    out.append(" */")
    return out


def tsdoc_field_lines(doc: str) -> List[str]:
    """字段文档 -> 缩进 2 空格的 TSDoc 行；单行时压缩为一行块注释"""
    body = [ln.rstrip() for ln in doc.splitlines() if ln.strip()]
    if not body:
        return []
    if len(body) == 1:
        return [f"  /** {body[0]} */"]
    out = ["  /**"]
    out.extend(f"   * {ln}".rstrip() for ln in body)
    out.append("   */")
    return out


def build_ts_models(builder: SchemaBuilder) -> str:
    """为 components/schemas 生成 TS interface 定义（跳过前端已内置的基础响应类型）"""
    lines = []
    skip_names = {"YdszResponse", "PageResponse", "PageQuery", "IResponse"}
    for name, sch in builder.components.items():
        if name in skip_names:
            continue
        props = sch.get("properties", {})
        doc = (sch.get("description") or "").strip()
        if _PLACEHOLDER_DOC.match(doc):
            doc = ""
        # 空行分隔：上一 interface 结束时已追加，首个由 BASE_RESPONSE_TS 的尾换行提供
        lines.extend(tsdoc_lines(doc or infer_type_doc(name)))
        if not props:
            # 无字段 DTO 输出 type 别名而非空 interface：
            # 空 interface 触发 no-empty-object-type（结构上等价于宽容的 object 类型）
            lines.append(f"export type {name} = object;")
            lines.append("")
            continue
        fdocs = sch.get("x-field-docs", {})
        lines.append(f"export interface {name} {{")
        for fname, fs in props.items():
            fname_ts = fname if re.match(r"^[A-Za-z_$][\w$]*$", fname) else json.dumps(fname)
            ts_type = java_to_ts(fs, builder)
            # 字段注释优先取 x-field-docs（$ref 字段无法挂在同级 description 上）
            fdoc = (fdocs.get(fname) or fs.get("description") or "").strip()
            if fdoc and not _PLACEHOLDER_DOC.match(fdoc):
                lines.extend(tsdoc_field_lines(fdoc))
            lines.append(f"  {fname_ts}?: {ts_type};")
        lines.append("}")
        lines.append("")
    # 保留单个尾换行：ESLint eol-last 要求生成件同样以换行结尾
    return "\n".join(lines).rstrip() + "\n"


def camel(name: str) -> str:
    """任意风格 -> camelCase（首字母小写）：FlowTask->flowTask, CEPTest->cepTest, OAuth2Application->oauth2Application"""
    s = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1 \2", name)  # CEPTest -> CEP Test
    s = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", s)  # FlowTask -> Flow Task
    s = re.sub(r"[_\-]+", " ", s)
    parts = s.split()
    if not parts:
        return ""
    out = parts[0].lower()
    for p in parts[1:]:
        if p:
            out += p[0].upper() + p[1:].lower()
    return out


def collect_type_names(*exprs: str) -> List[str]:
    """从 TS 类型表达式中收集引用的自定义类型名（大写开头、非基础类型）"""
    BASIC_TS = {
        "string", "number", "boolean", "unknown", "void", "Record", "object",
        "Date", "any", "null", "undefined", "PageResponse", "YdszResponse",
    }
    names = set()
    for expr in exprs:
        # 剔除字符串字面量（enum 值如 'RECEIVED' 不应被当作类型名）
        expr = re.sub(r"'[^']*'", "", expr)
        expr = re.sub(r'"[^"]*"', "", expr)
        for m in re.finditer(r"\b([A-Z][A-Za-z0-9_]*)\b", expr):
            n = m.group(1)
            if n not in BASIC_TS:
                names.add(n)
    return sorted(names)


JS_RESERVED = {
    "abstract", "arguments", "await", "boolean", "break", "byte", "case", "catch",
    "char", "class", "const", "continue", "debugger", "default", "delete", "do",
    "double", "else", "enum", "eval", "export", "extends", "false", "final",
    "finally", "float", "for", "function", "goto", "if", "implements", "import",
    "in", "instanceof", "int", "interface", "let", "long", "native", "new", "null",
    "package", "private", "protected", "public", "return", "short", "static",
    "super", "switch", "synchronized", "this", "throw", "throws", "transient",
    "true", "try", "typeof", "var", "void", "volatile", "while", "with", "yield",
    "of",
}


def safe_fn_name(name: str) -> str:
    """规避 JS/TS 保留字：delete -> deleteApi"""
    return name + "Api" if name in JS_RESERVED else name


def gen_api_file(svc: str, ctrl_name: str, endpoints: List[Dict[str, Any]], builder: SchemaBuilder) -> str:
    """生成一个 Controller 对应的 TS API 文件"""
    header = (
        "/**\n"
        f" * {ctrl_name} API 封装（auto-generated by bash/gen-contract.py）\n"
        " *\n"
        f" * <p>对应后端 {{@code {ctrl_name}}}，共 {len(endpoints)} 个端点。\n"
        f" * <p>路径规范: /api/v1/{svc}/**（kebab-case），成功码统一为 code === 'A00000'。\n"
        " *\n"
        " * @author ydsz-team\n"
        f" * @auto-generated 请勿手动修改；后端契约变更后执行 {{@code python bash/gen-contract.py {svc}}} 重新生成\n"
        " * @since 1.0.0\n"
        " */\n"
        "import { requestClient } from '#/api/request';\n"
        "{extra_imports}\n"
        "\n"
    )
    lines = []
    used_types: List[str] = []
    any_page = False
    for ep in endpoints:
        # 函数名
        fn = safe_fn_name(camel(ep["operationId"]))
        # ---- 返回类型剥壳：后端 YdszResponse<T>/PageResponse<T>，前端拦截器已解包 data ----
        # 递归剥壳：YdszResponse<PageResponse<X>> 需剥两层，data 类型取最内层 X
        ret_ref = ep["returns"]
        data_ref = ret_ref
        is_page = False
        WRAP = ("YdszResponse", "PageResponse", "BaseResponse", "Result", "R", "AjaxResult")
        while data_ref and data_ref.simple in WRAP:
            if data_ref.simple == "PageResponse":
                is_page = True
            data_ref = data_ref.args[0] if data_ref.args else JavaTypeRef("Object")
        if data_ref and data_ref.simple in ("void", "Void"):
            ret_ts = "void"
        else:
            ret_schema = builder.convert(data_ref)
            ret_ts = java_to_ts(ret_schema, builder)
            if ret_ts in ("object", "Record<string, unknown>"):
                ret_ts = "unknown"
        if is_page:
            any_page = True
            ret_annotation = f"PageResponse<{ret_ts}>"
        elif ret_ts == "void":
            ret_annotation = "void"
        else:
            ret_annotation = ret_ts
        used_types.extend(collect_type_names(ret_annotation))
        # ---- 参数 ----
        path_params, query_params, body_param, form_params = [], [], [], []
        for p in ep["params"]:
            pt = java_to_ts(builder.convert(p["type"]), builder)
            used_types.extend(collect_type_names(pt))
            if p["kind"] == "path":
                path_params.append(f"    {camel(p['name'])}: {pt};")
            elif p["kind"] == "query":
                query_params.append(f"    {camel(p['name'])}?: {pt};")
            elif p["kind"] == "body":
                body_param = (camel(p["name"]), pt)
            elif p["kind"] == "form":
                form_params.append(f"    {camel(p['name'])}?: {pt};")
        # URL 模板：path 参数替换为 ${}；并对解析遗漏的占位符兜底替换
        url = ep["path"]
        path_keys: List[str] = []
        for p in ep["params"]:
            if p["kind"] == "path":
                path_keys.append(camel(p["name"]))
                url = url.replace("{" + p["name"] + "}", "${" + camel(p["name"]) + "}")
        for m in re.finditer(r"(?<!\$)\{([^{}]+)\}", url):
            pk = camel(m.group(1))
            url = url.replace("{" + m.group(1) + "}", "${" + pk + "}")
            if pk not in path_keys:
                path_params.append(f"    {pk}: string;")
                path_keys.append(pk)
        sig_parts = []
        if path_params:
            sig_parts.append("{{ {keys} }}: {{\n{body}\n  }}".format(
                keys=", ".join(path_keys), body=chr(10).join(path_params)))
        if query_params:
            sig_parts.append(f"params: {{\n{chr(10).join(query_params)}\n  }}")
        if body_param:
            sig_parts.append(f"data: {body_param[1]}")
        sig = ", ".join(sig_parts) if sig_parts else ""
        verb = ep["method"]
        # 请求体存在 -> 传 data；否则 query/form 传 { params }
        args = []
        if body_param:
            args.append("data")
        if query_params or form_params:
            args.append("{ params }")
        # DELETE 无 (url, data) 重载：请求体需并入 config（{ data } 或 { data, params }）
        if verb == "delete" and body_param:
            config_kv = ["data"]
            if query_params or form_params:
                config_kv.append("params")
            args = ["{{ {0} }}".format(", ".join(config_kv))]
        call_args = ", ".join(args)
        call = f"requestClient.{verb}<{ret_annotation}>(`{url}`"
        if call_args:
            call += ", " + call_args
        call += ")"
        # 生成 JSDoc。
        # 云顶编码规范 §3.1：unknown 属"特殊场景"，必须注释说明理由；
        # 后端返回 Map<String, Object> / Object 这类未固定为具名 VO 的响应会落到 unknown，
        # 若不注明理由即构成规范违规，故在此自动补齐说明。
        doc = [f" * {ep['operationId']}: {ep['method'].upper()} {ep['path']}"]
        if ret_annotation == "unknown":
            raw_ret = (ret_ref.raw if ret_ref else "").replace("*/", "*\\/")
            doc.append(" *")
            doc.append(" * <p>返回 unknown 的理由（云顶编码规范 §3.1 特殊场景豁免）：")
            doc.append(" * 后端方法声明为 {@code " + raw_ret + "}，响应结构未固定为具名 VO，")
            doc.append(" * 无法在生成期推导出稳定字段，故不使用 any，退守为 unknown。")
            doc.append(" * 调用方应在使用前做类型收窄（参见规范 §3.1 的 isUserInfo 参考实现）。")
        lines.append("/**\n" + "\n".join(doc) + "\n */")
        lines.append(f"export function {fn}({sig}): Promise<{ret_annotation}> {{")
        lines.append(f"  return {call};")
        lines.append("}")
        lines.append("")
    used_types = sorted(set(t for t in used_types if t != "PageResponse"))
    import_lines = []
    if any_page:
        import_lines.append("import type { PageResponse } from './models';")
    if used_types:
        import_lines.append("import type { " + ", ".join(used_types) + " } from './models';")
    header = header.replace("{extra_imports}", "\n".join(import_lines))
    return header + "\n".join(lines)


# ======================================================================
# 主流程
# ======================================================================

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    is_check = "--check" in sys.argv[1:]
    # P0-1（2026-09-02）：--spec-only 仅产出 openapi.json 契约基线，不重写旧轨 .ts 封装。
    # 供 unified-contract.mjs 降级链路转换为 schema.d.ts，实现新旧轨道解耦。
    is_spec_only = "--spec-only" in sys.argv[1:]
    targets = args if args else list(SERVICE_MAP.keys())
    for svc in targets:
        if svc not in SERVICE_MAP:
            print(f"[gen-contract] 未知服务: {svc}，可用: {list(SERVICE_MAP.keys())}")
            sys.exit(1)
    exit_code = 0
    for svc in targets:
        app = SERVICE_MAP[svc]
        svc_dir = os.path.join(CLOUD_ROOT, f"ydsz-{svc}")
        if not os.path.isdir(svc_dir):
            print(f"[gen-contract] 跳过 {svc}: 后端目录不存在 {svc_dir}")
            continue
        # 每个服务独立解析，清空类型缓存避免跨服务同名类串扰
        JavaSource._cache = {}
        JavaSource._not_found = set()
        try:
            # 1. 收集该服务全部 Controller
            controllers = {}
            for dp, dn, fn in os.walk(svc_dir):
                if "target" in dp:
                    continue
                for f in fn:
                    if f.endswith("Controller.java"):
                        p = os.path.join(dp, f)
                        s, eps = parse_controller(p)
                        if eps:
                            controllers.setdefault(f[:-5], []).extend(eps)
            if not controllers:
                print(f"[gen-contract] {svc}: 无 Controller")
                continue
            # 2. 构建 schema
            builder = SchemaBuilder()
            all_eps = []
            for ctrl, eps in controllers.items():
                all_eps.extend(eps)
            spec = build_openapi(svc, all_eps, builder)
        except Exception:
            import traceback
            traceback.print_exc()
            print(f"[gen-contract] {svc}: 生成失败")
            sys.exit(1)
        # P0-2 修复：--check 必须是纯只读。此前该分支仍会写 openapi.json / api/*.ts / models.ts，
        #          并 rename 归档"孤立"文件，导致 CI 校验污染工作区、产生幽灵变更。
        if not is_check:
            # 3. 输出 openapi.json + 生成 API 层（直接并入 api/ 根目录，遵循云顶规范 6.2 扁平结构）
            try:
                out_sdk = os.path.join(MICRO_ROOT, "apps", app, "src", "api", "sdk")
                os.makedirs(out_sdk, exist_ok=True)
                spec_path = os.path.join(out_sdk, "openapi.json")
                with open(spec_path, "w", encoding="utf-8") as f:
                    json.dump(spec, f, ensure_ascii=False, indent=1)
                # P0-1：--spec-only 模式到此即完成，跳过旧轨 .ts 封装与 index.ts 改写
                if is_spec_only:
                    print(
                        f"[gen-contract] {svc:10s} -> {app:16s} "
                        f"controllers={len(controllers):3d} endpoints={len(all_eps):4d} "
                        f"schemas={len(builder.components)} (--spec-only)"
                    )
                    continue
                # 业务 API 文件直接落在 api/ 根目录
                api_dir = os.path.join(MICRO_ROOT, "apps", app, "src", "api")
                os.makedirs(api_dir, exist_ok=True)
                # 文件名统一 camelCase 且首字母小写；大小写与既有文件保持一致，避免跨平台导出漂移
                existing_basenames = {f[:-3]: f for f in os.listdir(api_dir) if f.endswith(".ts")}

                def _export_name(fname: str) -> str:
                    for key in existing_basenames:
                        if key.lower() == fname.lower():
                            return key
                    return fname

                exports = []
                for ctrl in sorted(controllers):
                    fname = ctrl.replace("Controller", "").replace("controller", "")
                    fname = camel(fname) or ctrl
                    # 文件名统一 camelCase 且首字母小写
                    fname = fname[0].lower() + fname[1:] if fname else ctrl
                    fname = _export_name(fname)
                    fpath = os.path.join(api_dir, f"{fname}.ts")
                    content = gen_api_file(svc, ctrl, controllers[ctrl], builder)
                    with open(fpath, "w", encoding="utf-8") as f:
                        f.write("/** auto-generated by bash/gen-contract.py — DO NOT EDIT */\n// @data-file 纯类型 API 封装生成件（不计入行数/复杂度规则）\n" + content)
                    exports.append(fname)
                # models.ts 必须在 API 文件生成之后写入：gen_api_file 阶段才把
                # 返回类型（如 RuleDefinitionVO）加入 components，先写会导致类型缺失
                with open(os.path.join(api_dir, "models.ts"), "w", encoding="utf-8") as f:
                    f.write("/** auto-generated by bash/gen-contract.py — DO NOT EDIT */\n// @data-file 纯类型定义生成件（interface 占位不计入行数规则）\n" + BASE_RESPONSE_TS + "\n" + build_ts_models(builder))
                # 更新 api/index.ts：仅保留 core/request/models 导出。
                # 业务模块不在此聚合（多个 Controller 存在 get/stats/validate 等重名方法，
                # export * 会触发 TS2308 歧义），由业务代码按文件名直接 import（如 '#/api/ruleAdmin'）。
                idx_path = os.path.join(api_dir, "index.ts")
                idx_existing = ""
                if os.path.exists(idx_path):
                    idx_existing = open(idx_path, encoding="utf-8").read()
                if "export * from './core'" not in idx_existing:
                    idx_existing = idx_existing.rstrip() + "\nexport * from './core';\n" if idx_existing.strip() else "/**\n * API 索引（auto-generated 追加导出）\n */\nexport * from './core';\n"
                # 移除先前追加的业务模块/models 导出段，避免重复与歧义（core 保留）
                idx_existing = re.sub(r"(?m)^export \* from '\./(?!core|models)[\w]+';\n", "", idx_existing)
                idx_existing = re.sub(r"\nexport \* from '\./models';\n$", "\n", idx_existing)
                if "export * from './core'" not in idx_existing:
                    idx_existing = idx_existing.rstrip() + "\nexport * from './core';\n"
                if "export * from './models'" not in idx_existing:
                    idx_existing = idx_existing.rstrip() + "\nexport * from './models';\n"
                with open(idx_path, "w", encoding="utf-8") as f:
                    f.write(idx_existing)
                # 归档孤立生成文件（后端已删除相应 Controller 的旧产物），避免悬空导入
                expected_files = {e.lower() for e in set(exports) | {"index", "models", "request"}}
                gen_banner = "auto-generated by bash/gen-contract.py"
                for fname in sorted(os.listdir(api_dir)):
                    if not fname.endswith(".ts") or fname[:-3].lower() in expected_files:
                        continue
                    fpath_orphan = os.path.join(api_dir, fname)
                    if not os.path.isfile(fpath_orphan):
                        continue
                    try:
                        with open(fpath_orphan, encoding="utf-8", errors="ignore") as hf:
                            head = hf.read(300)
                    except OSError:
                        continue
                    if gen_banner not in head:
                        continue
                    # P0-8: 归档目录固定为 {app}/archived/contracts（位于 src 外，
                    #       避免 ESLint/tsconfig 将归档产物纳入工程导致解析错误）
                    bak_dir = os.path.join(MICRO_ROOT, "apps", app, "archived", "contracts")
                    os.makedirs(bak_dir, exist_ok=True)
                    dst = os.path.join(bak_dir, fname)
                    if os.path.exists(dst):
                        os.remove(dst)
                    os.rename(fpath_orphan, dst)
                    print(f"[gen-contract] {svc}: 归档孤立生成文件 {fname}")
                # 移除已废弃的 generated/ 目录（如存在）：rename 归档而非删除，规避沙箱回收站限制
                gen_old = os.path.join(api_dir, "generated")
                if os.path.isdir(gen_old):
                    import shutil
                    bak = os.path.join(MICRO_ROOT, "apps", app, "archived", "contracts")
                    if os.path.isdir(bak):
                        shutil.rmtree(bak)
                    os.rename(gen_old, bak)
            except Exception:
                import traceback
                traceback.print_exc()
                print(f"[gen-contract] {svc}: 写文件失败")
                sys.exit(1)
        total = len(all_eps)
        print(f"[gen-contract] {svc:10s} -> {app:16s} controllers={len(controllers):3d} endpoints={total:4d} schemas={len(builder.components)}")
        # 4. --check 模式：仅校验契约基线是否漂移（不改写文件）
        if is_check:
            spec_path = os.path.join(MICRO_ROOT, "apps", app, "src", "api", "sdk", "openapi.json")
            if not os.path.exists(spec_path):
                print(f"[gen-contract] {svc}: 契约基线缺失 {spec_path}，请先执行 pnpm gen:contract")
                exit_code = 1
                continue
            existing = open(spec_path, encoding="utf-8").read()
            current = json.dumps(spec, ensure_ascii=False, indent=1)
            if existing != current:
                print(f"[gen-contract] {svc}: ✗ 契约漂移！后端接口已变更，请执行 pnpm gen:contract 重新生成")
                exit_code = 1
            else:
                print(f"[gen-contract] {svc}: ✓ 契约一致")
    # 5. P1-6: 校验 Feign 路径常量与各服务契约一致（防 /ruleEngine 类路径失配复发）
    exit_code = check_feign_constants(exit_code)
    sys.exit(exit_code)


# ======================================================================
# P1-6: Feign 路径常量契约校验
# ======================================================================

FEIGN_CONSTANTS_REL = os.path.join(
    "ydsz-common", "ydsz-common-feign", "src", "main", "java",
    "com", "njydsz", "common", "feign", "FeignClientConstants.java")

# FeignClientConstants 常量名前缀 -> 目标服务
FEIGN_PREFIX_SERVICE = {
    "SYSTEM_": "system",
    "MESSAGE_": "message",
    "CRONJOB_": "cronjob",
    "LITERULE_": "literule",
    "WORKFLOW_": "workflow",
    "USERINFO_": "userinfo",
}


def _normalize_tpl(path: str) -> str:
    """路径模板归一化：{xxx} -> {}，便于与服务实际路径模板比对。"""
    return re.sub(r"\{[^}]*\}", "{}", path)


def check_feign_constants(exit_code: int) -> int:
    """校验 FeignClientConstants 路径常量均存在于对应服务 openapi.json（P1-6）。

    <p>历史缺陷：LITERULE_PATH_DRY_RUN 指向已废弃的 /ruleEngine/rules/dryRun，
    Feign 调用 404 后静默走 fallback。将本类常量纳入契约门禁可杜绝复发。

    @param exit_code 现有退出码（不覆盖已有失败）
    @return 更新后的退出码：存在失配常量时为 1
    """
    const_path = os.path.join(CLOUD_ROOT, FEIGN_CONSTANTS_REL)
    if not os.path.exists(const_path):
        print(f"[gen-contract] P1-6: 未找到 FeignClientConstants，跳过校验: {const_path}")
        return exit_code
    with open(const_path, encoding="utf-8", errors="ignore") as f:
        src = f.read()
    constants = re.findall(r'public\s+static\s+final\s+String\s+(\w+)\s*=\s*"([^"]+)"', src)
    # 聚合各服务已生成契约中的路径模板
    svc_paths: Dict[str, set] = {}
    for svc, app in SERVICE_MAP.items():
        spec_path = os.path.join(MICRO_ROOT, "apps", app, "src", "api", "sdk", "openapi.json")
        if not os.path.exists(spec_path):
            continue
        with open(spec_path, encoding="utf-8") as f:
            spec = json.load(f)
        svc_paths[svc] = {_normalize_tpl(p) for p in spec.get("paths", {})}
    mismatch = []
    for name, value in constants:
        prefix = next((p for p in FEIGN_PREFIX_SERVICE if name.startswith(p)), None)
        if prefix is None:
            continue
        paths = svc_paths.get(FEIGN_PREFIX_SERVICE[prefix])
        if paths is None:
            continue
        if _normalize_tpl(value) not in paths:
            mismatch.append((name, value, FEIGN_PREFIX_SERVICE[prefix]))
    if mismatch:
        for name, value, svc in mismatch:
            print(f"[gen-contract] P1-6: ✗ Feign 常量 {name}={value} 在 {svc} 契约中不存在")
        return 1
    print("[gen-contract] P1-6: Feign 路径常量与契约全部一致")
    return exit_code


if __name__ == "__main__":
    main()
