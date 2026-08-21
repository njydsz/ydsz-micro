/**
 * use-layout-state 组合式函数
 *
 * 管理 YDSZLayout 的布局状态：header/footer/sidebar 的展开收起状态、
 * 相关的计算属性、滚动/鼠标追踪及联动的 watchers。
 *
 * @path comm\@core\ui-kit\layout-ui\src\composables\use-layout-state.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { CSSProperties } from 'vue';

import type { YDSZLayoutProps } from '../YDSZ-layout';

import { computed, ref, watch } from 'vue';

import {
  useLayoutFooterStyle,
  useLayoutHeaderStyle,
} from '@YDSZ-core/composables';

import { useMouse, useScroll, useThrottleFn } from '@vueuse/core';

import { useLayout } from '../hooks/use-layout';

/**
 * useLayoutState 的输入选项
 */
interface UseLayoutStateOptions {
  /** 组件 props */
  props: YDSZLayoutProps;
  /** 侧边栏折叠状态（双向绑定） */
  sidebarCollapse: { value: boolean };
  /** 侧边栏扩展区域可见性（双向绑定） */
  sidebarExtraVisible: { value: boolean | undefined };
  /** 侧边栏扩展区域折叠状态（双向绑定） */
  sidebarExtraCollapse: { value: boolean };
  /** 侧边栏悬停展开状态（双向绑定） */
  sidebarExpandOnHover: { value: boolean };
  /** 侧边栏是否启用（双向绑定） */
  sidebarEnable: { value: boolean };
  /** 事件触发函数 */
  emit: (event: 'sideMouseLeave' | 'toggleSidebar') => void;
}

/**
 * 提取 YDSZLayout 的布局状态逻辑：
 * - header/footer/sidebar 的展开收起状态管理
 * - 滚动/鼠标追踪及联动 watchers
 * - 与布局相关的全部计算属性
 *
 * @param options - 包含 props、双向绑定 model refs 和 emit 的选项对象
 * @returns 模板所需的全部状态、计算属性和方法
 */
