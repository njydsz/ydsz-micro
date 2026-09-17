/**
 * 无障碍（a11y）检测套件：针对核心 UI 组件的自动化无障碍断言
 *
 * <p>基于 vitest-axe + axe-core 运行 WCAG 2.1 AA 级检测；
 * color-contrast 规则在默认流程中关闭（动态主题切换会带来的误报），
 * 交由视觉回归测试或独立 contrast 检查负责。
 *
 * <p>扩展 expect matcher 后支持 <code>await expect(el).toBeAccessible()</code> 风格。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\accessibility.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { describe, expect, it } from 'vitest';

import { mount } from '@vue/test-utils';
import { axe } from 'vitest-axe';

import { Button, type ButtonProps } from './button';
import {
  Card,
  CardContent,
  CardDescription as CardDesc,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';
import { Checkbox } from './checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';
import { Input } from './input';
import { Label } from './label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  describe('Button', () => {
    it('icon button 应具有 aria-label', async () => {
      const wrapper = mount(Button, {
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
      const wrapper = mount(Button, {
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
    it('FormItem + FormLabel + FormControl 应链路完整', async () => {
      const wrapper = mount(
        {
          components: {
            Form,
            FormControl,
            FormDescription,
            FormField,
            FormItem,
            FormLabel,
            FormMessage,
          },
          template: `
            <Form>
              <FormField name="email">
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <input type="email" placeholder="email@test.com" />
                  </FormControl>
                  <FormDescription>We'll never share your email</FormDescription>
                  <FormMessage />
                </FormItem>
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

  describe('Table', () => {
    it('完整表格（含 thead / tbody / th scope）应通过 a11y', async () => {
      const wrapper = mount(
        {
          components: {
            Table,
            TableBody,
            TableCell,
            TableHead,
            TableHeader,
            TableRow,
          },
          template: `
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Name</TableHead>
                  <TableHead scope="col">Age</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Alice</TableCell>
                  <TableCell>30</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          `,
        },
        { attachTo: document.body },
      );
      await expect(wrapper.element).toBeAccessible();
      wrapper.unmount();
    });
  });

  describe('Dialog', () => {
    it('Dialog 容器应通过 a11y 检测', async () => {
      const wrapper = mount(
        {
          components: {
            Dialog,
            DialogContent,
            DialogDescription,
            DialogFooter,
            DialogHeader,
            DialogTitle,
          },
          template: `
            <Dialog>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Title</DialogTitle>
                  <DialogDescription>Description</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <button>OK</button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          `,
        },
        { attachTo: document.body },
      );
      await expect(wrapper.element).toBeAccessible();
      wrapper.unmount();
    });
  });

  describe('Input + Label', () => {
    it('Input 配 Label 应通过 a11y', async () => {
      const wrapper = mount(
        {
          components: { Input, Label },
          template: `
            <div>
              <Label for="name">Name</Label>
              <Input id="name" placeholder="Enter name" />
            </div>
          `,
        },
        { attachTo: document.body },
      );
      await expect(wrapper.element).toBeAccessible();
      wrapper.unmount();
    });
  });

  describe('Card', () => {
    it('Card 应通过 a11y 检测', async () => {
      const wrapper = mount(
        {
          components: {
            Card,
            CardContent,
            CardDesc,
            CardFooter,
            CardHeader,
            CardTitle,
          },
          template: `
            <Card>
              <CardHeader>
                <CardTitle>Title</CardTitle>
                <CardDesc>Description</CardDesc>
              </CardHeader>
              <CardContent>Content</CardContent>
              <CardFooter>Footer</CardFooter>
            </Card>
          `,
        },
        { attachTo: document.body },
      );
      await expect(wrapper.element).toBeAccessible();
      wrapper.unmount();
    });
  });

  describe('Checkbox', () => {
    it('Checkbox 配 Label 应通过 a11y 检测', async () => {
      const wrapper = mount(
        {
          components: { Checkbox, Label },
          template: `
            <div class="flex items-center gap-2">
              <Checkbox id="accept" aria-label="Accept terms" />
              <Label for="accept">Accept terms</Label>
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
