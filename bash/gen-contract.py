#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
ydsz-micro 静态契约提取器 + API 层生成器
==========================================
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

CLOUD_ROOT = r"D:\Code\open\ydsz-cloud"
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

/** 分页响应（对齐 {@code PageResponse<T>}） */
export interface PageResponse<T = unknown> extends YdszResponse<T> {
  pages?: number;
  total?: number;
  pageNum?: number;
  pageSize?: number;
  current?: number;
  size?: number;
}

/** 分页查询参数 */
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

    @classmethod
    def load(cls, simple_name: str, hint_pkg: Optional[str] = None) -> Optional["JavaSource"]:
        """按简单类名查找（带缓存）"""
        if simple_name in cls._cache:
            return cls._cache[simple_name]
        if simple_name in BASIC_TYPES or simple_name in ("Object", "String", "Integer", "Long", "Boolean", "Double", "Float", "BigDecimal", "BigInteger", "Character", "Short", "Byte", "UUID", "LocalDate", "LocalDateTime", "LocalTime", "Instant", "OffsetDateTime", "Date", "Timestamp", "JsonNode", "List", "Set", "Map", "Collection", "Iterable", "ArrayList", "LinkedList", "HashSet", "TreeSet", "HashMap", "LinkedHashMap", "TreeMap", "ConcurrentHashMap", "Optional", "Map.Entry"):
            return None
        found = None
        for root in JAVA_ROOTS:
            for dp, dn, fn in os.walk(root):
                if "target" in dp or "node_modules" in dp:
                    continue
                if f"{simple_name}.java" in fn:
                    p = os.path.join(dp, f"{simple_name}.java")
                    found = JavaSource(p)
                    break
            if found:
                break
        if found:
            cls._cache[simple_name] = found
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
            m = re.search(r"\benum\s+\w+\s*\{([^}]*)\}", self.src)
            vals = []
            if m:
                for seg in m.group(1).split(","):
                    seg = seg.strip()
                    if seg:
                        vals.append(seg.split("(")[0].split(";")[0].strip())
            self._enum_values = vals
        return self._enum_values

    @property
    def is_enum(self) -> bool:
        return bool(re.search(r"\benum\s+\w+", self.src))

    @property
    def is_record(self) -> bool:
        return bool(re.search(r"\brecord\s+\w+", self.src))


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
            return {"type": "string", "enum": src.enum_values, "description": f"枚举 {name}"}
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
        if src.is_record:
            props = OrderedDict()
            required = []
            for fname, ftype in src.record_fields:
                jt = parse_type(ftype)
                props[fname] = self.convert(jt, src)
                required.append(fname)
            return {"type": "object", "properties": props, "required": required,
                    "description": f"record {src.cls_name}"}
        props = OrderedDict()
        for fname, ftype, _ann in src.class_fields:
            jt = parse_type(ftype)
            props[fname] = self.convert(jt, src)
        return {"type": "object", "properties": props, "description": f"class {src.cls_name}"}


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


def parse_controller(path: str) -> Tuple[Optional[str], List[Dict[str, Any]]]:
    """解析一个 Controller，返回 (service, endpoints)"""
    rel = os.path.relpath(path, CLOUD_ROOT).replace("\\", "/")
    svc = rel.split("/")[0].replace("ydsz-", "")
    src = strip_comments(open(path, encoding="utf-8", errors="ignore").read())
    # 类级映射
    cm = re.search(r'@RequestMapping\s*\(\s*(?:value\s*=\s*)?["\']([^"\']+)["\']', src)
    base = cm.group(1) if cm else ""
    # 去掉所有注解（保留方法体），逐方法切分
    endpoints = []
    # 用方法级注解切分：找到每个 @XxxMapping 的位置
    method_positions = [(m.start(), m) for m in re.finditer(r'@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping)\b', src)]
    for i, (pos, m) in enumerate(method_positions):
        end = method_positions[i + 1][0] if i + 1 < len(method_positions) else len(src)
        seg = src[pos:end]
        verb = HTTP_VERBS[m.group(1)]
        # 方法路径
        pm = re.search(r'@(?:Get|Post|Put|Delete|Patch)Mapping\s*\(\s*(?:value\s*=\s*)?["\']([^"\']*)["\']', seg)
        sub = pm.group(1) if pm else ""
        # 方法签名（public ... name(...)）
        sig = re.search(r'public\s+([\w.$<>?,\s\[\]]+?)\s+(\w+)\s*\(([^)]*)\)', seg, re.S)
        if not sig:
            continue
        ret_raw = sig.group(1).strip()
        method_name = sig.group(2)
        params_raw = sig.group(3)
        # 返回类型
        ret_ref = parse_type(ret_raw)
        # 参数
        params = []
        param_segs = split_top_level(params_raw) if params_raw.strip() else []
        for pseg in param_segs:
            # 分离注解与类型声明
            ann_m = re.findall(r"@(\w+(?:\([^)]*\))?)", pseg)
            ann_text = " ".join(ann_m)
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
            elif "@RequestPart" in ann_text or "@RequestHeader" in ann_text:
                kind = "form" if "@RequestPart" in ann_text else "header"
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


