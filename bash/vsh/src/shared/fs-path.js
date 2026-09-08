"use strict";
/**
 * @file vsh shared - 文件系统与路径别名解析工具
 * @author YDSZ Team
 * @since 2026-08-24
 * @description 供 check-arch / check-circular 复用：递归收集源码文件、解析 #/ 与 @ydsz/@ydsz-core 别名。
 *              纯 Node 内置模块实现，零第三方依赖，契合「最小化外部依赖、绝对可控」原则。
 *
 * @path bash\vsh\src\shared\fs-path.ts
 * @author ydsz-team
 * @since 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectSourceFiles = collectSourceFiles;
exports.loadPathMapping = loadPathMapping;
exports.resolveSpecifier = resolveSpecifier;
exports.extractSpecifiers = extractSpecifiers;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
/** 纳入依赖图分析的源码扩展名 */
var SOURCE_EXTS = ['.ts', '.tsx', '.mts', '.cts', '.vue', '.js', '.mjs', '.cjs'];
/** 递归收集时跳过的目录 */
var IGNORE_DIRS = new Set([
    'node_modules',
    'dist',
    'coverage',
    '.git',
    '.husky',
    'e2e',
    '.changeset',
]);
/**
 * 递归收集 rootDir 下指定顶层目录中的所有源码文件。
 * @param rootDir 项目根
 * @param dirs 需要扫描的顶层目录（默认 main / apps / comm）
 */
function collectSourceFiles(rootDir, dirs) {
    if (dirs === void 0) { dirs = ['main', 'apps', 'comm']; }
    var files = [];
    for (var _i = 0, dirs_1 = dirs; _i < dirs_1.length; _i++) {
        var dir = dirs_1[_i];
        walk((0, node_path_1.resolve)(rootDir, dir), files);
    }
    return files;
}
/**
 * 递归遍历目录，将匹配 SOURCE_EXTS 扩展名的文件路径累加到 files 数组。
 *
 * @param dir   当前遍历目录
 * @param files 累加器数组
 */
function walk(dir, files) {
    if (!(0, node_fs_1.existsSync)(dir))
        return;
    var entries;
    try {
        entries = (0, node_fs_1.readdirSync)(dir, { withFileTypes: true });
    }
    catch (_a) {
        return;
    }
    for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
        var e = entries_1[_i];
        if (e.isDirectory()) {
            if (IGNORE_DIRS.has(e.name))
                continue;
            walk((0, node_path_1.join)(dir, e.name), files);
        }
        else if (e.isFile()) {
            if (SOURCE_EXTS.includes((0, node_path_1.extname)(e.name)))
                files.push((0, node_path_1.join)(dir, e.name));
        }
    }
}
/**
 * 加载 tsconfig.paths.json 的 paths 映射（用于 @ydsz/*、@ydsz-core/* 别名解析）。
 */
function loadPathMapping(rootDir) {
    try {
        var raw = JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.resolve)(rootDir, 'tsconfig.paths.json'), 'utf-8'));
        return (raw.compilerOptions && raw.compilerOptions.paths) || {};
    }
    catch (_a) {
        return {};
    }
}
/**
 * 从文件路径逐级向上查找所属 package 根目录（含 package.json 的目录）。
 * 用于 #/ 包内别名解析到「当前包的 src」目录。
 *
 * @param filePath 当前文件绝对路径
 * @return package 根目录路径，未找到返回 null
 */
function findPackageRoot(filePath) {
    var dir = (0, node_path_1.dirname)(filePath);
    for (var i = 0; i < 12; i++) {
        if ((0, node_fs_1.existsSync)((0, node_path_1.join)(dir, 'package.json')))
            return dir;
        var parent_1 = (0, node_path_1.dirname)(dir);
        if (parent_1 === dir)
            return null;
        dir = parent_1;
    }
    return null;
}
/**
 * 为无扩展名的路径依次尝试补全 SOURCE_EXTS 中的扩展名，
 * 或尝试 index.<ext> 入口文件。
 *
 * @param base 无扩展名的绝对路径
 * @return 首个存在的文件路径，未找到返回 null
 */
