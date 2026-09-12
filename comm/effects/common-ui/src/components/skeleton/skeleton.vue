<!--
  全局骨架屏组件

  <p>页面切换时显示骨架屏，避免白屏，提升用户体验。
  <p>符合云顶编码规范 §5 性能规范、§11 可访问性规范。

  <p>使用方式:
  <pre>{@code
    <Skeleton type="dashboard" />
    <Skeleton type="list" :count="5" />
    <Skeleton type="detail" />
    <Skeleton type="form" />
  }</pre>

  @path comm/effects/common-ui/src/components/skeleton/skeleton.vue
  @author ydsz-team
  @since 4.0.0
-->
<script setup lang="ts">
import { computed } from 'vue';

/**
 * 骨架屏类型
 */
export type SkeletonType = 'dashboard' | 'list' | 'detail' | 'form' | 'table' | 'custom';

/**
 * 组件 Props
 */
interface Props {
  /** 骨架屏类型 */
  type?: SkeletonType;
  /** 骨架屏行数（list/table 类型有效） */
  count?: number;
  /** 是否显示动画 */
  animated?: boolean;
  /** 自定义类名 */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'list',
  count: 3,
  animated: true,
  class: '',
});

/**
 * 骨架屏样式类
 */
const skeletonClasses = computed(() => {
  return ['skeleton-container', props.animated ? 'skeleton-animated' : '', props.class]
    .filter(Boolean)
    .join(' ');
});
</script>

<template>
  <div :class="skeletonClasses" role="status" aria-label="加载中" aria-live="polite">
    <!-- Dashboard 骨架屏 -->
    <div v-if="type === 'dashboard'" class="skeleton-dashboard">
      <div class="skeleton-row">
        <div class="skeleton-card" style="

--delay: 0ms" />
        <div class="skeleton-card" style="

--delay: 100ms" />
        <div class="skeleton-card" style="

--delay: 200ms" />
        <div class="skeleton-card" style="

--delay: 300ms" />
      </div>
      <div class="skeleton-chart" />
      <div class="skeleton-row">
        <div class="skeleton-table" style="

--delay: 400ms" />
        <div class="skeleton-list" style="

--delay: 500ms" />
      </div>
    </div>

    <!-- List 骨架屏 -->
    <div v-else-if="type === 'list'" class="skeleton-list">
      <div
        v-for="i in count"
        :key="i"
        class="skeleton-list-item"
        :style="{ '--delay': `${i * 50}ms` }"
      >
        <div class="skeleton-avatar" />
        <div class="skeleton-content">
          <div class="skeleton-line skeleton-line-lg" />
          <div class="skeleton-line skeleton-line-md" />
        </div>
      </div>
    </div>

    <!-- Detail 骨架屏 -->
    <div v-else-if="type === 'detail'" class="skeleton-detail">
      <div class="skeleton-header">
        <div class="skeleton-avatar skeleton-avatar-lg" />
        <div class="skeleton-header-content">
          <div class="skeleton-line skeleton-line-xl" />
          <div class="skeleton-line skeleton-line-lg" />
        </div>
      </div>
      <div class="skeleton-section">
        <div class="skeleton-line skeleton-line-md" style="width: 120px" />
        <div class="skeleton-line" />
        <div class="skeleton-line" />
        <div class="skeleton-line skeleton-line-sm" />
      </div>
      <div class="skeleton-section">
        <div class="skeleton-line skeleton-line-md" style="width: 100px" />
        <div class="skeleton-line" />
        <div class="skeleton-line" />
      </div>
    </div>

    <!-- Form 骨架屏 -->
    <div v-else-if="type === 'form'" class="skeleton-form">
      <div v-for="i in count" :key="i" class="skeleton-form-item">
        <div class="skeleton-line skeleton-line-sm" style="width: 80px" />
        <div class="skeleton-input" />
      </div>
      <div class="skeleton-form-actions">
        <div class="skeleton-button" />
        <div class="skeleton-button skeleton-button-secondary" />
      </div>
    </div>

    <!-- Table 骨架屏 -->
    <div v-else-if="type === 'table'" class="skeleton-table">
      <div class="skeleton-table-header">
        <div v-for="i in 5" :key="i" class="skeleton-line skeleton-line-sm" />
      </div>
      <div v-for="i in count" :key="i" class="skeleton-table-row">
        <div v-for="j in 5" :key="j" class="skeleton-line" />
      </div>
    </div>

    <!-- Custom 骨架屏 -->
    <div v-else class="skeleton-custom">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.skeleton-container {
  width: 100%;
  padding: var(--space-group);
}

