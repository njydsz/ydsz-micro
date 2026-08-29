/**
 * @ydsz/pact-test — Pact 消费者驱动契约测试
 *
 * <p>提供前端消费者契约测试能力，确保前后端契约一致性。
 *
 * <p>使用流程:
 * <ol>
 *   <li>前端编写契约测试，生成 Pact 文件（JSON）</li>
 *   <li>Pact 文件上传至 Pact Broker</li>
 *   <li>后端 CI 拉取 Pact 文件并验证履行</li>
 * </ol>
 *
 * @path comm/effects/pact-test/src/index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

export { createPactInteraction, pactProvider } from './pact-setup';
export type { PactInteractionOptions, PactProviderConfig } from './types';
