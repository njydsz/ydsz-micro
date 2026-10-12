/**
 * YdInput 组件 Storybook Stories
 *
 * P1-2.3: 组件文档化 — YdInput 组件交互式文档
 *
 * <p>P1-6: 新增尺寸档位 Stories（xs / sm / default / lg）。
 * <p>5.6.0: 新增 clearable / prefix / suffix / showCount / disabled / readonly Stories。
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/ui/input/YdInput.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import YdInput from './YdInput.vue';

const meta: Meta<typeof YdInput> = {
  title: 'Core/YdInput',
  component: YdInput,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default', 'lg'],
      description: '输入框尺寸档位',
    },
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number', 'tel', 'url', 'search'],
      description: '输入框类型',
    },
    placeholder: {
      control: 'text',
      description: '占位文本',
    },
    modelValue: {
      control: 'text',
      description: '绑定值',
    },
    isClearable: {
      control: 'boolean',
      description: '是否显示清空按钮',
    },
    isShowCount: {
      control: 'boolean',
      description: '是否显示字符计数',
    },
    disabled: {
      control: 'boolean',
      description: '禁用状态',
    },
    readonly: {
      control: 'boolean',
      description: '只读状态',
    },
    maxlength: {
      control: 'number',
      description: '最大输入长度',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          '输入框组件用于接收用户文本输入，支持 4 档尺寸（xs/sm/default/lg）、clearable、prefix/suffix、字符计数与状态控制。',
      },
    },
  },
};

/**
 * YdInput 组件示例集的 Storybook 元信息。
 *
 * 覆盖的状态：
 *  - 类型维度：`Default`(text) / `Password` / `Email` / `Number` / `Search`；
 *    其中 `password`、`email`、`number` 依赖原生 input 的 type 行为与校验提示，
 *    是最容易因 `v-bind` 顺序被覆盖而失效的一组，因此单独成 story；
 *  - 交互状态：`Disabled` 禁用态、`WithValue` 受控有值态；
 *  - `AllTypes`：全部 type 同屏对照，用于快速核对各类型下的边框与内边距是否一致。
 *
 * meta 提供了 `type` / `placeholder` / `disabled` / `modelValue` 四个控件，
 * 可在面板中直接组合验证，无需为每种组合各写一个 story。
 */
export default meta;
type Story = StoryObj<typeof YdInput>;

/** 默认输入框 */
export const Default: Story = {
  render: (args) => ({
    components: { YdInput },
    setup() {
      return { args };
    },
    template: '<YdInput v-bind="args" v-model="args.modelValue" style="width: 300px;" />',
  }),
  args: {
    type: 'text',
    placeholder: '请输入内容...',
    modelValue: '',
  },
};

/** 密码输入框 */
export const Password: Story = {
  render: (args) => ({
    components: { YdInput },
    setup() {
      return { args };
    },
    template: '<YdInput v-bind="args" v-model="args.modelValue" style="width: 300px;" />',
  }),
  args: {
    type: 'password',
    placeholder: '请输入密码...',
    modelValue: '',
  },
};

/** 邮箱输入框 */
export const Email: Story = {
  render: (args) => ({
    components: { YdInput },
    setup() {
      return { args };
    },
    template: '<YdInput v-bind="args" v-model="args.modelValue" style="width: 300px;" />',
  }),
  args: {
    type: 'email',
    placeholder: '请输入邮箱...',
    modelValue: '',
  },
};

/** 数字输入框 */
export const Number: Story = {
  render: (args) => ({
    components: { YdInput },
    setup() {
      return { args };
    },
    template: '<YdInput v-bind="args" v-model="args.modelValue" style="width: 300px;" />',
  }),
  args: {
    type: 'number',
    placeholder: '请输入数字...',
    modelValue: '',
  },
};

/** 禁用状态 */
export const Disabled: Story = {
  render: (args) => ({
    components: { YdInput },
    setup() {
      return { args };
    },
    template: '<YdInput v-bind="args" v-model="args.modelValue" style="width: 300px;" />',
  }),
  args: {
    type: 'text',
    placeholder: '禁用状态',
    modelValue: '无法编辑',
    disabled: true,
  },
};

/** 带默认值 */
export const WithValue: Story = {
  render: (args) => ({
    components: { YdInput },
    setup() {
      return { args };
    },
    template: '<YdInput v-bind="args" v-model="args.modelValue" style="width: 300px;" />',
  }),
  args: {
    type: 'text',
    placeholder: '请输入内容...',
    modelValue: '默认值',
  },
};

/** 搜索输入框 */
export const Search: Story = {
  render: (args) => ({
    components: { YdInput },
    setup() {
      return { args };
    },
    template: '<YdInput v-bind="args" v-model="args.modelValue" style="width: 300px;" />',
  }),
  args: {
    type: 'search',
    placeholder: '搜索...',
    modelValue: '',
  },
};

/** 所有类型展示 */
export const AllTypes: Story = {
  render: () => ({
    components: { YdInput },
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px; width: 300px;">
        <YdInput type="text" placeholder="文本输入" />
        <YdInput type="password" placeholder="密码输入" />
        <YdInput type="email" placeholder="邮箱输入" />
        <YdInput type="number" placeholder="数字输入" />
        <YdInput type="tel" placeholder="电话输入" />
        <YdInput type="url" placeholder="URL 输入" />
        <YdInput type="search" placeholder="搜索输入" />
      </div>
    `,
  }),
};

/** 尺寸档位展示 */
export const AllSizes: Story = {
  render: () => ({
    components: { YdInput },
    template: `
      <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
        <YdInput size="xs" placeholder="xs" style="width: 120px;" />
        <YdInput size="sm" placeholder="sm" style="width: 120px;" />
        <YdInput size="default" placeholder="default" style="width: 140px;" />
        <YdInput size="lg" placeholder="lg" style="width: 160px;" />
      </div>
    `,
  }),
};

/** 带清空按钮 */
export const Clearable: Story = {
  render: (args) => ({
    components: { YdInput },
    setup() {
      return { args };
    },
    template: '<YdInput v-bind="args" v-model="args.modelValue" style="width: 300px;" />',
  }),
  args: {
    isClearable: true,
    placeholder: '输入后可清空...',
    modelValue: '示例文本',
  },
};

/** 带前置/后置内容（prefix + suffix） */
export const PrefixSuffix: Story = {
  render: () => ({
    components: { YdInput },
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px; width: 300px;">
        <YdInput placeholder="请输入金额">
          <template #prefix>￥</template>
          <template #suffix>元</template>
        </YdInput>
        <YdInput placeholder="请输入网址">
          <template #prefix>https://</template>
        </YdInput>
        <YdInput placeholder="搜索" is-clearable>
          <template #suffix>搜索</template>
        </YdInput>
      </div>
    `,
  }),
};

/** 字符计数（maxlength + showCount） */
export const ShowCount: Story = {
  render: (args) => ({
    components: { YdInput },
    setup() {
      return { args };
    },
    template: '<YdInput v-bind="args" v-model="args.modelValue" style="width: 300px;" />',
  }),
  args: {
    maxlength: 20,
    isShowCount: true,
    placeholder: '最多输入 20 字',
    modelValue: '已输入内容',
  },
};

/** 禁用与只读状态 */
export const DisabledReadonly: Story = {
  render: () => ({
    components: { YdInput },
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px; width: 300px;">
        <YdInput modelValue="禁用状态" disabled placeholder="禁用" />
        <YdInput modelValue="只读状态" readonly placeholder="只读" />
      </div>
    `,
  }),
};
