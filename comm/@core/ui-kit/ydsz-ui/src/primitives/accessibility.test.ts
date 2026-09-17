/**
 * 无障碍（a11y）检测套件：针对核心 UI 组件的自动化无障碍断言
 *
 * <p>基于 vitest-axe + axe-core 运行 WCAG 2.1 AA 级检测；
 * color-contrast 规则在默认流程中关闭（动态主题切换会带来的误报），
 * 交由视觉回归测试或独立 contrast 检查负责。
 *
 * <p>扩展 expect matcher 后支持 <code>await expect(el).toBeAccessible()</code> 风格。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\accessibility.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { describe, expect, it } from 'vitest';

import { mount } from '@vue/test-utils';
import { axe } from 'vitest-axe';

import { YdButtonBase, type ButtonProps } from './button';
import {
  YdCard,
  YdCardContent,
  YdCardDescription as CardDesc,
  YdCardFooter,
  YdCardHeader,
  YdCardTitle,
} from './card';
import { YdCheckboxBase } from './checkbox';
import {
  YdDialog,
  YdDialogContent,
  YdDialogDescription,
  YdDialogFooter,
  YdDialogHeader,
  YdDialogTitle,
} from './dialog';
import {
  Form,
  YdFormControl,
  YdFormDescription,
  FormField,
  YdFormItem,
  YdFormLabel,
  YdFormMessage,
} from './form';
import { YdInput } from './input';
import { YdLabel } from './label';
import {
  YdTable,
  YdTableBody,
  YdTableCell,
  YdTableHead,
  YdTableHeader,
  YdTableRow,
} from './table';

/** 扩展 vitest expect：添加 toBeAccessible matcher */
expect.extend({
  async toBeAccessible(received: HTMLElement) {
    const results = await axe(received);
    return {
      pass: results.violations.length === 0,
      message: () => {
        if (results.violations.length === 0) {
          return 'Expected element to have no accessibility violations';
        }
        const summary = results.violations
          .map((v) => `[${v.impact}] ${v.id}: ${v.description}`)
          .join('\n');
        return `Expected element to be accessible, but found violations:\n${summary}`;
      },
    };
  },
});

declare module 'vitest' {
   
  interface Assertion<T> {
    toBeAccessible(): Promise<T>;
  }
}

