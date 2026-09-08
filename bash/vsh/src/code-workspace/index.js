"use strict";
/**
 * @file vsh code-workspace - 工作区配置管理工具
 * @author YDSZ Team
 * @since 2026-08-23
 * @description 同步 VS Code 工作区配置，统一管理扩展推荐和设置
 *
 * @path bash\vsh\src\code-workspace\index.ts
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
exports.generateWorkspaceConfig = generateWorkspaceConfig;
exports.writeWorkspaceFile = writeWorkspaceFile;
exports.syncWorkspace = syncWorkspace;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
/** 推荐的扩展列表 */
var RECOMMENDED_EXTENSIONS = [
    'Vue.volar',
    'dbaeumer.vscode-eslint',
    'esbenp.prettier-vscode',
    'bradlc.vscode-tailwindcss',
    'usernamehw.errorlens',
    'eamodio.gitlens',
    'streetsidesoftware.code-spell-checker',
];
/** 推荐的工作区设置 */
var RECOMMENDED_SETTINGS = {
    'editor.formatOnSave': true,
    'editor.defaultFormatter': 'esbenp.prettier-vscode',
    'editor.codeActionsOnSave': {
        'source.fixAll.eslint': 'explicit',
        'source.organizeImports': 'never',
    },
    'eslint.validate': ['javascript', 'typescript', 'vue'],
    'tailwindCSS.experimental.classRegex': [
        ['clsx\\(([^)]*)\\)', ["\"([^\"]*)\"", "'([^']*)'"]],
        ['cn\\(([^)]*)\\)', ["\"([^\"]*)\"", "'([^']*)'"]],
    ],
};
/**
 * 扫描项目中的 apps 和 comm 目录
 */
function scanProjectFolders(rootDir) {
    var folders = [];
    var scanDir = function (dir, prefix) {
        if (!(0, node_fs_1.existsSync)(dir))
            return;
        var entries = (0, node_fs_1.readdirSync)(dir, { withFileTypes: true });
        for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
            var entry = entries_1[_i];
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                var relativePath = "./".concat(prefix, "/").concat(entry.name);
                folders.push({
                    path: relativePath,
                    name: "".concat(prefix, "/").concat(entry.name),
                });
            }
        }
    };
    scanDir((0, node_path_1.resolve)(rootDir, 'apps'), 'apps');
    scanDir((0, node_path_1.resolve)(rootDir, 'comm'), 'comm');
    scanDir((0, node_path_1.resolve)(rootDir, 'main'), 'main');
    return folders;
}
/**
 * 生成工作区配置
 */
function generateWorkspaceConfig(options) {
    var _a, _b;
    var rootDir = (_a = options.rootDir) !== null && _a !== void 0 ? _a : process.cwd();
    var folders = scanProjectFolders(rootDir);
    // 根目录也添加
    folders.unshift({ path: '.', name: 'root' });
    return {
        folders: folders,
        settings: __assign(__assign({}, RECOMMENDED_SETTINGS), options.settings),
        extensions: {
            recommendations: __spreadArray(__spreadArray([], RECOMMENDED_EXTENSIONS, true), ((_b = options.extensions) !== null && _b !== void 0 ? _b : []), true),
        },
    };
}
/**
 * 写入工作区配置文件
 */
function writeWorkspaceFile(outputPath, config) {
    var content = JSON.stringify(config, null, 2);
    (0, node_fs_1.writeFileSync)(outputPath, content, 'utf-8');
    console.log("\u2705 \u5DE5\u4F5C\u533A\u914D\u7F6E\u5DF2\u5199\u5165: ".concat(outputPath));
}
/**
 * 同步工作区配置
 */
function syncWorkspace(options) {
    return __awaiter(this, void 0, void 0, function () {
        var rootDir, output, config;
        var _a, _b;
        return __generator(this, function (_c) {
            rootDir = (_a = options.rootDir) !== null && _a !== void 0 ? _a : process.cwd();
            output = (_b = options.output) !== null && _b !== void 0 ? _b : (0, node_path_1.resolve)(rootDir, 'ydsz-admin.code-workspace');
            config = generateWorkspaceConfig({ rootDir: rootDir });
            writeWorkspaceFile(output, config);
            return [2 /*return*/];
        });
    });
}
// CLI 入口
if (import.meta.url === "file://".concat(process.argv[1])) {
    var rootDir = (_a = process.argv[2]) !== null && _a !== void 0 ? _a : process.cwd();
    syncWorkspace({ rootDir: rootDir })
        .then(function () {
        console.log('✅ 工作区配置同步完成');
        process.exit(0);
    })
        .catch(function (err) {
        console.error('工作区配置同步失败:', err);
        process.exit(1);
    });
}
