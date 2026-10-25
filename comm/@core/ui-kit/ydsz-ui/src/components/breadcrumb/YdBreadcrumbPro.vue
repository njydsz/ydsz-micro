<script setup lang="ts">
/**
 * 面包屑 Pro —— 便利性封装（Convenience Wrapper）。
 *
 * 配置式 items API，允许通过数组快速声明面包屑，
 * 对齐 Ant Design / Element Plus 的 Breadcrumb 使用习惯；
 * 需要精细控制时仍可直接组合 YdBreadcrumb 七件套原子组件。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\breadcrumb\YdBreadcrumbPro.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import YdBreadcrumb from './YdBreadcrumb.vue';
import YdBreadcrumbItem from './YdBreadcrumbItem.vue';
import YdBreadcrumbLink from './YdBreadcrumbLink.vue';
import YdBreadcrumbList from './YdBreadcrumbList.vue';
import YdBreadcrumbPage from './YdBreadcrumbPage.vue';
import YdBreadcrumbSeparator from './YdBreadcrumbSeparator.vue';

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

withDefaults(defineProps<{
  /** 面包屑项列表 */
  items: BreadcrumbItemOption[];
  /** 分隔符（默认 /） */
  separator?: string;
}>(), {
  separator: '/',
});
</script>

<template>
  <YdBreadcrumb>
    <YdBreadcrumbList>
      <template
        v-for="(item, idx) in items"
        :key="item.href ?? item.title"
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
