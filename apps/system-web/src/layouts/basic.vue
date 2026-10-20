<!--
 * basic 布局组件 —— 移动端侧边抽屉菜单适配
 *
 * <p>桌面端保持原有 YdAdminLayout 渲染链路不变；
 * 在移动端（&lt; 768px）追加抽屉式侧边菜单：
 * <ul>
 *   <li>顶部浮动 &ldquo;☰&rdquo; 按钮（仅移动端可见）</li>
 *   <li>抽屉从左侧滑入，带半透明遮罩</li>
 *   <li>菜单项复用 accessStore.accessMenus 数据，路由跳转后自动关闭抽屉</li>
 * </ul>
 *
 * @path apps\system-web\src\layouts\basic.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { RouteLocationRaw } from 'vue-router';

import { watch } from 'vue';

import { YdErrorBoundary, useWatermark } from '@ydsz/common-ui';
import { useAccessStore, useUserStore } from '@ydsz/stores';
import { useBreakpoints } from '@vueuse/core';
import { breakpointsTailwind } from '@vueuse/core';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import { createLogger } from '@ydsz-core/shared/utils';

const logger = createLogger('basic-layout');

const { t } = useI18n();
const userStore = useUserStore();
const accessStore = useAccessStore();
const router = useRouter();
const route = useRoute();
const { destroyWatermark, updateWatermark } = useWatermark();

/* ===================== 移动端断点判断 ===================== */
const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smaller('md');

/* ===================== 抽屉开关状态 ===================== */
const drawerOpen = ref(false);

/** 打开抽屉时锁定页面滚动 */
watch(drawerOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : '';
});

/** 路由变更后自动关闭抽屉 */
watch(
  () => route.fullPath,
  () => {
    drawerOpen.value = false;
  },
);

/* ===================== 菜单数据处理 ===================== */

/**
 * 将 accessMenus 拍平为可渲染列表，附带面包屑路径（i18n 已翻译的父级名称）。
 *
 * <p>仅展开两级（一级分组 + 二级菜单项），更深层级在桌面端的 YdAdminLayout 中渲染；
 * 移动端抽屉空间有限，只展示一级分组标题与其直属可跳转子项。
 */
interface DrawerMenuItem {
  /** 菜单项唯一键 */
  key: string;
  /** i18n 翻译后的显示文本 */
  label: string;
  /** 路由跳转地址（可路由的菜单项才有） */
  to?: RouteLocationRaw;
  /** 子菜单项 */
  children?: DrawerMenuItem[];
}

const menuItems = computed<DrawerMenuItem[]>(() => {
  return accessStore.accessMenus.map((menu) => {
    const key = menu.path ?? '';
    const label = menu.name || '';
    const children: DrawerMenuItem[] = [];

    if (menu.children?.length) {
      for (const child of menu.children) {
        const childPath = child.path;
        if (!childPath) continue;
        children.push({
          key: childPath,
          label: child.name || '',
          to: { path: childPath },
        });
      }
    }

    const item: DrawerMenuItem = { key, label };
    if (menu.path) {
      item.to = { path: menu.path };
    }
    if (children.length > 0) {
      item.children = children;
    }
    return item;
  });
});

/**
 * 点击菜单项：跳转到目标路由，关闭抽屉。
 *
 * @param to - 路由跳转目标
 */
function handleMenuClick(to: RouteLocationRaw): void {
  router.push(to).catch(() => {
    logger.warn('抽屉菜单路由跳转失败，目标路径：{}', to);
  });

  // 关闭抽屉
  drawerOpen.value = false;
}

