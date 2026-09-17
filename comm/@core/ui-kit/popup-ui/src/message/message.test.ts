/**
 * message 命令式 API 测试 — 验证注册表增删、同内容去重、按类型排序与关闭回调
 *
 * <p>宿主席的 DOM 渲染依赖浏览器环境，这里集中在 message.ts 的纯逻辑层断言；
 * 云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\popup-ui\src\message\message.test.ts
 * @author ydsz-team
 * @since 5.3.0
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

import { nextTick } from 'vue';

import { messageList, sortedMessages } from './message';
import {
  ydszMessage,
  messageError,
  messageInfo,
  messageLoading,
  messageSuccess,
  closeMessage,
  closeAllMessages,
  unmountHost,
} from './message';

describe('message 命令式 API', () => {
  afterEach(() => {
    closeAllMessages();
    unmountHost();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('应真实挂载宿主席并在 body 渲染消息条目', async () => {
    ydszMessage('已保存', { type: 'success' });
    await nextTick();

    expect(document.querySelector('[data-message-item]')).toBeTruthy();
  });

  it('字符串入参应默认 info 类型并写入注册表', () => {
    const id = ydszMessage('已保存');

    expect(id).toMatch(/^ydsz-msg-/);
    expect(messageList.value).toHaveLength(1);
    expect(messageList.value[0].content).toBe('已保存');
    expect(messageList.value[0].type).toBe('info');
    expect(messageList.value[0].duration).toBe(3000);
  });

  it('对象入参应完整透传配置', () => {
    const onClose = vi.fn();
    ydszMessage({
      content: '服务不可用',
      type: 'error',
      duration: 5000,
      closable: true,
      onClose,
    });

    const item = messageList.value[0];
    expect(item.type).toBe('error');
    expect(item.closable).toBe(true);
    expect(item.onClose).toBe(onClose);
  });

  it('loading 快捷键应常驻（duration=0）', () => {
    messageLoading('正在生成');

    const item = messageList.value[0];
    expect(item.type).toBe('loading');
    expect(item.duration).toBe(0);
  });

  it('同内容同类型应去重复用 id，不同类型不去重', () => {
    const a = messageSuccess('同步完成');
    const b = messageSuccess('同步完成');
    expect(b).toBe(a);
    expect(messageList.value).toHaveLength(1);

    const c = ydszMessage('同步完成');
    expect(c).not.toBe(a);
    expect(messageList.value).toHaveLength(2);
  });

  it('sortedMessages 应将 loading 置顶，其余按原序', async () => {
    messageInfo('普通1');
    messageError('错误');
    messageSuccess('成功');
    const list = sortedMessages.value.map((i) => i.type);
    expect(list[0]).toBe('error');
    // 无 loading 时保持稳定顺序
    expect(list).toEqual(['error', 'success', 'info']);

    messageLoading('常驻');
    const withLoading = sortedMessages.value.map((i) => i.type);
    expect(withLoading[0]).toBe('loading');
  });

  it('closeMessage 应在动画后移除并触发回调', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const id = ydszMessage('即将关闭');
    expect(messageList.value).toHaveLength(1);

    closeMessage(id, onClose);
    expect(messageList.value[0].leaving).toBe(true);

    vi.advanceTimersByTime(200);
    expect(messageList.value).toHaveLength(0);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
