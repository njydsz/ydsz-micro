/**
 * 统一契约生成入口
 *
 * <p>合并 gen-api.mjs 与 gen-contract.py 为单一入口，消除双轨制漂移风险。
 * 默认读取后端构建产物（target/openapi/*.json），无需后端服务运行。
 * 可选 --live 模式从运行时 /v3/api-docs 拉取（对应开发联调场景）。
 *
 * <p>使用方式:
 *   pnpm gen:api              # 默认模式：从后端构建产物读取 spec，生成全部 SDK
 *   pnpm gen:api workflow     # 仅生成 workflow-web 的 SDK
 *   pnpm gen:api --check      # CI 模式：仅检查（有漂移则失败）
 *   pnpm gen:api --live       # 运行时模式：从运行中的后端服务拉取 spec
 *   pnpm gen:api --static     # 强制静态提取（从 Java 源码解析，降级兜底）
 *
 * <p>环境变量:
 *   YDSZ_OPENAPI_ROOT  后端仓库根目录（CI 注入；默认本机 D:\Code\open\ydsz-cloud）
 *
 * <p>产出:
 *   1. apps/{app}/src/api/sdk/schema.d.ts      —— 完整类型定义（paths + components + operations）
 *   2. apps/{app}/src/api/sdk/index.ts         —— 类型安全 SDK 客户端入口
 *   3. apps/{app}/src/api/sdk/types-export.ts  —— 命名类型别名导出
 *   4. apps/{app}/src/api/sdk/.api-contract.lock —— 契约 hash 快照
 *
 * @path bash\unified-contract.mjs
 * @author ydsz-team
 * @since 4.0.0
 * @see docs/云顶编码规范.md 第 6 章 API 请求规范
 * @see docs/OPENAPI_SPEC_GUIDE.md 后端构建期 spec 生成指南
 */

