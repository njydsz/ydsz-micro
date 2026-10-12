/**
 * Steps 步骤条组件 Stories。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\steps\Steps.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import YdSteps from './YdSteps.vue';
import type { StepItem } from './YdSteps.vue';

const steps: StepItem[] = [
  { title: '第一步', description: '填写基本信息' },
  { title: '第二步', description: '上传附件材料' },
  { title: '第三步', description: '审核中' },
  { title: '第四步', description: '完成' },
];

const meta = {
  component: YdSteps,
  tags: ['autodocs'],
  title: 'Primitives/Steps',
  argTypes: {
    current: { control: { type: 'range', max: 3, min: 0, step: 1 } },
    dot: { control: 'boolean' },
    onChange: { action: 'change' },
  },
} satisfies Meta<typeof YdSteps>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    current: 1,
    steps,
  },
};

export const DotStyle: Story = {
  args: {
    current: 2,
    dot: true,
    steps,
  },
};

export const WithErrorStep: Story = {
  args: {
    current: 2,
    steps: [
      steps[0],
      steps[1],
      { ...steps[2], status: 'error', errorDescription: '审核拒绝' } as any,
      steps[3],
    ],
  },
};
