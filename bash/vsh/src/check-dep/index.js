"use strict";
/**
 * @file vsh check-dep - 依赖合规检查工具
 * @author YDSZ Team
 * @since 2026-08-23
 * @description 依赖合规检查：许可证白名单、工作区协议、import 边界（云顶规范 §6.1）、lockfile 一致性
 *
 * 退出码：0 = 通过；1 = 存在违规；2 = 执行异常。
 * 零外部依赖，使用 Node 原生 API + 项目内共享解析工具（与 check-circular 复用同一套别名/导入解析）。
 *
 * @path bash\vsh\src\check-dep\index.ts
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDep = checkDep;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var fs_path_ts_1 = require("../shared/fs-path.ts");
/** 默认配置 */
var DEFAULT_CONFIG = {
    allowedLicenses: [
        'MIT',
        // MIT-0（MIT No Attribution）：OSI 认证的 MIT 免署名变体，条款较 MIT 更宽松
        'MIT-0',
        'Apache-2.0',
        'BSD-2-Clause',
        'BSD-3-Clause',
        'ISC',
        '0BSD',
        'Unlicense',
        'CC0-1.0',
        'Python-2.0',
        'BlueOak-1.0.0',
    ],
    forbiddenPackages: ['moment', 'jquery', 'lodash'],
    requireWorkspaceProtocol: true,
    businessDirs: ['apps', 'main/src'],
    forbiddenFetchPackages: [
        'axios',
        'node-fetch',
        'undici',
        'ofetch',
        'cross-fetch',
        'got',
        'superagent',
    ],
    fetchInfraDirs: ['comm/effects/request'],
};
/** 跳过的目录（避免扫描产物与依赖） */
var SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', 'coverage', '.turbo']);
/**
 * 解析某个直接依赖的真实许可证（读取其 package.json）。
 * 优先查包本地 node_modules，再回退到根 node_modules（pnpm 提升）。
 * 返回 license；`unknown` 表示包已安装但未声明 license 字段，
 * `missing` 表示包在 node_modules 中完全未找到（安装不完整）。
 */
