/**
 * preferences 模块
 *
 * @path apps\system-web\src\preferences.ts
 * @author remi-team
 * @since 1.0.0
 */
import { defineOverridesPreferences } from '@remi/preferences';

/**
 * 系统管理子应用偏好覆盖配置。
 *
 * 在 @remi/preferences 默认值基础上按 system-web 诉求定制：
 * 应用名取自构建期标题、默认首页指向 /remi-sys、隐藏侧边栏，并固定 deep-blue 主题。
 */
export const overridesPreferences = defineOverridesPreferences({
  app: {
    name: import.meta.env.VITE_APP_TITLE,
    defaultHomePath: '/remi-sys',
  },
  sidebar: {
    hidden: true,
  },
  theme: {
    builtinType: 'deep-blue',
    colorPrimary: 'hsl(211 98% 52%)',
    mode: 'light',
    radius: '0.5',
    semiDarkHeader: false,
    semiDarkSidebar: false,
  },
});
