/**
 * 用户偏好 API —— 后端持久化用户偏好配置
 *
 * <p>用户级偏好（默认首页/语言）使用 backend API + localStorage 缓存。
 * 后端契约：{@code UserPreferenceController} 映射于 {@code /api/v1/user/preferences}。
 *
 * @path apps\system-web\src\api\core\preference.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';

/** 用户偏好 DTO */
export interface UserPreferenceDTO {
  /** 默认首页路径 */
  defaultIndex?: string;
  /** 语言设置 */
  language?: string;
  /** 主题模式 */
  theme?: string;
  /** 主题色 */
  themeColor?: string;
  /** 菜单布局 */
  menuLayout?: string;
  /** 菜单手风琴 */
  accordionMenu?: boolean;
  /** 表格密度 */
  tableSize?: string;
  /** 字体大小 */
  fontSize?: string;
}

/**
 * 获取当前用户偏好配置（从后端加载，合并 localStorage 缓存）。
 *
 * @returns 用户偏好配置
 */
export async function getUserPreferenceApi(): Promise<UserPreferenceDTO> {
  return requestClient.get<UserPreferenceDTO>('/api/v1/user/preferences');
}

/**
 * 保存当前用户偏好配置到后端。
 *
 * @param preference - 偏好配置
 * @returns 保存结果
 */
export async function saveUserPreferenceApi(
  preference: UserPreferenceDTO,
): Promise<void> {
  await requestClient.put<void>('/api/v1/user/preferences', preference);
}

/**
 * 重置当前用户偏好为默认值。
 *
 * @returns 重置后的默认偏好
 */
export async function resetUserPreferenceApi(): Promise<UserPreferenceDTO> {
  return requestClient.post<UserPreferenceDTO>(
    '/api/v1/user/preferences/reset',
  );
}
