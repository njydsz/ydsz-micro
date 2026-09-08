"use strict";
/**
 * @file vsh check-circular - 循环依赖检测工具
 * @author YDSZ Team
 * @since 2026-08-23
 * @description 检测项目中的循环依赖，确保模块依赖图无环。
 *              2026-08-24 重构：
 *                - 移除对 @typescript-eslint/typescript-estree 的硬编码依赖（改为正则提取 specifier，零第三方依赖）；
 *                - 复用 tsconfig.paths.json 解析 @ydsz/@ydsz-core 别名，并支持 #/ 包内别名；
 *                - 修复原 resolveImport 对 #/ 直接 return null、@ 前缀错误拼接导致的「主路径循环检测失明」问题；
 *                - 默认递归收集 main/apps/comm 全部源码文件参与构图。
 *
 * @path bash\vsh\src\check-circular\index.ts
 */
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCircular = checkCircular;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var fs_path_ts_1 = require("../shared/fs-path.ts");
/**
 * 解析文件中的 import 依赖 specifier（正则提取，覆盖 .ts / .vue）。
 */
function parseImports(filePath) {
    try {
        var content = (0, node_fs_1.readFileSync)(filePath, 'utf-8');
        return (0, fs_path_ts_1.extractSpecifiers)(content);
    }
    catch (_a) {
        return [];
    }
}
/**
 * 构建依赖图（仅纳入项目内文件，第三方包忽略）。
 */
function buildDependencyGraph(filePath, graph, visited, rootDir, paths) {
    var resolvedPath = (0, node_path_1.resolve)(filePath);
    if (visited.has(resolvedPath))
        return;
    visited.add(resolvedPath);
    if (!graph.has(resolvedPath)) {
        graph.set(resolvedPath, new Set());
    }
    var imports = parseImports(filePath);
    for (var _i = 0, imports_1 = imports; _i < imports_1.length; _i++) {
        var imp = imports_1[_i];
        var resolvedImport = (0, fs_path_ts_1.resolveSpecifier)(imp, filePath, rootDir, paths);
        if (resolvedImport) {
            graph.get(resolvedPath).add(resolvedImport);
            if (!visited.has(resolvedImport)) {
                buildDependencyGraph(resolvedImport, graph, visited, rootDir, paths);
            }
        }
    }
}
/**
 * 使用 DFS 检测循环依赖
 */
function detectCycles(graph, rootDir) {
    var cycles = [];
    var visited = new Set();
    var recursionStack = new Set();
    var path = [];
    function dfs(node) {
        var _a;
        visited.add(node);
        recursionStack.add(node);
        path.push(node);
        var neighbors = (_a = graph.get(node)) !== null && _a !== void 0 ? _a : new Set();
        for (var _i = 0, neighbors_1 = neighbors; _i < neighbors_1.length; _i++) {
            var neighbor = neighbors_1[_i];
            if (!visited.has(neighbor)) {
                dfs(neighbor);
            }
            else if (recursionStack.has(neighbor)) {
                var cycleStart = path.indexOf(neighbor);
                var cycle = path.slice(cycleStart);
                // 跳过单节点自环（A -> A，通常由 barrel 重导出 / #/ 别名解析回自身导致，非架构问题）
                if (cycle.length <= 1)
                    continue;
                cycles.push({
                    cycle: __spreadArray(__spreadArray([], cycle, true), [neighbor], false),
                    description: cycle.map(function (p) { return (0, node_path_1.relative)(rootDir, p); }).join(' → ') +
                        " \u2192 ".concat((0, node_path_1.relative)(rootDir, neighbor)),
                });
            }
        }
        path.pop();
        recursionStack.delete(node);
    }
    for (var _i = 0, _a = graph.keys(); _i < _a.length; _i++) {
        var node = _a[_i];
        if (!visited.has(node)) {
            dfs(node);
        }
    }
    return cycles;
}
/**
 * 执行循环依赖检测
 */
function checkCircular(options) {
    return __awaiter(this, void 0, void 0, function () {
        var rootDir, graph, visited, paths, files, _i, files_1, file;
        var _a, _b;
        return __generator(this, function (_c) {
            rootDir = (_a = options.rootDir) !== null && _a !== void 0 ? _a : process.cwd();
            graph = new Map();
            visited = new Set();
            paths = (0, fs_path_ts_1.loadPathMapping)(rootDir);
            files = (_b = options.files) !== null && _b !== void 0 ? _b : (0, fs_path_ts_1.collectSourceFiles)(rootDir);
            for (_i = 0, files_1 = files; _i < files_1.length; _i++) {
                file = files_1[_i];
                buildDependencyGraph(file, graph, visited, rootDir, paths);
            }
            return [2 /*return*/, detectCycles(graph, rootDir)];
        });
    });
}
// CLI 入口
if (import.meta.url === "file://".concat(process.argv[1])) {
    var rootDir = (0, node_path_1.resolve)((_a = process.argv[2]) !== null && _a !== void 0 ? _a : process.cwd());
    console.log("\uD83D\uDD0D \u6267\u884C\u5FAA\u73AF\u4F9D\u8D56\u68C0\u6D4B: ".concat(rootDir));
    checkCircular({ rootDir: rootDir })
        .then(function (cycles) {
        if (cycles.length === 0) {
            console.log('✅ 循环依赖检测通过：未发现循环');
            process.exit(0);
        }
        console.error("\u274C \u53D1\u73B0 ".concat(cycles.length, " \u5904\u5FAA\u73AF\u4F9D\u8D56:\n"));
        for (var _i = 0, cycles_1 = cycles; _i < cycles_1.length; _i++) {
            var c = cycles_1[_i];
            console.error("  \u5FAA\u73AF: ".concat(c.description));
        }
        process.exit(1);
    })
        .catch(function (err) {
        console.error('循环依赖检测出错:', err);
        process.exit(2);
    });
}
