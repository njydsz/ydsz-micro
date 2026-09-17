/**
 * Form 组件 Storybook Stories
 *
 * P1-2.3: 组件文档化 — Form 组件交互式文档
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/ui/form/Form.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import { ref } from 'vue';

import { YdButtonBase } from '../button';
import { YdInput } from '../input';
import { createLogger } from '@ydsz-core/shared/utils';

const logger = createLogger('FormStories');

import {
  Form,
  YdFormControl,
  YdFormDescription,
  FormField,
  YdFormItem,
  YdFormLabel,
  YdFormMessage,
} from './index';

const meta: Meta = {
  title: 'Core/Form',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '表单组件用于收集用户输入，提供字段验证、错误提示和表单布局管理。',
      },
    },
  },
};

/**
 * Form 组件示例集的 Storybook 元信息。
 *
 * 覆盖的状态：
 *  - `LoginForm`：登录场景，最小字段集 + 提交处理；
 *  - `RegistrationForm`：注册场景，字段更多，展示多字段纵向间距与标签对齐；
 *  - `SearchForm`：搜索场景，单行紧凑布局（标签与控件同行）；
 *  - `FormWithErrors`：校验失败态，展示 `YdFormMessage` 的错误文案与错误态样式，
 *    这是验证 `aria-invalid` / `aria-describedby` 可达性链路是否接上的关键示例。
 *
 * 各 story 统一走 FormField → YdFormControl → YdFormMessage 的嵌套结构：
 * 字段级校验上下文由 FormField 提供，控件必须包在 YdFormControl 内才能拿到
 * `id` 与 `aria-describedby`，直接把 YdInput 放进 YdFormItem 会导致错误提示读屏不可达。
 */
export default meta;
type Story = StoryObj;

/** 基础登录表单 */
export const LoginForm: Story = {
  render: () => ({
    components: { Form, FormField, YdFormItem, YdFormLabel, YdFormControl, YdFormMessage, YdInput, YdButtonBase },
    setup() {
      const form = ref({
        username: '',
        password: '',
      });

      const handleSubmit = () => {
        // 日志脱敏：禁止输出 password 字段
        const maskedData = { ...form.value, password: '***' };
        logger.debug('提交数据:', maskedData);
      };

      return { form, handleSubmit };
    },
    template: `
      <Form @submit.prevent="handleSubmit" style="width: 400px;">
        <FormField v-slot="{ field }" name="username">
          <YdFormItem>
            <YdFormLabel>用户名</YdFormLabel>
            <YdFormControl>
              <YdInput v-bind="field" v-model="form.username" placeholder="请输入用户名" />
            </YdFormControl>
            <YdFormMessage />
          </YdFormItem>
        </FormField>

        <FormField v-slot="{ field }" name="password">
          <YdFormItem>
            <YdFormLabel>密码</YdFormLabel>
            <YdFormControl>
              <YdInput v-bind="field" v-model="form.password" type="password" placeholder="请输入密码" />
            </YdFormControl>
            <YdFormMessage />
          </YdFormItem>
        </FormField>

        <YdButtonBase type="submit" style="width: 100%; margin-top: 16px;">登录</YdButtonBase>
      </Form>
    `,
  }),
};