describe('Accessibility Audit', () => {
  describe('YdButtonBase', () => {
    it('icon button 应具有 aria-label', async () => {
      const wrapper = mount(YdButtonBase, {
        attrs: { 'aria-label': 'close' },
        props: { size: 'icon' } as ButtonProps,
        slots: { default: 'X' },
      });
      const html = wrapper.element as HTMLElement;
      expect(html.getAttribute('aria-label')).toBe('close');
      // vitest-axe 要求容器挂载到 document.body
      document.body.appendChild(html);
      await expect(html).toBeAccessible();
      document.body.removeChild(html);
    });

    it('正常按钮应通过 a11y 检测', async () => {
      const wrapper = mount(YdButtonBase, {
        props: { variant: 'default' } as ButtonProps,
        slots: { default: 'Click me' },
      });
      const html = wrapper.element as HTMLElement;
      document.body.appendChild(html);
      await expect(html).toBeAccessible();
      document.body.removeChild(html);
    });
  });

  describe('Form', () => {
    it('YdFormItem + YdFormLabel + YdFormControl 应链路完整', async () => {
      const wrapper = mount(
        {
          components: {
            Form,
            YdFormControl,
            YdFormDescription,
            FormField,
            YdFormItem,
            YdFormLabel,
            YdFormMessage,
          },
          template: `
            <Form>
              <FormField name="email">
                <YdFormItem>
                  <YdFormLabel>Email</YdFormLabel>
                  <YdFormControl>
                    <input type="email" placeholder="email@test.com" />
                  </YdFormControl>
                  <YdFormDescription>We'll never share your email</YdFormDescription>
                  <YdFormMessage />
                </YdFormItem>
              </FormField>
            </Form>
          `,
        },
        { attachTo: document.body },
      );
      await expect(wrapper.element).toBeAccessible();
      wrapper.unmount();
    });
  });

  describe('YdTable', () => {
    it('完整表格（含 thead / tbody / th scope）应通过 a11y', async () => {
      const wrapper = mount(
        {
          components: {
            YdTable,
            YdTableBody,
            YdTableCell,
            YdTableHead,
            YdTableHeader,
            YdTableRow,
          },
          template: `
            <YdTable>
              <YdTableHeader>
                <YdTableRow>
                  <YdTableHead scope="col">Name</YdTableHead>
                  <YdTableHead scope="col">Age</YdTableHead>
                </YdTableRow>
              </YdTableHeader>
              <YdTableBody>
                <YdTableRow>
                  <YdTableCell>Alice</YdTableCell>
                  <YdTableCell>30</YdTableCell>
                </YdTableRow>
              </YdTableBody>
            </YdTable>
          `,
        },
        { attachTo: document.body },
      );
      await expect(wrapper.element).toBeAccessible();
      wrapper.unmount();
    });
  });

  describe('YdDialog', () => {
    it('YdDialog 容器应通过 a11y 检测', async () => {
      const wrapper = mount(
        {
          components: {
            YdDialog,
            YdDialogContent,
            YdDialogDescription,
            YdDialogFooter,
            YdDialogHeader,
            YdDialogTitle,
          },
          template: `
            <YdDialog>
              <YdDialogContent>
                <YdDialogHeader>
                  <YdDialogTitle>Title</YdDialogTitle>
                  <YdDialogDescription>Description</YdDialogDescription>
                </YdDialogHeader>
                <YdDialogFooter>
                  <button>OK</button>
                </YdDialogFooter>
              </YdDialogContent>
            </YdDialog>
          `,
        },
        { attachTo: document.body },
      );
      await expect(wrapper.element).toBeAccessible();
      wrapper.unmount();
    });
  });

  describe('YdInput + YdLabel', () => {
    it('YdInput 配 YdLabel 应通过 a11y', async () => {
      const wrapper = mount(
        {
          components: { YdInput, YdLabel },
          template: `
            <div>
              <YdLabel for="name">Name</YdLabel>
              <YdInput id="name" placeholder="Enter name" />
            </div>
          `,
        },
        { attachTo: document.body },
      );
      await expect(wrapper.element).toBeAccessible();
      wrapper.unmount();
    });
  });

  describe('YdCard', () => {
    it('YdCard 应通过 a11y 检测', async () => {
      const wrapper = mount(
        {
          components: {
            YdCard,
            YdCardContent,
            CardDesc,
            YdCardFooter,
            YdCardHeader,
            YdCardTitle,
          },
          template: `
            <YdCard>
              <YdCardHeader>
                <YdCardTitle>Title</YdCardTitle>
                <CardDesc>Description</CardDesc>
              </YdCardHeader>
              <YdCardContent>Content</YdCardContent>
              <YdCardFooter>Footer</YdCardFooter>
            </YdCard>
          `,
        },
        { attachTo: document.body },
      );
      await expect(wrapper.element).toBeAccessible();
      wrapper.unmount();
    });
  });

  describe('YdCheckboxBase', () => {
    it('YdCheckboxBase 配 YdLabel 应通过 a11y 检测', async () => {
      const wrapper = mount(
        {
          components: { YdCheckboxBase, YdLabel },
          template: `
            <div class="flex items-center gap-2">
              <YdCheckboxBase id="accept" aria-label="Accept terms" />
              <YdLabel for="accept">Accept terms</YdLabel>
            </div>
          `,
        },
        { attachTo: document.body },
      );
      await expect(wrapper.element).toBeAccessible();
      wrapper.unmount();
    });
  });
});
