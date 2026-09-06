/**
 * TemplateController API 封装。
 *
 * <p>对应后端 {@code TemplateController}，路径前缀 /api/v1/generator。
 * <p>提供模板分组管理与模板 CRUD 功能。
 *
 * @author ydsz-team
 * @path apps/generator-web/src/api/template.ts
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';
import type { GenTemplate, GenTemplateGroup } from './models';

// ══════════════ 分组管理 ══════════════

/**
 * 查询全部分组。
 *
 * @returns 分组列表
 */
export function listGroups(): Promise<GenTemplateGroup[]> {
  return requestClient.get<GenTemplateGroup[]>(`/api/v1/generator/groups`);
}

/**
 * 获取当前激活分组。
 *
 * @returns 激活分组
 */
export function getActiveGroup(): Promise<GenTemplateGroup> {
  return requestClient.get<GenTemplateGroup>(`/api/v1/generator/groups/active`);
}

/**
 * 激活指定分组。
 *
 * @param id 分组 ID
 */
export function activateGroup({ id }: { id: number }): Promise<void> {
  return requestClient.post<void>(`/api/v1/generator/groups/${id}/activate`);
}

/**
 * 创建分组。
 *
 * @param group 分组实体
 * @returns 持久化后实体
 */
export function createGroup(group: GenTemplateGroup): Promise<GenTemplateGroup> {
  return requestClient.post<GenTemplateGroup>(`/api/v1/generator/groups`, group);
}

/**
 * 删除分组。
 *
 * @param id 分组 ID
 */
export function deleteGroup({ id }: { id: number }): Promise<void> {
  return requestClient.delete<void>(`/api/v1/generator/groups/${id}`);
}

// ══════════════ 模板管理 ══════════════

/**
 * 查询分组全部模板。
 *
 * @param params 包含 groupId
 * @returns 模板列表
 */
export function listTemplates(params: { groupId: number }): Promise<GenTemplate[]> {
  return requestClient.get<GenTemplate[]>(`/api/v1/generator/templates`, { params });
}

/**
 * 查询单个模板。
 *
 * @param id 模板 ID
 * @returns 模板实体
 */
export function getTemplate({ id }: { id: number }): Promise<GenTemplate> {
  return requestClient.get<GenTemplate>(`/api/v1/generator/templates/${id}`);
}

/**
 * 更新模板内容。
 *
 * @param template 模板实体（含 id + content）
 * @returns 更新后实体
 */
export function updateTemplate(template: GenTemplate): Promise<GenTemplate> {
  return requestClient.post<GenTemplate>(`/api/v1/generator/templates/update`, template);
}

/**
 * 搜索模板（按文件名/描述）。
 *
 * @param params 包含 groupId + keyword
 * @returns 匹配结果
 */
export function searchTemplates(params: { groupId: number; keyword: string }): Promise<GenTemplate[]> {
  return requestClient.get<GenTemplate[]>(`/api/v1/generator/templates/search`, { params });
}