function resolveLicense(name, pkgDir, rootDir) {
    var candidates = [
        (0, node_path_1.join)(pkgDir, 'node_modules', name, 'package.json'),
        (0, node_path_1.join)(rootDir, 'node_modules', name, 'package.json'),
    ];
    for (var _i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {
        var p = candidates_1[_i];
        if (!(0, node_fs_1.existsSync)(p))
            continue;
        try {
            var meta = JSON.parse((0, node_fs_1.readFileSync)(p, 'utf-8').replace(/^\ufeff/, ''));
            if (typeof meta.license === 'string')
                return meta.license;
            if (Array.isArray(meta.licenses) && meta.licenses.length > 0) {
                var first = meta.licenses[0];
                if (typeof first === 'string')
                    return first;
                if (first && typeof first.type === 'string')
                    return first.type;
            }
        }
        catch (_a) {
            /* 解析失败忽略，回退 unknown */
        }
        // package.json 存在但无 license 字段：上游包元数据缺失（非安装问题）
        return 'unknown';
    }
    return 'missing';
}
/**
 * 检查单个 package.json 的依赖
 */
function checkPackageJson(packagePath, config, rootDir) {
    var _a, _b;
    var violations = [];
    if (!(0, node_fs_1.existsSync)(packagePath)) {
        return violations;
    }
    var pkgDir = (0, node_path_1.dirname)(packagePath);
    var pkg = JSON.parse((0, node_fs_1.readFileSync)(packagePath, 'utf-8').replace(/^\ufeff/, ''));
    var deps = (_a = pkg.dependencies) !== null && _a !== void 0 ? _a : {};
    var devDeps = (_b = pkg.devDependencies) !== null && _b !== void 0 ? _b : {};
    var allDeps = __assign(__assign({}, deps), devDeps);
    for (var _i = 0, _c = Object.entries(allDeps); _i < _c.length; _i++) {
        var _d = _c[_i], name_1 = _d[0], version = _d[1];
        var v = version;
        // 检查禁止包
        if (config.forbiddenPackages.includes(name_1)) {
            violations.push({
                package: name_1,
                version: v,
                license: 'unknown',
                reason: '包在禁止列表中',
                file: packagePath,
                severity: 'error',
            });
        }
        // 检查工作区协议（@ydsz/* 内部包必须走 workspace 协议）
        if (config.requireWorkspaceProtocol && name_1.startsWith('@ydsz/')) {
            if (v !== 'workspace:*' && !v.startsWith('workspace:')) {
                violations.push({
                    package: name_1,
                    version: v,
                    license: 'unknown',
                    reason: '@ydsz 内部包应使用 workspace 协议（workspace:*）',
                    file: packagePath,
                    severity: 'error',
                });
            }
        }
        // 解析真实许可证（内部 @ydsz 包跳过；workspace: 协议跳过）
        if (!name_1.startsWith('@ydsz/') && !v.startsWith('workspace:')) {
            var license = resolveLicense(name_1, pkgDir, rootDir);
            if (license === 'unknown') {
                violations.push({
                    package: name_1,
                    version: v,
                    license: license,
                    reason: '包已安装但未在 package.json 声明 license 字段（上游元数据缺失）',
                    file: packagePath,
                    severity: 'warn',
                });
            }
            else if (license === 'missing') {
                violations.push({
                    package: name_1,
                    version: v,
                    license: 'unknown',
                    reason: '无法解析许可证（node_modules 中未找到），请确认依赖已安装',
                    file: packagePath,
                    severity: 'warn',
                });
            }
            else if (!config.allowedLicenses.includes(license)) {
                violations.push({
                    package: name_1,
                    version: v,
                    license: license,
                    reason: "\u8BB8\u53EF\u8BC1\u300C".concat(license, "\u300D\u4E0D\u5728\u767D\u540D\u5355\uFF08").concat(config.allowedLicenses.join('/'), "\uFF09"),
                    file: packagePath,
                    severity: 'error',
                });
            }
        }
    }
    return violations;
}
/**
 * 递归收集目录下的 package.json 所在目录（排除产物与依赖）。
 * 用于 lockfile importer 覆盖率校验。
 */
function collectPackageDirs(rootDir, baseDirs) {
    var result = [];
    var walk = function (dir, depth) {
        if (depth > 8)
            return;
        var entries;
        try {
            entries = (0, node_fs_1.readdirSync)(dir);
        }
        catch (_a) {
            return;
        }
        for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
            var entry = entries_1[_i];
            if (SKIP_DIRS.has(entry))
                continue;
            var full = (0, node_path_1.join)(dir, entry);
            var st = void 0;
            try {
                st = (0, node_fs_1.statSync)(full);
            }
            catch (_b) {
                continue;
            }
            if (!st.isDirectory())
                continue;
            if ((0, node_fs_1.existsSync)((0, node_path_1.join)(full, 'package.json'))) {
                result.push((0, node_path_1.relative)(rootDir, full).split('\\').join('/'));
            }
            walk(full, depth + 1);
        }
    };
    for (var _i = 0, baseDirs_1 = baseDirs; _i < baseDirs_1.length; _i++) {
        var b = baseDirs_1[_i];
        var full = (0, node_path_1.join)(rootDir, b);
        if ((0, node_fs_1.existsSync)(full))
            walk(full, 0);
    }
    return result;
}
/**
 * 从 pnpm-lock.yaml 提取 importers 段的键集合（工作区包路径）。
 */
