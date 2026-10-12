<!--
 * YdDrawerContainer —— 全局抽屉容器，承载命令式打开的多个抽屉。
 *
 * <p>在应用根节点挂载一次即可：
 * <pre>
 *   &lt;YdDrawerContainer /&gt;
 * </pre>
 *
 * <p>与 `useDrawer().drawer.open(options)` 配合使用。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\drawer\YdDrawerContainer.vue
 * @author ydsz-team
 * @since 1.0.0
 -->
<script lang="ts" setup>
import { reactive, ref } from 'vue';

import YdDrawer from './YdDrawer.vue';

import type { DrawerEntry } from './types';

// 使用 reactive 包裹状态以避免 vue-tsc 对 defineExpose 与 ref 绑定冲突的问题
const state = reactive({
  items: [] as DrawerEntry[],
});

/** 每个抽屉项的 resolve —— Promise 解析回调映射 */
const resolveMap = ref<Map<string, (data?: unknown) => void>>(new Map());

/**
 * 主动关闭某个抽屉（命令式 close 用）。
 */
function closeDrawer(id: string, data?: unknown): void {
  const resolve = resolveMap.value.get(id);
  if (resolve) {
    resolve(data);
    resolveMap.value.delete(id);
  }
  state.items = state.items.filter((e) => e.id !== id);
}

/**
 * 关闭所有抽屉。
 */
function closeAll(): void {
  const allItems = [...state.items];
  allItems.forEach((entry) => {
    const resolve = resolveMap.value.get(entry.id);
    if (resolve) {
      resolve(undefined);
      resolveMap.value.delete(entry.id);
    }
  });
  state.items = [];
}

/**
 * 在 update:open=false 时把 entry 从列表移除。
 */
function onUpdateOpen(entry: DrawerEntry, visible: boolean): void {
  if (!visible) {
    const resolve = resolveMap.value.get(entry.id);
    if (resolve) {
      resolve(undefined);
      resolveMap.value.delete(entry.id);
    }
    removeItem(entry.id);
  }
}

function removeItem(id: string): void {
  state.items = state.items.filter((e) => e.id !== id);
  resolveMap.value.delete(id);
}

/**
 * 添加抽屉。供 use-drawer-internal 通过 ref 调用。
 */
function _push(entry: DrawerEntry, resolve: (data?: unknown) => void): void {
  resolveMap.value.set(entry.id, resolve);
  state.items.push(entry);
}

defineExpose({
  _push,
  closeAll,
  closeDrawer,
  items: state.items,
});
</script>

<template>
  <div class="yd-drawer-container">
    <YdDrawer
      v-for="entry in state.items"
      :key="entry.id"
      :open="true"
      :header="entry.options.header"
      :position="entry.options.position"
      :width="entry.options.width"
      :height="entry.options.height"
      :mask-closable="entry.options.maskClosable ?? true"
      :close-on-esc="entry.options.closeOnEsc ?? true"
      :show-close="entry.options.showClose ?? true"
      :mask="entry.options.mask ?? true"
      :destroy-on-close="entry.options.destroyOnClose ?? false"
      @update:open="onUpdateOpen(entry, $event)"
      @closed="removeItem(entry.id)"
    >
      <!-- 内容组件（命令式） -->
      <template v-if="entry.options.component">
        <component :is="entry.options.component" v-bind="entry.options.props || {}" />
      </template>
      <!-- 简单文本内容 -->
      <template v-else-if="entry.options.content">
        <p class="text-sm text-text-secondary">{{ entry.options.content }}</p>
      </template>

      <!-- 底部（命令式 footer 渲染） -->
      <template v-if="entry.options.footer" #footer>
        <component :is="entry.options.footer()" />
      </template>
    </YdDrawer>
  </div>
</template>

<style scoped>
.yd-drawer-container {
  position: relative;
  pointer-events: none;
}
</style>
