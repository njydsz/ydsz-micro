/**
 * YdDialog 组件 Storybook Stories
 *
 * P1-2.3: 组件文档化 — YdDialog 组件交互式文档
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/ui/dialog/YdDialog.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import { ref } from 'vue';

import {
  YdDialog,
  YdDialogContent,
  YdDialogDescription,
  YdDialogFooter,
  YdDialogHeader,
  YdDialogTitle,
  YdDialogTrigger,
} from './index';

const meta: Meta = {
  title: 'Core/YdDialog',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '对话框组件用于在不离开当前页面的情况下向用户展示重要信息或收集输入。',
      },
    },
  },
};

/**
 * YdDialog 组件示例集的 Storybook 元信息。
 *
 * 覆盖的状态：
 *  - `Default`：确认类对话框（危险操作二次确认），展示 Header + Footer 的标准结构；
 *  - `FormDialog`：内嵌表单的对话框，验证 YdDialogContent 在表单撑高后的最大宽度与滚动；
 *  - `InfoDialog`：纯信息展示，无破坏性操作，Footer 只有一个「我知道了」。
 *
 * 三个 story 统一用 `v-model:open` 受控 + `YdDialogTrigger as-child` 包裹原生 button，
 * 这是本组件的正确用法示例：`as-child` 让触发器复用宿主元素的样式与语义，
 * 若直接写 `<YdDialogTrigger>` 会多套一层 button 导致嵌套按钮与样式错乱。
 */
export default meta;
type Story = StoryObj;

/** 基础对话框 */
export const Default: Story = {
  render: () => ({
    components: { YdDialog, YdDialogTrigger, YdDialogContent, YdDialogHeader, YdDialogTitle, YdDialogDescription, YdDialogFooter },
    setup() {
      const open = ref(false);
      return { open };
    },
    template: `
      <YdDialog v-model:open="open">
        <YdDialogTrigger as-child>
          <button style="padding: 8px 16px; border: none; border-radius: 4px; background: #007bff; color: white; cursor: pointer;">
            打开对话框
          </button>
        </YdDialogTrigger>
        <YdDialogContent>
          <YdDialogHeader>
            <YdDialogTitle>确认操作</YdDialogTitle>
            <YdDialogDescription>
              此操作将永久删除该项目，是否继续？
            </YdDialogDescription>
          </YdDialogHeader>
          <YdDialogFooter>
            <button @click="open = false" style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; background: white; cursor: pointer;">
              取消
            </button>
            <button @click="open = false" style="padding: 8px 16px; border: none; border-radius: 4px; background: #dc3545; color: white; cursor: pointer;">
              确认删除
            </button>
          </YdDialogFooter>
        </YdDialogContent>
      </YdDialog>
    `,
  }),
};

/** 表单对话框 */
export const FormDialog: Story = {
  render: () => ({
    components: { YdDialog, YdDialogTrigger, YdDialogContent, YdDialogHeader, YdDialogTitle, YdDialogDescription, YdDialogFooter },
    setup() {
      const open = ref(false);
      return { open };
    },
    template: `
      <YdDialog v-model:open="open">
        <YdDialogTrigger as-child>
          <button style="padding: 8px 16px; border: none; border-radius: 4px; background: #007bff; color: white; cursor: pointer;">
            编辑用户
          </button>
        </YdDialogTrigger>
        <YdDialogContent style="max-width: 450px;">
          <YdDialogHeader>
            <YdDialogTitle>编辑用户信息</YdDialogTitle>
            <YdDialogDescription>
              修改用户的个人资料信息。
            </YdDialogDescription>
          </YdDialogHeader>
          <div style="display: flex; flex-direction: column; gap: 16px; padding: 16px 0;">
            <div>
              <label style="display: block; margin-bottom: 4px; font-weight: 500;">姓名</label>
              <input type="text" value="张三" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" />
            </div>
            <div>
              <label style="display: block; margin-bottom: 4px; font-weight: 500;">邮箱</label>
              <input type="email" value="zhangsan@example.com" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" />
            </div>
          </div>
          <YdDialogFooter>
            <button @click="open = false" style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; background: white; cursor: pointer;">
              取消
            </button>
            <button @click="open = false" style="padding: 8px 16px; border: none; border-radius: 4px; background: #007bff; color: white; cursor: pointer;">
              保存
            </button>
          </YdDialogFooter>
        </YdDialogContent>
      </YdDialog>
    `,
  }),
};

/** 信息展示对话框 */
export const InfoDialog: Story = {
  render: () => ({
    components: { YdDialog, YdDialogTrigger, YdDialogContent, YdDialogHeader, YdDialogTitle, YdDialogDescription },
    setup() {
      const open = ref(false);
      return { open };
    },
    template: `
      <YdDialog v-model:open="open">
        <YdDialogTrigger as-child>
          <button style="padding: 8px 16px; border: none; border-radius: 4px; background: #007bff; color: white; cursor: pointer;">
            查看详情
          </button>
        </YdDialogTrigger>
        <YdDialogContent>
          <YdDialogHeader>
            <YdDialogTitle>系统通知</YdDialogTitle>
            <YdDialogDescription>
              系统将于今晚 22:00 进行维护升级，预计持续 2 小时。请提前保存工作内容。
            </YdDialogDescription>
          </YdDialogHeader>
          <div style="padding: 16px 0;">
            <p style="margin-bottom: 8px;"><strong>维护时间：</strong>2024-01-15 22:00 - 2024-01-16 00:00</p>
            <p style="margin-bottom: 8px;"><strong>影响范围：</strong>所有在线服务</p>
            <p><strong>注意事项：</strong>请提前保存未提交的数据</p>
          </div>
          <YdDialogFooter>
            <button @click="open = false" style="padding: 8px 16px; border: none; border-radius: 4px; background: #007bff; color: white; cursor: pointer;">
              我知道了
            </button>
          </YdDialogFooter>
        </YdDialogContent>
      </YdDialog>
    `,
  }),
};
