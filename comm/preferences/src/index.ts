/**
 * 应用偏好配置重写入口 — 提供跨应用统一的偏好默认值覆写函数。
 *
 * @path comm\preferences\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Preferences } from '@YDSZ-core/preferences';
import type { DeepPartial } from '@YDSZ-core/typings';

/**
 * 定义应用级偏好配置覆写，返回修改后的偏好对象。
 *
 * @remarks
 * 所有 app 需要相同默认偏好时在此统一定义，避免修改 @YDSZ-core/preferences 内部默认值。
 *
 * @param preferences - 需要覆写的偏好配置（DeepPartial 允许部分字段）
 * @returns 合并后的偏好配置对象
 */
function defineOverridesPreferences(
  preferences: DeepPartial<Preferences>,
): DeepPartial<Preferences> {
  return preferences;
}

export { defineOverridesPreferences };

export * from '@YDSZ-core/preferences';
