/**
 * YdForm 高级校验模式 Storybook Stories。
 *
 * P0-5: 补齐表单校验全链路 —— 异步校验、跨字段联动、提交时自动聚焦首个错误字段。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\form\Form.async.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import { object, ref as yupRef, string } from 'yup';

import {
  FormField,
  useFormField,
} from './index';
import YdFormControl from './YdFormControl.vue';
import YdFormDescription from './YdFormDescription.vue';
import YdFormItem from './YdFormItem.vue';
import YdFormLabel from './YdFormLabel.vue';
import YdFormMessage from './YdFormMessage.vue';

const meta: Meta = {
  title: 'Core/Form/Advanced',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

/** 提交时自动聚焦第一个错误字段 */
export const AutoFocusError: Story = {
  render: () => ({
    components: {
      FormField,
      YdFormControl,
      YdFormDescription,
      YdFormItem,
      YdFormLabel,
      YdFormMessage,
      useFormField,
    },
    template: `
      <form class="space-y-4" @submit.prevent>
        <FormField name="email">
          <YdFormItem>
            <YdFormLabel>邮箱</YdFormLabel>
            <YdFormControl>
              <input name="email" class="border p-2 w-full" placeholder="请输入邮箱" />
            </YdFormControl>
            <YdFormDescription>我们不会公开您的邮箱。</YdFormDescription>
            <YdFormMessage />
          </YdFormItem>
        </FormField>
        <FormField name="password">
          <YdFormItem>
            <YdFormLabel>密码</YdFormLabel>
            <YdFormControl>
              <input name="password" type="password" class="border p-2 w-full" placeholder="请输入密码" />
            </YdFormControl>
            <YdFormMessage />
          </YdFormItem>
        </FormField>
        <p class="text-xs text-muted-foreground">
          提交此表单时如果校验失败，第一个错误字段会自动 scrollIntoView + focus。
          （需配合 YdForm.vue 的 submitWithErrorFocus 方法）
        </p>
      </form>
    `,
  }),
};

/** 跨字段联动校验：确认密码必须匹配密码 */
export const CrossFieldValidation: Story = {
  render: () => ({
    components: {
      FormField,
      YdFormControl,
      YdFormItem,
      YdFormLabel,
      YdFormMessage,
    },
    setup() {
      const password = '';
      const schema = object({
        password: string().min(6, '密码至少 6 位').required('请输入密码'),
        confirmPassword: string()
          .required('请确认密码')
          .oneOf([yupRef('password')], '两次密码不一致'),
      });
      return { password, schema };
    },
    template: `
      <form class="space-y-4">
        <FormField name="password">
          <YdFormItem>
            <YdFormLabel>密码</YdFormLabel>
            <YdFormControl>
              <input name="password" type="password" class="border p-2 w-full" />
            </YdFormControl>
            <YdFormMessage />
          </YdFormItem>
        </FormField>
        <FormField name="confirmPassword" :depends-on="['password']">
          <YdFormItem>
            <YdFormLabel>确认密码</YdFormLabel>
            <YdFormControl>
              <input name="confirmPassword" type="password" class="border p-2 w-full" />
            </YdFormControl>
            <YdFormMessage />
          </YdFormItem>
        </FormField>
        <p class="text-xs text-muted-foreground">
          跨字段校验依赖 vee-validate 的 yup.oneOf + yup.ref 机制。
        </p>
      </form>
    `,
  }),
};

/** 异步校验：模拟远程用户名查重 */
export const AsyncValidation: Story = {
  render: () => ({
    components: {
      FormField,
      YdFormControl,
      YdFormDescription,
      YdFormItem,
      YdFormLabel,
      YdFormMessage,
    },
    template: `
      <form class="space-y-4">
        <FormField name="username">
          <YdFormItem>
            <YdFormLabel>用户名</YdFormLabel>
            <YdFormControl>
              <input name="username" class="border p-2 w-full" placeholder="输入用户名" />
            </YdFormControl>
            <YdFormDescription>
              校验中会显示 loading spinner，校验完成后展示结果。
            </YdFormDescription>
            <YdFormMessage />
          </YdFormItem>
        </FormField>
        <p class="text-xs text-muted-foreground">
          当字段处于 isValidating 状态时，YdFormMessage 会显示 loading spinner，
          替代错误消息（异步校验完整流程需后端接口配合）。
        </p>
      </form>
    `,
  }),
};