function parseLockfileImporters(lockPath) {
    var importers = new Set();
    if (!(0, node_fs_1.existsSync)(lockPath))
        return importers;
    var text = (0, node_fs_1.readFileSync)(lockPath, 'utf-8');
    var startIdx = text.indexOf('\nimporters:');
    if (startIdx < 0)
        return importers;
    // importers 段结束于下一个顶层键（0 缩进的 `key:`），通常是 `packages:`
    var afterStart = text.slice(startIdx + 1);
    var endMatch = afterStart.match(/\n[A-Za-z][A-Za-z0-9_-]*:/);
    var section = endMatch ? afterStart.slice(0, endMatch.index) : afterStart;
    // importer 键为 2 空格缩进的 `path:` 行
    var re = /^[ ]{2}([A-Za-z0-9@/_.-]+):/gm;
    var m;
    while ((m = re.exec(section)) !== null) {
        importers.add(m[1]);
    }
    return importers;
}
/**
 * 从 pnpm-workspace.yaml 解析 catalog 段定义的键集合。
 * 用于校验各包 `catalog:` 引用的一致性（"最小化外部依赖、版本绝对可控"的硬性抓手）。
 */
function parseCatalogKeys(rootDir) {
    var keys = new Set();
    var wsPath = (0, node_path_1.join)(rootDir, 'pnpm-workspace.yaml');
    if (!(0, node_fs_1.existsSync)(wsPath))
        return keys;
    var text;
    try {
        text = (0, node_fs_1.readFileSync)(wsPath, 'utf-8');
    }
    catch (_a) {
        return keys;
    }
    // catalog 段：顶层 `catalog:` 键起，到下一个 0 缩进顶层键（或文件末尾）止
    var lines = text.split('\n');
    var inCatalog = false;
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        if (line.trim() === 'catalog:') {
            inCatalog = true;
            continue;
        }
        if (inCatalog) {
            if (line && !line.startsWith(' ')) {
                inCatalog = false;
                continue;
            }
            var m = /^\s{2}['"]?([^'":\s]+)['"]?\s*:/.exec(line);
            if (m)
                keys.add(m[1]);
        }
    }
    return keys;
}
/**
 * catalog 一致性校验：各包依赖中 `catalog:` 引用必须能在 pnpm-workspace.yaml catalog 中找到定义。
 */
function checkCatalogConsistency(rootDir, packagePaths) {
    var violations = [];
    var catalogKeys = parseCatalogKeys(rootDir);
    if (catalogKeys.size === 0) {
        violations.push({
            package: 'pnpm-workspace.yaml',
            version: '-',
            license: '-',
            reason: 'pnpm-workspace.yaml 中 catalog 段缺失或为空，无法校验 catalog: 引用一致性',
            file: (0, node_path_1.join)(rootDir, 'pnpm-workspace.yaml'),
            severity: 'error',
        });
        return violations;
    }
    for (var _i = 0, packagePaths_1 = packagePaths; _i < packagePaths_1.length; _i++) {
        var packagePath = packagePaths_1[_i];
        var pkg = void 0;
        try {
            pkg = JSON.parse((0, node_fs_1.readFileSync)(packagePath, 'utf-8').replace(/^\ufeff/, ''));
        }
        catch (_a) {
            continue;
        }
        var deps = pkg.dependencies;
        var devDeps = pkg.devDependencies;
        var allDeps = __assign(__assign({}, (deps !== null && deps !== void 0 ? deps : {})), (devDeps !== null && devDeps !== void 0 ? devDeps : {}));
        for (var _b = 0, _c = Object.entries(allDeps); _b < _c.length; _b++) {
            var _d = _c[_b], name_2 = _d[0], version = _d[1];
            if (version === 'catalog:' && !catalogKeys.has(name_2)) {
                violations.push({
                    package: name_2,
                    version: version,
                    license: '-',
                    reason: "\u4F9D\u8D56\u4F7F\u7528 catalog: \u534F\u8BAE\uFF0C\u4F46 pnpm-workspace.yaml catalog \u672A\u5B9A\u4E49\u300C".concat(name_2, "\u300D\u2014\u2014\u8BF7\u8865 catalog \u6761\u76EE\u6216\u6539\u7528\u663E\u5F0F\u7248\u672C"),
                    file: packagePath,
                    severity: 'error',
                });
            }
        }
    }
    return violations;
}
/**
 * lockfile 一致性校验：检查工作区包是否均已锁定（出现在 importers 中）。
 */
