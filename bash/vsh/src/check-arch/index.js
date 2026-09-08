"use strict";
/**
 * @file vsh check-arch - 架构守护工具
 * @author YDSZ Team
 * @since 2026-08-23
 * @description 检查项目架构规范，确保模块依赖方向正确（分层约束）。
 *              2026-08-24 重构：修复 glob 匹配退化问题，基于「源文件目录前缀 + import specifier 前缀」双层判定，
 *              并默认递归收集 main/apps/comm 下全部源码文件。
 *
 * @path bash\vsh\src\check-arch\index.ts
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
exports.checkArch = checkArch;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var fs_path_ts_1 = require("../shared/fs-path.ts");
/** 默认架构规则（路径前缀基于 tsconfig.paths 与目录约定） */
var DEFAULT_RULES = [
    {
        name: 'no-app-direct-import-effects',
        from: ['apps/'],
        to: ['comm/effects', '../comm/effects', '../../comm/effects'],
        description: '子应用不应直接依赖 comm/effects 内部模块（应通过 @ydsz/* 公开包访问）',
    },
    {
        name: 'no-main-import-apps',
        from: ['main/'],
        to: ['apps/', '@ydsz/userinfo-web', '@ydsz/system-web', '@ydsz/message-web', '@ydsz/cronjob-web', '@ydsz/workflow-web', '@ydsz/nextwiki-web', '@ydsz/literule-web', '@ydsz/agent-web'],
        description: '主应用不应依赖子应用代码',
    },
    {
        name: 'utils-no-effects',
        from: ['comm/utils/'],
        to: ['comm/effects', '../comm/effects', '@ydsz/effects'],
        description: '工具模块不应依赖 effects 模块',
    },
];
/** 文件路径是否落在某目录前缀下 */
function underDir(fileRel, prefix) {
    return fileRel === prefix || fileRel.startsWith(prefix);
}
/** 检查单个文件的 import 是否违反规则 */
function checkFile(filePath, rules, rootDir) {
    var violations = [];
    var content = (0, node_fs_1.readFileSync)(filePath, 'utf-8');
    var lines = content.split('\n');
    var fileRel = (0, node_path_1.relative)(rootDir, filePath).replace(/\\/g, '/');
    for (var _i = 0, rules_1 = rules; _i < rules_1.length; _i++) {
        var rule = rules_1[_i];
        var fromHit = rule.from.some(function (p) { return underDir(fileRel, p); });
        if (!fromHit)
            continue;
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var specs = (0, fs_path_ts_1.extractSpecifiers)(line);
            var _loop_1 = function (spec) {
                if (rule.to.some(function (t) { return spec === t || spec.startsWith(t + '/') || spec.startsWith(t); })) {
                    violations.push({
                        rule: rule.name,
                        file: filePath,
                        line: i + 1,
                        message: "".concat(rule.description, " -> \u547D\u4E2D import \"").concat(spec, "\""),
                    });
                }
            };
            for (var _a = 0, specs_1 = specs; _a < specs_1.length; _a++) {
                var spec = specs_1[_a];
                _loop_1(spec);
            }
        }
    }
    return violations;
}
/**
 * 子应用生命周期导出校验（云顶规范 §12.2【强制】）：
 * 每个子应用（apps 下各应用的 src/main.ts）必须导出标准的 bootstrap / mount / unmount 生命周期。
 * 本项目经 @ydsz/shared-auth 的 createSubApp 工厂统一产出，检查文件是否以
 * `export const { bootstrap, mount, unmount }`（含 update）形式导出。
 */
function checkSubAppLifecycle(rootDir, files) {
    var violations = [];
    var appMainFiles = files.filter(function (f) { return /apps\/[^/]+\/src\/main\.ts$/.test(f); });
    for (var _i = 0, appMainFiles_1 = appMainFiles; _i < appMainFiles_1.length; _i++) {
        var file = appMainFiles_1[_i];
        var content = void 0;
        try {
            content = (0, node_fs_1.readFileSync)(file, 'utf-8');
        }
        catch (_a) {
            continue;
        }
        // 匹配 `export const { bootstrap, mount, unmount[, update] } = createSubApp(...)`
        var lifecycleRe = /export\s+const\s*\{\s*(?:bootstrap|mount|unmount)\s*,\s*(?:bootstrap|mount|unmount)\s*,\s*(?:bootstrap|mount|unmount)\s*(?:,\s*update\s*)?\}/;
        if (!lifecycleRe.test(content)) {
            violations.push({
                rule: 'sub-app-standard-lifecycle',
                file: file,
                line: 1,
                message: '子应用未导出标准 bootstrap/mount/unmount 生命周期（云顶规范 §12.2），请使用 createSubApp 工厂',
            });
        }
    }
    return violations;
}
/**
 * 执行架构检查
 */
function checkArch(options) {
    return __awaiter(this, void 0, void 0, function () {
        var rootDir, rules, allViolations, files, _i, files_1, file;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            rootDir = (_a = options.rootDir) !== null && _a !== void 0 ? _a : process.cwd();
            rules = (_b = options.rules) !== null && _b !== void 0 ? _b : DEFAULT_RULES;
            allViolations = [];
            files = (_c = options.files) !== null && _c !== void 0 ? _c : (0, fs_path_ts_1.collectSourceFiles)(rootDir);
            for (_i = 0, files_1 = files; _i < files_1.length; _i++) {
                file = files_1[_i];
                allViolations.push.apply(allViolations, checkFile(file, rules, rootDir));
            }
            allViolations.push.apply(allViolations, checkSubAppLifecycle(rootDir, files));
            return [2 /*return*/, allViolations];
        });
    });
}
// CLI 入口
if (import.meta.url === "file://".concat(process.argv[1])) {
    var rootDir_1 = (0, node_path_1.resolve)((_a = process.argv[2]) !== null && _a !== void 0 ? _a : process.cwd());
    console.log("\uD83D\uDD0D \u6267\u884C\u67B6\u6784\u68C0\u67E5: ".concat(rootDir_1));
    checkArch({ rootDir: rootDir_1 })
        .then(function (violations) {
        if (violations.length === 0) {
            console.log('✅ 架构检查通过：未发现违规依赖');
            process.exit(0);
        }
        console.error("\u274C \u53D1\u73B0 ".concat(violations.length, " \u5904\u67B6\u6784\u8FDD\u89C4:\n"));
        for (var _i = 0, violations_1 = violations; _i < violations_1.length; _i++) {
            var v = violations_1[_i];
            console.error("  [".concat(v.rule, "] ").concat((0, node_path_1.relative)(rootDir_1, v.file), ":").concat(v.line));
            console.error("    ".concat(v.message));
        }
        process.exit(1);
    })
        .catch(function (err) {
        console.error('架构检查出错:', err);
        process.exit(2);
    });
}
