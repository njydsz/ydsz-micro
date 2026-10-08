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

import { nextTick, onMounted, watch } from 'vue';

import { useForwardPriorityValues } from '@ydsz-core/composables';
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

const state = props.formApi?.useStore?.();

const forward = useForwardPriorityValues(props, state);

const componentRefMap = new Map<string, unknown>();

const { delegatedSlots, form } = useFormInitial(forward);

provideFormProps([forward, form]);
provideComponentRefMap(componentRefMap);

props.formApi?.mount?.(form, componentRefMap);

// ===== 草稿自动保存 =====
let draftRestoreData: Recordable | undefined = undefined;
if (props.draft) {
  // 动态导入 useFormDraft 以避免非 draft 场景的额外开销
  const { useFormDraft } = await import('@ydsz-core/composables');
  const fieldNames = (state.value.schema || []).map((s) => s.fieldName).join(':');
  const storageKey =
    props.draftKey || `form:${window.location.hash || fieldNames}`;
  // TTL 默认 24 小时
  const ttlSeconds = props.draftTTL ?? 86_400;

  useFormDraft<Recordable>({
    key: storageKey,
    ttlSeconds,
  });

  // 挂载后恢复草稿
  onMounted(async () => {
    await nextTick();
    // useFormDraft 已加载，此处通过 import 后调用
    const { useFormDraft: loadDraft } = await import(
      '@ydsz-core/composables'
    );
    // 由于 useFormDraft 需要生命周期 hook，在 onSetup 阶段已调用
    // 此处直接在组件逻辑中实现恢复
    const savedRaw = localStorage.getItem(`ydsz:draft:${storageKey}`);
    if (savedRaw) {
      try {
        const meta = JSON.parse(savedRaw);
        if (meta?.data && typeof meta.savedAt === 'number') {
          const expired = Date.now() - meta.savedAt > ttlSeconds * 1000;
          if (!expired) {
            draftRestoreData = meta.data;
            // 将草稿数据写入 vee-validate 表单
            Object.entries(meta.data).forEach(([key, val]) => {
              form.setFieldValue(key, val);
            });
            props.formApi?.emit('draft-restored', meta.data);
          } else {
            localStorage.removeItem(`ydsz:draft:${storageKey}`);
          }
        }
      } catch {
        // 解析失败则清除
        localStorage.removeItem(`ydsz:draft:${storageKey}`);
      }
    }
  });

  // 值变化时防抖写入草稿
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  watch(
    () => form.values,
    (newVal) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        try {
          localStorage.setItem(
            `ydsz:draft:${storageKey}`,
            JSON.stringify({ savedAt: Date.now(), data: newVal }),
          );
        } catch {
          /* 静默处理配额超出 */
        }
      }, 1500);
    },
    { deep: true },
  );
}

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
    },
    { deep: true },
  );
});
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

