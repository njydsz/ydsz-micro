<!--
 * 受控表单组件：表单状态由外部 useYdForm 提供，本组件只负责渲染与事件转发。
 *
 * 状态外置后，父组件可在任意时机触发校验、取值或重置，适用于需要在组件之外
 * 驱动表单的场景（弹窗提交、分步流转、跨组件联动）。
 * 除字段级插槽外，还开放 reset-before / submit-before / expand-before 等
 * 动作区插槽；各插槽均回传对应的上下文（如校验状态、提交处理函数），
 * 便于在按钮前后插入自定义操作。
 *
 * <p>草稿自动保存：当 <code>draft</code> 为 <code>true</code> 时，通过
 * <code>useFormDraft</code> 将表单数据防抖保存到 localStorage，页面刷新后可恢复。
 * 恢复时 emit <code>draft-restored</code> 事件。
 *
 * @path comm\@core\ui-kit\form-ui\src\UseForm.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { Recordable } from '@ydsz-core/typings';

import type { YdExtendedFormApi, YdFormProps } from './types';

import { nextTick, onMounted, ref, unref, watch } from 'vue';

import {
  useFormDraft,
  useForwardPriorityValues,
} from '@ydsz-core/composables';
import { cloneDeep, get, isEqual, set } from '@ydsz-core/shared/utils';

import { useDebounceFn } from '@vueuse/core';

import FormActions from './components/form-actions.vue';
import {
  COMPONENT_BIND_EVENT_MAP,
  COMPONENT_MAP,
  DEFAULT_FORM_COMMON_CONFIG,
} from './config';
import { Form } from './form-render';
import {
  provideComponentRefMap,
  provideFormProps,
  useFormInitial,
} from './use-form-context';

// 通过 extends 会导致热更新卡死，所以重复写了一遍
interface Props extends YdFormProps {
  formApi: YdExtendedFormApi;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'draft-restored', values: Record<string, unknown>): void;
}>();

const state = props.formApi?.useStore?.();

const forward = useForwardPriorityValues(props, state);

const componentRefMap = new Map<string, unknown>();

const { delegatedSlots, form } = useFormInitial(forward);

provideFormProps([forward, form]);
provideComponentRefMap(componentRefMap);

props.formApi?.mount?.(form, componentRefMap);

// ===== 草稿自动保存 =====
/**
 * 草稿存储 key：优先使用 draftKey prop，否则基于路由 hash + 表单字段签名生成。
 */
function resolveDraftKey(): string {
  if (props.draftKey) {
    return props.draftKey;
  }
  const fieldNames = (state.value.schema || [])
    .map((s: { fieldName: string }) => s.fieldName)
    .join(':');
  // 在微前端场景下 window.location.hash 包含子应用路由路径
  return `form:${window.location.hash || fieldNames}`;
}

// 仅在 draft=true 时启用草稿 composable（props.draft 不会运行时变更，生命周期安全）
const draftCtx = props.draft
  ? useFormDraft<Record<string, unknown>>({
      key: resolveDraftKey(),
      ttlSeconds: props.draftTTL ?? 86_400,
    })
  : null;

const handleUpdateCollapsed = (value: boolean) => {
  props.formApi?.setState({ collapsed: !!value });
};

function handleKeyDownEnter(event: KeyboardEvent) {
  if (!state.value.submitOnEnter || !forward.value.formApi?.isMounted) {
    return;
  }
  // 如果是 textarea 不阻止默认行为，否则会导致无法换行。
  // 跳过 textarea 的回车提交处理
  if (event.target instanceof HTMLTextAreaElement) {
    return;
  }
  event.preventDefault();

  forward.value.formApi.validateAndSubmitForm();
}

const handleValuesChangeDebounced = useDebounceFn(async () => {
  state.value.submitOnChange && forward.value.formApi?.validateAndSubmitForm();
}, 300);

const valuesCache: Recordable<unknown> = {};

onMounted(async () => {
  // 只在挂载后开始监听，form.values会有一个初始化的过程
  await nextTick();

  // 草稿模式：挂载后尝试恢复草稿
  if (draftCtx) {
    const restored = draftCtx.restoreDraft();
    if (restored) {
      Object.entries(restored).forEach(([key, val]) => {
        try {
          form.setFieldValue(key, val);
        } catch {
          /* 字段名不匹配时跳过 */
        }
      });
      emit('draft-restored', restored);
    }
  }

  watch(
    () => form.values,
    async (newVal) => {
      if (forward.value.handleValuesChange) {
        const fields = state.value.schema?.map((item) => {
          return item.fieldName;
        });

        if (fields && fields.length > 0) {
          const changedFields: string[] = [];
          fields.forEach((field) => {
            const newFieldValue = get(newVal, field);
            const oldFieldValue = get(valuesCache, field);
            if (!isEqual(newFieldValue, oldFieldValue)) {
              changedFields.push(field);
              set(valuesCache, field, newFieldValue);
            }
          });

          if (changedFields.length > 0) {
            // 调用handleValuesChange回调，传入所有表单值的深拷贝和变更的字段列表
            forward.value.handleValuesChange(
              cloneDeep(await forward.value.formApi.getValues()),
              changedFields,
            );
          }
        }
      }
      handleValuesChangeDebounced();

      // 草稿模式：同步写入草稿 ref（useFormDraft 内部防抖保存到 localStorage）
      if (draftCtx && newVal) {
        draftCtx.draft.value = cloneDeep(newVal);
      }
    },
    { deep: true },
  );
});

// 草稿模式：vee-validate 提交成功后清除草稿
// vee-validate 的 submitCount 在每次提交尝试时递增；当其递增且 errors 为空时表示提交成功
if (draftCtx) {
  const prevSubmitCount = ref(unref(form.submitCount));
  watch(
    () => unref(form.submitCount),
    (count) => {
      if (count > prevSubmitCount.value && Object.keys(form.errors.value).length === 0) {
        draftCtx.clearDraft();
      }
      prevSubmitCount.value = count;
    },
  );
}
</script>

<template>
  <Form
    @keydown.enter="handleKeyDownEnter"
    v-bind="forward"
    :collapsed="state.collapsed"
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
          v-if="forward.showDefaultActions"
          :model-value="state.collapsed"
          @update:model-value="handleUpdateCollapsed"
        >
          <template #reset-before="resetSlotProps">
            <slot name="reset-before" v-bind="resetSlotProps"></slot>
          </template>
          <template #submit-before="submitSlotProps">
            <slot name="submit-before" v-bind="submitSlotProps"></slot>
          </template>
          <template #expand-before="expandBeforeSlotProps">
            <slot name="expand-before" v-bind="expandBeforeSlotProps"></slot>
          </template>
          <template #expand-after="expandAfterSlotProps">
            <slot name="expand-after" v-bind="expandAfterSlotProps"></slot>
          </template>
        </FormActions>
      </slot>
    </template>
  </Form>
</template>
