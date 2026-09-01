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
