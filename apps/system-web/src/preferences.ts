/**
 * preferences 模块
 *
 * <p>系统管理子应用偏好覆盖配置。
 * <p>在 @ydsz/preferences 默认值基础上按 system-web 诉求定制：
 * 应用名取自构建期标题、默认首页指向 /YDSZ-sys、隐藏侧边栏，并固定 deep-blue 主题。
 *
 * <p>个性化偏好（主题/布局/表格/字体等）通过 localStorage 即时生效 + 后端持久化；
 * 具体偏好项由 {@code @/composables/usePreferences} 统一管理。
 *
 * @path apps\system-web\src\preferences.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineOverridesPreferences } from '@ydsz/preferences';

/**
 * 系统管理子应用偏好覆盖。
 *
 * <p>覆盖字段说明：
 * <ul>
 *   <li>{@code app.name} — 取自构建期 {@code VITE_APP_TITLE}</li>
 *   <li>{@code app.defaultHomePath} — 登录后默认进入 /YDSZ-sys</li>
 *   <li>{@code app.language} — 初始语言（zh-CN / en-US）</li>
 *   <li>{@code app.menuLayout} — 菜单位置（side | top | mix）</li>
 *   <li>{@code app.theme} — 主题模式（light | dark | auto）</li>
 *   <li>{@code theme.mode} — 主题模式（auto 跟随系统）</li>
 *   <li>{@code sidebar.hidden} — 子应用独立运行时隐藏侧边栏</li>
 * </ul>
 */
export const overridesPreferences = defineOverridesPreferences({
  app: {
    defaultHomePath: '/YDSZ-sys',
    language: 'zh-CN',
    menuLayout: 'side',
    name: import.meta.env.VITE_APP_TITLE,
    theme: 'auto',
  },
  sidebar: {
    hidden: true,
  },
  theme: {
    builtinType: 'deep-blue',
    colorPrimary: 'hsl(211 98% 52%)',
    mode: 'auto',
    radius: '0.5',
    semiDarkHeader: false,
    semiDarkSidebar: false,
  },
});
