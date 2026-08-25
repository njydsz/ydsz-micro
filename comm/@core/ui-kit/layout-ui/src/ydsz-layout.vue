<!--
 * YDSZ-layout Vue 组件
 *
 * @path comm\@core\ui-kit\layout-ui\src\YDSZ-layout.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { YDSZLayoutProps } from './YDSZ-layout';

import { SCROLL_FIXED_CLASS } from '@YDSZ-core/composables';
import { Menu } from '@YDSZ-core/icons';
import { YDSZIconButton } from '@YDSZ-core/shadcn-ui';
import { ELEMENT_ID_MAIN_CONTENT } from '@YDSZ-core/shared/constants';

import {
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
  LayoutSidebar,
  LayoutTabbar,
} from './components';
import { useLayoutState } from './composables/use-layout-state';

interface Props extends YDSZLayoutProps {}

defineOptions({
  name: 'YDSZLayout',
});

const props = withDefaults(defineProps<Props>(), {
  contentCompact: 'wide',
  contentCompactWidth: 1200,
  contentPadding: 0,
  contentPaddingBottom: 0,
  contentPaddingLeft: 0,
  contentPaddingRight: 0,
  contentPaddingTop: 0,
  footerEnable: false,
  footerFixed: true,
  footerHeight: 32,
  headerHeight: 50,
  headerHidden: false,
  headerMode: 'fixed',
  headerToggleSidebarButton: true,
  headerVisible: true,
  isMobile: false,
  layout: 'sidebar-nav',
  sidebarCollapsedButton: true,
  sidebarCollapseShowTitle: false,
  sidebarExtraCollapsedWidth: 60,
  sidebarFixedButton: true,
  sidebarHidden: false,
  sidebarMixedWidth: 80,
  sidebarTheme: 'dark',
  sidebarWidth: 180,
  sideCollapseWidth: 60,
  tabbarEnable: true,
  tabbarHeight: 40,
  zIndex: 200,
});

const emit = defineEmits<{ sideMouseLeave: []; toggleSidebar: [] }>();
const sidebarCollapse = defineModel<boolean>('sidebarCollapse', {
  default: false,
});
const sidebarExtraVisible = defineModel<boolean>('sidebarExtraVisible');
const sidebarExtraCollapse = defineModel<boolean>('sidebarExtraCollapse', {
  default: false,
});
const sidebarExpandOnHover = defineModel<boolean>('sidebarExpandOnHover', {
  default: false,
});
const sidebarEnable = defineModel<boolean>('sidebarEnable', { default: true });

const {
  sidebarExpandOnHovering,
  headerIsHidden,
  contentRef,
  scrollY,
  isHeaderAutoMode,
  headerWrapperHeight,
  getSideCollapseWidth,
  sidebarEnableState,
  sidebarMarginTop,
  getSidebarWidth,
  sidebarExtraWidth,
  isSideMode,
  headerFixed,
  showSidebar,
  maskVisible,
  mainStyle,
  tabbarStyle,
  contentStyle,
  headerZIndex,
  headerWrapperStyle,
  sidebarZIndex,
  footerWidth,
  maskStyle,
  showHeaderToggleButton,
  showHeaderLogo,
  currentLayout,
  isFullContent,
  isHeaderMixedNav,
  isHeaderNav,
  isMixedNav,
  isSidebarMixedNav,
  handleClickMask,
  handleHeaderToggle,
} = useLayoutState({
  props,
  sidebarCollapse,
  sidebarExtraVisible,
  sidebarExtraCollapse,
  sidebarExpandOnHover,
  sidebarEnable,
  emit,
});

const idMainContent = ELEMENT_ID_MAIN_CONTENT;
</script>

