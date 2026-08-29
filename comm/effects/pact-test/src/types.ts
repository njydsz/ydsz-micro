/**
 * @ydsz/pact-test 类型定义
 *
 * @path comm/effects/pact-test/src/types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/**
 * Pact Provider 配置
 */
export interface PactProviderConfig {
  /** Provider 名称（后端服务名） */
  providerName: string;
  /** Provider 基础 URL */
  providerBaseUrl: string;
  /** Pact Broker URL（可选） */
  brokerUrl?: string;
  /** Pact Broker Token（可选） */
  brokerToken?: string;
}

/**
 * Pact 交互配置
 */
export interface PactInteractionOptions {
  /** 交互描述 */
  description: string;
  /** 请求方法 */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** 请求路径 */
  path: string;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 请求体 */
  body?: unknown;
  /** 期望的响应状态码 */
  status: number;
  /** 期望的响应体 */
  responseBody?: unknown;
  /** 期望的响应头 */
  responseHeaders?: Record<string, string>;
}

/**
 * Pact 文件结构
 */
export interface PactFile {
  consumer: { name: string };
  provider: { name: string };
  interactions: PactInteractionRecord[];
  metadata: {
    pactSpecification: { version: string };
  };
}

/**
 * Pact 交互记录
 */
export interface PactInteractionRecord {
  description: string;
  providerState?: string;
  request: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  response: {
    status: number;
    headers?: Record<string, string>;
    body?: unknown;
  };
}
