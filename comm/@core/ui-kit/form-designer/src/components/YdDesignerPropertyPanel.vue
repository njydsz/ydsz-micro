<!--
 * YdDesignerPropertyPanel — 可视化表单设计器右侧属性面板。
 *
 * <p>当选中画布字段时，显示该字段的属性编辑表单（label/fieldName/placeholder/
 * 校验/栅格占位等），修改实时同步到 Schema。
 *
 * @path comm\@core\ui-kit\form-designer\src\components\YdDesignerPropertyPanel.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { CanvasItem } from '../types';

import { useDesignerContext } from './designer-context';

defineProps<{
  isReadonly?: boolean;
}>();

const item = defineModel<CanvasItem | null>('selectedItem');

const emit = defineEmits<{
  'update-item': [id: string, updates: Partial<CanvasItem]>;
}>();

const { isReadonly } = useDesignerContext();

/**
 * 推送字段属性更新。
 */
function updateField(updates: Partial<CanvasItem>): void {
  if (!item.value) {
    return;
  }
  emit('update-item', item.value.id, updates);
}

/** 常用校验规则快捷配置 */
const quickRules = [
  { label: '必填', type: 'required' as const },
  { label: '手机号', type: 'pattern' as const, value: '^1[3-9]\\d{9}$' },
  { label: '邮箱', type: 'pattern' as const, value: '^[\\w.-]+@[\\w.-]+\\.\\w+$' },
  { label: '身份证号', type: 'pattern' as const, value: '^\\d{17}[\\dX]$' },
];
</script>

<template>
  <div class="yfd-property flex w-64 flex-shrink-0 flex-col gap-3 overflow-y-auto border-l bg-muted/20 p-3">
    <h3 class="text-xs font-semibold text-muted-foreground uppercase">属性面板</h3>

    <!-- 未选中提示 -->
    <div
      v-if="!item"
      class="text-xs text-muted-foreground"
    >
      在画布上点击字段进行编辑
    </div>

    <!-- 字段属性编辑 -->
    <div v-else class="flex flex-col gap-3">
      <div class="flex flex-col gap-1">
        <label class="text-xs text-muted-foreground">字段名</label>
        <input
          :value="item.fieldName"
          :disabled="isReadonly"
          class="rounded border border-input bg-background px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          @input="updateField({ fieldName: ($event.target as HTMLInputElement).value })"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs text-muted-foreground">标签</label>
        <input
          :value="item.label"
          :disabled="isReadonly"
          class="rounded border border-input bg-background px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          @input="updateField({ label: ($event.target as HTMLInputElement).value })"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs text-muted-foreground">Placeholder</label>
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
          必填
        </label>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs text-muted-foreground">栅格占位 (1-12)</label>
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
        <label class="text-xs text-muted-foreground">快捷校验</label>
        <div class="flex flex-wrap gap-1">
          <button
            v-for="rule in quickRules"
            :key="rule.type + String(rule.value)"
            type="button"
            :disabled="isReadonly"
            class="rounded border border-input px-2 py-0.5 text-[10px] hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            @click="updateField({
              isRequired: rule.type === 'required' ? true : item.isRequired,
              rules: [
                ...item.rules,
                {
                  type: rule.type,
                  value: rule.value,
                  trigger: 'blur',
                  message: rule.label === '必填' ? '此字段必填' : `请输入有效的${rule.label}`,
                },
              ],
            })"
          >
            + {{ rule.label }}
          </button>
        </div>
      </div>

      <!-- 已配置规则 -->
      <div v-if="item.rules.length > 0" class="flex flex-col gap-1">
        <label class="text-xs text-muted-foreground">校验规则 ({{ item.rules.length }})</label>
        <div
          v-for="(rule, idx) in item.rules"
          :key="idx"
          class="flex items-center justify-between rounded bg-muted/40 px-2 py-1 text-[10px]"
        >
          <span>{{ rule.label }}: {{ rule.message }}</span>
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
