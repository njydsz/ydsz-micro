"use strict";
/**
 * check-bundle — 产物共享依赖重复打包检测
 *
 * importmap 外部化的共享依赖（vue / element-plus / vxe-table 等）必须以
 * bare import 形式出现在构建产物中（运行时由浏览器按 importmap 解析为唯一实例）。
 * 若某应用产物中完全找不到对应 bare import，说明该依赖被误打包进 chunk，
 * 将导致主/子应用出现双实例（provide/inject 与全局状态割裂）。
 *
 * 检查逻辑（产物级，与构建期 bundle-budget 插件互补）：
 * 1. 扫描 main 与 apps 各应用的 dist 产物
 * 2. 读取各应用 package.json 的 YDSZ.shareStrategy 确定应外置的依赖集
 * 3. 对每个应外置依赖，检测产物中是否存在 bare import 证据
 *    （from"dep" / from'dep' / import("dep") / import('dep')）
 * 4. 应用声明了依赖但产物零证据 → 判定为误打包，报错退出
 *
 * @path bash\vsh\src\check-bundle\index.ts
 * @author ydsz-team
 * @since 4.4.0
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
exports.checkBundle = checkBundle;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
/** 共享依赖清单镜像（与 conf/vite-config/src/micro-shared-deps.ts 保持一致，避免跨包 import） */
var CORE_DEPS = ['vue', 'vue-router', 'pinia'];
var UI_DEPS = ['element-plus', '@element-plus/icons-vue', 'vxe-table', 'vxe-pc-ui'];
/** 策略 → 应外置依赖集（与 STRATEGY_MAP 对齐） */
var STRATEGY_MAP = {
    core: CORE_DEPS,
    'core-ui': __spreadArray(__spreadArray([], CORE_DEPS, true), UI_DEPS, true),
    all: __spreadArray(__spreadArray(__spreadArray([], CORE_DEPS, true), UI_DEPS, true), ['axios', 'echarts', 'dayjs', 'vue-demi'], false),
};
/** 生成检测某依赖 bare import 的正则 */
function bareImportRegex(dep) {
    var escaped = dep.replaceAll('/', '\\/');
    return new RegExp("(?:from|import)\\s*\\(?[\"']".concat(escaped, "[\"']"), 'g');
}
/** 递归收集目录下的 .js 产物路径 */
function collectJsFiles(dir) {
    var out = [];
    for (var _i = 0, _a = (0, node_fs_1.readdirSync)(dir, { withFileTypes: true }); _i < _a.length; _i++) {
        var entry = _a[_i];
        var full = (0, node_path_1.join)(dir, entry.name);
        if (entry.isDirectory()) {
            out.push.apply(out, collectJsFiles(full));
        }
        else if (entry.name.endsWith('.js')) {
            out.push(full);
        }
    }
    return out;
}
/**
 * 执行产物共享依赖检测。
 *
 * @param rootDir - monorepo 根目录
 * @returns 违规列表（空数组表示通过；未构建的应用自动跳过）
 */
function checkBundle(rootDir) {
    var _a, _b;
    var violations = [];
    var appDirs = __spreadArray([
        { name: 'main-web', path: (0, node_path_1.join)(rootDir, 'main') }
    ], (0, node_fs_1.readdirSync)((0, node_path_1.join)(rootDir, 'apps'))
        .filter(function (name) { return !name.startsWith('.'); })
        .map(function (name) { return ({ name: name, path: (0, node_path_1.join)(rootDir, 'apps', name) }); }), true);
    for (var _i = 0, appDirs_1 = appDirs; _i < appDirs_1.length; _i++) {
        var app = appDirs_1[_i];
        var distDir = (0, node_path_1.join)(app.path, 'dist');
        if (!(0, node_fs_1.existsSync)(distDir) || !((_a = (0, node_fs_1.statSync)(distDir, { throwIfNoEntry: false })) === null || _a === void 0 ? void 0 : _a.isDirectory())) {
            continue; // 未构建则跳过
        }
        // 读取应用共享策略（默认 all，与 vite-config 行为一致）
        var strategy = 'all';
        try {
            var pkg = JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.join)(app.path, 'package.json'), 'utf-8'));
            strategy = ((_b = pkg.YDSZ) === null || _b === void 0 ? void 0 : _b.shareStrategy) || 'all';
        }
        catch (_c) {
            // package.json 缺失时保守使用默认策略
        }
        var expectedDeps = STRATEGY_MAP[strategy] || STRATEGY_MAP.all;
        var jsFiles = collectJsFiles(distDir);
        if (jsFiles.length === 0)
            continue;
        // 拼接全部产物内容做一次性检测（产物总量有限，内存可承受）
        var bundleContent = jsFiles.map(function (f) { return (0, node_fs_1.readFileSync)(f, 'utf-8'); }).join('\n');
        for (var _d = 0, expectedDeps_1 = expectedDeps; _d < expectedDeps_1.length; _d++) {
            var dep = expectedDeps_1[_d];
            var evidence = bareImportRegex(dep).test(bundleContent);
            if (!evidence) {
                violations.push({
                    app: app.name,
                    dep: dep,
                    message: "\u7B56\u7565 \"".concat(strategy, "\" \u8981\u6C42 ").concat(dep, " \u7ECF importmap \u5916\u7F6E\uFF0C\u4F46\u4EA7\u7269\u4E2D\u672A\u53D1\u73B0 bare import \u2014\u2014 \u7591\u4F3C\u88AB\u8BEF\u6253\u5305\uFF08\u5C06\u5BFC\u81F4\u53CC\u5B9E\u4F8B\uFF09"),
                });
            }
        }
    }
    return violations;
}
