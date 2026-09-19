<!--
 * Transfer 穿梭框：双栏带搜索，将选项从左栏移到右栏。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\transfer\transfer.vue
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { TransferEmits, TransferItem, TransferProps } from './transfer-types';

import { computed, ref, watch } from 'vue';

defineOptions({ name: 'YdTransfer' });

const props = withDefaults(defineProps<TransferProps>(), {
  filterPlaceholder: '请输入搜索内容',
  filterable: true,
  notFoundContent: '列表为空',
  titles: () => ['源列表', '目标列表'],
});

const emit = defineEmits<TransferEmits>();

/** 左侧搜索关键词 */
const leftFilter = ref('');
/** 右侧搜索关键词 */
const rightFilter = ref('');
/** 左侧选中项 */
const leftSelected = ref<Set<string | number>>(new Set());
/** 右侧选中项 */
const rightSelected = ref<Set<string | number>>(new Set());
/** 当前 targetKeys */
const innerTargetKeys = ref<Set<string | number>>(new Set(props.targetKeys));

watch(
  () => props.targetKeys,
  (val) => {
    innerTargetKeys.value = new Set(val);
  },
);

/** 左侧显示项（未被选中的） */
const leftData = computed(() => {
  const data = props.dataSource.filter((item) => !innerTargetKeys.value.has(item.key));
  if (!leftFilter.value || !props.filterable) return data;
  const keyword = leftFilter.value.toLowerCase();
  return data.filter(
    (item) =>
      item.title.toLowerCase().includes(keyword)
      || (item.description ?? '').toLowerCase().includes(keyword),
  );
});

/** 右侧显示项（已选中的） */
const rightData = computed(() => {
  const data = props.dataSource.filter((item) => innerTargetKeys.value.has(item.key));
  if (!rightFilter.value || !props.filterable) return data;
  const keyword = rightFilter.value.toLowerCase();
  return data.filter(
    (item) =>
      item.title.toLowerCase().includes(keyword)
      || (item.description ?? '').toLowerCase().includes(keyword),
  );
});

/** 全选：左侧 */
const isAllLeftChecked = computed(
  () => leftData.value.length > 0 && leftSelected.value.size === leftData.value.length && leftData.value.every((item) => !item.isDisabled),
);

/** 全选：右侧 */
const isAllRightChecked = computed(
  () => rightData.value.length > 0 && rightSelected.value.size === rightData.value.length && rightData.value.every((item) => !item.isDisabled),
);

/** 选中项总数（右侧） */
const selectedCount = computed(() => innerTargetKeys.value.size);

/** 全选/取消全选（左侧） */
function handleAllLeftChange(checked: boolean): void {
  leftSelected.value = checked
    ? new Set(leftData.value.filter((item) => !item.isDisabled).map((item) => item.key))
    : new Set();
}

/** 全选/取消全选（右侧） */
function handleAllRightChange(checked: boolean): void {
  rightSelected.value = checked
    ? new Set(rightData.value.filter((item) => !item.isDisabled).map((item) => item.key))
    : new Set();
}

/** 从左移到右 */
function moveToRight(): void {
  const toMove = [...leftSelected.value];
  toMove.forEach((key) => innerTargetKeys.value.add(key));
  leftSelected.value = new Set();
  emitUpdate();
  emit('change', [...innerTargetKeys.value], 'right', toMove);
}

/** 从右移到左 */
function moveToLeft(): void {
  const toMove = [...rightSelected.value];
  toMove.forEach((key) => innerTargetKeys.value.delete(key));
  rightSelected.value = new Set();
  emitUpdate();
  emit('change', [...innerTargetKeys.value], 'left', toMove);
}

/** 发出 update:targetKeys 事件 */
function emitUpdate(): void {
  emit('update:targetKeys', [...innerTargetKeys.value]);
}
</script>

