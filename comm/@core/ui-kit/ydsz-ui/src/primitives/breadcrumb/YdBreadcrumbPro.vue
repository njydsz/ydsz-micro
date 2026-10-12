<script setup lang="ts">
/**
* 面包屑 Pro —— 便利性封装（Convenience Wrapper）。
* 
 * 配置式 options API，允许通过 items 数组快速声明面包屑，
 * 对齐 Ant Design / Element Plus 的 Breadcrumb 使用习惯。
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\breadcrumb\YdBreadcrumbPro.vue
 * @author ydsz-team
 * @since 1.0.0
 */
/**
 * 面包屑 Pro——配置式便利性封装。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { YdBreadcrumb, YdBreadcrumbItem, YdBreadcrumbLink, YdBreadcrumbList, YdBreadcrumbPage, YdBreadcrumbSeparator } from '@ydsz-core/ydsz-ui';

/** 面包屑项配置 */
export interface BreadcrumbItemOption {
  /** 显示文本 */
  title: string;
  /** 跳转路径（不传则渲染为纯文本） */
  href?: string;
  /** 是否在菜单中禁用（不可点击） */
  disabled?: boolean;
  /** 自定义点击事件 */
  onClick?: () => void;
}

const props = withDefaults(defineProps<{
  /** 面包屑项列表 */
  items: BreadcrumbItemOption[];
  /** 分隔符（默认 /） */
  separator?: string;
}>(), {
  separator: '/',
});
</script>

<template>
  <!--
    面包屑便利性封装 —— 配置式 options 用法。

    用法一（配置式，快速声明）：
    ```html
    <YdBreadcrumbPro :items="[
      { title: '首页', href: '/' },
      { title: '知识图谱', href: '/kg' },
      { title: '实体详情' },
    ]" />
    ```

    用法二（声明式，精细控制 —— 直接使用七件套原子组件）：
    ```html
    <YdBreadcrumb>
      <YdBreadcrumbList>
        <YdBreadcrumbItem><YdBreadcrumbLink href="/">首页</YdBreadcrumbLink></YdBreadcrumbItem>
        <YdBreadcrumbSeparator />
        <YdBreadcrumbItem><YdBreadcrumbPage>实体详情</YdBreadcrumbPage></YdBreadcrumbItem>
      </YdBreadcrumbList>
    </YdBreadcrumb>
    ```
  -->
  <YdBreadcrumb>
    <YdBreadcrumbList>
      <template
        v-for="(item, idx) in items"
        :key="idx"
      >
        <YdBreadcrumbItem>
          <YdBreadcrumbLink
            v-if="item.href && !item.disabled"
            :href="item.href"
            @click="item.onClick"
          >
            {{ item.title }}
          </YdBreadcrumbLink>
          <YdBreadcrumbPage v-else-if="idx === items.length - 1">
            {{ item.title }}
          </YdBreadcrumbPage>
          <span v-else :class="item.disabled ? 'text-muted-foreground cursor-not-allowed' : ''">
            {{ item.title }}
          </span>
        </YdBreadcrumbItem>
        <YdBreadcrumbSeparator v-if="idx < items.length - 1">
          <slot name="separator">{{ separator }}</slot>
        </YdBreadcrumbSeparator>
      </template>
    </YdBreadcrumbList>
  </YdBreadcrumb>
</template>
