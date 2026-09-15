/**
 * 规则包管理扩展 API 封装
 *
 * <p>覆盖后端 {@code RulePackController} 中 {@code rulePack.ts} 未生成的端点
 * （质量评分）。 {@code stressTest} 已存在于 auto-generated 文件，不在此重复。
 * <p>路径规范: /api/literule/**（kebab-case），成功码统一为 code === 'A00000'。
 *
 * @path apps\literule-web\src\api\rulePackExtend.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';

/**
 * scorePack: POST /api/literule/rules/packs/{id}/score
 *
 * <p>返回 unknown 的理由（云顶编码规范 §3.1 特殊场景豁免）：
 * 后端方法声明为 {@code YdszResponse}，响应结构未固定为具名 VO，
 * 无法在生成期推导出稳定字段，故不使用 any，退守为 unknown。
 */
export function scorePack({ id }: {
    id: string;
}): Promise<unknown> {
  return requestClient.post<unknown>(`/api/literule/rules/packs/${id}/score`);
}
