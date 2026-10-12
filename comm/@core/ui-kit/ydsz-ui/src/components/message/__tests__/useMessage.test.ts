/**
 * @file useMessage.test.ts
 * @description useMessage composable 行为测试——队列 / 自动关闭 / 手动关闭 / 类型变体。
 *
 * 注意：useMessage() 在无 Provider 时使用模块级 singleton 容器，
 *       因此 beforeEach 必须清理，避免跨测试状态污染。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\message\__tests__\useMessage.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { MessageConfig } from '../types'
import { useMessage } from '../useMessage'

describe('useMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // 清理模块级 singleton 容器（避免跨测试污染）
    const { clear } = useMessage()
    clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function createHandler() {
    const { message, success, error, warning, info, loading, clear, messages } = useMessage()
    return { message, success, error, warning, info, loading, clear, messages }
  }

  it('message() 推送一条消息（字符串重载）', () => {
    const { messages, message } = createHandler()
    message('hello')
    expect(messages.value).toHaveLength(1)
    expect(messages.value[0]!.content).toBe('hello')
    expect(messages.value[0]!.type).toBe('info')
  })

  it('message() 推送一条消息（对象重载）', () => {
    const { messages, message } = createHandler()
    const config: MessageConfig = { content: 'test', type: 'success', duration: 5000 }
    message(config)
    expect(messages.value[0]!.type).toBe('success')
    expect(messages.value[0]!.duration).toBe(5000)
  })

  it('success() 快捷方法：type = success', () => {
    const { messages, success } = createHandler()
    success('操作成功')
    expect(messages.value[0]!.type).toBe('success')
  })

  it('error() 快捷方法：type = error', () => {
    const { messages, error } = createHandler()
    error('出错了')
    expect(messages.value[0]!.type).toBe('error')
  })

  it('warning() 快捷方法：type = warning', () => {
    const { messages, warning } = createHandler()
    warning('注意')
    expect(messages.value[0]!.type).toBe('warning')
  })

  it('loading() 快捷方法：type = loading', () => {
    const { messages, loading } = createHandler()
    loading('加载中')
    expect(messages.value[0]!.type).toBe('loading')
  })

  it('duration 到期后自动移除', () => {
    const { messages, message } = createHandler()
    message({ content: 'auto close', duration: 3000 })
    expect(messages.value).toHaveLength(1)

    vi.advanceTimersByTime(3000)
    expect(messages.value).toHaveLength(0)
  })

  it('duration = 0 时不自动关闭', () => {
    const { messages, message } = createHandler()
    message({ content: 'sticky', duration: 0 })
    vi.advanceTimersByTime(99999)
    expect(messages.value).toHaveLength(1)
  })

  it('handle.close() 手动关闭', () => {
    const { messages, message } = createHandler()
    const handle = message({ content: 'manual close', duration: 0 })
    expect(messages.value).toHaveLength(1)
    handle.close()
    expect(messages.value).toHaveLength(0)
  })

  it('clear() 清空所有消息', () => {
    const { messages, message, clear } = createHandler()
    message({ content: 'msg1', duration: 0 })
    message({ content: 'msg2', duration: 0 })
    message({ content: 'msg3', duration: 0 })
    expect(messages.value).toHaveLength(3)
    clear()
    expect(messages.value).toHaveLength(0)
  })

  it('队列上限：超出时移除最早一条', () => {
    const { messages, message } = createHandler()
    for (let i = 0; i < 6; i++)
      message({ content: `msg${i}`, duration: 0 })

    expect(messages.value).toHaveLength(5)
    expect(messages.value[0]!.content).toBe('msg1')
    expect(messages.value[4]!.content).toBe('msg5')
  })

  it('onClose 回调在关闭时触发', () => {
    const { message } = createHandler()
    const onClose = vi.fn()
    const handle = message({ content: 'cb test', duration: 0, onClose })
    handle.close()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('默认 config 值：isClosable = true, duration = 3000, type = info', () => {
    const { messages, message } = createHandler()
    message('defaults')
    const m = messages.value[0]!
    expect(m.isClosable).toBe(true)
    expect(m.duration).toBe(3000)
    expect(m.type).toBe('info')
  })
})
