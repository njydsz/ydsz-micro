/**
 * Toast composable 单元测试 —— 验证 useToast 消息队列管理。
 *
 * <p>测试范围：add / success / info / warning / error / remove / removeGroup / removeAll，
 * 以及 messages 引用同步。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\toast\toast.test.ts
 * @author ydsz-team
 * @since 26.10.11
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { messages, useToast } from './use-toast';
import type { ToastMessage } from './types';

function resetStore(): void {
  // 直接清空模块级 ref
  messages.value.splice(0, messages.value.length);
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

  /* ---------- removeGroup --------- */

  it('removeGroup 应移除指定位置的全部消息', () => {
    toast.add({ detail: '右上角1', position: 'top-right' });
    toast.add({ detail: '右上角2', position: 'top-right' });
    toast.add({ detail: '左上角1', position: 'top-left' });
    toast.removeGroup('top-right');
    expect(messages.value).toHaveLength(1);
    expect(messages.value[0]?.detail).toBe('左上角1');
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
    toast.add({
      closable: false,
      detail: '完整字段',
      group: 'my-group',
      icon: '<svg/>',
      severity: 'warning',
      summary: '标题',
    });
    const msg = messages.value[0] as ToastMessage;
    expect(msg.summary).toBe('标题');
    expect(msg.icon).toBe('<svg/>');
    expect(msg.group).toBe('my-group');
    expect(msg.closable).toBe(false);
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
