<!--
 * 字典标签组件 — 将字典值渲染为带颜色的标签（表格列常用）
 *
 * 使用自研 shadcn YdBadge 组件，零 element-plus 依赖。
 *
 * @path comm\effects\shared-business\src\components\dict-tag.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 字典标签组件 — 将字典值渲染为带颜色的标签。
 *
 * 基于《UI组件复用规范.md》§3.1 的语义名约定，保留对旧 EP 色名（info/warning/primary/
 * success/danger）的兼容映射，内部统一归一到 shadcn YdBadge variant。
 */
import { computed, onMounted, watch } from 'vue';

import { YdBadge } from '@ydsz-core/shadcn-ui';

import { useDictStore } from '@ydsz/stores';

type EpColor = 'primary' | 'success' | 'info' | 'warning' | 'danger';

interface Props {
  /** 字典类型编码 */
  dictType: string;
  /** 字典值 */
  value?: string | number;
  /** 自定义颜色映射（value → EP 色名），不传时按索引轮询 */
  colorMap?: Record<string, EpColor>;
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  colorMap: undefined,
});

const dictStore = useDictStore();

const colorPalette: EpColor[] = [
  'primary',
  'success',
  'info',
  'warning',
  'danger',
];

/** EP color -> shadcn YdBadge variant 兼容映射 */
function colorToVariant(color?: EpColor): 'default' | 'outline' | 'secondary' | 'destructive' {
  const map: Record<EpColor, 'default' | 'outline' | 'secondary' | 'destructive'> = {
    info: 'secondary',
    primary: 'default',
    success: 'default',
    warning: 'outline',
    danger: 'destructive',
  };
  return map[color ?? 'info'];
}

const items = computed(() => dictStore.getItems(props.dictType));

const current = computed(() =>
  items.value.find((item) => String(item.itemValue) === String(props.value)),
);

const tagVariant = computed(() => {
  if (props.colorMap?.[String(props.value)]) {
    return colorToVariant(props.colorMap[String(props.value)]);
  }
  if (!props.value && props.value !== 0) {
    return 'secondary';
  }
  // 按字典项排序位置轮询取色，保证同一值颜色稳定
  const idx = items.value.findIndex(
    (item) => String(item.itemValue) === String(props.value),
  );
  const color = colorPalette[idx % colorPalette.length] ?? 'info';
  return colorToVariant(color);
});

onMounted(() => {
  dictStore.ensureLoaded(props.dictType);
});

watch(
  () => props.dictType,
  (type) => {
    dictStore.ensureLoaded(type);
  },
  { immediate: true },
);
</script>

<template>
  <YdBadge
    v-if="current"
    :variant="tagVariant"
  >
    {{ current.itemText }}
  </YdBadge>
  <span
    v-else
    class="dict-tag--empty"
  >
    -
  </span>
</template>

<style scoped>
.dict-tag--empty {
  color: hsl(var(--txt-tertiary, #909399));
}
</style>
