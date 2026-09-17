import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'YDSZ-UI',
  description: 'YDSZ Micro 前端微应用组件库 — 基于 Vue 3 + Radix Vue + Tailwind CSS 的现代化 UI 组件体系',
  lang: 'zh-CN',
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.svg' }],
  ],

  markdown: {
    lineNumbers: true,
  },

  vue: {
    template: {
      compilerOptions: {
        whitespace: 'condense',
      },
    },
  },

  themeConfig: {
    // 品牌色：云顶蓝
    nav: [
      { text: '首页', link: '/' },
      { text: '组件总览', link: '/components/components' },
      {
        text: '基础组件',
        items: [
          { text: 'Button', link: '/components/button' },
          { text: 'Input', link: '/components/input' },
          { text: 'Select', link: '/components/select' },
          { text: 'Table', link: '/components/table' },
        ],
      },
    ],

    sidebar: {
      '/components/': [
        {
          text: '组件总览',
          items: [
            { text: '全部组件', link: '/components/components' },
          ],
        },
        {
          text: '基础组件',
          items: [
            { text: 'Button 按钮', link: '/components/button' },
            { text: 'Input 输入框', link: '/components/input' },
            { text: 'Select 选择器', link: '/components/select' },
            { text: 'Table 表格', link: '/components/table' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ydsz-micro' },
    ],

    footer: {
      message: 'YDSZ Micro 前端团队出品',
      copyright: 'Copyright © 2024 YDSZ Micro',
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索' },
          modal: {
            noResultsText: '没有找到结果',
            resetButtonTitle: '重置搜索',
            footer: { selectText: '选择', navigateText: '跳转' },
          },
        },
      },
    },

    outline: {
      label: '页面导航',
      level: [2, 3],
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    lastUpdated: {
      text: '最后更新于',
    },

    editLink: {
      pattern: 'https://github.com/ydsz-micro/ydsz-micro/edit/main/docs/component-docs/docs/:path',
      text: '在 GitHub 上编辑此页',
    },
  },

  // 自定义 CSS 变量：引用 YDSZ 品牌色
  cssVars: {
    // 主色：云顶蓝（品牌色）
    '--vp-c-brand-1': '#1a6fb5',
    '--vp-c-brand-2': '#2a8fcf',
    '--vp-c-brand-3': '#0d5a99',
    '--vp-c-brand-soft': 'rgba(26, 111, 181, 0.14)',
    // 背景色
    '--vp-c-bg': '#ffffff',
    '--vp-c-bg-alt': '#f6f8fa',
    '--vp-c-bg-elv': '#ffffff',
    // 边框
    '--vp-c-divider': '#e2e8f0',
  },
});
