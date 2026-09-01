<!--
 * 声明式表单组件：接收 Schema 与配置，在内部自行持有并管理表单状态。
 *
 * 适合 Schema 固定、无需在父组件里操作表单的场景；若需要在外部驱动
 * （弹窗提交、分步表单），请改用 useYDSZForm 组合式用法。
 * 所有字段级插槽按字段名透出，默认插槽的插槽属性一并向下传递，
 * 业务可只覆盖个别字段而保留其余字段的默认渲染。
 *
 * @path comm\@core\ui-kit\form-ui\src\YDSZ-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { YDSZFormProps } from './types';

import { ref, watchEffect } from 'vue';

import { useForwardPropsEmits } from '@YDSZ-core/composables';

import FormActions from './components/form-actions.vue';
import {
  COMPONENT_BIND_EVENT_MAP,
  COMPONENT_MAP,
  DEFAULT_FORM_COMMON_CONFIG,
} from './config';
import { Form } from './form-render';
import { provideFormProps, useFormInitial } from './use-form-context';

// 通过 extends 会导致热更新卡死
type Props = YDSZFormProps;
const props = withDefaults(defineProps<Props>(), {
  actionWrapperClass: '',
  collapsed: false,
  collapsedRows: 1,
  commonConfig: () => ({}),
  handleReset: undefined,
  handleSubmit: undefined,
  layout: 'horizontal',
  resetButtonOptions: () => ({}),
  showCollapseButton: false,
  showDefaultActions: true,
  submitButtonOptions: () => ({}),
  wrapperClass: 'grid-cols-1',
});

const forward = useForwardPropsEmits(props);

const currentCollapsed = ref(false);

const { delegatedSlots, form } = useFormInitial(props);

provideFormProps([props, form]);

const handleUpdateCollapsed = (value: boolean) => {
  currentCollapsed.value = !!value;
};

watchEffect(() => {
  currentCollapsed.value = props.collapsed;
});
</script>

<template>
  <Form
    v-bind="forward"
    :collapsed="currentCollapsed"
    :component-bind-event-map="COMPONENT_BIND_EVENT_MAP"
    :component-map="COMPONENT_MAP"
    :form="form"
    :global-common-config="DEFAULT_FORM_COMMON_CONFIG"
  >
    <template
      v-for="slotName in delegatedSlots"
      :key="slotName"
      #[slotName]="slotProps"
    >
      <slot :name="slotName" v-bind="slotProps"></slot>
    </template>
    <template #default="slotProps">
      <slot v-bind="slotProps">
        <FormActions
          v-if="showDefaultActions"
          :model-value="currentCollapsed"
          @update:model-value="handleUpdateCollapsed"
        />
      </slot>
    </template>
  </Form>
</template>

