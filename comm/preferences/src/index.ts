/**
 * 应用偏好配置
 *
 * @path comm\preferences\src\index.ts
 * @author remi-team
 * @since 1.0.0
 */
import type { Preferences } from '@remi-core/preferences';
import type { DeepPartial } from '@remi-core/typings';

/**
 * 如果你想所有的app都使用相同的默认偏好设置，你可以在这里定义
 * 而不是去修改 @remi-core/preferences 中的默认偏好设置
 * @param preferences
 * @returns
 */

function defineOverridesPreferences(preferences: DeepPartial<Preferences>) {
  return preferences;
}

export { defineOverridesPreferences };

export * from '@remi-core/preferences';
