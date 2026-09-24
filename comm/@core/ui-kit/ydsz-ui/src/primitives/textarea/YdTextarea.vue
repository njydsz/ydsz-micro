<!--
 * 多行输入框 —— 对标一线竞品（EP Textarea / Naive Textarea）能力矩阵。
 *
 * <p>增强能力（5.6.0 新增）：
 * <ul>
 *   <li>autosize：基于 scrollHeight 的自动增高（支持 minRows / maxRows 约束）</li>
 *   <li>resize：控制浏览器原生拖拽拉伸方向（none / both / horizontal / vertical）</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\textarea\YdTextarea.vue
 * @author ydsz-team
 * @since 1.0.0 (5.6.0 新增 autosize / resize)
-->
<script setup lang="ts">
import { ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { useVModel } from '@vueuse/core';

/** 文本域拉伸方向 */
export type TextareaResize = 'none' | 'both' | 'horizontal' | 'vertical';

/** autosize 配置 */
export interface AutosizeConfig {
  /** 最小行数 */
  minRows?: number;
  /** 最大行数 */
  maxRows?: number;
}

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = withDefaults(
  defineProps<{
    class?: ClassValue;
    defaultValue?: number | string;
    modelValue?: number | string;
    /** 自动增高：true 开启默认配置，或传入 AutosizeConfig */
    autosize?: boolean | AutosizeConfig;
    /** 拉伸控制 */
    resize?: TextareaResize;
    /** 占位符 */
    placeholder?: string;
    /** 最大字符数 */
    maxlength?: number;
    /** 是否显示字数统计 */
    isShowCount?: boolean;
    /** 禁用 */
    disabled?: boolean;
    /** 只读 */
    readonly?: boolean;
  }>(),
  {
    resize: 'vertical',
  },
);

const emits = defineEmits<{
  (e: 'update:modelValue', payload: number | string): void;
}>();

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: props.defaultValue,
  passive: true,
});

const textareaRef = ref<HTMLTextAreaElement | null>(null);

/** 是否启用了 autosize */
const isAutosizeEnabled = ref(!!props.autosize);

/** autosize 配置（规范化后） */
const autosizeConfig = ref<AutosizeConfig>(() => {
  if (typeof props.autosize === 'object') return props.autosize;
  return { maxRows: 10, minRows: 2 };
});

/** 每行像素高度（默认 text-sm 行高 ≈ 20px + py-2 ≈ 24px，取近似） */
const LINE_HEIGHT = 24;

/** autosize：根据内容调整 textarea 高度 */
function adjustHeight(): void {
  if (!isAutosizeEnabled.value || !textareaRef.value) return;

  const el = textareaRef.value;
  // 先重置为 auto 才能拿到真实 scrollHeight
  el.style.height = 'auto';

  const minH = (autosizeConfig.value.minRows ?? 2) * LINE_HEIGHT;
  const maxH = (autosizeConfig.value.maxRows ?? 10) * LINE_HEIGHT;

  // scrollHeight 是内容实际所需高度
  let nextH = Math.max(el.scrollHeight, minH);
  if (maxH > 0) {
    nextH = Math.min(nextH, maxH);
  }
  el.style.height = `${nextH}px`;
}

/** resize 对应的 CSS value */
function getResizeCssValue(): string {
  return props.resize ?? 'vertical';
}
</script>

<template>
  <div class="relative w-full">
    <textarea
      ref="textareaRef"
      v-model="modelValue"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :disabled="disabled"
      :readonly="readonly"
      :class="
        cn(
          'border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-input-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 readonly:cursor-default readonly:bg-muted/30',
          resize === 'none' && 'resize-none',
          $props.class,
        )
      "
      :style="{
        resize: getResizeCssValue(),
        minHeight: isAutosizeEnabled ? `${(autosizeConfig.minRows ?? 2) * LINE_HEIGHT}px` : undefined,
      }"
      :aria-disabled="disabled"
      :aria-readonly="readonly"
      @input="isAutosizeEnabled && adjustHeight()"
    ></textarea>
    <!-- 字符计数 -->
    <span
      v-if="isShowCount"
      class="text-muted-foreground text-xs tabular-nums"
      :class="{
        'text-destructive': maxlength != null && String(modelValue ?? '').length >= maxlength,
      }"
    >
      {{ String(modelValue ?? '').length }}{{ maxlength != null ? ` / ${maxlength}` : '' }}
    </span>
  </div>
</template>
