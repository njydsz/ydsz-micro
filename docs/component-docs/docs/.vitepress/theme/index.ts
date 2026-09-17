import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';

// 注入 Tailwind CSS（复用 ydsz-ui 共享的 tailwind 配置）
import './styles.css';

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app, router, siteData }) {
    // 可在此处注册全局组件或自定义指令
  },
};

export default theme;
