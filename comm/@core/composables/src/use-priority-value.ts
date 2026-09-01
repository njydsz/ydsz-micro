/**
 * 可覆盖属性优先级组合式函数：按 插槽 > attrs > props > state 顺序取值。
 *
 * @path comm\@core\composables\src\use-priority-value.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { ComputedRef, Ref } from 'vue';

import { computed, getCurrentInstance, unref, useAttrs, useSlots } from 'vue';

import {
  getFirstNonNullOrUndefined,
  kebabToCamelCase,
} from '@YDSZ-core/shared/utils';

/**
 * 依次从插槽、attrs、props、state 中获取值
 * @param key
 * @param props
 * @param state
 */
export function usePriorityValue<
  T extends object,
  S extends object,
  K extends keyof T = keyof T,
>(key: K, props: T, state: Readonly<Ref<NoInfer<S>>> | undefined) {
  const instance = getCurrentInstance();
  const slots = useSlots();
  const attrs = useAttrs() as T;

  const value = computed((): T[K] => {
    // props不管有没有传，都会有默认值，会影响这里的顺序，
    // 通过判断原始props是否有值来判断是否传入
    const rawProps = (instance?.vnode?.props || {}) as T;

    const standardRawProps = {} as T;

    for (const [propKey, propValue] of Object.entries(rawProps)) {
      standardRawProps[kebabToCamelCase(propKey) as K] = propValue as T[K];
    }
    const propsKey =
      standardRawProps?.[key] === undefined ? undefined : props[key];

    // slot可以关闭（slot/attrs/state 均为运行时透传来源，按 unknown 收窄后统一裁决）
    return getFirstNonNullOrUndefined(
      slots[key as string] as unknown,
      attrs[key] as unknown,
      propsKey as unknown,
      state?.value?.[key as unknown as keyof S] as unknown,
    ) as T[K];
  });

  return value;
}

/**
 * 批量获取state中的值（每个值都是ref）
 * @param props
 * @param state
 */
export function usePriorityValues<
  T extends object,
  S extends Ref<object> = Readonly<Ref<NoInfer<T>, NoInfer<T>>>,
>(props: T, state: S | undefined) {
  const result: { [K in keyof T]: ComputedRef<T[K]> } = {} as never;

  (Object.keys(props) as (keyof T)[]).forEach((key) => {
    result[key] = usePriorityValue(key as keyof typeof props, props, state);
  });

  return result;
}

/**
 * 批量获取state中的值（集中在一个computed，用于透传）
 * @param props
 * @param state
 */
export function useForwardPriorityValues<
  T extends object,
  S extends Ref<object> = Readonly<Ref<NoInfer<T>, NoInfer<T>>>,
>(props: T, state: S | undefined) {
  const computedResult: { [K in keyof T]: ComputedRef<T[K]> } = {} as never;

  (Object.keys(props) as (keyof T)[]).forEach((key) => {
    computedResult[key] = usePriorityValue(
      key as keyof typeof props,
      props,
      state,
    );
  });

  return computed(() => {
    const unwrapResult: Record<string, unknown> = {};
    Object.keys(props).forEach((key) => {
      // 索引收窄：key 来自 props 自身键集合，computedResult 必含对应条目
      unwrapResult[key] = unref(
        computedResult[key as keyof typeof computedResult],
      );
    });
    return unwrapResult as { [K in keyof T]: T[K] };
  });
}
