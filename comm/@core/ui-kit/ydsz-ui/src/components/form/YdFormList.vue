<!--
 * YdFormList —— 声明式动态字段列表容器（对标 AntD Form.List）。
 *
 * <p>在 vee-validate Form 上下文中使用，通过 default 插槽暴露：
 *  - fields: 当前列表项
 *  - add / remove / move / insert / replace: 操作方法
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/components/form/YdFormList.vue
 * @author ydsz-team
 * @since 26.10.30
-->
<script lang="ts" setup generic="T = unknown">
import { provide } from 'vue';

import { useFormList, type FormListFieldEntry } from './use-form-list';

/* ============================================================ */
/* Props                                                          */
/* ============================================================ */

interface Props {
  /**
   * vee-validate Path 路径，例如 'contacts' 或 'items'。
   * <p>路径对应的 T[] 会自动通过 Form 的 initialValues 初始化。
   */
  name: any;
}

const props = defineProps<Props>();

/* ============================================================ */
/* 注入                                                          */
/* ============================================================ */

const listApi = useFormList<T>({ name: props.name });

provide('yd-form-list', listApi);

/* ============================================================ */
/* 插槽定义                                                       */
/* ============================================================ */

defineSlots<{
  default: (props: {
    fields: FormListFieldEntry<T>[];
    add: (value?: Partial<T>) => void;
    remove: (index: number) => void;
    move: (from: number, to: number) => void;
    insert: (index: number, value?: Partial<T>) => void;
    replace: (index: number, value: Partial<T>) => void;
    reset: (values: Partial<T>[]) => void;
    length: number;
  }) => any;
}>();

const { add, fields, insert, move, remove, replace, reset } = listApi;
</script>

<template>
  <slot
    :add="add"
    :fields="fields as any"
    :insert="insert"
    :length="fields.length"
    :move="move"
    :remove="remove"
    :replace="replace"
    :reset="reset"
  />
</template>