import { execFileSync, execSync } from 'node:child_process';
import { existsSync, globSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

/** 后端仓库根目录（静态模式读取 target/openapi/*.json） */
const CLOUD_ROOT = process.env.YDSZ_OPENAPI_ROOT || 'D:\\Code\\open\\ydsz-cloud';

/**
 * 后端微服务 → 前端子应用 映射表。
 *
 * <p>key:   子应用名（与 apps/ 和 MICRO_APPS 注册名一致）
 * <p>live:   运行时 OpenAPI 规范地址（--live 模式使用）
 * <p>local:  构建产物路径（默认模式，相对于 CLOUD_ROOT）
 * <p>output: SDK 产物输出目录（相对于项目根）
 */
const SERVICE_MAP = {
  userinfo: {
    live: 'http://localhost:9002/v3/api-docs',
    local: 'ydsz-userinfo/ydsz-userinfo-web/target/openapi/openapi.json',
    output: 'apps/userinfo-web/src/api/sdk',
  },
  system: {
    live: 'http://localhost:9001/v3/api-docs',
    local: 'ydsz-system/ydsz-system-web/target/openapi/openapi.json',
    output: 'apps/system-web/src/api/sdk',
  },
  message: {
    live: 'http://localhost:9004/v3/api-docs',
    local: 'ydsz-message/ydsz-message-web/target/openapi/openapi.json',
    output: 'apps/message-web/src/api/sdk',
  },
  cronjob: {
    live: 'http://localhost:9006/v3/api-docs',
    local: 'ydsz-cronjob/ydsz-cronjob-web/target/openapi/openapi.json',
    output: 'apps/cronjob-web/src/api/sdk',
  },
  workflow: {
    live: 'http://localhost:9005/v3/api-docs',
    local: 'ydsz-workflow/ydsz-workflow-web/target/openapi/openapi.json',
    output: 'apps/workflow-web/src/api/sdk',
  },
  nextwiki: {
    live: 'http://localhost:9003/v3/api-docs',
    local: 'ydsz-nextwiki/ydsz-nextwiki-web/target/openapi/openapi.json',
    output: 'apps/nextwiki-web/src/api/sdk',
  },
  literule: {
    live: 'http://localhost:9007/v3/api-docs',
    local: 'ydsz-literule/ydsz-literule-web/target/openapi/openapi.json',
    output: 'apps/literule-web/src/api/sdk',
  },
  agent: {
    live: 'http://localhost:9008/v3/api-docs',
    local: 'ydsz-agent/ydsz-agent-web/target/openapi/openapi.json',
    output: 'apps/agent-web/src/api/sdk',
  },
};


/**
 * 为生成的 SDK 计算稳定 hash，输出到 .api-contract.lock
 *
 * @param serviceName 服务名
 * @param outputDir   输出目录（相对于项目根）
 */
function writeLockFile(serviceName, outputDir) {
  const lockPath = join(ROOT, outputDir, '.api-contract.lock');
  const hash = createHash('sha256');
  const files = globSync(join(ROOT, outputDir, '*.ts'));
  for (const file of files.sort()) {
    hash.update(readFileSync(file, 'utf-8'));
  }
  writeFileSync(lockPath, `${hash.digest('hex')}\n`);
  console.log(`  lock: ${lockPath}`);
}

/**
 * 读取 lock 文件的 hash 值
 *
 * @param outputDir 输出目录
 * @returns hash 值，不存在返回空字符串
 */
function readLockHash(outputDir) {
  const lockPath = join(ROOT, outputDir, '.api-contract.lock');
  if (!existsSync(lockPath)) return '';
  return readFileSync(lockPath, 'utf-8').trim();
}

/**
 * 生成命名类型别名导出文件
 *
 * <p>从 schema.d.ts 中提取 components.schemas 类型，生成命名别名导出。
 * 消除 models.ts 手动类型定义，实现类型单一数据源。
 *
 * @param outDir 输出目录
 * @param serviceName 服务名
 */
function generateTypesExport(outDir, serviceName) {
  const schemaPath = join(outDir, 'schema.d.ts');
  // P0-1 修复：schema.d.ts 缺失时跳过，避免产出引用空源的坏文件
  if (!existsSync(schemaPath)) return;

  const schemaContent = readFileSync(schemaPath, 'utf-8');

  // P0-1 修复：--export-type 模式下命名类型位于 components.schemas 块内
  // （形如 `        AppInfoDTO: {`），而非顶层 `export interface X {}`；
  // 此前正则匹配不到任何类型导致 types-export.ts 被静默跳过
  const typeNames = [];
  const schemaLines = schemaContent.split('\n');
  let inSchemas = false;
  let schemasIndent = -1;
  for (const line of schemaLines) {
    if (!inSchemas) {
      const schemasMatch = line.match(/^(\s*)schemas: \{$/);
      if (schemasMatch) {
        inSchemas = true;
        schemasIndent = schemasMatch[1].length;
      }
      continue;
    }
    // schemas 块结束：出现缩进不大于 schemas 本身的非空行（如闭合的 `    }`）
    const indentMatch = line.match(/^(\s*)\S/);
    if (line.trim() && indentMatch && indentMatch[1].length <= schemasIndent) {
      break;
    }
    const entryMatch = line.match(
      new RegExp(`^\\s{${schemasIndent + 4}}([A-Z][A-Za-z0-9_]*): \\{`),
    );
    if (entryMatch) {
      typeNames.push(entryMatch[1]);
    }
  }

  if (typeNames.length === 0) return;

  // 去重并排序；排除与 ../models 重导出同名的通用类型（models.ts 泛型版本
  // 带 T 参数与文档注释，优于 schema 中的未参数化包装），避免 TS2484 导出冲突
  const excluded = new Set(['PageResponse', 'YdszResponse']);
  const uniqueTypeNames = [...new Set(typeNames)].filter((t) => !excluded.has(t)).sort();

  const lines = [
    '/**',
    ` * ${serviceName} 命名类型别名导出`,
    ' *',
    ' * <p>由 unified-contract.mjs 自动生成，请勿手动修改。',
    ' * <p>提供 components.schemas 中定义的命名类型别名，消除 models.ts 手动类型定义。',
    ' *',
    ' * @auto-generated',
    ' * @since 4.0.0',
    ' */',
    '',
    "import type { components } from './schema';",
    '',
    '// 导出命名类型别名，便于业务代码直接使用',
  ];

  for (const typeName of uniqueTypeNames) {
    lines.push(`export type ${typeName} = components['schemas']['${typeName}'];`);
  }

  lines.push('');
  lines.push('// 常用响应类型别名');
  // P0-1 修复：models.ts 位于 sdk/ 上级目录（api/models.ts），此前 './models' 解析到
  // 不存在的 sdk/models.ts 导致悬空导入
  lines.push("export type { PageResponse, YdszResponse } from '../models';");
  lines.push('');

  const exportPath = join(outDir, 'types-export.ts');
  writeFileSync(exportPath, lines.join('\n'));
  console.log(`  ✓ types-export.ts (${uniqueTypeNames.length} types)`);
}

/**
 * 生成 SDK 客户端入口文件
 *
 * @param outDir 输出目录
 * @param serviceName 服务名
 */
function generateSdkIndex(outDir, serviceName) {
  const indexPath = join(outDir, 'index.ts');

  // P0-1 修复：schema.d.ts 缺失时跳过生成，避免产出引用不存在模块的坏 index.ts
  if (!existsSync(join(outDir, 'schema.d.ts'))) {
    console.log(`  · index.ts (跳过：schema.d.ts 缺失)`);
    return;
  }

  // 如果已存在且非自动生成，保留手动扩展
  if (existsSync(indexPath)) {
    const content = readFileSync(indexPath, 'utf-8');
    if (!content.includes('auto-generated')) {
      console.log(`  · index.ts (保留手动扩展)`);
      return;
    }
  }

  const content = `/**
 * ${serviceName} OpenAPI SDK 客户端入口
 *
 * <p>由 unified-contract.mjs 自动生成，请勿手动修改。
 * <p>基于 openapi-fetch 创建的类型安全 API 客户端。
 *
 * @auto-generated
 * @since 4.0.0
 */

import { createOpenApiClient } from '@ydsz/shared-auth';
import type { paths } from './schema';

/**
 * ${serviceName} 类型安全 API 客户端
 *
 * <p>基于生成的 schema.d.ts 提供完整的类型检查和自动补全。
 * <p>所有 API 路径、参数、响应类型均与后端 OpenAPI 规范对齐。
 *
 * @example
 * \`\`\`ts
 * import { apiClient } from '#/api/sdk';
 *
 * // 类型安全的 API 调用
 * const { data, error } = await apiClient.GET('/users/{id}', {
 *   params: { path: { id: '123' } },
 * });
 * \`\`\`
 */
export const apiClient = createOpenApiClient<paths>({
  // P0-1 修复：spec 中 paths 为完整路径（/api/v1/**），baseUrl 必须为空串；
  // 此前 '/api/${serviceName}' 会拼出 /api/system/api/v1/** 错误地址
  baseUrl: '',
});

// 导出完整类型供业务代码使用
export type { paths, components, operations } from './schema';

// 导出命名类型别名
export * from './types-export';
`;

  writeFileSync(indexPath, content);
  console.log(`  ✓ index.ts (client)`);
}

/**
 * 生成 models.ts 基础响应类型
 *
 * @param outDir 输出目录
 * @param serviceName 服务名
 */
function generateModels(outDir, serviceName) {
  const modelsPath = join(outDir, '..', 'models.ts');

  // P0-1 加固（2026-09-02）：models.ts 存在即保留，不做内容嗅探式判定——
  // 既有文件归属 gen-contract.py（含全量 DTO 与 requestClient 解包说明，优于本模板），
  // 任何模式（含 --check）都不得覆盖；unified-contract 仅在文件缺失时做首次初始化。
  // 此前基于内容标记的守卫在实测中出现过一次覆盖（标记判定失效），故收紧为存在性判定。
  if (existsSync(modelsPath)) {
    console.log(`  · models.ts (已存在，保留)`);
    return;
  }

  const content = `/**
 * ${serviceName} 基础响应类型
 *
 * <p>由 unified-contract.mjs 自动生成。
 * <p>YdszResponse / PageResponse / PageQuery 为前端通用基础响应类型。
 *
 * @auto-generated
 * @since 4.0.0
 */

/** 后端统一响应结构（对齐 {@code YdszResponse<T>}） */
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

/** 分页响应（对齐后端 {@code PageResponse<T>}） */
export interface PageResponse<T = unknown> {
  /** 总记录数 */
  total?: number;
  /** 当前页码（从 1 开始） */
  pageNum?: number;
  /** 每页记录数 */
  pageSize?: number;
  /** 分页数据 */
  data: T;
}

/** 分页查询参数（前端通用约定） */
export interface PageQuery {
  pageNum?: number;
  pageSize?: number;
}
`;

  writeFileSync(modelsPath, content);
  console.log(`  ✓ models.ts (base types)`);
}

/**
 * 使用静态提取作为降级方案
 *
 * <p>P0-1 修复（2026-09-02）：调用 gen-contract.py --spec-only 仅产出 openapi.json
 * 契约基线（写入 outDir），不重写旧轨 .ts 封装——新旧轨道解耦，
 * 转换为 schema.d.ts 由 {@link generateSchemaFromSpec} 统一完成。
 *
 * @param serviceName 服务名
 * @returns 是否成功
 */
function useStaticExtraction(serviceName) {
  const svcDir = join(CLOUD_ROOT, `ydsz-${serviceName}`);
  if (!existsSync(svcDir)) {
    console.log(`  ! 后端目录不存在: ${svcDir}`);
    return false;
  }

  // 调用 gen-contract.py 进行静态提取（--spec-only：仅产出 openapi.json）
  // P0-1 修复：execFileSync 免 shell 直调 python，规避 ComSpec 缺失环境（Git Bash/沙箱）下
  // execSync 默认 shell cmd.exe ENOENT 问题
  try {
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    execFileSync(pythonCmd, ['bash/gen-contract.py', serviceName, '--spec-only'], {
      cwd: ROOT,
      stdio: 'pipe',
    });
    return true;
  } catch (err) {
    console.log(`  ! 静态提取失败: ${err.message}`);
    return false;
  }
}

/**
 * 将 outDir/openapi.json 转换为 schema.d.ts（类型安全 SDK 的核心产物）
 *
 * <p>P0-1 修复（2026-09-02）：抽取为独立函数，构建产物 / 运行时 / 静态提取
 * 三种来源的 spec 统一经此转换为 schema.d.ts——此前静态降级链路缺失此步，
 * 导致 schema.d.ts 永远无法落地、index.ts 引用不存在的模块。
 *
 * @param outDir SDK 输出目录（openapi.json 已存在于其中）
 * @returns 转换是否成功
 */
function generateSchemaFromSpec(outDir) {
  const specPath = join(outDir, 'openapi.json');
  if (!existsSync(specPath)) {
    console.log('  ! openapi.json 缺失，跳过 schema 转换');
    return false;
  }
  try {
    // P0-1 修复：shell 环境自愈——受限环境（Git Bash 沙箱等）ComSpec 未设置时，
    // 显式注入标准 cmd.exe 路径，保证 npx.cmd 可执行；常规 Windows 环境行为不变
    const childEnv = { ...process.env };
    if (process.platform === 'win32' && !childEnv.ComSpec) {
      const defaultCmd = 'C:\\Windows\\System32\\cmd.exe';
      if (existsSync(defaultCmd)) {
        childEnv.ComSpec = defaultCmd;
        childEnv.PATH = `${process.env.PATH || ''};C:\\Windows\\System32`;
      }
    }
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    execSync(
      `${npxCmd} openapi-typescript "${specPath}" --output "${join(outDir, 'schema.d.ts')}" --export-type`,
      {
        cwd: ROOT,
        stdio: 'pipe',
        env: childEnv,
        shell: process.platform === 'win32' ? (childEnv.ComSpec || 'cmd.exe') : undefined,
      },
    );

    // 追加 eslint-disable 头
    const schemaPath = join(outDir, 'schema.d.ts');
    let schema = readFileSync(schemaPath, 'utf-8');
    schema = `/* eslint-disable */\n/* auto-generated by pnpm gen:api — DO NOT EDIT */\n${schema}`;
    writeFileSync(schemaPath, schema);

    console.log(`  ✓ schema.d.ts`);
    return true;
  } catch (err) {
    console.error(`  ✗ openapi-typescript 转换失败: ${err.message}`);
    return false;
  }
}

/**
 * 主流程
 */
async function main() {
  const args = process.argv.slice(2);
  const isCheck = args.includes('--check');
  const isStatic = args.includes('--static');
  const isLive = args.includes('--live');
  const targetName = args.find((a) => !a.startsWith('--'));

  const targets = targetName
    ? [[targetName, SERVICE_MAP[targetName]]].filter(([, v]) => v)
    : Object.entries(SERVICE_MAP);

  if (targetName && !SERVICE_MAP[targetName]) {
    console.error(`未知服务: ${targetName}。可用: ${Object.keys(SERVICE_MAP).join(', ')}`);
    process.exit(1);
  }

  const modeLabel = isLive ? '运行时模式 (--live)' : isStatic ? '静态提取模式 (--static)' : '构建产物模式 (默认)';
  console.log(`[gen:api] ${isCheck ? 'CI 契约检查' : '生成 SDK'} — ${modeLabel}，共 ${targets.length} 个服务\n`);

  let hasChanges = false;
  let hasErrors = false;

  for (const [name, { live, local, output }] of targets) {
    const outDir = join(ROOT, output);
    const oldHash = readLockHash(output);

    console.log(`[${name}] ${isLive ? live : local}`);

    let success = false;
    let specData = '';

    // 1. 默认模式：从后端构建产物 target/openapi/ 读取
    if (!isLive && !isStatic) {
      const localPath = join(CLOUD_ROOT, local);
      if (existsSync(localPath)) {
        try {
          specData = readFileSync(localPath, 'utf-8');
          mkdirSync(outDir, { recursive: true });
          success = true;
          console.log(`  ← 读取构建产物: ${localPath}`);
        } catch (err) {
          console.log(`  ! 读取构建产物失败: ${err.message}`);
        }
      } else {
        console.log(`  ! 构建产物不存在: ${localPath}`);
        console.log(`  ! 提示: 请先在 ydsz-cloud 执行 mvn compile -P openapi-spec 生成 spec`);
      }
    }

    // 2. --live 模式：运行时 HTTP 获取
    if (!success && isLive) {
      try {
        const resp = await fetch(live, { signal: AbortSignal.timeout(15000) });
        if (resp.ok) {
          specData = await resp.text();
          mkdirSync(outDir, { recursive: true });
          success = true;
          console.log(`  ← 运行时获取: ${live}`);
        }
      } catch {
        console.log(`  ! 运行时获取失败: ${live}`);
      }
    }

    // 3. 写入 openapi.json + openapi-typescript 生成 schema
    if (success) {
      const specPath = join(outDir, 'openapi.json');
      writeFileSync(specPath, specData);
      success = generateSchemaFromSpec(outDir);
    }

    // 4. 降级使用静态提取（gen-contract.py --spec-only 产出 openapi.json）
    if (!success) {
      success = useStaticExtraction(name);
      // P0-1 修复：静态产物同样转换为 schema.d.ts，补齐类型安全 SDK 输出
      if (success) {
        success = generateSchemaFromSpec(outDir);
      }
    }

    if (!success) {
      console.error(`  ✗ 无法生成 ${name} 的 SDK`);
      hasErrors = true;
      continue;
    }

    // 5. 生成命名类型别名导出
    generateTypesExport(outDir, name);

    // 6. 生成 SDK 客户端入口
    generateSdkIndex(outDir, name);

    // 7. 生成 models.ts
    generateModels(outDir, name);

    // 8. 写入 lock 文件
    writeLockFile(name, output);

    // 9. CI 模式：检查是否有变更
    if (isCheck) {
      const newHash = readLockHash(output);
      if (oldHash !== newHash && oldHash) {
        console.error(`  ✗ 契约变更: ${name} 后端接口已修改，请运行 pnpm gen:api 更新 SDK`);
        hasChanges = true;
      } else {
        console.log(`  ✓ 契约一致`);
      }
    }
  }

  if (hasErrors) {
    console.error('\n[gen:api] 部分服务生成失败！');
    process.exit(1);
  }

  if (isCheck && hasChanges) {
    console.error('\n[gen:api] 契约漂移检测失败！请运行 pnpm gen:api 同步前端 SDK。');
    process.exit(1);
  }

  console.log(`\n[gen:api] ${isCheck ? '契约一致' : '完成，共 ' + targets.length + ' 个服务'}`);
}

main();
