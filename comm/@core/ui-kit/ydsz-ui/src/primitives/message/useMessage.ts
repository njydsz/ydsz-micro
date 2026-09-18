/**
 * @file useMessage.ts
 * @description 命令式消息反馈 composable —— 优先取 MessageProvider 上下文，
 *              无 Provider 时回退到模块级独立容器（保证任何调用点可用）。
 *
 * 架构对齐 component-optimization-plan.md P0-C：
 *   - 组件库为一等公民位置
 *   - effects/notification/use-toast 改为 deprecated re-export 桥接
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\message\useMessage.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import type { ComputedRef, Ref } from 'vue'

import { computed, getCurrentInstance, inject, ref } from 'vue'

import type { MessageConfig, MessageHandle, MessageInstance, MessageType } from './types'

/** 注入 key（Symbol 避免冲突） */
export const MESSAGE_PROVIDER_KEY = Symbol('ydsz-message-provider') as InjectionKey<MessageProviderContext>

/** MessageProvider 暴露给注入者的契约 */
export interface MessageProviderContext {
  /** 当前消息列表（响应式） */
  messages: Ref<MessageInstance[]>
  /** 推送一条消息 */
  push: (config: MessageConfig) => MessageHandle
  /** 移除一条消息 */
  remove: (id: string) => void
  /** 清空所有消息 */
  clear: () => void
}

/** 模块级独立容器实例（未挂 Provider 时的降级） */
let fallbackContainer: MessageProviderContext | null = null

/** 生成唯一 ID */
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 创建消息容器（Provider 或降级共用）。
 *
 * 队列上限 5 条，溢出时移除最早一条。
 */
function createContainer(): MessageProviderContext {
  const messages = ref<MessageInstance[]>([])
  const MAX_QUEUE = 5

  function push(config: MessageConfig): MessageHandle {
    const instance: MessageInstance = {
      id: generateId(),
      content: config.content,
      type: config.type ?? 'info',
      duration: config.duration ?? 3000,
      isClosable: config.isClosable ?? true,
      onClose: config.onClose,
      createdAt: Date.now(),
    }

    messages.value = [...messages.value, instance]

    // 队列溢出：移除最早一条
    if (messages.value.length > MAX_QUEUE) {
      const removed = messages.value.shift()
      removed?.onClose?.()
    }

    // 自动关闭
    if (instance.duration > 0) {
      setTimeout(() => {
        remove(instance.id)
      }, instance.duration)
    }

    return {
      close: () => remove(instance.id),
    }
  }

  function remove(id: string): void {
    const index = messages.value.findIndex((m): boolean => m.id === id)
    if (index === -1)
      return
    const [removed] = messages.value.splice(index, 1)
    removed?.onClose?.()
  }

  function clear(): void {
    messages.value.forEach((m): void => m.onClose?.())
    messages.value = []
  }

  return { messages, push, remove, clear }
}

/**
 * 获取消息容器（Provider 优先，降级独立容器兜底）。
 */
function getContainer(): MessageProviderContext {
  // 仅在 Vue 上下文中尝试注入 Provider，否则回退到模块级容器
  const instance = getCurrentInstance()
  if (instance) {
    const provider = inject(MESSAGE_PROVIDER_KEY, null)
    if (provider)
      return provider
  }
  if (!fallbackContainer)
    fallbackContainer = createContainer()
  return fallbackContainer
}

/** useMessage 返回句柄 */
export interface UseMessageHandler {
  /** 消息列表（用于自绘 Provider 外的场景） */
  messages: ComputedRef<MessageInstance[]>
  /** 通用消息 */
  message: (config: MessageConfig | string) => MessageHandle
  /** 成功消息 */
  success: (content: string, config?: Omit<MessageConfig, 'content' | 'type'>) => MessageHandle
  /** 错误消息 */
  error: (content: string, config?: Omit<MessageConfig, 'content' | 'type'>) => MessageHandle
  /** 警告消息 */
  warning: (content: string, config?: Omit<MessageConfig, 'content' | 'type'>) => MessageHandle
  /** 信息消息 */
  info: (content: string, config?: Omit<MessageConfig, 'content' | 'type'>) => MessageHandle
  /** 加载消息 */
  loading: (content: string, config?: Omit<MessageConfig, 'content' | 'type'>) => MessageHandle
  /** 清空所有 */
  clear: () => void
}

/**
 * 消息反馈 composable。
 *
 * @example
 * ```ts
 * const { success, error } = useMessage()
 * success('保存成功！')
 * error('网络异常', { duration: 5000 })
 * ```
 */
export function useMessage(): UseMessageHandler {
  const container = getContainer()

  const messages = computed<MessageInstance[]>((): MessageInstance[] => container.messages.value)

  function normalizeConfig(config: MessageConfig | string, type: MessageType): MessageInstance {
    const base: MessageConfig = typeof config === 'string' ? { content: config, type } : { ...config, type }
    return {
      id: generateId(),
      content: base.content,
      type,
      duration: base.duration ?? 3000,
      isClosable: base.isClosable ?? true,
      onClose: base.onClose,
      createdAt: Date.now(),
    }
  }

  function pushByType(config: MessageConfig | string, type: MessageType): MessageHandle {
    if (typeof config === 'string')
      return container.push({ content: config, type })
    return container.push({ ...config, type })
  }

  return {
    messages,
    message: (config): MessageHandle => container.push(typeof config === 'string' ? { content: config } : config),
    success: (content, config): MessageHandle => pushByType(config ? { ...config, content, type: 'success' } : content, 'success'),
    error: (content, config): MessageHandle => pushByType(config ? { ...config, content, type: 'error' } : content, 'error'),
    warning: (content, config): MessageHandle => pushByType(config ? { ...config, content, type: 'warning' } : content, 'warning'),
    info: (content, config): MessageHandle => pushByType(config ? { ...config, content, type: 'info' } : content, 'info'),
    loading: (content, config): MessageHandle => pushByType(config ? { ...config, content, type: 'loading' } : content, 'loading'),
    clear: (): void => container.clear(),
  }
}
