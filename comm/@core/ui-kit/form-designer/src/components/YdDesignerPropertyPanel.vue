<script lang="ts" setup>
/**
* YdDesignerPropertyPanel — 可视化表单设计器右侧属性面板。
* 
 * <p>当选中画布字段时，显示该字段的属性编辑表单（label/fieldName/placeholder/
 * 校验/栅格占位等），修改实时同步到 Schema。
* 
 * @path comm\@core\ui-kit\form-designer\src\components\YdDesignerPropertyPanel.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import type { CanvasItem } from '../types';

import { computed } from 'vue';

import { useLocale } from '@ydsz-core/ydsz-ui/locale';

import { useDesignerContext } from './designer-context';

defineProps<{
  isReadonly?: boolean;
}>();

const item = defineModel<CanvasItem | null>('selectedItem');

const emit = defineEmits<{
  'update-item': [id: string, updates: Partial<CanvasItem>];
}>();

const { isReadonly } = useDesignerContext();
const { t } = useLocale();

/**
 * 推送字段属性更新。
 */
function updateField(updates: Partial<CanvasItem>): void {
  if (!item.value) {
    return;
  }
  emit('update-item', item.value.id, updates);
}

/** 常用校验规则快捷配置（labelKey 走词典，type/value 是写入 Schema 的数据） */
const QUICK_RULES: Array<{ labelKey: string; type: 'required' | 'pattern'; value?: string }> = [
  { labelKey: 'common.required', type: 'required' },
  { labelKey: 'designer.rulePhone', type: 'pattern', value: '^1[3-9]\\d{9}$' },
  { labelKey: 'designer.ruleEmail', type: 'pattern', value: '^[\\w.-]+@[\\w.-]+\\.\\w+$' },
  { labelKey: 'designer.ruleIdCard', type: 'pattern', value: '^\\d{17}[\\dX]$' },
];

const quickRules = computed(() =>
  QUICK_RULES.map((rule) => ({ ...rule, label: t(rule.labelKey) })),
);

/**
 * 追加一条快捷校验规则。
 *
 * <p>提示文案按 {@code rule.type} 而非渲染出的 label 文本分支：label 已被 t() 本地化，
 * 拿它当分支条件时切到任何非中文语种都会让 required 规则落到「请输入有效的…」模板上。
 */
function applyQuickRule(rule: (typeof QUICK_RULES)[number]): void {
  if (!item.value) {
    return;
  }
  updateField({
    isRequired: rule.type === 'required' ? true : item.value.isRequired,
    rules: [
      ...item.value.rules,
      {
        type: rule.type,
        value: rule.value,
        trigger: 'blur',
        message: rule.type === 'required'
          ? t('designer.ruleRequiredMessage')
          : t('designer.rulePatternMessage', { label: t(rule.labelKey) }),
      },
    ],
  });
}
</script>

<template>
  <div class="yfd-property flex w-64 flex-shrink-0 flex-col gap-3 overflow-y-auto border-l bg-muted/20 p-3">
    <h3 class="text-xs font-semibold text-muted-foreground uppercase">{{ t('designer.panelTitle') }}</h3>

    <!-- 未选中提示 -->
    <div
      v-if="!item"
      class="text-xs text-muted-foreground"
    >
      {{ t('designer.panelEmptyHint') }}
    </div>

    <!-- 字段属性编辑 -->
    <div v-else class="flex flex-col gap-3">
      <div class="flex flex-col gap-1">
        <label class="text-xs text-muted-foreground">{{ t('designer.fieldName') }}</label>
        <input
          :value="item.fieldName"
          :disabled="isReadonly"
          class="rounded border border-input bg-background px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          @input="updateField({ fieldName: ($event.target as HTMLInputElement).value })"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs text-muted-foreground">{{ t('designer.fieldLabel') }}</label>
        <input
          :value="item.label"
          :disabled="isReadonly"
          class="rounded border border-input bg-background px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          @input="updateField({ label: ($event.target as HTMLInputElement).value })"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs text-muted-foreground">{{ t('designer.placeholderField') }}</label>
        <input
          :value="item.placeholder ?? ''"
          :disabled="isReadonly"
          class="rounded border border-input bg-background px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          @input="updateField({ placeholder: ($event.target as HTMLInputElement).value })"
        />
      </div>

      <div class="flex items-center gap-2">
        <label class="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            :checked="item.isRequired"
            :disabled="isReadonly"
            class="rounded border-input"
            @change="updateField({ isRequired: ($event.target as HTMLInputElement).checked })"
          />
          {{ t('common.required') }}
        </label>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs text-muted-foreground">{{ t('designer.gridSpan') }}</label>
        <input
          type="number"
          :value="item.span"
          min="1"
          max="12"
          :disabled="isReadonly"
          class="rounded border border-input bg-background px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          @input="updateField({ span: Number(($event.target as HTMLInputElement).value) || 12 })"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs text-muted-foreground">{{ t('designer.quickRules') }}</label>
        <div class="flex flex-wrap gap-1">
          <button
            v-for="rule in quickRules"
            :key="rule.type + String(rule.value)"
            type="button"
            :disabled="isReadonly"
            class="rounded border border-input px-2 py-0.5 text-[10px] hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            @click="applyQuickRule(rule)"
          >
            + {{ rule.label }}
          </button>
        </div>
      </div>

      <!-- 已配置规则 -->
      <div v-if="item.rules.length > 0" class="flex flex-col gap-1">
        <label class="text-xs text-muted-foreground">{{ t('designer.rulesHeader', { count: item.rules.length }) }}</label>
        <div
          v-for="(rule, idx) in item.rules"
          :key="idx"
          class="flex items-center justify-between rounded bg-muted/40 px-2 py-1 text-[10px]"
        >
          <span>{{ rule.message }}</span>
          <button
            v-if="!isReadonly"
            type="button"
            class="text-destructive"
            @click="updateField({ rules: item.rules.filter((_, i) => i !== idx) })"
          >
            x
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