def build_ts_models(builder: SchemaBuilder) -> str:
    """为 components/schemas 生成 TS interface 定义"""
    lines = []
    for name, sch in builder.components.items():
        props = sch.get("properties", {})
        if not props:
            lines.append(f"export interface {name} {{}}")
            continue
        lines.append(f"export interface {name} {{")
        for fname, fs in props.items():
            fname_ts = fname if re.match(r"^[A-Za-z_$][\w$]*$", fname) else json.dumps(fname)
            ts_type = java_to_ts(fs, builder)
            lines.append(f"  /** {fs.get('description','')} */".rstrip() if fs.get("description") else "")
            lines.append(f"  {fname_ts}?: {ts_type};")
        lines.append("}")
        lines.append("")
    return "\n".join(lines).rstrip()


def camel(name: str) -> str:
    """下划线/连字符 -> camelCase（用于 TS 字段名）"""
    parts = re.split(r"[_-]+", name)
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def gen_api_file(svc: str, ctrl_name: str, endpoints: List[Dict[str, Any]], builder: SchemaBuilder) -> str:
    """生成一个 Controller 对应的 TS API 文件"""
    header = f"""/**
 * {ctrl_name} API 封装（auto-generated by bash/gen-contract.py）
 *
 * <p>对应后端 {{@code {ctrl_name}}}，共 {len(endpoints)} 个端点。
 * <p>路径规范: /api/v1/{svc}/**（kebab-case），成功码统一为 code === 'A00000'。
 *
 * @author ydsz-team
 * @auto-generated 请勿手动修改；后端契约变更后执行 {{@code python bash/gen-contract.py {svc}}} 重新生成
 * @since 1.0.0
 */
import {{ requestClient }} from '#/api/request';
import type {{ YdszResponse, PageResponse, PageQuery }} from './base';

"""
    lines = [header]
    used_types = set()
    for ep in endpoints:
        # 函数名
        fn = camel(ep["operationId"])
        ret_schema = builder.convert(ep["returns"])
        ret_ts = java_to_ts(ret_schema, builder)
        if ret_ts in ("object", "Record<string, unknown>", "unknown") or ret_ts.endswith("[]"):
            data_type = ret_ts if ret_ts not in ("object", "Record<string, unknown>", "unknown") else "unknown"
            wrapper = "YdszResponse"
        else:
            data_type = ret_ts
            wrapper = "YdszResponse"
        # 参数
        path_params, query_params, body_param, form_params = [], [], [], []
        for p in ep["params"]:
            pt = java_to_ts(builder.convert(p["type"]), builder)
            if p["kind"] == "path":
                path_params.append(f"    {camel(p['name'])}: {pt};")
            elif p["kind"] == "query":
                query_params.append(f"    {camel(p['name'])}?: {pt};")
            elif p["kind"] == "body":
                body_param = (camel(p["name"]), pt)
            elif p["kind"] == "form":
                form_params.append(f"    {camel(p['name'])}?: {pt};")
        sig_parts = []
        if path_params:
            sig_parts.append(f"path: {{\n{'\\n'.join(path_params)}\n  }}")
        if query_params:
            sig_parts.append(f"params: {{\n{'\\n'.join(query_params)}\n  }}")
        if body_param:
            sig_parts.append(f"data: {body_param[1]}")
        sig = ", ".join(sig_parts) if sig_parts else ""
        # URL 模板
        url = ep["path"]
        for p in ep["params"]:
            if p["kind"] == "path":
                url = url.replace("{" + p["name"] + "}", "${" + camel(p["name"]) + "}")
        verb = ep["method"]
        ret_annotation = f"{wrapper}<{data_type}>" if data_type != "void" else f"{wrapper}<void>"
        if data_type == "unknown":
            ret_annotation = "YdszResponse<unknown>"
        if ret_ts.endswith("[]"):
            pass
        call = f"requestClient.{verb}<{ret_annotation}>(`{url}`"
        args = []
        if body_param:
            args.append("data")
        if query_params or form_params:
            args.append("{ params }")
        if path_params and not args:
            args.append("{}")
        call_args = ", ".join(args)
        call = f"{call}{', ' if call_args else ''}{call_args})"
        # 生成
        lines.append(f"/**\n * {ep['operationId']}: {ep['method'].upper()} {ep['path']}\n */")
        lines.append(f"export function {fn}({sig}): Promise<{ret_annotation}> {{")
        lines.append(f"  return {call};")
        lines.append("}")
        lines.append("")
    return "\n".join(lines)


