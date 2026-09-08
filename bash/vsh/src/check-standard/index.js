"use strict";
/**
 * 云顶编码规范合规扫描器（vsh check-standard）
 *
 * 以代码事实为准，对 apps/ comm/ main/ 逐项核验《前端模块-云顶编码规范》19 章
 * 中的【强制】条款，输出结构化违规清单。
 *
 * 判定口径严格对齐规范原文：
 * - §3.1  业务代码（apps/*、comm/effects/*、main/* 非生成件）严禁 any
 * - §4.1  `<script setup>` 优先，结构顺序 script → template → style
 * - §4.4  组件文件名与组件名使用 PascalCase
 * - §4.6  v-for 禁止索引作为 key
 * - §5.3  首屏外图片必须 loading="lazy"
 * - §14.5 生产环境禁止 console.*
 * - §15.1 SFC ≤1000 行 / 逻辑文件 ≤500 行 / 数据文件 ≤1000 行（需 @data-file）
 * - §15.3 函数行数 ≤50 行
 *
 * 用法：pnpm vsh:check-standard
 *
 * @path bash\vsh\src\check-standard\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
// ---------------------------------------------------------------------------
// 配置
// ---------------------------------------------------------------------------
var ROOT = process.cwd();
/** 跳过这些路径片段 */
var SKIP_SEGMENTS = new Set([
    'node_modules',
    'dist',
    'coverage',
    '.turbo',
    '.git',
    'build',
    '.output',
    'public',
    'vendor',
]);
/** §3.1 豁免：第三方 CLI 生成件，其受控 any 透传不可控 */
var ANY_EXEMPT_SEGMENTS = ['shadcn-ui', '__tests__', '.generated-archived'];
/** 测试 / 示例 / stories 文件：console 与 any 豁免，但行数仍受约束 */
var EXEMPT_FILE_PATTERN = /(\.test\.|\.spec\.|__tests__|\.stories\.|coverage)/i;
/** 生成件：行数豁免但需 @data-file 注解 */
var GENERATED_MARKER = 'auto-generated';
// ---------------------------------------------------------------------------
// 工具
// ---------------------------------------------------------------------------
var violations = [];
function add(rule, file, line, message, severity) {
    violations.push({ rule: rule, file: file, line: line, message: message, severity: severity });
}
function rel(abs) {
    return (0, node_path_1.relative)(ROOT, abs).split(node_path_1.sep).join('/');
}
/** 递归收集文件 */
function walk(dir, exts, out) {
    if (out === void 0) { out = []; }
    var entries;
    try {
        entries = (0, node_fs_1.readdirSync)(dir);
    }
    catch (_a) {
        return out;
    }
    var _loop_1 = function (name_1) {
        if (SKIP_SEGMENTS.has(name_1))
            return "continue";
        var full = (0, node_path_1.join)(dir, name_1);
        var st = void 0;
        try {
            st = (0, node_fs_1.statSync)(full);
        }
        catch (_b) {
            return "continue";
        }
        if (st.isDirectory()) {
            walk(full, exts, out);
        }
        else if (exts.some(function (e) { return name_1.endsWith(e); })) {
            out.push(full);
        }
    };
    for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
        var name_1 = entries_1[_i];
        _loop_1(name_1);
    }
    return out;
}
function read(abs) {
    try {
        return (0, node_fs_1.readFileSync)(abs, 'utf8');
    }
    catch (_a) {
        return '';
    }
}
var TS_FILES = walk((0, node_path_1.join)(ROOT, 'apps'), ['.ts'])
    .concat(walk((0, node_path_1.join)(ROOT, 'comm'), ['.ts']))
    .concat(walk((0, node_path_1.join)(ROOT, 'main'), ['.ts']));
var VUE_FILES = walk((0, node_path_1.join)(ROOT, 'apps'), ['.vue'])
    .concat(walk((0, node_path_1.join)(ROOT, 'comm'), ['.vue']))
    .concat(walk((0, node_path_1.join)(ROOT, 'main'), ['.vue']));
