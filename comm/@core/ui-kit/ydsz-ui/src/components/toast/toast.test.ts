/**
 * Toast composable 单元测试 —— 验证 useToast 消息队列管理。
 *
 * <p>测试范围：add / 快捷方法 / remove / removeGroup / removeByPosition / removeAll、
 * messages 引用同步、configureToast 默认值与 maxVisible 截断。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\toast\toast.test.ts
 * @author ydsz-team
 * @since 26.10.11
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { defineComponent, h } from 'vue';

import { configureToast, messages, useToast } from './use-toast';
import type { ToastMessage } from './types';

/** 走公开 API 清空单例，避免直接改动只读 computed 背后的数组 */
function resetStore(): void {
  useToast().removeAll();
  configureToast({ life: 4500, maxVisible: 0, position: 'top-right' });
}

describe('useToast', () => {
  let toast: ReturnType<typeof useToast>;

  beforeEach(() => {
    resetStore();
    toast = useToast();
  });

  afterEach(() => {
    resetStore();
  });

  /* ---------- add --------- */

  it('add 应创建并插入一条消息到列表顶部', () => {
    const handle = toast.add({ severity: 'info', detail: 'hello' });
    expect(messages.value).toHaveLength(1);
    expect(messages.value[0]?.detail).toBe('hello');
    expect(messages.value[0]?.severity).toBe('info');
    expect(typeof handle.close).toBe('function');
  });

  it('add 应使用默认值（life=4500, closable=true, position=top-right）', () => {
    toast.add({ detail: '默认配置' });
    const msg = messages.value[0] as ToastMessage;
    expect(msg.life).toBe(4500);
    expect(msg.closable).toBe(true);
    expect(msg.position).toBe('top-right');
    expect(msg.severity).toBe('info');
  });

  it('add 应支持 position 与 life=0（常驻）', () => {
    toast.add({ detail: '常驻', life: 0, position: 'bottom-center' });
    const msg = messages.value[0] as ToastMessage;
    expect(msg.position).toBe('bottom-center');
    expect(msg.life).toBe(0);
  });

  it('add 返回的 handle.close 应能移除该条', () => {
    const handle = toast.add({ detail: '将关闭' });
    expect(messages.value).toHaveLength(1);
    handle.close();
    expect(messages.value).toHaveLength(0);
  });

  /* ---------- 快捷方法 --------- */

  it('success 应创建 severity=success 的消息', () => {
    toast.success('成功');
    expect(messages.value).toHaveLength(1);
    expect(messages.value[0]?.severity).toBe('success');
    expect(messages.value[0]?.detail).toBe('成功');
  });

  it('info 应创建 severity=info 的消息', () => {
    toast.info('信息');
    expect(messages.value[0]?.severity).toBe('info');
  });

  it('warning 应创建 severity=warning 的消息', () => {
    toast.warning('警告');
    expect(messages.value[0]?.severity).toBe('warning');
  });

  it('error 应创建 severity=error 的消息', () => {
    toast.error('错误');
    expect(messages.value[0]?.severity).toBe('error');
  });

  it('快捷方法应支持第二参数 options', () => {
    toast.success('带标题', { summary: '完成', position: 'bottom-left' });
    const msg = messages.value[0] as ToastMessage;
    expect(msg.summary).toBe('完成');
    expect(msg.position).toBe('bottom-left');
  });

  /* ---------- remove --------- */

  it('remove 应移除指定 id 的消息', () => {
    toast.add({ detail: '第一条' });
    toast.add({ detail: '第二条' });
    const targetId = messages.value[0]?.id ?? '';
    toast.remove(targetId);
    expect(messages.value).toHaveLength(1);
    expect(messages.value[0]?.detail).toBe('第一条');
  });

  /* ---------- removeByPosition / removeGroup --------- */

  it('removeByPosition 应移除指定位置的全部消息', () => {
    toast.add({ detail: '右上角1', position: 'top-right' });
    toast.add({ detail: '右上角2', position: 'top-right' });
    toast.add({ detail: '左上角1', position: 'top-left' });
    toast.removeByPosition('top-right');
    expect(messages.value).toHaveLength(1);
    expect(messages.value[0]?.detail).toBe('左上角1');
  });

  it('removeGroup 应同位置共存但只移除同组消息', () => {
    toast.add({ detail: '导入1', group: 'import', position: 'top-right' });
    toast.add({ detail: '导入2', group: 'import', position: 'bottom-right' });
    toast.add({ detail: '其他', group: 'export', position: 'top-right' });
    toast.removeGroup('import');
    expect(messages.value).toHaveLength(1);
    expect(messages.value[0]?.detail).toBe('其他');
  });

  /* ---------- removeAll --------- */

  it('removeAll 应清空所有消息', () => {
    toast.success('A');
    toast.error('B');
    toast.warning('C');
    expect(messages.value).toHaveLength(3);
    toast.removeAll();
    expect(messages.value).toHaveLength(0);
  });

  /* ---------- 新消息插顶部 --------- */

  it('新消息应插入列表顶部（最新在上）', () => {
    toast.add({ detail: '第一条' });
    toast.add({ detail: '第二条' });
    toast.add({ detail: '第三条' });
    expect(messages.value[0]?.detail).toBe('第三条');
    expect(messages.value[2]?.detail).toBe('第一条');
  });

  /* ---------- summary / icon / group / closable --------- */

  it('add 应保留 summary / icon / group / closable 字段', () => {
    const CustomIcon = defineComponent({ render: () => h('i') });
    toast.add({
      closable: false,
      detail: '完整字段',
      group: 'my-group',
      icon: CustomIcon,
      severity: 'warning',
      summary: '标题',
    });
    const msg = messages.value[0] as ToastMessage;
    expect(msg.summary).toBe('标题');
    expect(msg.icon).toBe(CustomIcon);
    expect(msg.group).toBe('my-group');
    expect(msg.closable).toBe(false);
  });

  it('add 返回的 handle 应携带该条消息的 id', () => {
    const handle = toast.add({ detail: '带 id' });
    expect(handle.id).toBe(messages.value[0]?.id);
  });

  /* ---------- configureToast --------- */

  it('configureToast 应改写后续 add 的默认 life 与 position', () => {
    configureToast({ life: 1200, position: 'bottom-left' });
    toast.add({ detail: '继承全局配置' });
    const msg = messages.value[0] as ToastMessage;
    expect(msg.life).toBe(1200);
    expect(msg.position).toBe('bottom-left');
  });

  it('configureToast 应支持只覆盖单个字段', () => {
    configureToast({ life: 800 });
    toast.add({ detail: '部分覆盖' });
    const msg = messages.value[0] as ToastMessage;
    expect(msg.life).toBe(800);
    expect(msg.position).toBe('top-right');
  });

  it('显式传入的 life / position 应优先于全局配置', () => {
    configureToast({ life: 800, position: 'bottom-left' });
    toast.add({ detail: '显式覆盖', life: 0, position: 'top-center' });
    const msg = messages.value[0] as ToastMessage;
    expect(msg.life).toBe(0);
    expect(msg.position).toBe('top-center');
  });

  it('maxVisible 应截断最旧的消息', () => {
    configureToast({ maxVisible: 2 });
    toast.add({ detail: '最早' });
    toast.add({ detail: '中间' });
    toast.add({ detail: '最新' });
    expect(messages.value).toHaveLength(2);
    expect(messages.value.map((m) => m.detail)).toEqual(['最新', '中间']);
  });

  it('maxVisible=0 表示不限制条数', () => {
    configureToast({ maxVisible: 1 });
    configureToast({ maxVisible: 0 });
    toast.add({ detail: 'A' });
    toast.add({ detail: 'B' });
    toast.add({ detail: 'C' });
    expect(messages.value).toHaveLength(3);
  });

  /* --------- 多位并发 --------- */

  it('多位置并发消息应各自归类', () => {
    toast.add({ detail: 'A', position: 'top-right' });
    toast.add({ detail: 'B', position: 'bottom-left' });
    toast.add({ detail: 'C', position: 'top-center' });
    expect(messages.value).toHaveLength(3);
    const positions = messages.value.map((m) => m.position);
    expect(positions).toContain('top-right');
    expect(positions).toContain('bottom-left');
    expect(positions).toContain('top-center');
  });
});
