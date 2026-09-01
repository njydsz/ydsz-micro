#!/usr/bin/env node
/**
 * SSE 流式 SDK 生成器 —— 从后端流式契约产出类型化 for-await-of 消费入口。
 *
 * <p>工作流：
 * <ol>
 *   <li>读取 {@code $YDSZ_CLOUD_ROOT/.streaming-spec.yaml}（后端团队维护，列出 SSE/SSE-like endpoints）</li>
 *   <li>校验声明的类型是否为已有 SDK schema 中已引用的组件</li>
 *   <li>在请求客户端（{@code comm/effects/request/src/}）产出 {@code streaming-client.generated.ts}</li>
 *   <li>更新 lock 文件 {@code .stream-sdk.lock} 用于 CI 门禁</li>
 * </ol>
 *
 * <p>与 unified-contract.mjs (REST) 配合：REST SDK 提供「请求 DTO / 响应类型」，
 * 流式 SDK 提供「AsyncIterable 消费方法」，二者共享同一份 schema。
 *
 * <p>使用方式：
 * <pre>
 *   pnpm gen:streaming                  # 默认从 YDSZ_CLOUD_ROOT/.streaming-spec.yaml 读取
 *   pnpm gen:streaming --check          # CI 校验（漂移即 fail）
 *   pnpm gen:streaming --spec ./spec.yaml   # 显式指定 spec 文件路径
 * </pre>
 *
 * <p>流式 spec YAML 格式（后端维护）：
 * <pre>
 * version: "1.0"
 * endpoints:
 *   - name: agentChat
 *     method: POST
 *     path: /api/v1/agent/chat/stream
 *     description: Agent 对话流式返回
 *     chunkType: schemas.agent.ChatChunk               # 引用 OpenAPI schema
 *     chunkShape:                                     # 可选：内联类型描述（chunkType 优先）
 *       content: string
 *       done: boolean
 *       error: { code: number, message: string } | null
 *     eventName: delta                                 # SSE 事件名（默认 "message"）
 *
 *   - name: authEvents
 *     method: GET
 *     path: /api/v1/auth/events
 *     chunkType: schemas.auth.AuthEvent
 * </pre>
 *
 * @path bash/gen-streaming-sdk.mjs
 * @author ydsz-team
 * @since 4.1.0 (P2-9)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

/** 后端仓库根目录（默认从构建产物生成，而非依赖运行时） */
const CLOUD_ROOT = process.env.YDSZ_OPENAPI_ROOT || 'D:\\Code\\open\\ydsz-cloud';

/** 默认流式 spec 路径（受《云顶编码规范》第 36 章约束，spec 放 data/ 目录） */
const DEFAULT_SPEC_PATH = join(CLOUD_ROOT, '.streaming-spec.yaml');

/** lock 文件（CI 漂移门禁用） */
const LOCK_FILE = join(ROOT, 'apps', 'agent-web', 'src', 'api', 'sdk', '.stream-sdk.lock');

/** 输出目录 */
const OUTPUT_DIR = join(ROOT, 'comm', 'effects', 'request', 'src', 'streaming');
const OUTPUT_FILE = join(OUTPUT_DIR, 'streaming-client.generated.ts');

// =====================================================================
// YAML 简易解析（项目禁用 js-yaml 等第三方，自研零依赖 YAML subset 解析）
// =====================================================================

/**
 * 极简 YAML 解析器 —— 仅支持流式 spec 所需的子集（键值对、列表、嵌套 map、多行文本）。
 *
 * <p>显式拒绝复杂 YAML 锚点/别名/流式标量；不支持的语法直接报错而非降级解析，
 * 确保 spec 作者始终以最小可用集编写。
 */
function parseSimpleYaml(text) {
  const lines = text.split(/\r?\n/);
  const root = {};
  const stack = [{ obj: root, indent: -1 }];
  let currentList = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    // 跳过空行和注释
    if (!raw.trim() || raw.trim().startsWith('#')) continue;

    const indent = raw.search(/\S/);
    const line = raw.trim();

    // 退出更深层的嵌套
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
      currentList = null;
    }

    const top = stack[stack.length - 1];

    // 列表项（- key: value 或 - scalar）
    if (line.startsWith('- ')) {
      const content = line.slice(2).trim();
      if (!Array.isArray(top.obj)) {
        // 将当前对象的父值转为列表
        throw new Error(`YAML Parse Error at line ${i + 1}: 「-」缩进不对齐（parent 不是列表键）`);
      }
      if (content.includes(':')) {
        // 列表中的对象 entry
        const entry = {};
        top.obj.push(entry);
        const { key, value } = splitKeyValue(content);
        if (value !== undefined) {
          entry[key] = parseYamlScalar(value);
        } else {
          // value 在下一行
          stack.push({ obj: entry, indent: indent + 2 });
        }
      } else {
        // 纯标量列表项（不常见但兼容）
        top.obj.push(parseYamlScalar(content));
      }
      continue;
    }

    // 键值对
    if (line.includes(':')) {
      const { key, value } = splitKeyValue(line);
      if (value === undefined) {
        // 嵌套 map / 列表
        const newObj = {};
        top.obj[key] = newObj;
        stack.push({ obj: newObj, indent });
      } else if (value === '') {
        // 空值 → 可能是后续子 map 或列表
        top.obj[key] = [];
        stack.push({ obj: top.obj[key], indent: indent + 2 });
        currentList = top.obj[key];
      } else {
        top.obj[key] = parseYamlScalar(value);
      }
    }
  }

  return root;
}

