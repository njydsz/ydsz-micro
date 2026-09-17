/**
 * AgentStatusBadge 组件测试 — 验证状态徽章渲染行为
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 */

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AgentStatusBadge from './agent-status-badge.vue';
import type { AgentStatus } from './agent-status-badge.vue';

/**
 * 状态 → 期望显示的中文标签
 */
const STATUS_LABEL_MAP: Record<AgentStatus, string> = {
  idle: '空闲',
  running: '运行中',
  paused: '已暂停',
  error: '异常',
};

describe('AgentStatusBadge', () => {
  it('running 状态应显示「运行中」文字', () => {
    const wrapper = mount(AgentStatusBadge, { props: { status: 'running' } });
    expect(wrapper.text()).toContain('运行中');
    expect(wrapper.find('[data-testid="agent-status-badge"]').exists()).toBe(true);
  });

  it.each([
    ['idle', '空闲'],
    ['running', '运行中'],
    ['paused', '已暂停'],
    ['error', '异常'],
  ] as const)('%s 状态应显示「%s」', (status, expectedLabel) => {
    const wrapper = mount(AgentStatusBadge, { props: { status } });
    expect(wrapper.text()).toContain(expectedLabel);
  });

  it('应包含对应状态的 CSS 类名', () => {
    const wrapper = mount(AgentStatusBadge, { props: { status: 'error' } });
    const classes = wrapper.find('[data-testid="agent-status-badge"]').classes();
    expect(classes).toContain('bg-red-100');
    expect(classes).toContain('text-red-700');
  });

  it('showLabel=false 时不显示文字但 DOM 保留', () => {
    const wrapper = mount(AgentStatusBadge, {
      props: { status: 'paused', showLabel: false },
    });
    expect(wrapper.text()).toBe('');
    expect(wrapper.find('[data-testid="agent-status-badge"]').exists()).toBe(true);
  });

  it('应包含基础样式类名', () => {
    const wrapper = mount(AgentStatusBadge, { props: { status: 'idle' } });
    const classes = wrapper.find('[data-testid="agent-status-badge"]').classes();
    expect(classes).toContain('inline-flex');
    expect(classes).toContain('rounded-full');
  });
});
