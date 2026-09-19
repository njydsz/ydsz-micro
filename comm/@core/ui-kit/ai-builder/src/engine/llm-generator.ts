/**
 * LLM 驱动页面骨架生成器 — AI Builder 的智能升级路径。
 *
 * <p>保留 keyword-matcher 作为默认路径（零依赖、零成本），
 * 新增 LLM 选项（通过 fetch 调用 OpenAI 兼容接口），
 * 当 LLM 调用失败时自动降级回 keyword-matcher 路径，确保可用性。
 *
 * <p>架构：
 * ```
 *   User NL desc ──► llmGenerate() ──┬─ LLM 成功 → GeneratedPage
 *       (fallback)                   └─ LLM 失败 → keyword-matcher 路径
 * ```
 *
 * <p>环境变量（ydsz-agent 服务中配置）：
 * <ul>
 *   <li>YDSZ_LLM_API_URL — OpenAI 兼容 API 端点（如 https://api.openai.com/v1）</li>
 *   <li>YDSZ_LLM_API_KEY — API Key</li>
 *   <li>YDSZ_LLM_MODEL — 模型名（默认 gpt-4o-mini）</li>
 * </ul>
 *
 * @path comm\@core\ui-kit/ai-builder/src/engine/llm-generator.ts
 * @author ydsz-ai
 * @since 26.09.19
 */

import type {
  FieldSuggestion,
  GeneratedPage,
  PageIntent,
} from '../types';

import { generatePage } from './page-generator';
import { createLogger } from '@ydsz-core/shared/utils';

const logger = createLogger('AiBuilder:LLM');

/** LLM 调用选项 */
export interface LlmGenerationOptions {
  /** API 端点，默认从环境变量 YDSZ_LLM_API_URL 读取 */
  apiUrl?: string;
  /** API Key，默认从环境变量 YDSZ_LLM_API_KEY 读取 */
  apiKey?: string;
  /** 模型名，默认 gpt-4o-mini */
  model?: string;
  /** 超时（ms），默认 30000 */
  timeout?: number;
}

/** LLM 返回的字段 schema */
interface LlmFieldPayload {
  name: string;
  label: string;
  fieldType: FieldSuggestion['fieldType'];
  isRequired?: boolean;
  options?: string[];
  placeholder?: string;
  validation?: { pattern?: string; message?: string };
}

/** LLM 返回结构 */
interface LlmResponse {
  title: string;
  pageType: PageIntent['pageType'];
  description: string;
  fields: LlmFieldPayload[];
}

/**
 * 构建给 LLM 的 prompt。
 *
 * @param intent - 用户自然语言意图
 * @return 发送给 LLM 的 system + user prompt
 */
function buildPrompt(intent: PageIntent): { system: string; user: string } {
  const system = `你是一个企业级中后台 UI 生成助手。
根据用户的自然语言描述，生成页面骨架 JSON。
只输出 JSON，不输出任何解释文字。
字段类型仅允许: string | text | number | boolean | enum | email | phone | date | select。
enum/select 类型必须提供 options 数组。
输出格式：
{
  "title": "页面标题",
  "pageType": "form" | "table" | "dashboard",
  "description": "一句话描述",
  "fields": [
    { "name": "字段名", "label": "标签", "fieldType": "string", "isRequired": true, "placeholder": "提示", "options": [] }
  ]
}`;

  const user = `请为以下需求生成页面骨架 JSON：
描述：${intent.description}
${intent.pageType ? `页面类型提示：${intent.pageType}` : ''}
${intent.fields?.length ? `用户已声明字段：${intent.fields.join(', ')}` : ''}`;

  return { system, user };
}

/**
 * 调用 LLM API（OpenAI Chat Completions 兼容）。
 *
 * @param intent - 用户意图
 * @param options - LLM 选项
 * @return LLM 解析结果，失败时返回 null（由调用方降级到 keyword-matcher）
 */
async function callLlm(
  intent: PageIntent,
  options: LlmGenerationOptions = {},
): Promise<LlmResponse | null> {
  const apiUrl = options.apiUrl ?? process.env.YDSZ_LLM_API_URL ?? '';
  const apiKey = options.apiKey ?? process.env.YDSZ_LLM_API_KEY ?? '';
  const model = options.model ?? process.env.YDSZ_LLM_MODEL ?? 'gpt-4o-mini';
  const timeout = options.timeout ?? 30_000;

  if (!apiUrl || !apiKey) {
    logger.debug('LLM API 未配置（缺少 YDSZ_LLM_API_URL 或 YDSZ_LLM_API_KEY），降级到 keyword-matcher');
    return null;
  }

  const { system, user } = buildPrompt(intent);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      logger.warn(`LLM API 返回 ${response.status}，降级到 keyword-matcher`);
      return null;
    }

    const data: { choices: Array<{ message: { content: string } }> } = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      logger.warn('LLM 返回空内容，降级');
      return null;
    }

    return JSON.parse(content) as LlmResponse;
  } catch (error) {
    logger.warn('LLM 调用异常，降级到 keyword-matcher', error);
    return null;
  }
}

/**
 * 统一入口：LLM 优先，失败降级到 keyword-matcher。
 *
 * @param intent - 用户自然语言意图
 * @param options - LLM 配置选项
 * @return GeneratedPage
 */
export async function llmGenerate(
  intent: PageIntent,
  options?: LlmGenerationOptions,
): Promise<GeneratedPage> {
  // 1. 尝试 LLM 路径
  const llmResult = await callLlm(intent, options);
  if (llmResult) {
    logger.info('LLM 生成成功');
    return {
      title: llmResult.title,
      description: llmResult.description,
      pageType: llmResult.pageType,
      fields: llmResult.fields.map((f) => ({
        ...f,
        sortOrder: DEFAULT_SORT[f.name] ?? 50,
      })),
    };
  }

  // 2. 降级到零依赖 keyword-matcher 路径
  logger.info('keyword-matcher 路径');
  return generatePage(intent);
}

/** 默认排序值（与 keyword-matcher 保持一致） */
const DEFAULT_SORT: Record<string, number> = {
  name: 10,
  code: 20,
  status: 30,
  type: 35,
  sort: 90,
  remark: 100,
  description: 110,
};
