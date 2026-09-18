import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import StatsDashboard from './components/StatsDashboard.vue';
import ApiStatsPanel from './components/ApiStatsPanel.vue';
import G6Topology from './components/G6Topology.vue';
import './custom.css';

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('StatsDashboard', StatsDashboard);
    app.component('ApiStatsPanel', ApiStatsPanel);
    app.component('G6Topology', G6Topology);
  },
};

export default theme;
