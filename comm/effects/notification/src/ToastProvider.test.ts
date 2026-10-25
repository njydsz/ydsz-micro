/**
 * ToastProvider 组件测试 —— 验证浮层队列的生命周期契约。
 *
 * <p>测试范围：duration 到点自动出队、duration=0 常驻、关闭按钮手动出队、
 * 悬停暂停按剩余时间续算、severity 对应的 ARIA 角色、卸载后清理定时器。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\effects\notification\src\ToastProvider.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ToastProvider from './ToastProvider.vue';
import { getGlobalToastState } from './toast-state';
import { showToast } from './use-toast';

/** 队列快照，便于断言 */
function queueSize(): number {
  return getGlobalToastState().toasts.value.length;
}

/** 清空全局队列，避免用例间相互污染 */
function resetQueue(): void {
  getGlobalToastState().toasts.value = [];
}

/** 挂载 Provider 并等待 push 触发的 watcher 完成 */
async function mountProvider(): Promise<ReturnType<typeof mount>> {
  const wrapper = mount(ToastProvider);
  await flushPromises();
  return wrapper;
}

/** 发送一条 toast 并等待渲染 */
async function push(
  send: (title: string, options?: { description?: string; duration?: number }) => number,
  title: string,
  options?: { description?: string; duration?: number },
): Promise<number> {
  const id = send(title, options);
  await flushPromises();
  return id;
}

describe('ToastProvider', () => {
  beforeEach(() => {
    resetQueue();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetQueue();
  });

  it('duration 到点应自动从队列移除', async () => {
    const wrapper = await mountProvider();
    showToast.success('保存成功', { duration: 1000 });
    await flushPromises();
    expect(wrapper.text()).toContain('保存成功');

    vi.advanceTimersByTime(999);
    expect(queueSize()).toBe(1);

    vi.advanceTimersByTime(1);
    expect(queueSize()).toBe(0);
    wrapper.unmount();
  });

  it('duration=0 应常驻不自动关闭', async () => {
    const wrapper = await mountProvider();
    showToast('需要手动确认', { duration: 0 });
    await flushPromises();

    vi.advanceTimersByTime(60_000);
    expect(queueSize()).toBe(1);
    wrapper.unmount();
  });

  it('点击关闭按钮应立即出队', async () => {
    const wrapper = await mountProvider();
    await push(showToast.info, '临时提示', { duration: 5000 });

    await wrapper.find('button').trigger('click');
    expect(queueSize()).toBe(0);
    wrapper.unmount();
  });

  it('悬停暂停后按剩余时间续算，移出不再重新计满', async () => {
    const wrapper = await mountProvider();
    await push(showToast.info, '会被暂停', { duration: 1000 });
    const viewport = wrapper.get('div');

    vi.advanceTimersByTime(400);
    await viewport.trigger('mouseenter');

    vi.advanceTimersByTime(5000);
    expect(queueSize()).toBe(1);

    await viewport.trigger('mouseleave');
    vi.advanceTimersByTime(599);
    expect(queueSize()).toBe(1);

    vi.advanceTimersByTime(1);
    expect(queueSize()).toBe(0);
    wrapper.unmount();
  });

  it('error / warning 使用 role=alert，其余使用 role=status', async () => {
    const wrapper = await mountProvider();
    showToast.error('出错了', { duration: 0 });
    showToast.warning('请注意', { duration: 0 });
    showToast.success('已完成', { duration: 0 });
    await flushPromises();

    expect(wrapper.findAll('[role="alert"]')).toHaveLength(2);
    expect(wrapper.findAll('[role="status"]')).toHaveLength(1);
    wrapper.unmount();
  });

  it('卸载后不应留下定时器继续改动全局队列', async () => {
    const wrapper = await mountProvider();
    const id = showToast.info('跟随卸载', { duration: 1000 });
    await flushPromises();

    wrapper.unmount();
    vi.advanceTimersByTime(2000);
    expect(queueSize()).toBe(1);

    getGlobalToastState().dismiss(id);
    expect(queueSize()).toBe(0);
  });
});
