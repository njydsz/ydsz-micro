/**
 * Theme 系统 Storybook Stories
 *
 * P1-1: 运行时主题 API — 演示 useTheme / ThemeProvider 用法。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\theme\Theme.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import { ref } from 'vue';

import {
  YdButton,
} from '../button';
import { YdCard, YdCardContent } from '../card';
import { useTheme } from './use-theme';

const meta = {
  title: 'Core/Theme',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
# 运行时主题系统

通过 \`useTheme()\` 获取句柄后，可在运行时直接修改 CSS 变量，无需重新构建。

\`\`\`ts
const theme = useTheme();
theme.set('primary', '210 40% 50%');   // 单个 token
theme.bulk({ 'radius': '0.75rem' });    // 批量
theme.toggleDark();                       // 切换暗黑
theme.applyPreset('dark');                // 应用预设
theme.reset();                            // 全部回退
\`\`\`
        `,
      },
    },
  },
} satisfies Meta;

export default meta;

/** 主题切换演示：切换 primary / dark */
export const ThemePlayground: StoryObj = {
  render: () => ({
    components: { YdButton, YdCard, YdCardContent },
    setup() {
      const theme = useTheme();
      const isDark = ref(false);

      function toggleDark(): void {
        theme.toggleDark();
        isDark.value = !isDark.value;
      }

      function setPrimary(): void {
        theme.set('primary', '142 76% 36%');
      }

      function reset(): void {
        theme.reset();
        isDark.value = false;
      }

      return { isDark, reset, setPrimary, toggleDark };
    },
    template: `
      <div class="h-full rounded p-4 transition-colors" :class="isDark ? 'bg-slate-800 text-white' : 'bg-white'">
        <YdCard class="inline-block">
          <YdCardContent class="flex flex-col items-start gap-3 pt-6">
            <div class="flex gap-2">
              <YdButton variant="default" @click="toggleDark">{{ isDark ? 'Light' : 'Dark' }} Mode</YdButton>
              <YdButton variant="outline" @click="setPrimary">Green Primary</YdButton>
              <YdButton variant="ghost" @click="reset">Reset</YdButton>
            </div>
            <p class="text-sm text-muted-foreground">
              当前模式：{{ isDark ? 'dark' : 'light' }}
            </p>
          </YdCardContent>
        </YdCard>
      </div>
    `,
  }),
};
