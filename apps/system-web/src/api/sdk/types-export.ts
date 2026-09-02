/**
 * system 命名类型别名导出
 *
 * <p>由 unified-contract.mjs 自动生成，请勿手动修改。
 * <p>提供 components.schemas 中定义的命名类型别名，消除 models.ts 手动类型定义。
 *
 * @auto-generated
 * @since 4.0.0
 */

import type { components } from './schema';

// 导出命名类型别名，便于业务代码直接使用
export type AppInfoDTO = components['schemas']['AppInfoDTO'];
export type AppInfoPageQuery = components['schemas']['AppInfoPageQuery'];
export type AppValidateRequest = components['schemas']['AppValidateRequest'];
export type ConfigBatchDTO = components['schemas']['ConfigBatchDTO'];
export type ConfigDTO = components['schemas']['ConfigDTO'];
export type ConfigGetRequest = components['schemas']['ConfigGetRequest'];
export type ConfigPageQuery = components['schemas']['ConfigPageQuery'];
export type ConfigVO = components['schemas']['ConfigVO'];
export type DictItemBatchDTO = components['schemas']['DictItemBatchDTO'];
export type DictItemDTO = components['schemas']['DictItemDTO'];
export type DictItemGetRequest = components['schemas']['DictItemGetRequest'];
export type DictItemPageQuery = components['schemas']['DictItemPageQuery'];
export type DictItemVO = components['schemas']['DictItemVO'];
export type DictListRequest = components['schemas']['DictListRequest'];
export type DictPageQuery = components['schemas']['DictPageQuery'];
export type DictTypeDTO = components['schemas']['DictTypeDTO'];
export type EntityVersionPageQuery = components['schemas']['EntityVersionPageQuery'];
export type TenantDTO = components['schemas']['TenantDTO'];
export type TenantPageQuery = components['schemas']['TenantPageQuery'];
export type TenantPlanDTO = components['schemas']['TenantPlanDTO'];
export type TenantPlanMenuDTO = components['schemas']['TenantPlanMenuDTO'];
export type TenantPlanPageQuery = components['schemas']['TenantPlanPageQuery'];
export type VariableDTO = components['schemas']['VariableDTO'];
export type VariablePageQuery = components['schemas']['VariablePageQuery'];

// 常用响应类型别名
export type { PageResponse, YdszResponse } from '../models';
