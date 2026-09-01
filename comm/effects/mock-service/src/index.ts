/**
 * @ydsz/mock-service — MSW Mock 服务
 *
 * <p>基于 OpenAPI spec 自动生成 MSW 处理器 + 手工 Mock 工厂。
 *
 * @path comm/effects/mock-service/src/index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

export {
  generateMockHandlers,
  createMockHandler,
  createCrudHandlers,
} from './handlers';
export type { HandlerGeneratorOptions } from './handlers';
export { createMockDataFactory } from './factory';
export type { MockDataFactory } from './factory';
export type { MockFactoryOptions, MockSchema } from './types';

export {
  setupMockServer,
  closeMockWorker,
} from './server';