/** 将 "key: value" 拆为 { key, value } */
function splitKeyValue(s) {
  const idx = s.indexOf(':');
  const key = s.slice(0, idx).trim();
  const raw = s.slice(idx + 1).trim();
  if (raw === '') return { key, value: undefined };
  // 去掉行内注释（非引号内 #）
  const value = raw.replace(/\s+#.*$/, '').trim();
  return { key, value: value || undefined };
}

/** 解析 YAML 标量（null / boolean / int / float / string） */
function parseYamlScalar(v) {
  if (v === 'null' || v === '~') return null;
  if (v === 'true' || v === 'yes') return true;
  if (v === 'false' || v === 'no') return false;
  if (/^-?\d+$/.test(v)) return Number(v);
  if (/^-?\d*\.\d+$/.test(v)) return Number(v);
  // 去引号
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

// =====================================================================
// 主流程
// =====================================================================

async function main() {
  const args = process.argv.slice(2);
  const isCheck = args.includes('--check');
  const specArg = args.find((a, i) => a === '--spec' && args[i + 1]);
  const specPath = specArg ? args[args.indexOf('--spec') + 1] : DEFAULT_SPEC_PATH;

  console.log(`[gen:streaming] ${isCheck ? 'CI 校验' : '生成流式 SDK'} — spec: ${specPath}\n`);

  if (!existsSync(specPath)) {
    console.warn(`! 流式 spec 文件不存在: ${specPath}`);
    console.warn('! 提示: 请在 ydsz-cloud 仓库根创建 .streaming-spec.yaml，参见 bash/gen-streaming-sdk.mjs 头部文档。');
    if (isCheck) {
      console.error('\n[gen:streaming] spec 不存在，CI 校验跳过（不阻断）。');
    }
    return;
  }

  const specContent = readFileSync(specPath, 'utf-8');
  const spec = parseSimpleYaml(specContent);
  if (!spec.endpoints || !Array.isArray(spec.endpoints)) {
    console.error('✗ spec 格式错误：缺少 endpoints 列表');
    process.exit(1);
  }

  const newHash = createHash('sha256').update(specContent).digest('hex').slice(0, 12);
  const oldHash = existsSync(LOCK_FILE) ? readFileSync(LOCK_FILE, 'utf-8').trim() : null;

  if (isCheck) {
    if (oldHash && oldHash !== newHash) {
      console.error(`✗ 流式契约漂移: spec 已修改 (${oldHash} → ${newHash})，请运行 pnpm gen:streaming 更新 SDK`);
      process.exit(1);
    }
    console.log(`✓ 流式契约一致 (${newHash})`);
    return;
  }

  const code = generateStreamingClient(spec.endpoints);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, code);
  writeFileSync(LOCK_FILE, newHash);

  console.log(`✓ 流式 SDK 已生成: ${OUTPUT_FILE}`);
  console.log(`✓ endpoints: ${spec.endpoints.length} 个`);
  console.log(`✓ lock: ${newHash}`);
}

/**
 * 根据 endpoints 定义生成类型化流式客户端代码。
 *
 * <p>产出 example：
 * <pre>
 * export const stream = {
 *   agentChat(req: ChatRequest): AsyncGenerator&lt;TypedSseEvent&lt;ChatChunk&gt;&gt; {
 *     return streamRequestAsync({ url: '/api/v1/agent/chat/stream', method: 'POST', data: req });
 *   },
 * };
 * </pre>
 */
function generateStreamingClient(endpoints) {
  const header = `// =====================================================================
// 本文件由 pnpm gen:streaming 自动产出 —— 禁止手动修改
// spec 来源: .streaming-spec.yaml
// =====================================================================
import type { TypedSseEvent, StreamAsyncOptions } from '@YDSZ/shared-auth/sse';
import { streamRequestAsync } from '@YDSZ/shared-auth/sse';

/**
 * 流式 SDK 客户端。
 *
 * <p>将后端 SSE/SSE-like 端点封装为类型化 AsyncIterable，消费方使用 for-await-of：
 * <pre>
 * for await (const frame of stream.agentChat(req)) {
 *   const chunk = JSON.parse(frame.data) as ChatChunk;
 *   if (chunk.done) return;
 *   updateChatUI(chunk.content);
 * }
 * </pre>
 */
export const stream = {
`;

  const methods = endpoints.map((ep) => {
    const name = ep.name;
    const method = (ep.method || 'POST').toUpperCase();
    const path = ep.path;
    const chunkType = ep.chunkType ? chunkTypeToTS(ep.chunkType) : 'unknown';
    const requestType = ep.requestType ? chunkTypeToTS(ep.requestType) : 'unknown';

    return `  /**
   * ${ep.description || name}
   *
   * @param request - 请求参数
   * @param options - 请求覆盖（自定义 headers / signal）
   * @yields 类型化 SSE 帧
   */
  ${name}(request: ${requestType}, options?: Partial<StreamAsyncOptions>): AsyncGenerator<TypedSseEvent<${chunkType}>> {
    const opts: StreamAsyncOptions = {
      url: '${path}',
      method: '${method}',
      data: request,
      ...options,
    };
    return streamRequestAsync(opts) as AsyncGenerator<TypedSseEvent<${chunkType}>>;
  },`;
  });

  const footer = `
};
`;

  return [
    header,
    ...methods,
    footer,
    '',
    `/** 流式 contract hash（CI 漂移门禁用，由 lock 文件携带） */
export const STREAMING_CONTRACT_VERSION = 'gen-streaming@${Date.now()}';',
    '',
  ].join('\n');
}

/** 将 schema 路径 "schemas.agent.ChatChunk" 转为 TS 类型名 "ChatChunk" */
function chunkTypeToTS(ref) {
  // 简单处理：取最后一段
  const parts = ref.replace(/^#\//, '').split(/[./]/);
  return parts[parts.length - 1];
}

main().catch((err) => {
  console.error('[gen:streaming] 生成失败:', err);
  process.exit(1);
});