// ---------------------------------------------------------------------------
// §3.1 严禁 any（业务代码）
// ---------------------------------------------------------------------------
var ANY_PATTERNS = [
    { re: /:\s*\bany\b\s*(?=[;,)\]>=])/g, label: '显式 any 类型标注' },
    { re: /<\s*any\s*>/g, label: '泛型 any 实参' },
    { re: /\bas\s+any\b/g, label: 'as any 类型断言' },
    { re: /\bany\s*\[\s*\]/g, label: 'any[] 数组' },
    { re: /\bArray\s*<\s*any\s*>/g, label: 'Array<any>' },
    { re: /\bRecord\s*<\s*string\s*,\s*any\s*>/g, label: 'Record<string, any>' },
    { re: /\bPromise\s*<\s*any\s*>/g, label: 'Promise<any>' },
];
function checkAny() {
    var _a;
    var _loop_2 = function (file) {
        var p = rel(file);
        if (ANY_EXEMPT_SEGMENTS.some(function (s) { return p.includes(s); }))
            return "continue";
        if (EXEMPT_FILE_PATTERN.test(p))
            return "continue";
        var content = read(file);
        if (!content)
            return "continue";
        var lines = content.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var line = (_a = lines[i]) !== null && _a !== void 0 ? _a : '';
            // 跳过纯注释行中的说明性文字（如"避免使用 as any"）
            var trimmed = line.trim();
            if (trimmed.startsWith('*') || trimmed.startsWith('//'))
                continue;
            for (var _c = 0, ANY_PATTERNS_1 = ANY_PATTERNS; _c < ANY_PATTERNS_1.length; _c++) {
                var _d = ANY_PATTERNS_1[_c], re = _d.re, label = _d.label;
                re.lastIndex = 0;
                if (re.test(line)) {
                    add('§3.1', p, i + 1, "".concat(label, "\uFF1A").concat(trimmed.slice(0, 90)), 'P1');
                }
            }
        }
    };
    for (var _i = 0, _b = __spreadArray(__spreadArray([], TS_FILES, true), VUE_FILES, true); _i < _b.length; _i++) {
        var file = _b[_i];
        _loop_2(file);
    }
}
// ---------------------------------------------------------------------------
// §4.1 script setup 优先 + 结构顺序
// ---------------------------------------------------------------------------
function checkSfcStructure() {
    for (var _i = 0, VUE_FILES_1 = VUE_FILES; _i < VUE_FILES_1.length; _i++) {
        var file = VUE_FILES_1[_i];
        var p = rel(file);
        var content = read(file);
        if (!content)
            continue;
        var hasScript = /<script[\s>]/.test(content);
        var hasSetup = /<script[^>]*\bsetup\b[^>]*>/.test(content);
        var hasTemplate = /<template[\s>]/.test(content);
        if (!hasScript)
            continue;
        if (!hasSetup) {
            add('§4.1', p, 0, 'SFC 未使用 <script setup> 语法', 'P2');
        }
        // 结构顺序：script → template → style
        if (hasSetup && hasTemplate) {
            var scriptIdx = content.search(/<script[^>]*\bsetup\b[^>]*>/);
            var templateIdx = content.search(/<template[\s>]/);
            if (templateIdx >= 0 && scriptIdx > templateIdx) {
                add('§4.1', p, 0, 'SFC 结构顺序违规：<template> 应位于 <script setup> 之后', 'P2');
            }
        }
    }
}
// ---------------------------------------------------------------------------
// §4.4 组件文件名 PascalCase
// ---------------------------------------------------------------------------
function checkComponentNaming() {
    var _a;
    for (var _i = 0, VUE_FILES_2 = VUE_FILES; _i < VUE_FILES_2.length; _i++) {
        var file = VUE_FILES_2[_i];
        var p = rel(file);
        var base = (_a = p.split('/').pop()) !== null && _a !== void 0 ? _a : '';
        if (base === 'index.vue')
            continue; // index.vue 是目录组件约定，单独统计
        if (EXEMPT_FILE_PATTERN.test(p))
            continue;
        if (!/^[A-Z]/.test(base)) {
            add('§4.4', p, 0, "\u7EC4\u4EF6\u6587\u4EF6\u540D\u5E94\u4E3A PascalCase\uFF0C\u5F53\u524D\uFF1A".concat(base), 'P2');
        }
    }
}
// ---------------------------------------------------------------------------
// §4.6 v-for 禁止索引 key
// ---------------------------------------------------------------------------
var INDEX_KEY_RE = /:key\s*=\s*["'](index|i|idx|idx2|_\w*)["']/g;
function checkVForKey() {
    var _a;
    for (var _i = 0, VUE_FILES_3 = VUE_FILES; _i < VUE_FILES_3.length; _i++) {
        var file = VUE_FILES_3[_i];
        var p = rel(file);
        var content = read(file);
        if (!content)
            continue;
        var lines = content.split('\n');
        for (var i = 0; i < lines.length; i++) {
            INDEX_KEY_RE.lastIndex = 0;
            var line = (_a = lines[i]) !== null && _a !== void 0 ? _a : '';
            if (INDEX_KEY_RE.test(line)) {
                add('§4.6', p, i + 1, "v-for \u4F7F\u7528\u7D22\u5F15\u4F5C\u4E3A key\uFF1A".concat(line.trim().slice(0, 80)), 'P1');
            }
        }
    }
}
// ---------------------------------------------------------------------------
// §5.3 图片懒加载
// ---------------------------------------------------------------------------
function checkImageLazy() {
    for (var _i = 0, VUE_FILES_4 = VUE_FILES; _i < VUE_FILES_4.length; _i++) {
        var file = VUE_FILES_4[_i];
        var p = rel(file);
        var content = read(file);
        if (!content || !/<img[\s>]/.test(content))
            continue;
        // 提取所有 <img ...> 标签（支持多行）
        var imgRe = /<img\b[\s\S]*?>/g;
        var m = void 0;
        while ((m = imgRe.exec(content)) !== null) {
            var tag = m[0];
            var offset = content.slice(0, m.index).split('\n').length;
            if (!/loading\s*=\s*["']lazy["']/.test(tag)) {
                add('§5.3', p, offset, "<img> \u7F3A\u5C11 loading=\"lazy\"\uFF08\u9996\u5C4F\u5185\u56FE\u7247\u53EF\u8C41\u514D\uFF0C\u9700\u4EBA\u5DE5\u786E\u8BA4\uFF09", 'P2');
            }
        }
    }
}
// ---------------------------------------------------------------------------
// §14.5 生产环境禁止 console
// ---------------------------------------------------------------------------
var CONSOLE_RE = /\bconsole\s*\.\s*(log|info|warn|error|debug)\s*\(/g;
function checkConsole() {
    var _a;
    var scan = __spreadArray(__spreadArray([], TS_FILES, true), VUE_FILES, true);
    for (var _i = 0, scan_1 = scan; _i < scan_1.length; _i++) {
        var file = scan_1[_i];
        var p = rel(file);
        // logger 实现本身允许使用 console
        if (p.endsWith('logger.ts'))
            continue;
        if (EXEMPT_FILE_PATTERN.test(p))
            continue;
        var content = read(file);
        if (!content)
            continue;
        var lines = content.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var line = (_a = lines[i]) !== null && _a !== void 0 ? _a : '';
            var trimmed = line.trim();
            if (trimmed.startsWith('*') || trimmed.startsWith('//'))
                continue;
            CONSOLE_RE.lastIndex = 0;
            if (CONSOLE_RE.test(line)) {
                add('§14.5', p, i + 1, "\u76F4\u63A5\u4F7F\u7528 console\uFF0C\u5E94\u6539\u7528 logger\uFF1A".concat(trimmed.slice(0, 80)), 'P1');
            }
        }
    }
}
// ---------------------------------------------------------------------------
// §15.1 文件行数
// ---------------------------------------------------------------------------
function isDataFile(content) {
    // 判定工具：不含函数体与控制流语法即视为声明/资源类文件
    return !/\bfunction\b|=>\s*[{]|=>\s*[^(]*$|\bif\s*\(|\bfor\s*\(|\bwhile\s*\(|\bswitch\s*\(/.test(content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''));
}
function checkFileLength() {
    var all = __spreadArray(__spreadArray([], TS_FILES, true), VUE_FILES, true);
    for (var _i = 0, all_1 = all; _i < all_1.length; _i++) {
        var file = all_1[_i];
        var p = rel(file);
        var content = read(file);
        if (!content)
            continue;
        var lines = content.split('\n').length;
        var isVue = p.endsWith('.vue');
        var isGenerated = content.includes(GENERATED_MARKER);
        var hasDataFileTag = content.includes('@data-file');
        var isTypeFile = /types?\.ts$|\.d\.ts$/.test(p);
        if (isVue) {
            if (lines > 1000) {
                add('§15.1', p, 0, "Vue SFC ".concat(lines, " \u884C\uFF0C\u8D85\u8FC7 1000 \u884C\u4E0A\u9650"), 'P1');
            }
            continue;
        }
        if (isTypeFile) {
            if (lines > 1500) {
                add('§15.1', p, 0, "\u7C7B\u578B\u58F0\u660E\u6587\u4EF6 ".concat(lines, " \u884C\uFF0C\u8D85\u8FC7 1500 \u884C\u4E0A\u9650"), 'P1');
            }
            continue;
        }
        var dataLike = isDataFile(content);
        if (dataLike || isGenerated) {
            if (lines > 1000) {
                add('§15.1', p, 0, "\u6570\u636E/\u751F\u6210\u6587\u4EF6 ".concat(lines, " \u884C\uFF0C\u8D85\u8FC7 1000 \u884C\u4E0A\u9650\uFF08\u9700\u6309\u6A21\u5757\u62C6\u5206\uFF09"), 'P1');
            }
            if (lines > 500 && !hasDataFileTag) {
                add('§15.1', p, 0, "\u6570\u636E\u6587\u4EF6 ".concat(lines, " \u884C\u4F46\u7F3A\u5C11 // @data-file \u9876\u90E8\u6CE8\u89E3"), 'P2');
            }
            continue;
        }
        if (lines > 500) {
            add('§15.1', p, 0, "\u4E1A\u52A1\u903B\u8F91\u6587\u4EF6 ".concat(lines, " \u884C\uFF0C\u8D85\u8FC7 500 \u884C\u4E0A\u9650"), 'P1');
        }
    }
}
// ---------------------------------------------------------------------------
// §15.3 函数行数 ≤ 50
// ---------------------------------------------------------------------------
function checkFunctionLength() {
    var _a, _b, _c;
    for (var _i = 0, TS_FILES_1 = TS_FILES; _i < TS_FILES_1.length; _i++) {
        var file = TS_FILES_1[_i];
        var p = rel(file);
        if (EXEMPT_FILE_PATTERN.test(p))
            continue;
        var content = read(file);
        if (!content)
            continue;
        if (isDataFile(content))
            continue;
        var lines = content.split('\n');
        var start = -1;
        var name_2 = '';
        var depth = 0;
        for (var i = 0; i < lines.length; i++) {
            var line = (_a = lines[i]) !== null && _a !== void 0 ? _a : '';
            if (start < 0) {
                var m = (_b = /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/.exec(line)) !== null && _b !== void 0 ? _b : /^\s*(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(/.exec(line);
                if (m && line.trimEnd().endsWith('{')) {
                    start = i;
                    name_2 = (_c = m[1]) !== null && _c !== void 0 ? _c : '(anonymous)';
                    depth = 0;
                }
                continue;
            }
            for (var _d = 0, line_1 = line; _d < line_1.length; _d++) {
                var ch = line_1[_d];
                if (ch === '{')
                    depth++;
                else if (ch === '}')
                    depth--;
            }
            if (depth <= 0 && start >= 0) {
                var len = i - start + 1;
                if (len > 50) {
                    add('§15.3', p, start + 1, "\u51FD\u6570 ".concat(name_2, "() \u5171 ").concat(len, " \u884C\uFF0C\u8D85\u8FC7 50 \u884C\u4E0A\u9650"), 'P2');
                }
                start = -1;
            }
        }
    }
}
// ---------------------------------------------------------------------------
// §7.3 硬编码敏感信息
// ---------------------------------------------------------------------------
var SECRET_PATTERNS = [
    { re: /\bsk-[A-Za-z0-9]{16,}/g, label: '疑似 OpenAI/LLM API Key' },
    { re: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g, label: '疑似 AWS Access Key' },
    { re: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{6,}['"]/gi, label: '疑似硬编码密码' },
    { re: /(?:secret|apiKey|api_key|token)\s*[:=]\s*['"][A-Za-z0-9_-]{16,}['"]/gi, label: '疑似硬编码密钥/Token' },
];
function checkSecrets() {
    var _a;
    for (var _i = 0, _b = __spreadArray(__spreadArray([], TS_FILES, true), VUE_FILES, true); _i < _b.length; _i++) {
        var file = _b[_i];
        var p = rel(file);
        if (EXEMPT_FILE_PATTERN.test(p))
            continue;
        var content = read(file);
        if (!content)
            continue;
        var lines = content.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var line = (_a = lines[i]) !== null && _a !== void 0 ? _a : '';
            var trimmed = line.trim();
            if (trimmed.startsWith('*') || trimmed.startsWith('//'))
                continue;
            for (var _c = 0, SECRET_PATTERNS_1 = SECRET_PATTERNS; _c < SECRET_PATTERNS_1.length; _c++) {
                var _d = SECRET_PATTERNS_1[_c], re = _d.re, label = _d.label;
                re.lastIndex = 0;
                if (re.test(line)) {
                    add('§7.3', p, i + 1, "".concat(label, "\uFF1A").concat(trimmed.slice(0, 70)), 'P0');
                }
            }
        }
    }
}
// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------
function main() {
    var _a;
    checkAny();
    checkSfcStructure();
    checkComponentNaming();
    checkVForKey();
    checkImageLazy();
    checkConsole();
    checkFileLength();
    checkFunctionLength();
    checkSecrets();
    // 汇总
    var bySeverity = { P0: 0, P1: 0, P2: 0 };
    for (var _i = 0, violations_1 = violations; _i < violations_1.length; _i++) {
        var v = violations_1[_i];
        bySeverity[v.severity]++;
    }
    console.log('\n=== 云顶编码规范合规扫描（vsh check-standard）===\n');
    console.log("\u626B\u63CF\u6587\u4EF6\uFF1ATS ".concat(TS_FILES.length, " \u4E2A / Vue ").concat(VUE_FILES.length, " \u4E2A\n"));
    var order = ['P0', 'P1', 'P2'];
    var _loop_3 = function (sev) {
        var list = violations.filter(function (v) { return v.severity === sev; });
        if (list.length === 0)
            return "continue";
        console.log("--- ".concat(sev, "\uFF08").concat(list.length, " \u9879\uFF09---"));
        // 按规则分组
        var byRule = new Map();
        for (var _c = 0, list_1 = list; _c < list_1.length; _c++) {
            var v = list_1[_c];
            var arr = (_a = byRule.get(v.rule)) !== null && _a !== void 0 ? _a : [];
            arr.push(v);
            byRule.set(v.rule, arr);
        }
        for (var _d = 0, _e = __spreadArray([], byRule.entries(), true).sort(); _d < _e.length; _d++) {
            var _f = _e[_d], rule = _f[0], arr = _f[1];
            console.log("  [".concat(rule, "] ").concat(arr.length, " \u9879"));
            for (var _g = 0, _h = arr.slice(0, 40); _g < _h.length; _g++) {
                var v = _h[_g];
                var loc = v.line > 0 ? ":".concat(v.line) : '';
                console.log("    ".concat(v.file).concat(loc, " \u2014 ").concat(v.message));
            }
            if (arr.length > 40)
                console.log("    ... \u53E6\u6709 ".concat(arr.length - 40, " \u9879"));
        }
        console.log('');
    };
    for (var _b = 0, order_1 = order; _b < order_1.length; _b++) {
        var sev = order_1[_b];
        _loop_3(sev);
    }
    console.log("\u7EDF\u8BA1\uFF1AP0 ".concat(bySeverity.P0, " / P1 ").concat(bySeverity.P1, " / P2 ").concat(bySeverity.P2, "\uFF0C\u5408\u8BA1 ").concat(violations.length, " \u9879\n"));
}
main();
