/**
 * YDSZ UI Playground 入口 —— 挂载演示用 Vue 应用。
 *
 * 引入 design-tokens CSS 变量总表（:root 级别 CSS 自定义属性），
 * 以及 YDSZ 组件库全局样式 / 暗色覆盖 / reduced-motion 覆盖，
 * 再注册 ydsz-ui 插件后挂载 App。
 *
 * @path comm\@core\ui-kit\ydsz-ui\playground\main.ts
 * @author ydsz-team
 * @since 26.10.27
 */
import { createApp } from 'vue';

import '@ydsz-core/design-tokens/src/styles/variables.css';
import '@ydsz-core/ydsz-ui/src/styles/reduced-motion.css';

import YdszUi from '@ydsz-core/ydsz-ui';

import App from './App.vue';

const app = createApp(App);
app.use(YdszUi);
app.mount('#app');
