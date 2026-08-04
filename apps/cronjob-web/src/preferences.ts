/**
 * 任务调度子应用偏好配置
 *
 * @path apps\cronjob-web\src\preferences.ts
 * @author remi-team
 * @since 1.0.0
 */
import { defineOverridesPreferences } from '@remi/preferences';

/**
 * 任务调度子应用偏好覆盖配置。
 *
 * 在 @remi/preferences 默认值基础上按 cronjob-web 诉求定制：
 * 应用名取自构建期标题、默认首页指向 /remi-cron、隐藏侧边栏，并固定 deep-blue 主题。
 */
export const overridesPreferences = defineOverridesPreferences({
  app: {
    name: import.meta.env.VITE_APP_TITLE,
    defaultHomePath: '/remi-cron',
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
