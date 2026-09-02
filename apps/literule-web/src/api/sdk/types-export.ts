/**
 * literule 命名类型别名导出
 *
 * <p>由 unified-contract.mjs 自动生成，请勿手动修改。
 * <p>提供 components.schemas 中定义的命名类型别名，消除 models.ts 手动类型定义。
 *
 * @auto-generated
 * @since 4.0.0
 */

import type { components } from './schema';

// 导出命名类型别名，便于业务代码直接使用
export type CEPPattern = components['schemas']['CEPPattern'];
export type ChainEdgeDTO = components['schemas']['ChainEdgeDTO'];
export type ChainNodeDTO = components['schemas']['ChainNodeDTO'];
export type DecisionTableDTO = components['schemas']['DecisionTableDTO'];
export type ExpressionValidateDTO = components['schemas']['ExpressionValidateDTO'];
export type PageQuery = components['schemas']['PageQuery'];
export type RuleABPolicyDTO = components['schemas']['RuleABPolicyDTO'];
export type RuleABTestDTO = components['schemas']['RuleABTestDTO'];
export type RuleApproveDTO = components['schemas']['RuleApproveDTO'];
export type RuleBatchCategoryDTO = components['schemas']['RuleBatchCategoryDTO'];
export type RuleBatchPriorityDTO = components['schemas']['RuleBatchPriorityDTO'];
export type RuleBatchToggleDTO = components['schemas']['RuleBatchToggleDTO'];
export type RuleChainGraph = components['schemas']['RuleChainGraph'];
export type RuleDefinitionDTO = components['schemas']['RuleDefinitionDTO'];
export type RuleDelegateDTO = components['schemas']['RuleDelegateDTO'];
export type RuleDependencyAddDTO = components['schemas']['RuleDependencyAddDTO'];
export type RuleImportDTO = components['schemas']['RuleImportDTO'];
export type RulePackVO = components['schemas']['RulePackVO'];
export type RuleRejectDTO = components['schemas']['RuleRejectDTO'];
export type RuleStatusChangeDTO = components['schemas']['RuleStatusChangeDTO'];
export type RuleSubmitReviewDTO = components['schemas']['RuleSubmitReviewDTO'];
export type VariableDefinition = components['schemas']['VariableDefinition'];

// 常用响应类型别名
export type { PageResponse, YdszResponse } from '../models';