<template>
  <div class="relative flex min-h-full w-full">
    <LayoutSidebar
      v-if="sidebarEnableState"
      v-model:collapse="sidebarCollapse"
      v-model:expand-on-hover="sidebarExpandOnHover"
      v-model:expand-on-hovering="sidebarExpandOnHovering"
      v-model:extra-collapse="sidebarExtraCollapse"
      v-model:extra-visible="sidebarExtraVisible"
      :show-collapse-button="sidebarCollapsedButton"
      :show-fixed-button="sidebarFixedButton"
      :collapse-width="getSideCollapseWidth"
      :dom-visible="!isMobile"
      :extra-width="sidebarExtraWidth"
      :fixed-extra="sidebarExpandOnHover"
      :header-height="isMixedNav ? 0 : headerHeight"
      :is-sidebar-mixed="isSidebarMixedNav || isHeaderMixedNav"
      :margin-top="sidebarMarginTop"
      :mixed-width="sidebarMixedWidth"
      :show="showSidebar"
      :footer-enable="footerEnable"
      :footer-fixed="footerFixed"
      :footer-height="footerHeight"
      :theme="sidebarTheme"
      :width="getSidebarWidth"
      :z-index="sidebarZIndex"
      @leave="() => emit('sideMouseLeave')"
    >
      <template v-if="isSideMode && !isMixedNav" #logo>
        <slot name="logo"></slot>
      </template>

      <template v-if="isSidebarMixedNav || isHeaderMixedNav">
        <slot name="mixed-menu"></slot>
      </template>
      <template v-else>
        <slot name="menu"></slot>
      </template>

      <template #extra>
        <slot name="side-extra"></slot>
      </template>
      <template #extra-title>
        <slot name="side-extra-title"></slot>
      </template>
    </LayoutSidebar>

    <div
      ref="contentRef"
      class="flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in"
    >
      <div
        :class="[
          {
            'shadow-[0_16px_24px_hsl(var(--background))]': scrollY > 20,
          },
          SCROLL_FIXED_CLASS,
        ]"
        :style="headerWrapperStyle"
        class="overflow-hidden transition-all duration-200"
      >
        <LayoutHeader
          v-if="headerVisible"
          :full-width="!isSideMode"
          :height="headerHeight"
          :is-mobile="isMobile"
          :show="!isFullContent && !headerHidden"
          :sidebar-width="sidebarWidth"
          :theme="headerTheme"
          :width="mainStyle.width"
          :z-index="headerZIndex"
        >
          <template v-if="showHeaderLogo" #logo>
            <slot name="logo"></slot>
          </template>

          <template #toggle-button>
            <YDSZIconButton
              v-if="showHeaderToggleButton"
              class="my-0 mr-1 rounded-md"
              @click="handleHeaderToggle"
            >
              <Menu class="size-4" />
            </YDSZIconButton>
          </template>
          <slot name="header"></slot>
        </LayoutHeader>
      </div>

      <!-- </div> -->
      <LayoutContent
        :id="idMainContent"
        :content-compact="contentCompact"
        :content-compact-width="contentCompactWidth"
        :padding="contentPadding"
        :padding-bottom="contentPaddingBottom"
        :padding-left="contentPaddingLeft"
        :padding-right="contentPaddingRight"
        :padding-top="contentPaddingTop"
        :style="contentStyle"
        class="transition-[margin-top] duration-200"
      >
        <slot name="content"></slot>

        <template #overlay>
          <slot name="content-overlay"></slot>
        </template>
      </LayoutContent>
    </div>
    <LayoutFooter
      v-if="footerEnable"
      :fixed="footerFixed"
      :height="footerHeight"
      :show="!isFullContent"
      :width="footerWidth"
      :z-index="zIndex + 1"
    >
      <LayoutTabbar
        v-if="tabbarEnable"
        :height="tabbarHeight"
        :style="tabbarStyle"
      >
        <slot name="tabbar"></slot>
      </LayoutTabbar>
      <slot name="footer"></slot>
    </LayoutFooter>
    <slot name="extra"></slot>
    <div
      v-if="maskVisible"
      :style="maskStyle"
      class="bg-overlay fixed left-0 top-0 h-full w-full transition-[background-color] duration-200"
      @click="handleClickMask"
    ></div>
  </div>
</template>
