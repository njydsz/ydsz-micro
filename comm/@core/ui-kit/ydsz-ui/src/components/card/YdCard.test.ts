/**
 * YdCard 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\card\YdCard.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdCard from './YdCard.vue';
import YdCardContent from './YdCardContent.vue';
import YdCardDescription from './YdCardDescription.vue';
import YdCardFooter from './YdCardFooter.vue';
import YdCardHeader from './YdCardHeader.vue';
import YdCardTitle from './YdCardTitle.vue';

describe('YdCard', () => {
  describe('渲染', () => {
    it('默认渲染 div 容器', () => {
      const wrapper = mount(YdCard, {
        slots: { default: '内容' },
      });
      expect(wrapper.element.tagName).toBe('DIV');
      expect(wrapper.text()).toContain('内容');
    });

    it('默认 shadow=always 含 shadow-raised', () => {
      const wrapper = mount(YdCard);
      expect(wrapper.classes()).toContain('shadow-raised');
    });

    it('应用自定义 class', () => {
      const wrapper = mount(YdCard, {
        props: { class: 'custom-card' },
      });
      expect(wrapper.classes()).toContain('custom-card');
    });
  });

  describe('shadow 变体', () => {
    it('shadow=never 不含 shadow-raised', () => {
      const wrapper = mount(YdCard, {
        props: { shadow: 'never' },
      });
      expect(wrapper.classes()).not.toContain('shadow-raised');
    });

    it('shadow=hover 含 hover:shadow-raised', () => {
      const wrapper = mount(YdCard, {
        props: { shadow: 'hover' },
      });
      expect(wrapper.classes().join(' ')).toMatch(/hover:shadow-raised/);
    });
  });

  describe('hoverable', () => {
    it('hoverable=true 含 cursor-pointer', () => {
      const wrapper = mount(YdCard, {
        props: { hoverable: true },
      });
      expect(wrapper.classes()).toContain('cursor-pointer');
    });
  });

  describe('子组件', () => {
    it('YdCardHeader 渲染 slot', () => {
      const wrapper = mount(YdCardHeader, {
        slots: { default: '头部' },
      });
      expect(wrapper.text()).toContain('头部');
    });

    it('YdCardTitle 渲染为 h3', () => {
      const wrapper = mount(YdCardTitle, {
        slots: { default: '标题' },
      });
      expect(wrapper.element.tagName).toBe('H3');
    });

    it('YdCardDescription 渲染为 p 且含 text-muted-foreground', () => {
      const wrapper = mount(YdCardDescription, {
        slots: { default: '描述' },
      });
      expect(wrapper.element.tagName).toBe('P');
      expect(wrapper.classes()).toContain('text-muted-foreground');
    });

    it('YdCardContent 渲染 slot', () => {
      const wrapper = mount(YdCardContent, {
        slots: { default: '正文' },
      });
      expect(wrapper.text()).toContain('正文');
    });

    it('YdCardFooter 渲染 slot', () => {
      const wrapper = mount(YdCardFooter, {
        slots: { default: '底部' },
      });
      expect(wrapper.text()).toContain('底部');
    });
  });
});
