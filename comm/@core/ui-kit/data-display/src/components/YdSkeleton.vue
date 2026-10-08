<!--
 * 骨架屏组件 — 数据加载时的占位骨架展示。
 *
 * @author ydsz-team
 * @since 1.1.0
-->
<script lang="ts" setup>
/**
 * YdSkeleton — 骨架屏加载占位组件。
 *
 * <p>用于表格/列表数据加载时的占位展示，支持行数和列数自定义。
 *
 * @author ydzs-team
 * @since 1.1.0
 */

interface Props {
  /** 骨架行数 */
  rows?: number;
  /** 骨架列数 */
  columns?: number;
  /** 是否显示标题骨架 */
  showTitle?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  rows: 5,
  columns: 4,
  showTitle: true,
});
</script>

<template>
  <div class="yd-skeleton">
    <div v-if="props.showTitle" class="yd-skeleton__title"></div>
    <div class="yd-skeleton__table">
      <div class="yd-skeleton__header">
        <div v-for="col in props.columns" :key="'h-' + col" class="yd-skeleton__cell"></div>
      </div>
      <div v-for="row in props.rows" :key="'r-' + row" class="yd-skeleton__row">
        <div v-for="col in props.columns" :key="'c-' + row + '-' + col" class="yd-skeleton__cell"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yd-skeleton {
  width: 100%;
}

.yd-skeleton__title {
  width: 30%;
  height: 28px;
  margin-bottom: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: yd-skeleton-pulse 1.5s infinite;
}

.yd-skeleton__table {
  width: 100%;
}

.yd-skeleton__header,
.yd-skeleton__row {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--yd-color-border, #f0f0f0);
}

.yd-skeleton__header {
  border-bottom: 2px solid var(--yd-color-border, #e8e8e8);
}

.yd-skeleton__cell {
  flex: 1;
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 2px;
  animation: yd-skeleton-pulse 1.5s infinite;
}

@keyframes yd-skeleton-pulse {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
