<!--
 * status-badge 通用组件 — 统一的状态展示组件
 *
 * 使用自研 YdBadge 组件 + variant 语义映射，零 element-plus 依赖。
 *
 * @path comm\effects\shared-business\src\components\status-badge.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 状态徽章组件 — EP 风格的"颜色名"键升级为 shadcn variant 体系。
 *
 * 基于《UI组件复用规范.md》§3.1 的语义名约定（published / running / draft / offline /
 * pending / success / failed / dirty / archived），业务方可通过 statusMap 自定义
 * 键位 -> { variant, label } 的映射。对外保留对旧键名（info/warning/primary/success/danger）
 * 的兼容，内部归一化到 shadcn YdBadge variant。
 */
import { computed } from 'vue';

import { YdBadge } from '@ydsz-core/ydsz-ui';
import { $t } from '@ydsz/locales';

type EpColor =
  | 'info'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger';

interface StatusConfig {
  /** EP 色名（兼容旧 use 场景）；优先使用 variant，color 仅作 fallback */
  color?: EpColor;
  /** 显式指定 shadcn YdBadge variant；优先于 color */
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
  label: string;
}

interface Props {
  status: string;
  /** 状态 -> 显示配置 映射 */
  statusMap?: Record<string, StatusConfig>;
}

const props = withDefaults(defineProps<Props>(), {
  statusMap: undefined,
});

/**
 * 实际使用的状态映射。
 *
 * <p>默认文案不能写在 prop 默认值里：那里只能是静态中文串，切换语种不会跟着变。
 * 未传 statusMap 时按当前语种现取词典。
 */
const resolvedStatusMap = computed<Record<string, StatusConfig>>(() => props.statusMap ?? {
  DRAFT: { color: 'info', label: $t('ui.bizStatus.draft') },
  PENDING: { color: 'warning', label: $t('ui.bizStatus.pending') },
  RUNNING: { color: 'primary', label: $t('ui.bizStatus.running') },
  SUCCESS: { color: 'success', label: $t('ui.bizStatus.success') },
  FAILED: { color: 'danger', label: $t('ui.bizStatus.failed') },
  APPROVED: { color: 'success', label: $t('ui.bizStatus.approved') },
  REJECTED: { color: 'danger', label: $t('ui.bizStatus.rejected') },
  ENABLED: { color: 'success', label: $t('ui.bizStatus.enabled') },
  DISABLED: { color: 'info', label: $t('ui.bizStatus.disabled') },
});

/** EP color -> shadcn YdBadge variant 的兼容映射 */
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

const resolved = computed(() => {
  const cfg = resolvedStatusMap.value[props.status] ?? { color: 'info' as EpColor, label: props.status };
  return {
    label: cfg.label,
    variant: cfg.variant ?? colorToVariant(cfg.color),
  };
});
</script>

<template>
  <YdBadge :variant="resolved.variant">
    {{ resolved.label }}
  </YdBadge>
</template>