function resolveWithExt(base) {
    if ((0, node_fs_1.existsSync)(base) && (0, node_fs_1.statSync)(base).isFile())
        return base;
    for (var _i = 0, SOURCE_EXTS_1 = SOURCE_EXTS; _i < SOURCE_EXTS_1.length; _i++) {
        var ext = SOURCE_EXTS_1[_i];
        if ((0, node_fs_1.existsSync)(base + ext))
            return base + ext;
    }
    for (var _a = 0, SOURCE_EXTS_2 = SOURCE_EXTS; _a < SOURCE_EXTS_2.length; _a++) {
        var ext = SOURCE_EXTS_2[_a];
        var idx = (0, node_path_1.join)(base, 'index' + ext);
        if ((0, node_fs_1.existsSync)(idx))
            return idx;
    }
    return null;
}
/**
 * 匹配 tsconfig paths 中的键（支持末尾 * 通配），返回解析后的绝对路径。
 *
 * @param key     paths 键（如 '@ydsz/*'）
 * @param targets paths 值数组（如 ['comm/*']）
 * @param spec    import specifier（如 '@ydzs/request'）
 * @param rootDir 项目根
 * @return 解析后的绝对路径，未匹配返回 null
 */
function matchTsPath(key, targets, spec, rootDir) {
    if (key.endsWith('/*')) {
        var prefix = key.slice(0, -2);
        if (spec.startsWith(prefix)) {
            var rest = spec.slice(prefix.length);
            for (var _i = 0, targets_1 = targets; _i < targets_1.length; _i++) {
                var t = targets_1[_i];
                var mapped = t.replace(/\/\*$/, '') + rest;
                var abs = resolveWithExt((0, node_path_1.resolve)(rootDir, mapped));
                if (abs)
                    return abs;
            }
        }
        return null;
    }
    if (spec === key) {
        for (var _a = 0, targets_2 = targets; _a < targets_2.length; _a++) {
            var t = targets_2[_a];
            var abs = resolveWithExt((0, node_path_1.resolve)(rootDir, t));
            if (abs)
                return abs;
        }
    }
    return null;
}
/**
 * 将一个 import specifier 解析为项目内绝对文件路径。
 * 第三方包（node_modules）返回 null，不参与依赖图。
 *
 * @param spec import 来源字符串
 * @param importer 当前文件路径（用于相对路径与 #/ 解析）
 * @param rootDir 项目根
 * @param paths tsconfig paths 映射
 */
function resolveSpecifier(spec, importer, rootDir, paths) {
    // 相对路径
    if (spec.startsWith('.')) {
        return resolveWithExt((0, node_path_1.resolve)((0, node_path_1.dirname)(importer), spec));
    }
    // 包内别名 #/ -> 当前包 src
    if (spec.startsWith('#/')) {
        var pkgRoot = findPackageRoot(importer) || rootDir;
        return resolveWithExt((0, node_path_1.resolve)(pkgRoot, 'src', spec.slice(2)));
    }
    // 工作区别名 @ydsz/* / @ydsz-core/*
    if (spec.startsWith('@')) {
        for (var _i = 0, _a = Object.entries(paths); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], targets = _b[1];
            var hit = matchTsPath(key, targets, spec, rootDir);
            if (hit)
                return hit;
        }
    }
    return null;
}
/**
 * 从文件内容提取静态 import/export 的 specifier，用于「初始化期」依赖图。
 *
 * 排除规则（避免循环依赖误报/过度严格）：
 * - 注释行：JSDoc 内容行以 `*` 开头（云顶规范注释风格），`//`、`/*` 行同理。
 *   v4.3.1 修复：此前未排除注释，JSDoc 示例代码
 *   （`* import { x } from '@ydsz/shared-auth';`）被误判为真实依赖边，
 *   导致 check-circular 对 barrel re-export 模式批量误报循环依赖（×9）。
 *   注：曾尝试字符级 stripComments 状态机，但正则字面量（如 /<div id="..."/）
 *   内的引号会污染字符串状态机，故采用行级过滤——更简单且对此用途零误伤。
 * - 整行 `import type` / `export type`：编译后擦除，不构成运行时依赖。
 * - 动态 `import("x")` / `import("x").Type`：属于运行期懒加载或内联类型查询，不阻塞模块初始化，
 *   不计入初始化期循环（业界主流工具 madge/dependency-cruiser 同此默认）。此类导入本就是打破循环的惯用法。
 *
 * 仅保留静态 `from 'x'` 与 `export * from 'x'` 作为依赖边。
 */
function extractSpecifiers(content) {
    var specs = [];
    var lines = content.split('\n');
    var staticRe = /(?:from\s*|export\s+\*\s+from\s+)['"]([^'"]+)['"]/g;
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        var trimmed = line.trimStart();
        if (trimmed.startsWith('*') || trimmed.startsWith('/*') || trimmed.startsWith('//')) {
            continue;
        }
        if (/^\s*import\s+type\s/.test(line))
            continue;
        if (/^\s*export\s+type\s/.test(line))
            continue;
        var m = void 0;
        while ((m = staticRe.exec(line)) !== null) {
            specs.push(m[1]);
        }
    }
    return specs;
}
