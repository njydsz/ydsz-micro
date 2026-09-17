/**
 * @ydsz-core/editor-ui 包出口
 *
 * <p>提供 TipTap 富文本编辑器组件、工具栏、扩展集：
 * <ul>
 *   <li>{@link YdTipTapEditor} — 核心编辑器组件</li>
 *   <li>{@link YdTipTapToolbar} — 工具栏组件</li>
 *   <li>{@link getYdDefaultExtensions} — 获取默认扩展集</li>
 *   <li>{@link createMentionExtension} — 创建 @mention 提及扩展</li>
 *   <li>{@link createMentionSuggestion} — 创建提及建议配置</li>
 * </ul>
 *
 * @path comm\@core/ui-kit/editor-ui/src/index.ts
 * @author ydsz-team
 * @since 5.6.0
 */
export { YdTipTapEditor } from './YdTipTapEditor.vue';
export { YdTipTapToolbar } from './toolbar';
export { getYdDefaultExtensions } from './extensions';
export { createMentionExtension, createMentionSuggestion, mentionPluginKey } from './extensions/mention';
export type { MentionItem, MentionOptions } from './extensions/mention';
