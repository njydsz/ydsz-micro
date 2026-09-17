/**
 * YdTabs 组件 Storybook Stories
 *
 * P1-2.3: 组件文档化 — YdTabs 组件交互式文档
 *
 * @path comm/@core/ui-kit/shadcn-ui/src/ui/tabs/YdTabs.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import { YdTabs, YdTabsContent, YdTabsList, YdTabsTrigger } from './index';

const meta: Meta = {
  title: 'Core/YdTabs',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '标签页组件用于在同一区域内切换不同的内容视图，支持多个标签页的组织和管理。',
      },
    },
  },
};

/**
 * YdTabs 组件示例集的 Storybook 元信息。
 *
 * 覆盖的状态：
 *  - `Default`：无预设值的基础标签页，验证首项默认激活与键盘左右方向键切换；
 *  - `WithDefaultTab`：通过 `default-value` 指定初始激活项，验证非首项激活时
 *    指示器的初始位置计算；
 *  - `WithDisabledTab`：存在禁用项，验证禁用项不可聚焦、且方向键导航会跳过它；
 *  - `WithComplexContent`：面板内放复杂内容（表格/表单），用于观察切换时
 *    内容高度突变导致的容器抖动。
 */
export default meta;
type Story = StoryObj;

/** 基础标签页 */
export const Default: Story = {
  render: () => ({
    components: { YdTabs, YdTabsList, YdTabsTrigger, YdTabsContent },
    template: `
      <YdTabs default-value="tab1" style="width: 500px;">
        <YdTabsList>
          <YdTabsTrigger value="tab1">标签一</YdTabsTrigger>
          <YdTabsTrigger value="tab2">标签二</YdTabsTrigger>
          <YdTabsTrigger value="tab3">标签三</YdTabsTrigger>
        </YdTabsList>
        <YdTabsContent value="tab1">
          <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 4px; margin-top: 8px;">
            <p>这是标签一的内容区域。</p>
          </div>
        </YdTabsContent>
        <YdTabsContent value="tab2">
          <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 4px; margin-top: 8px;">
            <p>这是标签二的内容区域。</p>
          </div>
        </YdTabsContent>
        <YdTabsContent value="tab3">
          <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 4px; margin-top: 8px;">
            <p>这是标签三的内容区域。</p>
          </div>
        </YdTabsContent>
      </YdTabs>
    `,
  }),
};

/** 带默认激活标签 */
export const WithDefaultTab: Story = {
  render: () => ({
    components: { YdTabs, YdTabsList, YdTabsTrigger, YdTabsContent },
    template: `
      <YdTabs default-value="settings" style="width: 500px;">
        <YdTabsList>
          <YdTabsTrigger value="account">账户</YdTabsTrigger>
          <YdTabsTrigger value="settings">设置</YdTabsTrigger>
          <YdTabsTrigger value="notifications">通知</YdTabsTrigger>
        </YdTabsList>
        <YdTabsContent value="account">
          <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 4px; margin-top: 8px;">
            <h3>账户设置</h3>
            <p>管理您的账户信息和偏好设置。</p>
          </div>
        </YdTabsContent>
        <YdTabsContent value="settings">
          <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 4px; margin-top: 8px;">
            <h3>系统设置</h3>
            <p>配置系统参数和选项。</p>
          </div>
        </YdTabsContent>
        <YdTabsContent value="notifications">
          <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 4px; margin-top: 8px;">
            <h3>通知设置</h3>
            <p>自定义通知偏好和提醒方式。</p>
          </div>
        </YdTabsContent>
      </YdTabs>
    `,
  }),
};

/** 禁用某个标签 */
export const WithDisabledTab: Story = {
  render: () => ({
    components: { YdTabs, YdTabsList, YdTabsTrigger, YdTabsContent },
    template: `
      <YdTabs default-value="tab1" style="width: 500px;">
        <YdTabsList>
          <YdTabsTrigger value="tab1">可用标签</YdTabsTrigger>
          <YdTabsTrigger value="tab2" disabled>禁用标签</YdTabsTrigger>
          <YdTabsTrigger value="tab3">另一个可用标签</YdTabsTrigger>
        </YdTabsList>
        <YdTabsContent value="tab1">
          <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 4px; margin-top: 8px;">
            <p>这是第一个标签的内容。</p>
          </div>
        </YdTabsContent>
        <YdTabsContent value="tab3">
          <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 4px; margin-top: 8px;">
            <p>这是第三个标签的内容。</p>
          </div>
        </YdTabsContent>
      </YdTabs>
    `,
  }),
};

/** 复杂内容标签页 */
export const WithComplexContent: Story = {
  render: () => ({
    components: { YdTabs, YdTabsList, YdTabsTrigger, YdTabsContent },
    template: `
      <YdTabs default-value="overview" style="width: 600px;">
        <YdTabsList>
          <YdTabsTrigger value="overview">概览</YdTabsTrigger>
          <YdTabsTrigger value="analytics">分析</YdTabsTrigger>
          <YdTabsTrigger value="reports">报告</YdTabsTrigger>
        </YdTabsList>
        <YdTabsContent value="overview">
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-radius: 4px; margin-top: 8px;">
            <h3>项目概览</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 16px;">
              <div style="padding: 16px; background: #f3f4f6; border-radius: 4px;">
                <p style="font-size: 14px; color: #6b7280;">总项目数</p>
                <p style="font-size: 24px; font-weight: bold; margin-top: 4px;">128</p>
              </div>
              <div style="padding: 16px; background: #f3f4f6; border-radius: 4px;">
                <p style="font-size: 14px; color: #6b7280;">进行中</p>
                <p style="font-size: 24px; font-weight: bold; margin-top: 4px;">42</p>
              </div>
              <div style="padding: 16px; background: #f3f4f6; border-radius: 4px;">
                <p style="font-size: 14px; color: #6b7280;">已完成</p>
                <p style="font-size: 24px; font-weight: bold; margin-top: 4px;">86</p>
              </div>
            </div>
          </div>
        </YdTabsContent>
        <YdTabsContent value="analytics">
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-radius: 4px; margin-top: 8px;">
            <h3>数据分析</h3>
            <p style="margin-top: 12px;">这里可以展示各种图表和数据可视化内容。</p>
          </div>
        </YdTabsContent>
        <YdTabsContent value="reports">
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-radius: 4px; margin-top: 8px;">
            <h3>报告列表</h3>
            <ul style="margin-top: 12px; list-style: none; padding: 0;">
              <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">月度报告 - 2024年1月</li>
              <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">季度报告 - 2023年Q4</li>
              <li style="padding: 8px 0;">年度报告 - 2023年</li>
            </ul>
          </div>
        </YdTabsContent>
      </YdTabs>
    `,
  }),
};
