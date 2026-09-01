/**
 * @ydsz/mock-service — 类型定义
 *
 * <p>Mock 数据工厂与处理器生成的公共类型。
 *
 * @path comm/effects/mock-service/src/types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/**
 * Mock 工厂选项
 */
export interface MockFactoryOptions {
  /**
   * 列表生成数量（默认 10）
   */
  listSize?: number;

  /**
   * 随机种子（固定种子保证可重复）
   */
  seed?: number;
}

/**
 * 简化的 Schema 描述（OpenAPI Schema Object 子集）
 */
export type MockSchema = Record<string, unknown>;

/**
 * OpenAPI 3.x 规范子集（仅供 Mock 生成使用的最小结构）。
 *
 * 仅要求存在 paths 字段；paths 内各节点使用 unknown 延迟到
 * handlers.ts 内部再解析——避免对 OpenAPI Schema 做过于严格的
 * 类型声明，保持了从 JSON 导入的灵活性。
 */
export interface OpenAPISpec {
  /** API 路径集合，键为路径模板（如 /api/v1/user/{id}） */
  paths?: Record<string, unknown>;
  /** 组件定义（$ref 引用目标，可选） */
  components?: Record<string, unknown>;
  /** OpenAPI 版本号 */
  openapi?: string;
  /** 元信息 */
  info?: Record<string, unknown>;
}