/* 动画组合器规则统一置于单类规则之后 */
@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }

  100% {
    background-position: 200% 0;
  }
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }
}

/* Dashboard */
.skeleton-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-group);
}

.skeleton-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-group);
}

.skeleton-card {
  height: 100px;
  background: hsl(var(--bg-surface-3));
  border-radius: var(--radius-lg);
}

.skeleton-chart {
  height: 300px;
  background: hsl(var(--bg-surface-3));
  border-radius: var(--radius-lg);
}

.skeleton-table {
  flex: 1;
  height: 200px;
  background: hsl(var(--bg-surface-3));
  border-radius: var(--radius-lg);
}

/* List */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-group);
}

.skeleton-list-item {
  display: flex;
  align-items: center;
  gap: var(--space-group);
  padding: var(--space-group);
  background: hsl(var(--bg-surface-2));
  border-radius: var(--radius-lg);
  border: 1px solid hsl(var(--border-subtle));
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: hsl(var(--bg-surface-3));
  flex-shrink: 0;
}

.skeleton-avatar-lg {
  width: 64px;
  height: 64px;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Lines */
.skeleton-line {
  height: var(--text-14);
  background: hsl(var(--bg-surface-3));
  border-radius: var(--radius-xs);
  position: relative;
  overflow: hidden;
}

.skeleton-line::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, hsl(var(--bg-surface-2) / 50%), transparent);
  animation: shimmer 2s linear infinite;
  animation-delay: var(--delay, 0ms);
}

.skeleton-line-xl {
  height: var(--text-22);
  width: 60%;
}

.skeleton-line-lg {
  height: var(--text-18);
  width: 80%;
}

.skeleton-line-md {
  height: var(--text-14);
  width: 100%;
}

.skeleton-line-sm {
  height: var(--text-12);
  width: 100%;
}

/* Detail */
.skeleton-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-section);
}

.skeleton-header {
  display: flex;
  align-items: center;
  gap: var(--space-group);
}

.skeleton-header-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-inline);
}

.skeleton-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-group);
}

/* Form */
.skeleton-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-form-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-inline);
}

.skeleton-input {
  height: 40px;
  background: hsl(var(--bg-surface-3));
  border-radius: var(--radius-sm);
  border: 1px solid hsl(var(--border-subtle));
}

.skeleton-form-actions {
  display: flex;
  gap: var(--space-group);
  margin-top: var(--space-inline);
}

.skeleton-button {
  width: 100px;
  height: 36px;
  background: hsl(var(--bg-surface-3));
  border-radius: var(--radius-sm);
}

.skeleton-button-secondary {
  width: 80px;
}

/* Table */
.skeleton-table-header {
  display: flex;
  gap: var(--space-group);
  padding: var(--space-group);
  border-bottom: 1px solid hsl(var(--border-subtle));
}

.skeleton-table-header .skeleton-line {
  flex: 1;
}

.skeleton-table-row {
  display: flex;
  gap: var(--space-group);
  padding: var(--space-group);
  border-bottom: 1px solid hsl(var(--border-subtle));
}

.skeleton-table-row .skeleton-line {
  flex: 1;
}

.skeleton-animated .skeleton-card,
.skeleton-animated .skeleton-chart,
.skeleton-animated .skeleton-table,
.skeleton-animated .skeleton-list,
.skeleton-animated .skeleton-line,
.skeleton-animated .skeleton-avatar,
.skeleton-animated .skeleton-input,
.skeleton-animated .skeleton-button,
.skeleton-animated .skeleton-list-item {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  animation-delay: var(--delay, 0ms);
}

/* Responsive */
@media (width <= 768px) {
  .skeleton-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
