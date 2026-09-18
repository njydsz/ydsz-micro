/**
 * YdInput 组件测试 —— 验证核心交互与 5.6.0 新增能力。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\input\input.test.ts
 * @author ydsz-team
 * @since 1.0.0 (5.6.0 增加 clearable/prefix/suffix/maxlength 用例)
 */
import { describe, expect, it, vi } from 'vitest';

import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import YdInput from './YdInput.vue';

describe('YdInput', () => {
  it('YdInput 应被定义', () => {
    expect(YdInput).toBeDefined();
    expect(typeof YdInput).toBe('object');
  });

  it('应接收 modelValue prop 并渲染对应值', async () => {
    const wrapper = mount(YdInput, {
      props: { modelValue: 'hello' },
    });
    const input = wrapper.find('input');
    expect(input.element.value).toBe('hello');
    wrapper.unmount();
  });

  it('输入时应触发 update:modelValue', async () => {
    const wrapper = mount(YdInput, {
      props: { modelValue: '' },
    });
    const input = wrapper.find('input');
    await input.setValue('test');
    await nextTick();
    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    expect(emitted![0]).toEqual(['test']);
    wrapper.unmount();
  });

  it('clearable：有内容时显示清空按钮，点击清空', async () => {
    const wrapper = mount(YdInput, {
      props: { modelValue: 'content', isClearable: true },
    });
    // 包裹容器出现（因为 suffix 区含清空按钮）
    const wrapperDiv = wrapper.find('.relative.flex');
    expect(wrapperDiv.exists()).toBe(true);

    // 找到清空按钮并点击
    const clearBtn = wrapper.find('button[aria-label="清空输入"]');
    expect(clearBtn.exists()).toBe(true);
    await clearBtn.trigger('click');
    await nextTick();

    // 验证 modelValue 被清空
    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    expect(emitted![emitted!.length - 1]).toEqual(['']);

    // 验证 clear 事件触发
    expect(wrapper.emitted('clear')).toBeTruthy();
    wrapper.unmount();
  });

  it('clearable：无内容时不显示清空按钮', async () => {
    const wrapper = mount(YdInput, {
      props: { modelValue: '', isClearable: true },
    });
    const clearBtn = wrapper.find('button[aria-label="清空输入"]');
    expect(clearBtn.exists()).toBe(false);
    wrapper.unmount();
  });

  it('maxlength + showCount：显示字符计数', async () => {
    const wrapper = mount(YdInput, {
      props: { modelValue: 'abc', maxlength: 10, isShowCount: true },
    });
    const countEl = wrapper.find('.tabular-nums');
    expect(countEl.exists()).toBe(true);
    expect(countEl.text()).toBe('3 / 10');
    wrapper.unmount();
  });

  it('prefix slot 应被渲染', async () => {
    const wrapper = mount(YdInput, {
      props: { modelValue: '' },
      slots: { prefix: '<span class="prefix-text">￥</span>' },
    });
    expect(wrapper.find('.prefix-text').exists()).toBe(true);
    expect(wrapper.text()).toContain('￥');
    wrapper.unmount();
  });

  it('suffix slot 应被渲染', async () => {
    const wrapper = mount(YdInput, {
      props: { modelValue: '' },
      slots: { suffix: '<span class="suffix-text">搜索</span>' },
    });
    expect(wrapper.find('.suffix-text').exists()).toBe(true);
    expect(wrapper.text()).toContain('搜索');
    wrapper.unmount();
  });

  it('disabled：输入框应禁用', async () => {
    const wrapper = mount(YdInput, {
      props: { modelValue: '', disabled: true },
    });
    const input = wrapper.find('input');
    expect(input.element.disabled).toBe(true);
    wrapper.unmount();
  });

  it('readonly：输入框应只读', async () => {
    const wrapper = mount(YdInput, {
      props: { modelValue: '只读', readonly: true },
    });
    const input = wrapper.find('input');
    expect(input.element.readOnly).toBe(true);
    wrapper.unmount();
  });

  it('placeholder 应正确传递', async () => {
    const wrapper = mount(YdInput, {
      props: { modelValue: '', placeholder: '请输入用户名' },
    });
    const input = wrapper.find('input');
    expect(input.attributes('placeholder')).toBe('请输入用户名');
    wrapper.unmount();
  });
});
