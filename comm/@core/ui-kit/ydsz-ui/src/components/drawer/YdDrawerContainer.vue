<!--
 * YdDrawerContainer —— 全局抽屉容器，承载命令式打开的多个抽屉。
 *
 * <p>在应用根节点挂载一次即可：
 * <pre>
 *   &lt;YdDrawerContainer /&gt;
 * </pre>
 *
 * <p>与 `useDrawer().drawer.open(options)` 配合使用：条目只由内部注册表驱动，
 * 关闭原因由 YdDrawer 的 close 事件透传，退场动画结束后才真正出列。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\drawer\YdDrawerContainer.vue
 * @author ydsz-team
 * @since 1.0.0
 -->
<script lang="ts" setup>
import { ref, shallowRef } from 'vue';

import type { DrawerCloseReason, DrawerEntry } from './types';

import YdDrawer from './YdDrawer.vue';

/** 容器内的抽屉条目：附带 resolve 回调 */
interface ContainerEntry extends DrawerEntry {
  resolve: (payload: { data?: unknown; reason: DrawerCloseReason }) => void;
}

/**
 * 条目列表用 shallowRef：options.component 是用户传入的组件对象，
 * 深代理会把组件包成 reactive 对象（Vue 运行时会告警且失去引用相等）。
 * 可见位单独存 Set，改可见位不需要重写整条条目。
 */
const items = shallowRef<ContainerEntry[]>([]);

/** 当前可见的抽屉 id */
const visibleIds = ref<Set<string>>(new Set());

/** 已经解析过的条目 id，防止 close 与 closed 重复 resolve */
const settled = ref<Set<string>>(new Set());

function findEntry(id: string): ContainerEntry | undefined {
  return items.value.find((entry) => entry.id === id);
}

/**
 * 结算某个抽屉的 Promise（幂等）。
 */
function settle(id: string, reason: DrawerCloseReason, data?: unknown): void {
  if (settled.value.has(id)) return;
  settled.value.add(id);
  findEntry(id)?.resolve({ data, reason });
}

/**
 * 主动关闭某个抽屉（命令式 close / closeAll 用）。
 */
function closeDrawer(id: string, data?: unknown): void {
  if (!findEntry(id)) return;
  settle(id, 'api', data);
  visibleIds.value.delete(id);
}

/**
 * 关闭所有抽屉。
 */
function closeAll(): void {
  for (const entry of [...items.value]) closeDrawer(entry.id);
}

/**
 * YdDrawer 抛出关闭请求：记录原因并进入退场动画。
 */
function onDrawerClose(entry: ContainerEntry, reason: DrawerCloseReason): void {
  settle(entry.id, reason);
  visibleIds.value.delete(entry.id);
}

/**
 * 退场动画结束后出列。
 */
function removeItem(id: string): void {
  items.value = items.value.filter((entry) => entry.id !== id);
  visibleIds.value.delete(id);
  settled.value.delete(id);
}

/**
 * 添加抽屉。供 use-drawer-internal 通过实例引用调用。
 */
function push(entry: DrawerEntry, resolve: ContainerEntry['resolve']): void {
  items.value = [...items.value, { ...entry, resolve }];
  visibleIds.value.add(entry.id);
}

defineExpose({
  closeAll,
  closeDrawer,
  push,
});
</script>

<template>
  <div class="yd-drawer-container">
    <YdDrawer
      v-for="entry in items"
      :key="entry.id"
      :close-on-esc="entry.options.closeOnEsc ?? true"
      :destroy-on-close="entry.options.destroyOnClose ?? false"
      :header="entry.options.header"
      :height="entry.options.height"
      :mask="entry.options.mask ?? true"
      :mask-closable="entry.options.maskClosable ?? true"
      :open="visibleIds.has(entry.id)"
      :position="entry.options.position"
      :show-close="entry.options.showClose ?? true"
      :width="entry.options.width"
      @close="onDrawerClose(entry, $event)"
      @closed="removeItem(entry.id)"
    >
      <!-- 内容组件（命令式） -->
      <component :is="entry.options.component" v-if="entry.options.component" v-bind="entry.options.props || {}" />
      <!-- 简单文本内容 -->
      <p v-else-if="entry.options.content" class="text-sm text-text-secondary">
        {{ entry.options.content }}
      </p>

      <!-- 底部（命令式 footer 渲染） -->
      <template v-if="entry.options.footer" #footer>
        <component :is="entry.options.footer()" />
      </template>
    </YdDrawer>
  </div>
</template>

<style scoped>
/* 容器本身不拦截指针事件，抽屉遮罩与面板自行恢复 */
.yd-drawer-container {
  pointer-events: none;
}
</style>
