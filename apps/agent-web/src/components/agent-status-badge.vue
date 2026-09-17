<!--
 * AgentStatusBadge — 显示 Agent 运行状态的纯展示组件
 *
 * <p>无业务逻辑依赖，接收 status prop 显示对应徽章样式。
 * 纯展示组件，易于单测覆盖。
 *
 * @path apps/agent-web/src/components/agent-status-badge.vue
 * @author ydsz-team
 * @since 26.09.17
-->
<script lang="ts" setup>
/**
 * Agent 运行状态枚举。
 */
export type AgentStatus = 'idle' | 'running' | 'paused' | 'error';

export interface AgentStatusBadgeProps {
  /** Agent 当前状态 */
  status: AgentStatus;
  /** 是否显示文字标签，默认 true */
  showLabel?: boolean;
}

const props = withDefaults(defineProps<AgentStatusBadgeProps>(), {
  showLabel: true,
});

/** 状态 → 中文标签映射 */
const STATUS_LABELS: Record<AgentStatus, string> = {
  idle: '空闲',
  running: '运行中',
  paused: '已暂停',
  error: '异常',
};

/** 状态 → CSS 类名映射 */
const STATUS_CLASSES: Record<AgentStatus, string> = {
  idle: 'bg-gray-200 text-gray-600',
  running: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
};

const label = STATUS_LABELS[props.status];
const cssClass = STATUS_CLASSES[props.status];
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
    :class="cssClass"
    data-testid="agent-status-badge"
  >
    <span v-if="showLabel">{{ label }}</span>
  </span>
</template>
