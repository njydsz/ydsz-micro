"use strict";
/**
 * @file vsh publint - 包发布前检查工具
 * @author YDSZ Team
 * @since 2026-08-23
 * @description 发布前检查包的合规性，确保符合 npm 发布规范
 *
 * @path bash\vsh\src\publint\index.ts
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.publint = publint;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
/**
 * 检查单个包的 package.json
 */
function lintPackageJson(packagePath) {
    var _a;
    var errors = [];
    var warnings = [];
    var pkgPath = (0, node_path_1.resolve)(packagePath, 'package.json');
    if (!(0, node_fs_1.existsSync)(pkgPath)) {
        return {
            package: packagePath,
            path: pkgPath,
            errors: ['package.json 不存在'],
            warnings: [],
        };
    }
    var pkg = JSON.parse((0, node_fs_1.readFileSync)(pkgPath, 'utf-8').replace(/^\uFEFF/, ''));
    if (!pkg.name)
        errors.push('缺少 name 字段');
    if (!pkg.version)
        errors.push('缺少 version 字段');
    if (!pkg.description)
        warnings.push('建议添加 description');
    if (!pkg.exports && !pkg.main)
        errors.push('缺少 exports 或 main 字段');
    if (!pkg.type)
        warnings.push('建议添加 type: "module"');
    if (!pkg.files)
        warnings.push('建议添加 files 字段');
    if (!pkg.license)
        errors.push('缺少 license 字段');
    return {
        package: (_a = pkg.name) !== null && _a !== void 0 ? _a : packagePath,
        path: pkgPath,
        errors: errors,
        warnings: warnings,
    };
}
/**
 * 查找所有需要检查的包
 */
function findPackages(rootDir) {
    var packages = [];
    var scanDir = function (dir) {
        if (!(0, node_fs_1.existsSync)(dir))
            return;
        var entries = (0, node_fs_1.readdirSync)(dir, { withFileTypes: true });
        for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
            var entry = entries_1[_i];
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                var subDir = (0, node_path_1.resolve)(dir, entry.name);
                if ((0, node_fs_1.existsSync)((0, node_path_1.resolve)(subDir, 'package.json'))) {
                    packages.push(subDir);
                }
            }
        }
    };
    scanDir((0, node_path_1.resolve)(rootDir, 'apps'));
    scanDir((0, node_path_1.resolve)(rootDir, 'comm'));
    scanDir((0, node_path_1.resolve)(rootDir, 'conf'));
    return packages;
}
/**
 * 执行发布前检查
 */
function publint(options) {
    return __awaiter(this, void 0, void 0, function () {
        var rootDir, results, packages, _i, packages_1, pkg;
        var _a, _b;
        return __generator(this, function (_c) {
            rootDir = (_a = options.rootDir) !== null && _a !== void 0 ? _a : process.cwd();
            results = [];
            packages = (_b = options.packages) !== null && _b !== void 0 ? _b : findPackages(rootDir);
            for (_i = 0, packages_1 = packages; _i < packages_1.length; _i++) {
                pkg = packages_1[_i];
                results.push(lintPackageJson(pkg));
            }
            return [2 /*return*/, results];
        });
    });
}
// CLI 入口
if (import.meta.url === "file://".concat(process.argv[1])) {
    var rootDir = (_a = process.argv[2]) !== null && _a !== void 0 ? _a : process.cwd();
    console.log("\uD83D\uDD0D \u6267\u884C\u53D1\u5E03\u524D\u68C0\u67E5: ".concat(rootDir));
    publint({ rootDir: rootDir })
        .then(function (results) {
        var totalErrors = 0;
        var totalWarnings = 0;
        for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
            var r = results_1[_i];
            totalErrors += r.errors.length;
            totalWarnings += r.warnings.length;
        }
        if (totalErrors === 0 && totalWarnings === 0) {
            console.log('✅ 发布检查通过：所有包均合规');
            process.exit(0);
        }
        for (var _a = 0, results_2 = results; _a < results_2.length; _a++) {
            var r = results_2[_a];
            if (r.errors.length > 0 || r.warnings.length > 0) {
                console.log("\n\uD83D\uDCE6 ".concat(r.package));
                for (var _b = 0, _c = r.errors; _b < _c.length; _b++) {
                    var e = _c[_b];
                    console.error("  \u274C ".concat(e));
                }
                for (var _d = 0, _e = r.warnings; _d < _e.length; _d++) {
                    var w = _e[_d];
                    console.warn("  \u26A0\uFE0F  ".concat(w));
                }
            }
        }
        console.log("\n\uD83D\uDCCA \u7EDF\u8BA1: ".concat(totalErrors, " \u4E2A\u9519\u8BEF, ").concat(totalWarnings, " \u4E2A\u8B66\u544A"));
        process.exit(totalErrors > 0 ? 1 : 0);
    })
        .catch(function (err) {
        console.error('发布检查出错:', err);
        process.exit(2);
    });
}