export function useLayoutState(options: UseLayoutStateOptions) {
  const {
    props,
    sidebarCollapse,
    sidebarExtraVisible,
    sidebarExtraCollapse,
    sidebarExpandOnHover,
    sidebarEnable,
    emit,
  } = options;

  // side是否处于hover状态展开菜单中
  const sidebarExpandOnHovering = ref(false);
  const headerIsHidden = ref(false);
  const contentRef = ref();

  const {
    arrivedState,
    directions,
    isScrolling,
    y: scrollY,
  } = useScroll(document);

  const { setLayoutHeaderHeight } = useLayoutHeaderStyle();
  const { setLayoutFooterHeight } = useLayoutFooterStyle();

  const { y: mouseY } = useMouse({ target: contentRef, type: 'client' });

  const {
    currentLayout,
    isFullContent,
    isHeaderMixedNav,
    isHeaderNav,
    isMixedNav,
    isSidebarMixedNav,
  } = useLayout(props);

  /**
   * 顶栏是否自动隐藏
   */
  const isHeaderAutoMode = computed(() => props.headerMode === 'auto');

  const headerWrapperHeight = computed(() => {
    let height = 0;
    if (props.headerVisible && !props.headerHidden) {
      height += props.headerHeight;
    }
    return height;
  });

  const getSideCollapseWidth = computed(() => {
    const { sidebarCollapseShowTitle, sidebarMixedWidth, sideCollapseWidth } =
      props;

    return sidebarCollapseShowTitle ||
      isSidebarMixedNav.value ||
      isHeaderMixedNav.value
      ? sidebarMixedWidth
      : sideCollapseWidth;
  });

  /**
   * 动态获取侧边区域是否可见
   */
  const sidebarEnableState = computed(() => {
    return !isHeaderNav.value && sidebarEnable.value;
  });

  /**
   * 侧边区域离顶部高度
   */
  const sidebarMarginTop = computed(() => {
    const { headerHeight, isMobile } = props;
    return isMixedNav.value && !isMobile ? headerHeight : 0;
  });

  /**
   * 动态获取侧边宽度
   */
  const getSidebarWidth = computed(() => {
    const { isMobile, sidebarHidden, sidebarMixedWidth, sidebarWidth } = props;
    let width = 0;

    if (sidebarHidden) {
      return width;
    }

    if (
      !sidebarEnableState.value ||
      (sidebarHidden &&
        !isSidebarMixedNav.value &&
        !isMixedNav.value &&
        !isHeaderMixedNav.value)
    ) {
      return width;
    }

    if ((isHeaderMixedNav.value || isSidebarMixedNav.value) && !isMobile) {
      width = sidebarMixedWidth;
    } else if (sidebarCollapse.value) {
      width = isMobile ? 0 : getSideCollapseWidth.value;
    } else {
      width = sidebarWidth;
    }
    return width;
  });

  /**
   * 获取扩展区域宽度
   */
  const sidebarExtraWidth = computed(() => {
    const { sidebarExtraCollapsedWidth, sidebarWidth } = props;

    return sidebarExtraCollapse.value
      ? sidebarExtraCollapsedWidth
      : sidebarWidth;
  });

  /**
   * 是否侧边栏模式，包含混合侧边
   */
  const isSideMode = computed(
    () =>
      currentLayout.value === 'mixed-nav' ||
      currentLayout.value === 'sidebar-mixed-nav' ||
      currentLayout.value === 'sidebar-nav' ||
      currentLayout.value === 'header-mixed-nav' ||
      currentLayout.value === 'header-sidebar-nav',
  );

  /**
   * header fixed值
   */
  const headerFixed = computed(() => {
    const { headerMode } = props;
    return (
      isMixedNav.value ||
      headerMode === 'fixed' ||
      headerMode === 'auto-scroll' ||
      headerMode === 'auto'
    );
  });

  const showSidebar = computed(() => {
    return isSideMode.value && sidebarEnable.value && !props.sidebarHidden;
  });

  /**
   * 遮罩可见性
   */
  const maskVisible = computed(
    () => !sidebarCollapse.value && props.isMobile,
  );

  const mainStyle = computed(() => {
    let width = '100%';
    let sidebarAndExtraWidth = 'unset';
    if (
      headerFixed.value &&
      currentLayout.value !== 'header-nav' &&
      currentLayout.value !== 'mixed-nav' &&
      currentLayout.value !== 'header-sidebar-nav' &&
      showSidebar.value &&
      !props.isMobile
    ) {
      // fixed模式下生效
      const isSideNavEffective =
        (isSidebarMixedNav.value || isHeaderMixedNav.value) &&
        sidebarExpandOnHover.value &&
        sidebarExtraVisible.value;

      if (isSideNavEffective) {
        const sideCollapseWidth = sidebarCollapse.value
          ? getSideCollapseWidth.value
          : props.sidebarMixedWidth;
        const sideWidth = sidebarExtraCollapse.value
          ? props.sidebarExtraCollapsedWidth
          : props.sidebarWidth;

        // 100% - 侧边菜单混合宽度 - 菜单宽度
        sidebarAndExtraWidth = `${sideCollapseWidth + sideWidth}px`;
        width = `calc(100% - ${sidebarAndExtraWidth})`;
      } else {
        sidebarAndExtraWidth =
          sidebarExpandOnHovering.value && !sidebarExpandOnHover.value
            ? `${getSideCollapseWidth.value}px`
            : `${getSidebarWidth.value}px`;
        width = `calc(100% - ${sidebarAndExtraWidth})`;
      }
    }
    return {
      sidebarAndExtraWidth,
      width,
    };
  });

  // 计算 tabbar 的样式
  const tabbarStyle = computed((): CSSProperties => {
    return {
      marginLeft: `0px`,
      width: '100%',
    };
  });

  const contentStyle = computed((): CSSProperties => {
    const fixed = headerFixed.value;

    const { footerEnable, footerFixed, footerHeight } = props;
    return {
      marginTop:
        fixed &&
        !isFullContent.value &&
        !headerIsHidden.value &&
        (!isHeaderAutoMode.value || scrollY.value < headerWrapperHeight.value)
          ? `${headerWrapperHeight.value}px`
          : 0,
      paddingBottom: `${footerEnable && footerFixed ? footerHeight : 0}px`,
    };
  });

  const headerZIndex = computed(() => {
    const { zIndex } = props;
    const offset = isMixedNav.value ? 1 : 0;
    return zIndex + offset;
  });

  const headerWrapperStyle = computed((): CSSProperties => {
    const fixed = headerFixed.value;
    return {
      height: isFullContent.value ? '0' : `${headerWrapperHeight.value}px`,
      left: isMixedNav.value ? 0 : mainStyle.value.sidebarAndExtraWidth,
      position: fixed ? 'fixed' : 'static',
      top:
        headerIsHidden.value || isFullContent.value
          ? `-${headerWrapperHeight.value}px`
          : 0,
      width: mainStyle.value.width,
      'z-index': headerZIndex.value,
    };
  });

  /**
   * 侧边栏z-index
   */
  const sidebarZIndex = computed(() => {
    const { isMobile, zIndex } = props;
    let offset = isMobile || isSideMode.value ? 1 : -1;

    if (isMixedNav.value) {
      offset += 1;
    }

    return zIndex + offset;
  });

  const footerWidth = computed(() => {
    if (!props.footerFixed) {
      return '100%';
    }

    return '100%';
  });

  const maskStyle = computed((): CSSProperties => {
    return { zIndex: props.zIndex };
  });

  const showHeaderToggleButton = computed(() => {
    return (
      props.isMobile ||
      (props.headerToggleSidebarButton &&
        isSideMode.value &&
        !isSidebarMixedNav.value &&
        !isMixedNav.value &&
        !props.isMobile)
    );
  });

  const showHeaderLogo = computed(() => {
    return !isSideMode.value || isMixedNav.value || props.isMobile;
  });

  // === Watchers ===

  watch(
    () => props.isMobile,
    (val) => {
      if (val) {
        sidebarCollapse.value = true;
      }
    },
    {
      immediate: true,
    },
  );

  watch(
    [() => headerWrapperHeight.value, () => isFullContent.value],
    ([height]) => {
      setLayoutHeaderHeight(isFullContent.value ? 0 : height);
    },
    {
      immediate: true,
    },
  );

  watch(
    () => props.footerHeight,
    (height: number) => {
      setLayoutFooterHeight(height);
    },
    {
      immediate: true,
    },
  );

  {
    const mouseMove = () => {
      mouseY.value > headerWrapperHeight.value
        ? (headerIsHidden.value = true)
        : (headerIsHidden.value = false);
    };
    watch(
      [() => props.headerMode, () => mouseY.value],
      () => {
        if (!isHeaderAutoMode.value || isMixedNav.value || isFullContent.value) {
          if (props.headerMode !== 'auto-scroll') {
            headerIsHidden.value = false;
          }
          return;
        }
        headerIsHidden.value = true;
        mouseMove();
      },
      {
        immediate: true,
      },
    );
  }

  {
    const checkHeaderIsHidden = useThrottleFn(
      (top: boolean, bottom: boolean, topArrived: boolean) => {
        if (scrollY.value < headerWrapperHeight.value) {
          headerIsHidden.value = false;
          return;
        }
        if (topArrived) {
          headerIsHidden.value = false;
          return;
        }

        if (top) {
          headerIsHidden.value = false;
        } else if (bottom) {
          headerIsHidden.value = true;
        }
      },
      300,
    );

    watch(
      () => scrollY.value,
      () => {
        if (
          props.headerMode !== 'auto-scroll' ||
          isMixedNav.value ||
          isFullContent.value
        ) {
          return;
        }
        if (isScrolling.value) {
          checkHeaderIsHidden(
            directions.top,
            directions.bottom,
            arrivedState.top,
          );
        }
      },
    );
  }

  // === Methods ===

  function handleClickMask() {
    sidebarCollapse.value = true;
  }

  function handleHeaderToggle() {
    if (props.isMobile) {
      sidebarCollapse.value = false;
    } else {
      emit('toggleSidebar');
    }
  }

  return {
    // state refs
    sidebarExpandOnHovering,
    headerIsHidden,
    contentRef,

    // scroll position (used in template for shadow effect)
    scrollY,

    // computed properties
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

    // layout detection
    currentLayout,
    isFullContent,
    isHeaderMixedNav,
    isHeaderNav,
    isMixedNav,
    isSidebarMixedNav,

    // methods
    handleClickMask,
    handleHeaderToggle,
  };
}
