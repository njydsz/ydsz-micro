/**
 * 可覆盖属性优先级组合式函数：按 插槽 > attrs > props > state 顺序取值。
 *
 * @path comm\@core\composables\src\use-priority-value.ts
 * @author ydsz-team
 * @since 1.0.0
 *
 * @remarks
 * 类型补全说明：
 * - 批量构造函数（usePriorityValues / useForwardPriorityValues）使用 `{} as never` 作为累加器初值。
 *   原因：TypeScript 无法通过类型推断自动收窄「带动态键的 forEach 累加对象」到
 *   `{ [K in keyof T]: ComputedRef<T[K]> }`，此处用 `as never` 直接告知编译器
 *   「该赋值是 await-time 注入完成后的终态」。运行时每个 key 都会在 forEach 内被填充，
 *   最终返回对象的形态与声明类型一致。
 * - `useAttrs() as T`：Vue useAttrs 返回内部 attrs 类型为 `Record<string, unknown>`，
 *   调用侧通过 `as T` 显式声明「组件 props 与 attrs 同构」，由调用方保证类型安全。
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
  // 类型补全：累加器初值声明为 never 类型，告知 TS 运行时由 forEach 完成全部填充
  const result = {} as { [K in keyof T]: ComputedRef<T[K]> };

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
  // 类型补全：累加器初值直接断言为目标映射类型
  const computedResult = {} as { [K in keyof T]: ComputedRef<T[K]> };

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