# ======================================================================
# 主流程
# ======================================================================

def main():
    targets = sys.argv[1:] if len(sys.argv) > 1 else list(SERVICE_MAP.keys())
    for svc in targets:
        if svc not in SERVICE_MAP:
            print(f"[gen-contract] 未知服务: {svc}，可用: {list(SERVICE_MAP.keys())}")
            sys.exit(1)
    for svc in targets:
        app = SERVICE_MAP[svc]
        svc_dir = os.path.join(CLOUD_ROOT, f"ydsz-{svc}")
        if not os.path.isdir(svc_dir):
            print(f"[gen-contract] 跳过 {svc}: 后端目录不存在 {svc_dir}")
            continue
        # 每个服务独立解析，清空类型缓存避免跨服务同名类串扰
        JavaSource._cache = {}
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
        # 3. 输出 openapi.json + 生成 API 层
        try:
            out_sdk = os.path.join(MICRO_ROOT, "apps", app, "src", "api", "sdk")
            os.makedirs(out_sdk, exist_ok=True)
            spec_path = os.path.join(out_sdk, "openapi.json")
            with open(spec_path, "w", encoding="utf-8") as f:
                json.dump(spec, f, ensure_ascii=False, indent=1)
            gen_dir = os.path.join(MICRO_ROOT, "apps", app, "src", "api", "generated")
            os.makedirs(gen_dir, exist_ok=True)
            with open(os.path.join(gen_dir, "base.ts"), "w", encoding="utf-8") as f:
                f.write("/* eslint-disable */\n/** auto-generated by bash/gen-contract.py — DO NOT EDIT */\n" + BASE_RESPONSE_TS)
            exports = []
            for ctrl in sorted(controllers):
                fname = ctrl.replace("Controller", "").replace("controller", "")
                fname = camel(fname) or ctrl
                fpath = os.path.join(gen_dir, f"{fname}.ts")
                content = gen_api_file(svc, ctrl, controllers[ctrl], builder)
                with open(fpath, "w", encoding="utf-8") as f:
                    f.write("/* eslint-disable */\n/** auto-generated by bash/gen-contract.py — DO NOT EDIT */\n" + content)
                exports.append(fname)
            with open(os.path.join(gen_dir, "index.ts"), "w", encoding="utf-8") as f:
                f.write("/* eslint-disable */\n/** auto-generated by bash/gen-contract.py — DO NOT EDIT */\n")
                for e in sorted(set(exports)):
                    f.write(f"export * from './{e}';\n")
                f.write("export * from './base';\n")
        except Exception:
            import traceback
            traceback.print_exc()
            print(f"[gen-contract] {svc}: 写文件失败")
            sys.exit(1)
        total = len(all_eps)
        print(f"[gen-contract] {svc:10s} -> {app:16s} controllers={len(controllers):3d} endpoints={total:4d} schemas={len(builder.components)}")


if __name__ == "__main__":
    main()
