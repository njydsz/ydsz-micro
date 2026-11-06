/**
 * YdSpace 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\space\YdSpace.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdSpace from './YdSpace.vue';

describe('YdSpace', () => {
  describe('渲染', () => {
    it('默认渲染 presentation 角色容器', () => {
      const wrapper = mount(YdSpace, {
        slots: { default: '内容' },
      });
      expect(wrapper.attributes('role')).toBe('presentation');
    });

    it('渲染默认 slot', () => {
      const wrapper = mount(YdSpace, {
        slots: { default: '内容' },
      });
      expect(wrapper.text()).toContain('内容');
    });

    it('默认水平方向含 flex-row', () => {
      const wrapper = mount(YdSpace);
      expect(wrapper.classes()).toContain('flex-row');
    });
  });

  describe('direction', () => {
    it('direction=vertical 含 flex-col', () => {
      const wrapper = mount(YdSpace, {
        props: { direction: 'vertical' },
      });
      expect(wrapper.classes()).toContain('flex-col');
    });
  });

  describe('size', () => {
    it('size=middle 时 columnGap 为 16px', () => {
      const wrapper = mount(YdSpace, {
        props: { size: 'middle' },
      });
      expect(wrapper.attributes('style') ?? '').toMatch(/column-gap:\s*16px/);
    });

    it('size=small 时 columnGap 为 8px', () => {
      const wrapper = mount(YdSpace, {
        props: { size: 'small' },
      });
      expect(wrapper.attributes('style') ?? '').toMatch(/column-gap:\s*8px/);
    });

    it('vertical 方向使用 rowGap', () => {
      const wrapper = mount(YdSpace, {
        props: { direction: 'vertical', size: 'large' },
      });
      expect(wrapper.attributes('style') ?? '').toMatch(/row-gap:\s*24px/);
    });
  });

  describe('wrap', () => {
    it('wrap=true 含 flex-wrap', () => {
      const wrapper = mount(YdSpace, {
        props: { wrap: true },
      });
      expect(wrapper.classes()).toContain('flex-wrap');
    });
  });

  describe('block', () => {
    it('block=true 含 w-full', () => {
      const wrapper = mount(YdSpace, {
        props: { block: true },
      });
      expect(wrapper.classes()).toContain('w-full');
    });
  });
});
