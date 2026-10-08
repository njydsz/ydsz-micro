<!--
 * 空状态组件 — 无数据时的占位展示和操作引导。
 *
 * @author ydsz-team
 * @since 1.1.0
-->
<script lang="ts" setup>
/**
 * YdEmptyState — 空状态占位组件。
 *
 * <p>用于列表/表格无数据时的友好展示，支持自定义标题、描述和操作按钮。
 *
 * @author ydzs-team
 * @since 1.1.0
 */

interface Props {
  /** 空状态描述文案 */
  description?: string;
  /** 操作按钮文案（传入则显示按钮） */
  actionText?: string;
  /** 空状态类型：search=搜索无结果 / no-data=无数据 / permission=无权限 */
  type?: 'no-data' | 'search' | 'permission';
}

const props = withDefaults(defineProps<Props>(), {
  description: '暂无数据',
  type: 'no-data',
});

const emit = defineEmits<{
  action: [];
}>();

const iconMap: Record<string, string> = {
  'no-data': 'inbox',
  search: 'search',
  permission: 'lock',
};
</script>

<template>
  <div class="yd-empty-state">
    <div class="yd-empty-state__icon">
      <span class="yd-empty-state__icon-text">{{ iconMap[props.type] || 'inbox' }}</span>
    </div>
    <div class="yd-empty-state__description">
      {{ props.description }}
    </div>
    <div v-if="props.actionText" class="yd-empty-state__action">
      <button class="yd-empty-state__action-btn" @click="emit('action')">
        {{ props.actionText }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.yd-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.yd-empty-state__icon {
  margin-bottom: 16px;
  font-size: 48px;
  opacity: 0.6;
}

.yd-empty-state__icon-text {
  font-size: 48px;
  line-height: 1;
}

.yd-empty-state__description {
  margin-bottom: 16px;
  font-size: 14px;
  color: var(--yd-color-text-secondary, #8c8c8c);
}

.yd-empty-state__action-btn {
  padding: 8px 24px;
  font-size: 14px;
  color: #fff;
  background-color: var(--yd-color-primary, #4096ff);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.yd-empty-state__action-btn:hover {
  background-color: var(--yd-color-primary-hover, #1677ff);
}
</style>
