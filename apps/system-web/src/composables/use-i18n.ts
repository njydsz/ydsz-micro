/**
 * use-i18n.ts —— 本应用统一的文案翻译入口
 *
 * <p>为什么要有这层：视图与组件只依赖 `#/composables/use-i18n`，不直接依赖 `vue-i18n`，
 * 于是单测可以整体 mock 这个别名（见 views/global-search/index.test.ts），
 * 而不必 mock 第三方包；将来切换翻译实现（命名空间、插值规则）也只需改本文件。
 *
 * @path apps\system-web\src\composables\use-i18n.ts
 * @author ydsz-team
 * @since 1.0.0
 */

export { useI18n } from 'vue-i18n';
