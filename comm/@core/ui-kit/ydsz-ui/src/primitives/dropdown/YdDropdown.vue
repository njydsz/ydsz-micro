<!--
 * 下拉菜单 —— 便利性封装（Convenience Wrapper）。
 *
 * 配置式 options API 包裹 YdDropdownMenu 系列组件，
 * 对齐 Element Plus ElDropdown 的 options 配置形态。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\dropdown\YdDropdown.vue
 * @author ydsz-team
 * @since 1.0.0
 -->
<script setup lang="ts">
/**
 * 下拉菜单便利性封装。
 * <p>支持配置式 options 参数，简化常见使用场景。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { YdDropdownMenu, YdDropdownMenuContent, YdDropdownMenuItem, YdDropdownMenuSeparator, YdDropdownMenuTrigger } from '../dropdown-menu';

import type { HTMLAttributes } from 'vue';

/** 菜单项配置 */
export interface DropdownMenuItemOption {
  /** 显示文本 */
  label: string;
  /** 唯一值 */
  value: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示为分隔线 */
  divided?: boolean;
  /** 自定义图标 */
  icon?: string;
  /** 点击回调 */
  onClick?: () => void;
}

const props = withDefaults(defineProps<{
  /** 触发按钮文本 */
  label?: string;
  /** 配置式菜单项 */
  options?: DropdownMenuItemOption[];
  /** 触发方式 */
  trigger?: 'click' | 'hover' | 'focus';
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义 class */
  class?: HTMLAttributes['class'];
}>(), {
  trigger: 'click',
  disabled: false,
});
</script>

<template>
  <!--
    下拉菜单便利性封装 —— 配置式 options 用法。

    用法一（配置式，快速声明）：
    ```html
    <YdDropdown label="操作" :options="[
      { label: '编辑', value: 'edit', onClick: handleEdit },
      { label: '删除', value: 'delete', onClick: handleDelete },
      { label: '分享', value: 'share', divided: true, onClick: handleShare },
    ]" />
    ```

    用法二（声明式，精细控制）：
    ```html
    <YdDropdown>
      <YdDropdownMenuTrigger>操作</YdDropdownMenuTrigger>
      <YdDropdownMenuContent>
        <YdDropdownMenuItem @click="handleEdit">编辑</YdDropdownMenuItem>
        <YdDropdownMenuItem @click="handleDelete">删除</YdDropdownMenuItem>
        <YdDropdownMenuSeparator />
        <YdDropdownMenuItem @click="handleShare">分享</YdDropdownMenuItem>
      </YdDropdownMenuContent>
    </YdDropdown>
    ```
  -->
  <YdDropdownMenu>
    <!-- 触发器：有 label 时渲染文本按钮，否则使用 slot -->
    <YdDropdownMenuTrigger
      v-if="label"
      :disabled="disabled"
    >
      {{ label }}
    </YdDropdownMenuTrigger>
    <slot v-else name="trigger" />

    <!-- 内容：options 配置式 或 声明式 slot -->
    <YdDropdownMenuContent>
      <template v-if="options">
        <template
          v-for="item in options"
          :key="item.value"
        >
          <YdDropdownMenuSeparator v-if="item.divided" />
          <YdDropdownMenuItem
            :disabled="item.disabled"
            @click="item.onClick"
          >
            {{ item.label }}
          </YdDropdownMenuItem>
        </template>
      </template>
      <slot v-else />
    </YdDropdownMenuContent>
  </YdDropdownMenu>
</template>
