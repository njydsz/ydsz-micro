/**
 * YdDescriptions 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\descriptions\YdDescriptions.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdDescriptions from './YdDescriptions.vue';
import YdDescriptionsItem from './YdDescriptionsItem.vue';

describe('YdDescriptions', () => {
  describe('渲染', () => {
    it('默认渲染容器', () => {
      const wrapper = mount(YdDescriptions, {
        slots: {
          default: `<YdDescriptionsItem label="名称">值</YdDescriptionsItem>`,
        },
      });
      expect(wrapper.exists()).toBe(true);
    });

    it('column=2 时网格模板为 repeat(2,...)', () => {
      const wrapper = mount(YdDescriptions, {
        props: { column: 2 },
      });
      const html = wrapper.html();
      expect(html).toContain('repeat(2,');
    });

    it('title 存在时渲染标题', () => {
      const wrapper = mount(YdDescriptions, {
        props: { title: '详情' },
      });
      expect(wrapper.text()).toContain('详情');
    });
  });

  describe('border', () => {
    it('border=true 时含 border 类', () => {
      const wrapper = mount(YdDescriptions, {
        props: { border: true },
      });
      expect(wrapper.html()).toMatch(/border/);
    });
  });

  describe('YdDescriptionsItem', () => {
    it('渲染 label 与内容', () => {
      const wrapper = mount(YdDescriptionsItem, {
        props: { label: '名称' },
        slots: { default: '值' },
      });
      expect(wrapper.text()).toContain('名称');
      expect(wrapper.text()).toContain('值');
    });

    it('span=2 时 style 含 span 2', () => {
      const wrapper = mount(YdDescriptionsItem, {
        props: { label: '名称', span: 2 },
      });
      expect(wrapper.html()).toMatch(/span 2/);
    });
  });
});
