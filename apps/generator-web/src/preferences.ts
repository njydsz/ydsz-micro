import { defineOverridesPreferences } from '@ydsz/preferences';

/**
 * 代码生成器子应用偏好覆盖。
 *
 * 子应用作为内容区嵌入基座，隐藏侧边栏，固定主题。
 *
 * @path apps/generator-web/src/preferences.ts
 * @since 1.0.0
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
