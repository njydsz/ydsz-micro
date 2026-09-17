/**
 * 表单字段级订阅 —— 隔离大型表单字段变更的响应式影响范围。
 *
 * <p>痛点：默认情况下，vee-validate 的 form.values 是一个深层 reactive 对象，
 * 任意字段变更都触发所有使用 `form.values` 的 computed 与 watch 重新求值。
 * 100+ 字段的复杂表单（workflow 动态表单）每秒多次重渲染，造成卡顿。
 *
 * <p>本 composable 提供两个能力：
 * 1. `watchField` —— 仅监听单个字段值变化，其他字段变更不触发回调；
 * 2. `useFieldValue` —— 返回仅依赖指定字段的 computed ref，
 *    当且仅当该字段值变化时通知依赖它的渲染层。
 *
 * <p>使用方式：替换直接 `watch(() => form.values.xxx, cb)` 为
 * `watchField(form, 'xxx', cb)`，性能提升在 50+ 字段表单中尤为显著。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\form-ui\src\use-field-subscription.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import type { MaybeRef } from 'vue';

import {
  computed,
  isRef,
  watch,
  type ComputedRef,
  type Ref,
  type WatchCallback,
  type WatchOptions,
  type WatchStopHandle,
} from 'vue';

import { get } from '@ydsz-core/shared/utils';

/** 最小化的 vee-validate 表单接口 —— 只取用实现所必须的形状 */
interface FieldFormLike {
  values: Record<string, unknown>;
}

/** 字段订阅句柄：停监听 + 最新值快照 */
export interface FieldSubscription<T = unknown> {
  /** 停止监听 */
  stop: WatchStopHandle;
  /** 当前字段值（非响应式快照，仅作初始值使用） */
  snapshot: T;
}

/** 字段级计算属性句柄 */
export interface FieldValueHandle<T = unknown> {
  /** 字段值的计算属性 —— 仅当字段值变化时标记为 dirty */
  value: ComputedRef<T>;
  /** 字段值的 Ref（可能为 undefined 若从未被写入） */
  raw: Ref<T | undefined>;
}

/**
 * 以字段为粒度注册 watch：源 getter 只读取单个字段路径，
 * 因此其他字段的变化不会触发回调。
 *
 * @param form - vee-validate 表单实例（需持有 `values` 对象）
 * @param fieldName - 字段名，支持 `a.b` 嵌套路径
 * @param callback - 字段值变化时的回调
 * @param options - watch 选项（deep / flush 等）
 * @return 返回停监听句柄 + 快照值，便于业务异步场景使用
 *
 * @example
 * ```ts
 * // 只响应 status 字段变化，其他 99 个字段改动不会重新求值
 * const sub = watchField(form, 'status', (newVal) => {
 *   toggleDependentFields(newVal);
 * });
 * onUnmounted(() => sub.stop());
 * ```
 */
export function watchField<T = unknown>(
  form: FieldFormLike,
  fieldName: string,
  callback: WatchCallback<T, T | undefined>,
  options: WatchOptions = {},
): FieldSubscription<T> {
  const getter = () => get(form.values, fieldName) as T;

  const stop = watch(getter, callback, options);

  return {
    snapshot: getter(),
    stop,
  };
}

/**
 * 订阅多个字段：仅当任一指定字段变化时回调，其它字段不影响。
 *
 * @param form - vee-validate 表单实例
 * @param fieldNames - 要监听的字段名数组
 * @param callback - 多字段联合变化回调；每项给出字段名与当前值
 * @param options - watch 选项
 * @return 停监听句柄
 *
 * @example
 * ```ts
 * watchMultipleFields(
 *   form,
 *   ['startTime', 'endTime'],
 *   (vals) => { duration.value = calcDuration(vals); },
 * );
 * ```
 */
export function watchMultipleFields(
  form: FieldFormLike,
  fieldNames: string[],
  callback: (values: Array<{ field: string; value: unknown }>) => void,
  options: WatchOptions = {},
): WatchStopHandle {
  // 以 JSON 序列化作为 watch 源，确保数组/对象内容变化能被检测到
  // （Vue 默认 watch 对 getter 返回的引用类型只做浅比较）
  const getter = () =>
    JSON.stringify(
      fieldNames.map((name) => ({
        field: name,
        value: get(form.values, name),
      })),
    );

  return watch(
    getter,
    (newJson, oldJson) => {
      if (newJson === oldJson) return;
      const parsed: Array<{ field: string; value: unknown }> =
        JSON.parse(newJson);
      callback(parsed);
    },
    options,
  );
}

/**
 * 字段级计算属性 handle：返回的 computed 当且仅当该字段值变化时重新求值。
 *
 * <p>对比直接用 `computed(() => form.values[fieldName])`，
 * 本函数用 `get` 精确读取路径，避免 vee-validate 的深层 reactive 代理
 * 导致整个 values 对象被依赖追踪。
 *
 * @param source - 表单实例或者持有 values 的 reactive / ref 对象
 * @param fieldName - 字段名，支持嵌套路径
 * @param fallback - 字段不存在时的默认值
 * @return 仅跟踪单字段的计算属性与原始 ref
 *
 * @example
 * ```ts
 * const { value: status } = useFieldValue(form, 'status', 'draft');
 * // status.value 仅在 form.values.status 变化时重算
 * ```
 */
export function useFieldValue<T = unknown>(
  source: MaybeRef<FieldFormLike>,
  fieldName: string,
  fallback?: T,
): FieldValueHandle<T> {
  const raw = computed<T | undefined>(() => {
    const form = isRef(source) ? source.value : source;
    const val = get(form?.values, fieldName);
    return val === undefined ? fallback : (val as T);
  });

  const value = computed<T>(() => {
    const current = raw.value;
    return current === undefined ? (fallback as T) : current;
  });

  return { raw, value };
}

/**
 * 批量订阅 schema 中声明的「依赖某字段」的子节点，返回一组计算属性。
 * 适用于条件渲染场景：字段的显示/隐藏依赖其他字段值。
 *
 * <p>本函数不会解析 schema.dependencies 的联动规则；它只针对调用方
 * 已经明确的「某字段依赖某字段」关系建立精确订阅。
 *
 * @param form - vee-validate 表单实例
 * @param rules - 依赖关系列表：每一项表示「字段 A 依赖字段 B」
 * @return 各依赖字段对应的计算属性 Map（key 为源字段名）
 *
 * @example
 * ```ts
 * // 精确声明字段间的依赖，避免 schema 全量订阅
 * const deps = useDependentFieldValues(form, [
 *   { source: 'approvalStatus', dependsOn: 'status' },
 *   { source: 'rejectReason', dependsOn: 'approvalStatus' },
 * ]);
 * // deps.get('status') 仅在 form.values.status 变化时重算
 * ```
 */
export function useDependentFieldValues(
  form: FieldFormLike,
  rules: Array<{ source: string; dependsOn: string }>,
): Map<string, ComputedRef<unknown>> {
  const result = new Map<string, ComputedRef<unknown>>();
  const seen = new Set<string>();

  for (const rule of rules) {
    // 同一源字段只订阅一次（取首次出现）
    if (seen.has(rule.dependsOn)) continue;
    seen.add(rule.dependsOn);

    result.set(
      rule.dependsOn,
      computed(() => get(form.values, rule.dependsOn)),
    );
  }

  return result;
}
