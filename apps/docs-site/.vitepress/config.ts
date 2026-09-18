import { defineConfig } from 'vitepress';
import { generateNav } from './config/nav';
import { generateSidebar } from './config/sidebar';

const nav = generateNav();
const sidebar = generateSidebar();

export default defineConfig({
  title: 'YDSZ 文档站',
  description:
    '云顶智算（YDSZ）平台文档中心 — 八大引擎架构总览 · API 参考 · 编码规范 · 可视化拓扑',
  lang: 'zh-CN',
  cleanUrls: true,
  scrollOffset: 96,
  head: [
    ['meta', { name: 'theme-color', content: '#1a6dff' }],
    ['meta', { name: 'description', content: 'YDSZ 云平台八大引擎文档与 API 参考中心' }],
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
  ],
  markdown: {
    lineNumbers: true,
    container: {
      tipLabel: '提示',
      warningLabel: '注意',
      dangerLabel: '危险',
      infoLabel: '信息',
      detailsLabel: '详情',
    },
  },
  vite: {
    server: {
      hmr: {
        overlay: false,
      },
    },
  },
  themeConfig: {
    logo: {
      light: '/logo-light.svg',
      dark: '/logo-dark.svg',
      alt: 'YDSZ Logo',
    },
    siteTitle: 'YDSZ 文档',
    nav,
    sidebar,
    outline: {
      level: [2, 3],
      label: '页面导航',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ydsz-cloud' },
    ],
    footer: {
      message: 'YDSZ Cloud Platform Documentation Site',
      copyright:
        'Copyright © 2024-present YDSZ · 基于 VitePress 构建',
    },
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索' },
          modal: {
            resetButtonTitle: '清空查询',
            backButtonTitle: '返回',
            noResultsText: '没有找到结果',
            footer: { selectText: '选择', navigateText: '浏览', closeText: '关闭' },
          },
        },
      },
    },
    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },
  },
});
