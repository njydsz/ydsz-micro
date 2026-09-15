/**
 * CEP 页面服务层聚合
 * <p>聚合 {@code cep.ts}（auto-generated）与 {@code cepExtend.ts}（手动补齐）的 API 函数，
 * 为 CEP 页面提供统一导入入口。
 *
 * @path apps\literule-web\src\views\cep\cep.service.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export {
  feedEvent,
  feedEvents,
  listPatterns,
  recentHits,
  registerPattern,
  stats,
  unregisterPattern,
} from '#/api/cep';

export {
  disablePattern,
  enablePattern,
  getPattern,
  getPatternHits,
  getPatternStatistics,
  testPattern,
} from '#/api/cepExtend';
