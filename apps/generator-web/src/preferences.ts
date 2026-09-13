/**
 * 代码生成器子应用偏好覆盖配置。
 *
 * <p>按 @ydsz/preferences 定义覆盖子应用默认偏好；内容区嵌入基座场景下隐藏侧边栏。
 *
 * @path apps/generator-web/src/preferences.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineOverridesPreferences } from '@ydsz/preferences';

/**
 * 子应用默认首页 `defaultHomePath: '/ydsz-gen'`，固定侧边栏隐藏 + 固定浅蓝主题。
 */
export const overridesPreferences = defineOverridesPreferences({
  app: {
    defaultHomePath: '/ydsz-gen',
    name: '代码生成器',
  },
  theme: {
    mode: 'light',
    builtinType: 'deep-blue',
    colorPrimary: 'hsl(211 98% 52%)',
  },
  sidebar: {
    hidden: true,
  },
});
