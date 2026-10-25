/**
 * useDrawer 命令式 API 测试 —— 验证容器生命周期与 Promise 结算契约。
 *
 * <p>测试范围：文本/组件两种内容渲染、props 透传、close(reason) 来源分类、
 * close()/closeAll() 幂等、onClose 回调只触发一次、条目退场后出列、容器复用。
 *
 * <p>说明：容器由 createApp 独立挂载，因此不走 @vue/test-utils 的
 * transition/teleport 桩，after-leave 会真实触发。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\drawer\use-drawer.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { defineComponent, h, nextTick } from 'vue';

import type { DrawerCloseReason, DrawerInstance, DrawerOptions } from './types';

import { __resetDrawerContainerForTests, closeAllDrawers } from './use-drawer-internal';
import { useDrawer } from './use-drawer';
import { __resetOverlayEscapeStackForTests } from '../../composables/use-overlay-escape';

/** 轮询直到条件成立，避免依赖 Transition 具体时长 */
async function waitFor(condition: () => boolean, timeoutMs = 1000): Promise<void> {
  const startedAt = Date.now();
  while (!condition()) {
    if (Date.now() - startedAt > timeoutMs) throw new Error('[use-drawer.test] 等待条件超时');
    await new Promise((resolve) => setTimeout(resolve, 10));
    await nextTick();
  }
}

/** 当前 body 上的抽屉面板数量 */
function panelCount(): number {
  return document.body.querySelectorAll('[role="dialog"]').length;
}

/** 打开抽屉并等待其渲染落位 */
async function openDrawerInstance(options: DrawerOptions): Promise<DrawerInstance> {
  const { drawer } = useDrawer();
  const instance = await drawer.open(options);
  await nextTick();
  await nextTick();
  return instance;
}

/** Promise 结算结果容器，用 side-channel 收集以免 await 阻塞断言 */
function track(instance: DrawerInstance): { value?: { data?: unknown; reason: DrawerCloseReason } } {
  const box: { value?: { data?: unknown; reason: DrawerCloseReason } } = {};
  void instance.promise.then((payload) => {
    box.value = payload;
  });
  return box;
}

beforeEach(() => {
  __resetOverlayEscapeStackForTests();
  __resetDrawerContainerForTests();
});

afterEach(async () => {
  closeAllDrawers();
  await waitFor(() => panelCount() === 0).catch(() => undefined);
  document.body.innerHTML = '';
  __resetDrawerContainerForTests();
  __resetOverlayEscapeStackForTests();
});

describe('useDrawer 命令式 API', () => {
  it('open 渲染文本内容并在 close() 后出列', async () => {
    const instance = await openDrawerInstance({ content: '命令式内容', header: '详情' });
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.body.textContent).toContain('命令式内容');

    const box = track(instance);
    instance.close();
    await waitFor(() => panelCount() === 0);

    expect(box.value?.reason).toBe('api');
  });

  it('component 与 props 一起透传到内容组件', async () => {
    const Detail = defineComponent({
      props: { recordId: { type: Number, default: 0 } },
      setup(props) {
        return () => h('p', { class: 'imperative-detail' }, `id=${props.recordId}`);
      },
    });

    await openDrawerInstance({ component: Detail, header: '编辑', props: { recordId: 42 } });

    const detail = document.body.querySelector('.imperative-detail');
    expect(detail?.textContent).toBe('id=42');
  });

  it('点击关闭按钮结算 reason=close', async () => {
    const instance = await openDrawerInstance({ header: '关闭按钮' });
    const box = track(instance);

    const button = document.body.querySelector<HTMLButtonElement>('.yd-drawer-close');
    expect(button).not.toBeNull();
    button?.click();
    await waitFor(() => box.value !== undefined);

    expect(box.value?.reason).toBe('close');
  });

  it('点击遮罩结算 reason=mask', async () => {
    const instance = await openDrawerInstance({ header: '遮罩' });
    const box = track(instance);

    document.body.querySelector<HTMLElement>('.yd-drawer-overlay')?.click();
    await waitFor(() => box.value !== undefined);

    expect(box.value?.reason).toBe('mask');
  });

  it('ESC 结算 reason=esc 且只关最上层', async () => {
    const first = await openDrawerInstance({ header: '第一层' });
    const second = await openDrawerInstance({ header: '第二层' });
    const firstBox = track(first);
    const secondBox = track(second);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();
    await waitFor(() => secondBox.value !== undefined);

    expect(secondBox.value?.reason).toBe('esc');
    expect(firstBox.value).toBeUndefined();

    closeAllDrawers();
    await waitFor(() => firstBox.value !== undefined);
    expect(firstBox.value?.reason).toBe('api');
  });

  it('closeAll 一次结算全部抽屉', async () => {
    const a = await openDrawerInstance({ header: 'A' });
    const b = await openDrawerInstance({ header: 'B' });
    const boxA = track(a);
    const boxB = track(b);

    closeAllDrawers();
    await waitFor(() => boxA.value !== undefined && boxB.value !== undefined);

    expect(boxA.value?.reason).toBe('api');
    expect(boxB.value?.reason).toBe('api');
    await waitFor(() => panelCount() === 0);
  });

  it('重复 close 幂等：onClose 与 Promise 只结算一次', async () => {
    const onClose = vi.fn();
    const instance = await openDrawerInstance({ content: '幂等', onClose });
    const box = track(instance);

    instance.close();
    instance.close();
    await waitFor(() => box.value !== undefined);
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith('api');
  });

  it('close(data) 把业务数据带回 Promise', async () => {
    const instance = await openDrawerInstance({ header: '带数据' });
    const box = track(instance);

    instance.close({ saved: true });
    await waitFor(() => box.value !== undefined);

    expect(box.value?.data).toEqual({ saved: true });
    expect(box.value?.reason).toBe('api');
  });

  it('多次 open 复用同一个全局容器节点', async () => {
    await openDrawerInstance({ header: '复用一' });
    await openDrawerInstance({ header: '复用二' });

    expect(document.querySelectorAll('[data-yd-drawer-root]').length).toBe(1);
    expect(panelCount()).toBe(2);
  });
});