function checkLockfile(rootDir) {
    var violations = [];
    var lockPath = (0, node_path_1.join)(rootDir, 'pnpm-lock.yaml');
    if (!(0, node_fs_1.existsSync)(lockPath)) {
        violations.push({
            package: 'pnpm-lock.yaml',
            version: '-',
            license: '-',
            reason: '缺少 pnpm-lock.yaml，依赖未锁定',
            file: lockPath,
            severity: 'error',
        });
        return violations;
    }
    var importers = parseLockfileImporters(lockPath);
    var workspaceRoots = ['apps', 'comm', 'conf', 'main', 'bash'];
    var pkgDirs = collectPackageDirs(rootDir, workspaceRoots);
    for (var _i = 0, pkgDirs_1 = pkgDirs; _i < pkgDirs_1.length; _i++) {
        var dir = pkgDirs_1[_i];
        var key = dir === 'main' ? 'main' : dir;
        if (!importers.has(key)) {
            violations.push({
                package: dir,
                version: '-',
                license: '-',
                reason: '工作区包未在 pnpm-lock.yaml 的 importers 中锁定（lockfile 可能过期，请运行 pnpm install）',
                file: (0, node_path_1.join)(rootDir, dir),
                severity: 'error',
            });
        }
    }
    return violations;
}
/**
 * import 边界校验（云顶规范 §6.1）：
 * 业务代码（businessDirs）禁止直接引入 axios/fetch 类 HTTP 客户端，必须统一经由 @ydsz/request 基础设施层。
 */
