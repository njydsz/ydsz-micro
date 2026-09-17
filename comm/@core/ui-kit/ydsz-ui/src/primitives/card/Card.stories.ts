/**
 * YdCard 组件 Storybook Stories
 *
 * P1-2.3: 组件文档化 — YdCard 组件交互式文档
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/ui/card/YdCard.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import { YdCard, YdCardContent, YdCardDescription, YdCardFooter, YdCardHeader, YdCardTitle } from './index';

const meta: Meta = {
  title: 'Core/YdCard',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '卡片组件用于组织和展示相关内容，支持标题、描述、内容和底部区域。',
      },
    },
  },
};

/**
 * YdCard 组件示例集的 Storybook 元信息。
 *
 * 覆盖的状态（本组件是组合式结构，示例以「区域搭配」而非 props 为主）：
 *  - `Default`：Header + Content + Footer 全区域齐备的标准卡片；
 *  - `WithTitle`：仅标题 + 内容，用于内容极简的场景；
 *  - `FullCard`：带真实业务数据的完整卡片，展示 Footer 里并置多个操作按钮时的排布；
 *  - `YdCardGrid`：多卡片在响应式网格中的布局，验证卡片在容器宽度变化下的自适应。
 *
 * 因为 YdCard 本身无 props 面板，meta 未绑定 `component` 与 `argTypes` ——
 * 这里要验证的是插槽组合与间距，而非参数化状态。
 */
export default meta;
type Story = StoryObj;

/** 基础卡片 */
export const Default: Story = {
  render: () => ({
    components: { YdCard, YdCardHeader, YdCardTitle, YdCardDescription, YdCardContent, YdCardFooter },
    template: `
      <YdCard style="width: 350px;">
        <YdCardHeader>
          <YdCardTitle>卡片标题</YdCardTitle>
          <YdCardDescription>卡片描述文本</YdCardDescription>
        </YdCardHeader>
        <YdCardContent>
          <p>这是卡片的主要内容区域。</p>
        </YdCardContent>
        <YdCardFooter>
          <p>卡片底部</p>
        </YdCardFooter>
      </YdCard>
    `,
  }),
};

/** 仅标题卡片 */
export const WithTitle: Story = {
  render: () => ({
    components: { YdCard, YdCardHeader, YdCardTitle, YdCardContent },
    template: `
      <YdCard style="width: 350px;">
        <YdCardHeader>
          <YdCardTitle>项目概览</YdCardTitle>
        </YdCardHeader>
        <YdCardContent>
          <p>这是一个简单的卡片示例，只包含标题和内容。</p>
        </YdCardContent>
      </YdCard>
    `,
  }),
};

/** 完整卡片（带所有区域） */
export const FullCard: Story = {
  render: () => ({
    components: { YdCard, YdCardHeader, YdCardTitle, YdCardDescription, YdCardContent, YdCardFooter },
    template: `
      <YdCard style="width: 400px;">
        <YdCardHeader>
          <YdCardTitle>用户信息</YdCardTitle>
          <YdCardDescription>查看和编辑用户资料</YdCardDescription>
        </YdCardHeader>
        <YdCardContent>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <p><strong>姓名：</strong>张三</p>
            <p><strong>邮箱：</strong>zhangsan@example.com</p>
            <p><strong>角色：</strong>管理员</p>
          </div>
        </YdCardContent>
        <YdCardFooter style="display: flex; gap: 8px; justify-content: flex-end;">
          <button style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; background: white;">取消</button>
          <button style="padding: 8px 16px; border: none; border-radius: 4px; background: #007bff; color: white;">保存</button>
        </YdCardFooter>
      </YdCard>
    `,
  }),
};

/** 多卡片布局 */
export const YdCardGrid: Story = {
  render: () => ({
    components: { YdCard, YdCardHeader, YdCardTitle, YdCardDescription, YdCardContent },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; max-width: 900px;">
        <YdCard>
          <YdCardHeader>
            <YdCardTitle>项目 A</YdCardTitle>
            <YdCardDescription>进行中</YdCardDescription>
          </YdCardHeader>
          <YdCardContent>
            <p>这是项目 A 的描述信息。</p>
          </YdCardContent>
        </YdCard>
        <YdCard>
          <YdCardHeader>
            <YdCardTitle>项目 B</YdCardTitle>
            <YdCardDescription>已完成</YdCardDescription>
          </YdCardHeader>
          <YdCardContent>
            <p>这是项目 B 的描述信息。</p>
          </YdCardContent>
        </YdCard>
        <YdCard>
          <YdCardHeader>
            <YdCardTitle>项目 C</YdCardTitle>
            <YdCardDescription>待开始</YdCardDescription>
          </YdCardHeader>
          <YdCardContent>
            <p>这是项目 C 的描述信息。</p>
          </YdCardContent>
        </YdCard>
      </div>
    `,
  }),
};
