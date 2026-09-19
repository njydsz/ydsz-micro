/**
 * postcss.config 配置模块
 *
 * @path conf\tailwind-config\src\postcss.config.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import config from '.';

/**
 * PostCSS 插件集合（Tailwind 集成版）。
 *
 * 包含 Tailwind 本体、nesting、autoPrefixer、ant 前缀兼容；
 * 生产构建时追加 cssnano 压缩。
 *
 * <p>v5.0.0: EP 退场后移除 'el' 前缀，仅保留 ant-design-vue 兼容。
 *
 * @default —— PostCSS 配置对象（plugins map）
 */
export default {
  plugins: {
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {}),
    // Specifying the config is not necessary in most cases, but it is included
    autoprefixer: {},
    // 修复 ant-design-vue 的样式和 tailwindcss 冲突问题（EP 退场后 'el' 前缀已移除）
    'postcss-antd-fixes': { prefixes: ['ant'] },
    'postcss-import': {},
    'postcss-preset-env': {},
    tailwindcss: { config },
    'tailwindcss/nesting': {},
  },
};
