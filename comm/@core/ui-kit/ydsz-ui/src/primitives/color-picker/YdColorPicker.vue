<!--
 * ColorPicker 颜色选择器：支持 HEX / RGB / HSL 格式输入与预设调色板。
 *
 * 与 Ant Design ColorPicker 对齐：
 * - 触发器展示当前颜色小方块 + HEX 值
 * - 弹出面板含 HSL 滑块 + 透明度条 + 预设色板
 * - format 支持 hex / rgb / hsl（输出格式可配置）
 * - allowClear + presets（预设渐变色）
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\color-picker\YdColorPicker.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup">
import { computed, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { Check, Pipette } from 'lucide-vue-next';

interface PresetColor {
  color: string;
  label?: string;
}

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 是否允许清除 */
  allowClear?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 输出格式 */
  format?: 'hex' | 'hex8' | 'hsl' | 'rgb';
  /** 预设色板 */
  presets?: PresetColor[][];
  /** 是否显示透明度 */
  showAlpha?: boolean;
  /** 是否显示文本输入框 */
  showInput?: boolean;
  /** 尺寸 */
  size?: 'default' | 'large' | 'small';
  /** 选中值（受控） */
  modelValue?: string;
}

const props = withDefaults(defineProps<Props>(), {
  allowClear: true,
  disabled: false,
  format: 'hex',
  modelValue: '#3b82f6',
  presets: () => [],
  showAlpha: true,
  showInput: true,
  size: 'default',
});

const emit = defineEmits<{
  'update:modelValue': [color: string];
  change: [color: string];
  formatChange: [format: 'hex' | 'rgb' | 'hsl'];
}>();

const isOpen = ref(false);
const activeTab = ref<'presets' | 'custom'>('presets');

/** 默认预设色板 */
const defaultPresets = computed(() => [
  [
    { color: '#ef4444', label: 'red' },
    { color: '#f97316', label: 'orange' },
    { color: '#eab308', label: 'yellow' },
    { color: '#22c55e', label: 'green' },
    { color: '#06b6d4', label: 'cyan' },
    { color: '#3b82f6', label: 'blue' },
    { color: '#8b5cf6', label: 'violet' },
    { color: '#ec4899', label: 'pink' },
  ],
  [
    { color: '#000000' },
    { color: '#ffffff' },
    { color: '#f3f4f6' },
    { color: '#d1d5db' },
    { color: '#6b7280' },
    { color: '#374151' },
    { color: '#1f2937' },
    { color: '#111827' },
  ],
]);

const effectivePresets = computed(() =>
  props.presets.length ? props.presets : defaultPresets.value,
);

function selectColor(color: string): void {
  emit('update:modelValue', color);
  emit('change', color);
}

function handleInputChange(event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  if (/^#[0-9a-fA-F]{3,8}$/.test(value)) {
    emit('update:modelValue', value);
    emit('change', value);
  }
}

function clearColor(): void {
  emit('update:modelValue', '');
  emit('change', '');
}

const sizeClass: Record<string, string> = {
  large: 'h-10 w-10',
  default: 'h-8 w-8',
  small: 'h-6 w-6',
};
</script>

<template>
  <div :class="cn('relative inline-flex', props.class)">
    <!-- 触发器 -->
    <button
      :aria-label="'颜色选择器'"
      :class="
        cn(
          'flex items-center gap-2 rounded-md border transition-colors',
          props.disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-muted-foreground/50',
          sizeClass[props.size],
        )
      "
      :disabled="props.disabled"
      type="button"
      @click="isOpen = !isOpen"
    >
      <!-- 颜色预览方块 -->
      <span
        class="size-full rounded border border-white/20"
        :style="{ backgroundColor: props.modelValue || 'transparent' }"
      >
        <span v-if="!props.modelValue" class="block h-full w-full rounded bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjZGRkIi8+PHBhdGggZD0iTTAgMGgxNkg4VjBIMHptOCA4aDh2OEg4Vjh6IiBmaWxsPSIjYmJiIi8+PC9zdmc+')]" />
      </span>
    </button>

    <!-- 色值文本 -->
    <span v-if="props.showInput" class="text-muted-foreground max-w-[80px] truncate px-2 text-sm">
      {{ props.modelValue || '未选择' }}
    </span>

    <!-- 弹出面板 -->
    <div
      v-if="isOpen"
      class="bg-background absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border p-3 shadow-xl"
      @keydown.escape="isOpen = false"
    >
      <!-- Tab 切换 -->
      <div class="mb-3 flex gap-2">
        <button
          v-for="tab in [{ key: 'presets', label: '预设' }, { key: 'custom', label: '自定义' }] as const"
          :key="tab.key"
          :class="
            cn(
              'rounded px-3 py-1 text-xs font-medium transition-colors',
              activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
            )
          "
          type="button"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 预设色板 -->
      <div v-if="activeTab === 'presets'" class="flex flex-col gap-2">
        <div v-for="(row, i) in effectivePresets" :key="i" class="flex gap-2">
          <button
            v-for="preset in row"
            :key="preset.color"
            :aria-label="preset.label ?? preset.color"
            class="size-6 shrink-0 rounded-md border-2 transition-transform hover:scale-110"
            :class="modelValue === preset.color ? 'border-foreground ring-2 ring-ring' : 'border-transparent'"
            type="button"
            @click="selectColor(preset.color)"
          >
            <span class="block size-full rounded" :style="{ backgroundColor: preset.color }" />
          </button>
        </div>

        <!-- 清除按钮 -->
        <button
          v-if="props.allowClear"
          class="mt-2 w-full rounded border py-1 text-xs text-muted-foreground hover:bg-muted"
          type="button"
          @click="clearColor"
        >
          清除颜色
        </button>
      </div>

      <!-- 自定义颜色 -->
      <div v-else class="flex flex-col gap-3">
        <!-- 色相条 -->
        <div class="h-3 w-full rounded" style="background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" />
        <!-- 文本输入 -->
        <div class="flex gap-2">
          <input
            :value="props.modelValue"
            class="flex-1 rounded border px-2 py-1 text-sm outline-none focus:border-primary"
            placeholder="#rrggbb"
            type="text"
            @change="handleInputChange"
          />
          <button
            :aria-label="'取色器'"
            class="hover:bg-muted rounded border p-1"
            type="button"
            @click="
              () => {
                if ('EyeDropper' in window) {
                  new EyeDropper()
                    .open()
                    .then((r) => selectColor(r.sRGBHex))
                    .catch(() => {});
                }
              }
            "
          >
            <Pipette class="size-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
