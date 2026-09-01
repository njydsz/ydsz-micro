/**
 * 认证页（登录 / 注册 / 找回密码）的工具栏按钮类型。
 *
 * 用联合类型而非 string 约束，是为了让工具栏的开关配置在编译期就能发现拼写错误；
 * 运行时也据此按顺序渲染对应按钮，未列出的类型不会出现。
 *
 * @path comm\effects\layouts\src\authentication\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */
/**
 * 工具栏按钮类型：
 * - `color` —— 主题色切换
 * - `language` —— 语言切换
 * - `layout` —— 布局模式切换
 * - `theme` —— 明暗主题切换
 */
export type ToolbarType = 'color' | 'language' | 'layout' | 'theme';