function checkImportBoundary(rootDir, config) {
    var _a;
    var violations = [];
    var walk = function (dir) {
        var files = [];
        var entries;
        try {
            entries = (0, node_fs_1.readdirSync)(dir);
        }
        catch (_a) {
            return files;
        }
        for (var _i = 0, entries_2 = entries; _i < entries_2.length; _i++) {
            var entry = entries_2[_i];
            if (SKIP_DIRS.has(entry))
                continue;
            var full = (0, node_path_1.join)(dir, entry);
            var st = void 0;
            try {
                st = (0, node_fs_1.statSync)(full);
            }
            catch (_b) {
                continue;
            }
            if (st.isDirectory()) {
                files.push.apply(files, walk(full));
            }
            else if (/\.(ts|mts|cts|vue)$/.test(entry)) {
                files.push(full);
            }
        }
        return files;
    };
    var fetchRe = /(^|[^.\w])fetch\s*\(|new\s+XMLHttpRequest\b/;
    for (var _i = 0, _b = config.businessDirs; _i < _b.length; _i++) {
        var b = _b[_i];
        var full = (0, node_path_1.join)(rootDir, b);
        if (!(0, node_fs_1.existsSync)(full))
            continue;
        for (var _c = 0, _d = walk(full); _c < _d.length; _c++) {
            var file = _d[_c];
            var rel = (0, node_path_1.relative)(rootDir, file).split('\\').join('/');
            var content = void 0;
            try {
                content = (0, node_fs_1.readFileSync)(file, 'utf-8');
            }
            catch (_e) {
                continue;
            }
            // 1) 禁止的 HTTP 客户端包直接 import
            for (var _f = 0, _g = (0, fs_path_ts_1.extractSpecifiers)(content); _f < _g.length; _f++) {
                var spec = _g[_f];
                var base = (_a = spec.split('/').pop()) !== null && _a !== void 0 ? _a : spec;
                if (config.forbiddenFetchPackages.includes(base)) {
                    violations.push({
                        package: spec,
                        version: '-',
                        license: '-',
                        reason: '业务代码禁止直接引入 HTTP 客户端（云顶规范 §6.1），请改用 @ydsz/request',
                        file: rel,
                        severity: 'error',
                    });
                }
            }
            // 2) 裸 fetch / XMLHttpRequest 调用（业务代码应经 @ydsz/request）
            if (fetchRe.test(content)) {
                violations.push({
                    package: 'fetch/XMLHttpRequest',
                    version: '-',
                    license: '-',
                    reason: '业务代码禁止直接使用 fetch/XMLHttpRequest（云顶规范 §6.1），请改用 @ydsz/request',
                    file: rel,
                    severity: 'error',
                });
            }
        }
    }
    return violations;
}
/**
 * 执行依赖合规检查（聚合：package.json / import boundary / lockfile）
 */
function checkDep(options) {
    return __awaiter(this, void 0, void 0, function () {
        var rootDir, config, violations, rootPkg, packagePaths, workspaceRoots, _i, _a, dir, _b, packagePaths_2, packagePath;
        var _c;
        return __generator(this, function (_d) {
            rootDir = (_c = options.rootDir) !== null && _c !== void 0 ? _c : process.cwd();
            config = __assign(__assign({}, DEFAULT_CONFIG), options.config);
            violations = [];
            rootPkg = (0, node_path_1.resolve)(rootDir, 'package.json');
            packagePaths = [rootPkg];
            workspaceRoots = ['apps', 'comm', 'conf', 'main', 'bash'];
            for (_i = 0, _a = collectPackageDirs(rootDir, workspaceRoots); _i < _a.length; _i++) {
                dir = _a[_i];
                packagePaths.push((0, node_path_1.resolve)(rootDir, dir, 'package.json'));
            }
            for (_b = 0, packagePaths_2 = packagePaths; _b < packagePaths_2.length; _b++) {
                packagePath = packagePaths_2[_b];
                violations.push.apply(violations, checkPackageJson(packagePath, config, rootDir));
            }
            // 1.5) catalog 一致性（catalog: 引用必须能在 pnpm-workspace.yaml 中找到定义）
            violations.push.apply(violations, checkCatalogConsistency(rootDir, packagePaths));
            // 2) import 边界（云顶规范 §6.1）
            violations.push.apply(violations, checkImportBoundary(rootDir, config));
            // 3) lockfile 一致性
            violations.push.apply(violations, checkLockfile(rootDir));
            return [2 /*return*/, violations];
        });
    });
}
// CLI 入口
if (import.meta.url === "file://".concat(process.argv[1])) {
    var rootDir = (_a = process.argv[2]) !== null && _a !== void 0 ? _a : process.cwd();
    console.log("\uD83D\uDD0D \u6267\u884C\u4F9D\u8D56\u5408\u89C4\u68C0\u67E5: ".concat(rootDir));
    checkDep({ rootDir: rootDir })
        .then(function (violations) {
        var errors = violations.filter(function (v) { return v.severity !== 'warn'; });
        var warns = violations.filter(function (v) { return v.severity === 'warn'; });
        if (warns.length > 0) {
            console.warn("\n\u26A0\uFE0F  ".concat(warns.length, " \u5904\u8B66\u544A\uFF08\u4E0D\u963B\u65AD\uFF09:"));
            for (var _i = 0, warns_1 = warns; _i < warns_1.length; _i++) {
                var v = warns_1[_i];
                var loc = v.file ? " (".concat(v.file, ")") : '';
                console.warn("  ".concat(v.package, "@").concat(v.version, ": ").concat(v.reason).concat(loc));
            }
        }
        if (errors.length === 0) {
            console.log("\u2705 \u4F9D\u8D56\u5408\u89C4\u68C0\u67E5\u901A\u8FC7".concat(warns.length ? "\uFF08\u542B ".concat(warns.length, " \u8B66\u544A\uFF09") : ''));
            process.exit(0);
        }
        console.error("\n\u274C \u53D1\u73B0 ".concat(errors.length, " \u5904\u4F9D\u8D56\u8FDD\u89C4:"));
        for (var _a = 0, errors_1 = errors; _a < errors_1.length; _a++) {
            var v = errors_1[_a];
            var loc = v.file ? " (".concat(v.file, ")") : '';
            console.error("  ".concat(v.package, "@").concat(v.version, ": ").concat(v.reason).concat(loc));
        }
        process.exit(1);
    })
        .catch(function (err) {
        console.error('依赖合规检查出错:', err);
        process.exit(2);
    });
}
