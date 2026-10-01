/**
 * 字体子集化插件配置
 *
 * 使用 vite-plugin-font 在构建时自动提取字体子集。
 * 仅保留实际使用的字符，大幅减少字体文件体积。
 *
 * @path conf/vite-config/src/plugins/font.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { PluginOption } from 'vite';

/**
 * 创建字体子集化插件
 *
 * 仅在构建模式下生效，自动分析项目中使用的字符，
 * 生成仅包含必要字符的字体子集文件。
 *
 * 对于中文字体（通常 5-10MB），子集化后可降至 100-500KB。
 *
 * @returns Vite 插件配置
 */
async function viteFontPlugin(): Promise<PluginOption> {
  // 动态导入，避免开发模式加载
  const viteFont = await import('vite-plugin-font');

  // vite-plugin-font 是 unplugin 架构，其 default export 已经是一个
  // Vite 兼容的插件对象（包含 name/enforce/resolveId/load/transform hooks），
  // 不需要再次调用，可直接返回给 Vite 使用。
  return viteFont.default as unknown as PluginOption;
}

export { viteFontPlugin };
