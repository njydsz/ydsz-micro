/**
 * YdTransfer 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\transfer\YdTransfer.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdTransfer from './YdTransfer.vue';

const dataSource = [
  { key: 'a', label: '选项 A' },
  { key: 'b', label: '选项 B' },
  { key: 'c', label: '选项 C' },
];

describe('YdTransfer', () => {
  describe('渲染', () => {
    it('渲染容器', () => {
      const wrapper = mount(YdTransfer, {
        props: { dataSource },
      });
      expect(wrapper.exists()).toBe(true);
    });

    it('渲染数据项标签', () => {
      const wrapper = mount(YdTransfer, {
        props: { dataSource },
      });
      expect(wrapper.text()).toContain('选项 A');
      expect(wrapper.text()).toContain('选项 B');
    });

    it('渲染移动按钮', () => {
      const wrapper = mount(YdTransfer, {
        props: { dataSource },
      });
      expect(wrapper.findAll('button').length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('value', () => {
    it('value 传入时已选项在右侧', () => {
      const wrapper = mount(YdTransfer, {
        props: { dataSource, value: ['a'] },
      });
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('disabled', () => {
    it('disabled 时容器含 opacity-60', () => {
      const wrapper = mount(YdTransfer, {
        props: { dataSource, disabled: true },
      });
      expect(wrapper.classes().join(' ')).toMatch(/opacity-60/);
    });
  });

  describe('空数据', () => {
    it('空 dataSource 不抛错', () => {
      expect(() => {
        mount(YdTransfer, { props: { dataSource: [] } });
      }).not.toThrow();
    });
  });
});
