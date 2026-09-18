/**
 * @file use-controlled-state.ts
 * @description 受控状态增强 composable —— ydsz-vue 业务特化层。
 *
 * 在标准 v-model 受控模式之上，为 B 端表单场景提供：
 *  1. 脏值追踪（isDirty）—— 值与外部 modelValue 不同时为脏
 *  2. 防抖提交（debounced commit）—— 高频输入场景下合并 v-model 更新
 *  3. 重置能力（reset）—— 一键回到初始 modelValue
 *  4. 提交前校验钩子（onBeforeCommit）—— 返回 false 阻断提交
 *
 * 这是 ydsz-vue fork-and-own 后第一个业务特化 API，
 * 上游 reka-ui 提供通用原语，我们在此之上构建 B 端专属语义。
 *
 * @path comm\@core\ui-kit\ydsz-vue\src\composables\use-controlled-state.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import type { Ref } from 'vue'

import { ref, watch } from 'vue'

import { useForwardPropsEmits } from '../shared'

/** useControlledState 配置项 */
export interface UseControlledStateOptions<T> {
  /** 防抖等待时间（ms），0 表示不防抖 */
  debounce?: number
  /** 提交前的同步校验钩子，返回 false 则阻断本次提交 */
  onBeforeCommit?: (newValue: T, oldValue: T) => boolean | Promise<boolean>
  /** 脏值判定函数，默认使用严格不等（!==） */
  isDirty?: (newValue: T, oldValue: T) => boolean
}

/** useControlledState 返回句柄 */
export interface ControlledStateHandle<T> {
  /** 本地状态（UI 直接绑定） */
  localValue: Ref<T>
  /** 当前是否为脏值 */
  isDirty: Ref<boolean>
  /**
   * 手动提交本地值到外部（触发 'update:modelValue'）。
   * 会经过 onBeforeCommit 钩子。
   */
  commit: () => Promise<boolean>
  /** 重置到最近提交的值 */
  reset: () => void
  /** 放弃本地修改，强制与外部 modelValue 同步 */
  sync: () => void
}

/** 受控状态 props 基线契约（TS 已知字段） */
interface ControlledProps {
  modelValue?: unknown
  model_value?: unknown
}

/** 受控状态 emit 签名 */
type ControlledEmit<T> = (event: 'update:modelValue', value: T) => void

/**
 * 带脏值追踪 + 防抖 + 校验钩子的受控状态管理。
 *
 * @param props       组件 props（需包含 modelValue）
 * @param emit        组件 emit 函数
 * @param options     防抖 / 校验 / 脏值判定配置
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const props = defineProps<{ modelValue: string }>()
 * const emit = defineEmits<{ 'update:modelValue': [string] }>()
 *
 * const { localValue, isDirty, commit, reset } = useControlledState(props, emit, {
 *   debounce: 300,
 *   onBeforeCommit: (v) => v.length > 0,
 * })
 * </script>
 * ```
 */
export function useControlledState<T>(
  props: ControlledProps,
  emit: ControlledEmit<T>,
  options: UseControlledStateOptions<T> = {},
): ControlledStateHandle<T> {
  const {
    debounce = 0,
    onBeforeCommit,
    isDirty: dirtyComparator,
  } = options

  const modelValue = (props.modelValue ?? props.model_value) as T

  /** 内部状态：用于 UI 双向绑定 */
  const localValue = ref(structClone(modelValue)) as Ref<T>

  /** 脏值标记 */
  const isDirtyRef = ref(false)

  /** 记录上次提交成功的值，作为脏值比对基准 */
  const committedValue = ref(structClone(modelValue)) as Ref<T>

  /** 防抖计时器句柄 */
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  /** 计算当前是否脏 */
  function computeDirty(newValue: T): boolean {
    if (dirtyComparator)
      return dirtyComparator(newValue, committedValue.value)
    return newValue !== committedValue.value
  }

  /**
   * 提交本地值到外部。
   * 经过 onBeforeCommit 校验钩子，通过后才 emit 'update:modelValue'，
   * 并更新 committedValue 基准。
   */
  async function commit(): Promise<boolean> {
    const newValue = localValue.value
    const oldValue = committedValue.value

    if (onBeforeCommit) {
      const result = await onBeforeCommit(newValue, oldValue)
      if (!result)
        return false
    }

    committedValue.value = structClone(newValue)
    isDirtyRef.value = false
    emit('update:modelValue', structClone(newValue))
    return true
  }

  /** 重置到最近提交的值 */
  function reset(): void {
    localValue.value = structClone(committedValue.value)
    isDirtyRef.value = false
    disposeDebounce()
  }

  /** 强制同步：放弃本地修改，回到外部 modelValue */
  function sync(): void {
    const external = (props.modelValue ?? props.model_value) as T
    localValue.value = structClone(external)
    committedValue.value = structClone(external)
    isDirtyRef.value = false
    disposeDebounce()
  }

  /** 清理残留防抖计时器 */
  function disposeDebounce(): void {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  /** localValue 变化时：更新脏值标记 + 按配置决定是否自动提交 */
  watch(localValue, (newVal: T) => {
    isDirtyRef.value = computeDirty(newVal)

    if (debounce > 0) {
      // 防抖模式：延迟自动提交
      disposeDebounce()
      debounceTimer = setTimeout(() => {
        void commit()
      }, debounce)
    }
  })

  /** 外部 modelValue 变化时：同步内部状态（非脏） */
  watch(
    () => (props.modelValue ?? props.model_value),
    (newExternal: unknown) => {
      if (!computeDirty(localValue.value))
        sync()
    },
  )

  return {
    localValue,
    isDirty: isDirtyRef,
    commit,
    reset,
    sync,
  }
}

/** 浅拷贝，防止对象引用透传导致上下游状态串扰 */
function structClone<T>(value: T): T {
  if (value === null || value === undefined || typeof value !== 'object')
    return value
  if (Array.isArray(value))
    return [...value] as T
  return { ...value }
}

// 透出共享工具，保持与 radix 同源路径一致
export { useForwardPropsEmits }
