/**
 * @ydsz/pact-test — Pact 交互创建工具
 *
 * <p>提供简洁的 API 创建 Pact 交互定义，用于前端消费者契约测试。
 *
 * @path comm/effects/pact-test/src/pact-setup.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { PactInteractionOptions, PactInteractionRecord } from './types';

/**
 * Pact 交互构建器
 *
 * <p>链式 API 构建 Pact 交互定义。
 *
 * @example
 * ```ts
 * const interaction = createPactInteraction('获取配置列表')
 *   .withRequest('GET', '/api/v1/config/page')
 *   .withResponse(200, { code: 'A00000', data: { list: [], total: 0 } })
 *   .build();
 * ```
 */
export class PactInteractionBuilder {
  private interaction: Partial<PactInteractionRecord> = {};

  constructor(private description: string) {
    this.interaction.description = description;
  }

  /**
   * 设置请求
   */
  withRequest(
    method: string,
    path: string,
    options: { headers?: Record<string, string>; body?: unknown } = {},
  ): this {
    this.interaction.request = {
      method,
      path,
      ...options,
    };
    return this;
  }

  /**
   * 设置期望响应
   */
  withResponse(
    status: number,
    body?: unknown,
    headers?: Record<string, string>,
  ): this {
    this.interaction.response = {
      status,
      body,
      headers,
    };
    return this;
  }

  /**
   * 设置 Provider 状态
   */
  withProviderState(state: string): this {
    this.interaction.providerState = state;
    return this;
  }

  /**
   * 构建交互记录
   */
  build(): PactInteractionRecord {
    if (!this.interaction.request || !this.interaction.response) {
      throw new Error('Pact 交互必须设置 request 和 response');
    }
    return this.interaction as PactInteractionRecord;
  }
}

/**
 * 创建 Pact 交互构建器
 * @param description - 交互描述
 * @returns PactInteractionBuilder 实例
 */
export function createPactInteraction(description: string): PactInteractionBuilder {
  return new PactInteractionBuilder(description);
}

/**
 * 从选项快速创建 Pact 交互
 * @param options - 交互配置
 * @returns PactInteractionRecord
 */
export function pactProvider(options: PactInteractionOptions): PactInteractionRecord {
  return createPactInteraction(options.description)
    .withRequest(options.method, options.path, {
      headers: options.headers,
      body: options.body,
    })
    .withResponse(options.status, options.responseBody, options.responseHeaders)
    .build();
}

/**
 * Pact 文件生成器
 *
 * <p>收集多个交互并生成 Pact JSON 文件。
 */
export class PactFileBuilder {
  private interactions: PactInteractionRecord[] = [];

  constructor(
    private consumerName: string,
    private providerName: string,
  ) {}

  /**
   * 添加交互
   */
  addInteraction(interaction: PactInteractionRecord): this {
    this.interactions.push(interaction);
    return this;
  }

  /**
   * 批量添加交互
   */
  addInteractions(interactions: PactInteractionRecord[]): this {
    this.interactions.push(...interactions);
    return this;
  }

  /**
   * 构建 Pact 文件对象
   */
  build(): PactFile {
    return {
      consumer: { name: this.consumerName },
      provider: { name: this.providerName },
      interactions: this.interactions,
      metadata: {
        pactSpecification: { version: '3.0.0' },
      },
    };
  }

  /**
   * 生成 JSON 字符串
   */
  toJson(indent = 2): string {
    return JSON.stringify(this.build(), null, indent);
  }
}

/**
 * 创建 Pact 文件构建器
 * @param consumerName - 消费者名称（前端应用名）
 * @param providerName - Provider 名称（后端服务名）
 * @returns PactFileBuilder 实例
 */
export function createPactFile(
  consumerName: string,
  providerName: string,
): PactFileBuilder {
  return new PactFileBuilder(consumerName, providerName);
}

// 导入类型（用于导出）
import type { PactFile } from './types';
