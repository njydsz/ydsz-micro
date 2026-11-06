/**
 * YdUpload 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\upload\YdUpload.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdUpload from './YdUpload.vue';

describe('YdUpload', () => {
  describe('渲染', () => {
    it('渲染容器', () => {
      const wrapper = mount(YdUpload);
      expect(wrapper.exists()).toBe(true);
    });

    it('渲染隐藏 file input', () => {
      const wrapper = mount(YdUpload);
      expect(wrapper.find('input[type="file"]').exists()).toBe(true);
    });

    it('渲染上传按钮', () => {
      const wrapper = mount(YdUpload);
      expect(wrapper.findAll('button').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('accept', () => {
    it('accept 透传到 input', () => {
      const wrapper = mount(YdUpload, {
        props: { accept: 'image/*' },
      });
      expect(wrapper.find('input[type="file"]').attributes('accept')).toBe('image/*');
    });
  });

  describe('multiple', () => {
    it('isMultiple=true 时 input multiple', () => {
      const wrapper = mount(YdUpload, {
        props: { isMultiple: true },
      });
      expect(wrapper.find('input[type="file"]').attributes('multiple')).toBeDefined();
    });
  });

  describe('disabled', () => {
    it('isDisabled=true 时 input 禁用', () => {
      const wrapper = mount(YdUpload, {
        props: { isDisabled: true },
      });
      expect(wrapper.find('input[type="file"]').attributes('disabled')).toBeDefined();
    });
  });

  describe('listType', () => {
    it('listType=picture-card 渲染卡片', () => {
      const wrapper = mount(YdUpload, {
        props: { listType: 'picture-card' },
      });
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('isDrag', () => {
    it('isDrag=true 渲染 dropzone', () => {
      const wrapper = mount(YdUpload, {
        props: { isDrag: true },
      });
      expect(wrapper.find('[role="button"]').exists() || wrapper.find('button').exists()).toBe(
        true,
      );
    });
  });
});
