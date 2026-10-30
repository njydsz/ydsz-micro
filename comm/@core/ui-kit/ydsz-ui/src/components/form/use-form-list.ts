/**
 * useFormList composable —— vee-validate FieldArray 的命名单向封装。
 *
 * <p>对标 Ant Design 的 Form.List，提供：
 *  - `fields`: 当前列表项的只读响应式数组
 *  - `add`: 新增一条（可传入初始值）
 *  - `remove`: 按索引移除
 *  - `move`: 交换两条位置
 *  - `replace`: 整体替换
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\form\use-form-list.ts
 * @author ydsz-team
 * @since 26.10.30
 */

import { useFieldArray, type FieldEntry } from 'vee-validate';

import type { Ref } from 'vue';

/* ============================================================ */
/* 类型定义                                                       */
/* ============================================================ */

/** 字段条目（扩展 key 以稳定渲染） */
export type FormListFieldEntry<T> = FieldEntry<T>;

/** useFormList 配置 */
export interface UseFormListOptions {
  /**
   * vee-validate Path（字段路径），例如 'contacts' 或 'items'。
   * <p>泛型 PathValue 表示每个列表项的值的形状。
   */
  name: any; // 使用 any 避免 vee-validate Path 泛型约束过严
}

/** useFormList 返回值 */
export interface UseFormListReturn<T = unknown> {
  /** 当前列表项（含 key 的唯一标识以稳定渲染） */
  fields: Ref<FormListFieldEntry<T>[]>;
  /** 在末尾追加一条。value 为初始值。 */
  add: (value?: Partial<T>) => void;
  /** 按索引移除一条。 */
  remove: (index: number) => void;
  /** 移动 from → to 索引位置。 */
  move: (from: number, to: number) => void;
  /** 在指定索引处插入一条。 */
  insert: (index: number, value?: Partial<T>) => void;
  /** 替换指定索引处的值。 */
  replace: (index: number, value: Partial<T>) => void;
  /** 整体重置为 values 数组。 */
  reset: (values: Partial<T>[]) => void;
}

/* ============================================================ */
/* Composable                                                     */
/* ============================================================ */

/**
 * useFormList —— 表单动态字段列表管理。
 *
 * <p>必须在 `<Form>`（vee-validate 上下文）中使用。
 *
 * @param options - 配置项（含 name 路径）
 * @returns 列表管理句柄
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useFormList } from '@ydsz-core/ydsz-ui';
 *
 * const { fields, add, remove } = useFormList({ name: 'contacts' });
 * </script>
 *
 * <template>
 *   <Form>
 *     <div v-for="(field, idx) in fields" :key="field.key">
 *       <Field :name="`contacts[${idx}].email`" />
 *       <button @click="remove(idx)">删除</button>
 *     </div>
 *     <button @click="add({ email: '' })">新增</button>
 *   </Form>
 * </template>
 * ```
 */
export function useFormList<T = unknown>(
  options: UseFormListOptions,
): UseFormListReturn<T> {
  const fieldArray = useFieldArray<T>(options.name as any);

  return {
    add: (value?: Partial<T>) => fieldArray.push(value as T),
    fields: fieldArray.fields,
    insert: (index: number, value?: Partial<T>) => fieldArray.insert(index, value as T),
    move: (from: number, to: number) => fieldArray.move(from, to),
    remove: (index: number) => fieldArray.remove(index),
    replace: (index: number, value: Partial<T>) => {
      const all = [...fieldArray.fields.value];
      all[index] = { ...all[index], ...(value as any), key: all[index]?.key };
      fieldArray.replace(all as any);
    },
    reset: (values: Partial<T>[]) => fieldArray.replace(values as T[]),
  };
}