<template>
  <div :class="['yd-transfer', props.class, { 'yd-transfer--disabled': isDisabled }]">
    <!-- 左侧面板 -->
    <div class="yd-transfer__panel yd-transfer__panel--left">
      <div class="yd-transfer__header">
        <label class="yd-transfer__checkbox">
          <input
            type="checkbox"
            :checked="isAllLeftChecked"
            :disabled="leftData.length === 0"
            @change="handleAllLeftChange(($event.target as HTMLInputElement).checked)"
          />
        </label>
        <span class="yd-transfer__panel-title">{{ titles[0] }}</span>
        <span class="yd-transfer__count">{{ leftSelected.size }}/{{ leftData.length }}</span>
      </div>

      <div v-if="filterable" class="yd-transfer__filter">
        <input v-model="leftFilter" type="text" :placeholder="filterPlaceholder" class="yd-transfer__filter-input" />
      </div>

      <div class="yd-transfer__list">
        <template v-if="leftData.length > 0">
          <div
            v-for="item in leftData"
            :key="item.key"
            :class="['yd-transfer__item', { 'yd-transfer__item--disabled': item.isDisabled }]"
          >
            <label class="yd-transfer__item-label">
              <input
                v-model="leftSelected"
                type="checkbox"
                class="yd-transfer__checkbox"
                :value="item.key"
                :disabled="item.isDisabled"
              />
              <span class="yd-transfer__item-text">
                <span class="yd-transfer__item-title">{{ item.title }}</span>
                <span v-if="item.description" class="yd-transfer__item-desc">{{ item.description }}</span>
              </span>
            </label>
          </div>
        </template>
        <div v-else class="yd-transfer__empty">{{ notFoundContent }}</div>
      </div>
    </div>

    <!-- 中间操作按钮 -->
    <div class="yd-transfer__actions">
      <button
        class="yd-transfer__btn yd-transfer__btn--right"
        type="button"
        :disabled="leftSelected.size === 0 || isDisabled"
        @click="moveToRight"
      >
        &gt;
      </button>
      <button
        class="yd-transfer__btn yd-transfer__btn--left"
        type="button"
        :disabled="rightSelected.size === 0 || isDisabled"
        @click="moveToLeft"
      >
        &lt;
      </button>
    </div>

    <!-- 右侧面板 -->
    <div class="yd-transfer__panel yd-transfer__panel--right">
      <div class="yd-transfer__header">
        <label class="yd-transfer__checkbox">
          <input
            type="checkbox"
            :checked="isAllRightChecked"
            :disabled="rightData.length === 0"
            @change="handleAllRightChange(($event.target as HTMLInputElement).checked)"
          />
        </label>
        <span class="yd-transfer__panel-title">{{ titles[1] }}</span>
        <span class="yd-transfer__count">{{ selectedCount }}</span>
      </div>

      <div v-if="filterable" class="yd-transfer__filter">
        <input v-model="rightFilter" type="text" :placeholder="filterPlaceholder" class="yd-transfer__filter-input" />
      </div>

      <div class="yd-transfer__list">
        <template v-if="rightData.length > 0">
          <div v-for="item in rightData" :key="item.key" class="yd-transfer__item">
            <label class="yd-transfer__item-label">
              <input
                v-model="rightSelected"
                type="checkbox"
                class="yd-transfer__checkbox"
                :value="item.key"
                :disabled="item.isDisabled"
              />
              <span class="yd-transfer__item-text">
                <span class="yd-transfer__item-title">{{ item.title }}</span>
                <span v-if="item.description" class="yd-transfer__item-desc">{{ item.description }}</span>
              </span>
            </label>
          </div>
        </template>
        <div v-else class="yd-transfer__empty">{{ notFoundContent }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.yd-transfer {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

.yd-transfer__panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--ydsz-color-border, #d9d9d9);
  border-radius: 6px;
  min-width: 200px;
  max-width: 280px;
  overflow: hidden;
}

.yd-transfer__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--ydsz-color-bg-secondary, #fafafa);
  border-bottom: 1px solid var(--ydsz-color-border-light, #f0f0f0);
}

.yd-transfer__panel-title {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.yd-transfer__count {
  font-size: 12px;
  color: var(--ydsz-color-text-secondary, #999);
}

.yd-transfer__filter {
  padding: 8px 12px;
}

.yd-transfer__filter-input {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid var(--ydsz-color-border, #d9d9d9);
  border-radius: 4px;
  font-size: 13px;
  outline: none;

  &:focus {
    border-color: var(--ydsz-color-primary, #1677ff);
  }
}

.yd-transfer__list {
  flex: 1;
  max-height: 240px;
  overflow-y: auto;
  padding: 4px 0;
}

.yd-transfer__item {
  padding: 6px 12px;
  transition: background-color var(--ydsz-motion-duration-fast, 150ms);

  &:hover {
    background: var(--ydsz-color-bg-hover, #f5f5f5);
  }

  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.yd-transfer__item-label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}

.yd-transfer__item-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.yd-transfer__item-desc {
  font-size: 12px;
  color: var(--ydsz-color-text-secondary, #999);
}

.yd-transfer__checkbox {
  flex-shrink: 0;
  cursor: pointer;
}

.yd-transfer__empty {
  padding: 16px;
  text-align: center;
  color: var(--ydsz-color-text-secondary, #999);
  font-size: 13px;
}

.yd-transfer__actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.yd-transfer__btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--ydsz-color-border, #d9d9d9);
  border-radius: 4px;
  background: var(--ydsz-color-bg, #fff);
  cursor: pointer;
  font-size: 14px;
  transition: all var(--ydsz-motion-duration-fast, 150ms);

  &:hover:not(:disabled) {
    border-color: var(--ydsz-color-primary, #1677ff);
    color: var(--ydsz-color-primary, #1677ff);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &--right {
    background: var(--ydsz-color-primary, #1677ff);
    color: #fff;
    border-color: var(--ydsz-color-primary, #1677ff);

    &:hover:not(:disabled) {
      background: var(--ydsz-color-primary-hover, #4096ff);
    }
  }
}
</style>