/* ===================== 水印保持兼容 ===================== */
watch(
  () => (userStore.userInfo?.username, userStore.userInfo?.realName),
  async () => {
    const { preferences } = await import('@ydsz/preferences');
    if (preferences.app.watermark) {
      await updateWatermark({
        content: `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
      });
    } else {
      destroyWatermark();
    }
  },
);
</script>

<template>
  <!-- YdErrorBoundary 防止业务组件渲染异常导致白屏 -->
  <YdErrorBoundary :show-retry="true" :error-message="t('error.pageLoadFailed')">
    <RouterView />

    <!-- ===================== 移动端抽屉菜单 ===================== -->
    <Teleport to="body">
      <!-- 浮动汉堡按钮：仅 &lt; 768px 可见 -->
      <button
        v-if="isMobile"
        class="mobile-hamburger-btn"
        :aria-label="t('common.menu')"
        @click="drawerOpen = true"
      >
        <span class="hamburger-icon">&#9776;</span>
      </button>

      <!-- 遮罩层 + 抽屉面板 -->
      <Transition name="drawer-overlay">
        <div
          v-if="drawerOpen && isMobile"
          class="drawer-overlay"
          @click="drawerOpen = false"
        >
          <Transition name="drawer-slide">
            <nav
              v-if="drawerOpen"
              class="drawer-panel"
              role="navigation"
              aria-label="Mobile navigation"
              @click.stop
            >
              <!-- 抽屉头部 -->
              <div class="drawer-header">
                <span class="drawer-title">{{ t('common.menu') }}</span>
                <button
                  class="drawer-close-btn"
                  :aria-label="t('common.close')"
                  @click="drawerOpen = false"
                >
                  &times;
                </button>
              </div>

              <!-- 菜单列表 -->
              <ul class="drawer-menu">
                <li
                  v-for="item in menuItems"
                  :key="item.key"
                  class="drawer-menu-group"
                >
                  <!-- 一级菜单（有路由则直接跳转，有子项则展示分组标题） -->
                  <button
                    v-if="item.to && (!item.children || item.children.length === 0)"
                    class="drawer-menu-item drawer-menu-item--link"
                    @click="handleMenuClick(item.to)"
                  >
                    {{ item.label }}
                  </button>
                  <span
                    v-else
                    class="drawer-menu-group-title"
                  >
                    {{ item.label }}
                  </span>

                  <!-- 二级菜单列表 -->
                  <ul
                    v-if="item.children && item.children.length > 0"
                    class="drawer-submenu"
                  >
                    <li
                      v-for="child in item.children"
                      :key="child.key"
                    >
                      <button
                        class="drawer-menu-item"
                        @click="child.to && handleMenuClick(child.to)"
                      >
                        {{ child.label }}
                      </button>
                    </li>
                  </ul>
                </li>
              </ul>
            </nav>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </YdErrorBoundary>
</template>

<style lang="scss" scoped>
/* ===================== 汉堡按钮 ===================== */
.mobile-hamburger-btn {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background-color: hsl(0deg 0% 100%);
  box-shadow: 0 2px 8px hsl(0deg 0% 0% / 15%);
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: hsl(0deg 0% 95%);
  }
}

.hamburger-icon {
  font-size: 20px;
  line-height: 1;
}

/* ===================== 遮罩层 ===================== */
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  background-color: hsl(0deg 0% 0% / 50%);
}

.drawer-overlay-enter-active,
.drawer-overlay-leave-active {
  transition: opacity 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-overlay-enter-from,
.drawer-overlay-leave-to {
  opacity: 0;
}

/* ===================== 抽屉面板 ===================== */
.drawer-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 280px;
  max-width: 80vw;
  height: 100%;
  background-color: hsl(0deg 0% 100%);
  box-shadow: 2px 0 12px hsl(0deg 0% 0% / 20%);
  overflow-y: auto;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(-100%);
}

/* ===================== 抽屉头部 ===================== */
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid hsl(0deg 0% 90%);
}

.drawer-title {
  font-size: 1.125rem;
  font-weight: 600;
}

.drawer-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 24px;
  cursor: pointer;
  color: hsl(0deg 0% 40%);

  &:hover {
    color: hsl(0deg 0% 0%);
  }
}

/* ===================== 菜单列表 ===================== */
.drawer-menu {
  list-style: none;
  margin: 0;
  padding: 8px 0;
}

.drawer-menu-group {
  &:not(:last-child) {
    border-bottom: 1px solid hsl(0deg 0% 95%);
  }
}

.drawer-menu-group-title {
  display: block;
  padding: 12px 16px 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: hsl(0deg 0% 50%);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.drawer-submenu {
  list-style: none;
  margin: 0;
  padding: 0;
}

.drawer-menu-item {
  display: block;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: none;
  text-align: left;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
  color: hsl(0deg 0% 10%);

  &:hover {
    background-color: hsl(0deg 0% 96%);
  }

  &--link {
    font-weight: 500;
  }
}
</style>
