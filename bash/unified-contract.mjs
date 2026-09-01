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

import { execSync } from 'node:child_process';
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
  if (!existsSync(schemaPath)) return;

  const schemaContent = readFileSync(schemaPath, 'utf-8');

  // 提取 components.schemas 中的类型名
  const typeNames = [];
  const interfaceRegex = /export\s+interface\s+([A-Z][A-Za-z0-9_]*)\s*\{/g;
  let match = interfaceRegex.exec(schemaContent);
  while (match) {
    const typeName = match[1];
    // 跳过基础类型
    if (!['Paths', 'Operations', 'Components', 'Webhooks'].includes(typeName)) {
      typeNames.push(typeName);
    }
    match = interfaceRegex.exec(schemaContent);
  }

  if (typeNames.length === 0) return;

  // 去重并排序
  const uniqueTypeNames = [...new Set(typeNames)].sort();

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
  lines.push("export type { PageResponse, YdszResponse } from './models';");
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
  baseUrl: '/api/${serviceName}',
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

  // 如果已存在且包含手动添加的类型，保留
  if (existsSync(modelsPath)) {
    const content = readFileSync(modelsPath, 'utf-8');
    if (content.includes('手动添加的类型')) {
      console.log(`  · models.ts (保留手动类型)`);
      return;
    }
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
 * @param serviceName 服务名
 * @returns 是否成功
 */
function useStaticExtraction(serviceName) {
  const svcDir = join(CLOUD_ROOT, `ydsz-${serviceName}`);
  if (!existsSync(svcDir)) {
    console.log(`  ! 后端目录不存在: ${svcDir}`);
    return false;
  }

  // 调用 gen-contract.py 进行静态提取
  try {
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    execSync(`${pythonCmd} bash/gen-contract.py ${serviceName}`, {
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
      try {
        const specPath = join(outDir, 'openapi.json');
        writeFileSync(specPath, specData);

        const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
        execSync(
          `${npxCmd} openapi-typescript "${specPath}" --output "${join(outDir, 'schema.d.ts')}" --export-type`,
          { cwd: ROOT, stdio: 'pipe' },
        );

        // 追加 eslint-disable 头
        const schemaPath = join(outDir, 'schema.d.ts');
        let schema = readFileSync(schemaPath, 'utf-8');
        schema = `/* eslint-disable */\n/* auto-generated by pnpm gen:api — DO NOT EDIT */\n${schema}`;
        writeFileSync(schemaPath, schema);

        console.log(`  ✓ schema.d.ts`);
      } catch (err) {
        console.error(`  ✗ openapi-typescript 转换失败: ${err.message}`);
        success = false;
      }
    }

    // 4. 降级使用静态提取（从 Java 源码解析）
    if (!success) {
      success = useStaticExtraction(name);
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