/** 注册表单（带验证） */
export const RegistrationForm: Story = {
  render: () => ({
    components: {
      Form,
      FormField,
      YdFormItem,
      YdFormLabel,
      YdFormControl,
      YdFormDescription,
      YdFormMessage,
      YdInput,
      YdButtonBase,
    },
    setup() {
      const form = ref({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
      });

      const handleSubmit = () => {
        // 日志脱敏：禁止输出 password / confirmPassword 字段
        const maskedData = { ...form.value, password: '***', confirmPassword: '***' };
        logger.debug('注册数据:', maskedData);
      };

      return { form, handleSubmit };
    },
    template: `
      <Form @submit.prevent="handleSubmit" style="width: 450px;">
        <FormField v-slot="{ field }" name="email">
          <YdFormItem>
            <YdFormLabel>邮箱</YdFormLabel>
            <YdFormControl>
              <YdInput v-bind="field" v-model="form.email" type="email" placeholder="your@email.com" />
            </YdFormControl>
            <YdFormDescription>我们将向此邮箱发送验证链接</YdFormDescription>
            <YdFormMessage />
          </YdFormItem>
        </FormField>

        <FormField v-slot="{ field }" name="username">
          <YdFormItem>
            <YdFormLabel>用户名</YdFormLabel>
            <YdFormControl>
              <YdInput v-bind="field" v-model="form.username" placeholder="请输入用户名" />
            </YdFormControl>
            <YdFormDescription>3-20 个字符，只能包含字母、数字和下划线</YdFormDescription>
            <YdFormMessage />
          </YdFormItem>
        </FormField>

        <FormField v-slot="{ field }" name="password">
          <YdFormItem>
            <YdFormLabel>密码</YdFormLabel>
            <YdFormControl>
              <YdInput v-bind="field" v-model="form.password" type="password" placeholder="请输入密码" />
            </YdFormControl>
            <YdFormDescription>至少 8 个字符，包含大小写字母和数字</YdFormDescription>
            <YdFormMessage />
          </YdFormItem>
        </FormField>

        <FormField v-slot="{ field }" name="confirmPassword">
          <YdFormItem>
            <YdFormLabel>确认密码</YdFormLabel>
            <YdFormControl>
              <YdInput v-bind="field" v-model="form.confirmPassword" type="password" placeholder="再次输入密码" />
            </YdFormControl>
            <YdFormMessage />
          </YdFormItem>
        </FormField>

        <YdButtonBase type="submit" style="width: 100%; margin-top: 16px;">注册</YdButtonBase>
      </Form>
    `,
  }),
};

/** 搜索表单（内联布局） */
export const SearchForm: Story = {
  render: () => ({
    components: { Form, FormField, YdFormItem, YdFormControl, YdInput, YdButtonBase },
    setup() {
      const form = ref({
        keyword: '',
      });

      const handleSubmit = () => {
        logger.debug('搜索:', form.value.keyword);
      };

      return { form, handleSubmit };
    },
    template: `
      <Form @submit.prevent="handleSubmit" style="display: flex; gap: 12px; align-items: flex-end;">
        <FormField v-slot="{ field }" name="keyword" style="flex: 1;">
          <YdFormItem>
            <YdFormControl>
              <YdInput v-bind="field" v-model="form.keyword" placeholder="搜索关键词..." />
            </YdFormControl>
          </YdFormItem>
        </FormField>

        <YdButtonBase type="submit">搜索</YdButtonBase>
      </Form>
    `,
  }),
};

/** 带错误状态的表单 */
export const FormWithErrors: Story = {
  render: () => ({
    components: { Form, FormField, YdFormItem, YdFormLabel, YdFormControl, YdFormMessage, YdInput, YdButtonBase },
    setup() {
      const form = ref({
        email: 'invalid-email',
        password: '123',
      });

      const handleSubmit = () => {
        logger.debug('提交数据:', form.value);
      };

      return { form, handleSubmit };
    },
    template: `
      <Form @submit.prevent="handleSubmit" style="width: 400px;">
        <FormField v-slot="{ field }" name="email" :error="'请输入有效的邮箱地址'">
          <YdFormItem>
            <YdFormLabel>邮箱</YdFormLabel>
            <YdFormControl>
              <YdInput v-bind="field" v-model="form.email" type="email" />
            </YdFormControl>
            <YdFormMessage>请输入有效的邮箱地址</YdFormMessage>
          </YdFormItem>
        </FormField>

        <FormField v-slot="{ field }" name="password" :error="'密码长度不足'">
          <YdFormItem>
            <YdFormLabel>密码</YdFormLabel>
            <YdFormControl>
              <YdInput v-bind="field" v-model="form.password" type="password" />
            </YdFormControl>
            <YdFormMessage>密码长度不足</YdFormMessage>
          </YdFormItem>
        </FormField>

        <YdButtonBase type="submit" style="width: 100%; margin-top: 16px;">提交</YdButtonBase>
      </Form>
    `,
  }),
};
