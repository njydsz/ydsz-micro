/**
 * useMessage composable 测试 —— 命令式消息反馈。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\message\useMessage.test.ts
 * @author ydsz-team
 * @since 5.6.0
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

import { useMessage } from './useMessage';

describe('useMessage', () => {
  /** 每个用例前清空模块级兜底容器，保证测试隔离 */
  beforeEach(() => {
    const handler = useMessage();
    handler.clear();
  });

describe('useMessage', () => {
  it('应返回所有消息方法', () => {
    const handler = useMessage();
    expect(typeof handler.success).toBe('function');
    expect(typeof handler.error).toBe('function');
    expect(typeof handler.warning).toBe('function');
    expect(typeof handler.info).toBe('function');
    expect(typeof handler.loading).toBe('function');
    expect(typeof handler.message).toBe('function');
    expect(typeof handler.clear).toBe('function');
    expect(handler.messages).toBeDefined();
  });

  it('success 应返回句柄', () => {
    const handler = useMessage();
    const handle = handler.success('成功');
    expect(typeof handle.close).toBe('function');
  });

  it('消息列表应响应 push 操作', () => {
    const handler = useMessage();
    handler.success('操作成功');
    handler.error('操作失败');
    expect(handler.messages.value.length).toBe(2);
  });

  it('clear 应清空消息', () => {
    const handler = useMessage();
    handler.info('提示1');
    handler.info('提示2');
    expect(handler.messages.value.length).toBeGreaterThan(0);
    handler.clear();
    expect(handler.messages.value.length).toBe(0);
  });

  it('close 应移除指定消息', () => {
    const handler = useMessage();
    const handle = handler.success('成功');
    expect(handler.messages.value.length).toBe(1);
    handle.close();
    expect(handler.messages.value.length).toBe(0);
  });

  it('应支持传入配置对象', () => {
    const handler = useMessage();
    const onClose = vi.fn();
    handler.success('成功', { duration: 5000, isClosable: false, onClose });
    const msg = handler.messages.value[0];
    expect(msg.duration).toBe(5000);
    expect(msg.isClosable).toBe(false);
  });
});
