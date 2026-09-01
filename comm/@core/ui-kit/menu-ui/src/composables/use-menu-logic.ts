/**
 * Menu 组件的核心逻辑：状态管理、展开/折叠、菜单项注册、上下文注入、滚动定位与横向模式截断。
 *
 * 抽离成组合式函数是为了让菜单的行为可以脱离渲染层被测试与复用；
 * SFC 只保留模板与类名拼装。
 *
 * @path comm\@core\ui-kit\menu-ui\src\composables\use-menu-logic.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { ComputedRef, Ref, SetupContext, VNodeArrayChildren } from 'vue';

import type {
  MenuItemClicked,
  MenuItemRegistered,
  MenuProps,
  MenuProvider,
} from '../types';

import type { UseResizeObserverReturn } from '@vueuse/core';

import {
  computed,
  nextTick,
  reactive,
  ref,
  toRef,
  useSlots,
  watch,
  watchEffect,
} from 'vue';

import { useResizeObserver } from '@vueuse/core';

import {
  createMenuContext,
  createSubMenuContext,
} from '../hooks';
import { useMenuScroll } from '../hooks/use-menu-scroll';
import { flattedChildren } from '../utils';

/**
 * use-menu-logic 选项
 */
interface UseMenuLogicOptions {
  /**
   * 菜单组件的 props
   */
  props: MenuProps;
  /**
   * 菜单组件的事件触发器
   */
  emit: (
    event: 'close' | 'open' | 'select',
    path: string,
    parentPaths: string[],
  ) => void;
}

/**
 * use-menu-logic 返回值
 */
interface UseMenuLogicReturn {
  /**
   * 菜单项激活路径
   */
  activePath: MenuProvider['activePath'];
  /**
   * 添加菜单项
   */
  addMenuItem: (item: MenuItemRegistered) => void;
  /**
   * 添加子菜单
   */
  addSubMenu: (item: MenuItemRegistered) => void;
  /**
   * 关闭菜单
   */
  closeMenu: (path: string, parentPaths: string[]) => void;
  /**
   * 处理菜单项点击
   */
  handleMenuItemClick: (data: MenuItemClicked) => void;
  /**
   * 处理子菜单点击
   */
  handleSubMenuClick: (data: MenuItemRegistered) => void;
  /**
   * 当前是否为弹出式菜单
   */
  isMenuPopup: MenuProvider['isMenuPopup'];
  /**
   * 菜单项集合
   */
  items: MenuProvider['items'];
  /**
   * 菜单 DOM 引用
   */
  menu: Ref<HTMLUListElement | undefined>;
  /**
   * 子菜单集合
   */
  subMenus: MenuProvider['subMenus'];
  /**
   * 鼠标是否在子菜单内
   */
  mouseInChild: Ref<boolean>;
  /**
   * 已展开的菜单路径
   */
  openedMenus: MenuProvider['openedMenus'];
  /**
   * 打开菜单
   */
  openMenu: (path: string, parentPaths: string[]) => void;
  /**
   * 移除菜单项
   */
  removeMenuItem: (item: MenuItemRegistered) => void;
  /**
   * 移除子菜单
   */
  removeSubMenu: (item: MenuItemRegistered) => void;
  /**
   * 滚动到激活的菜单项
   */
  scrollToActiveItem: () => void;
  /**
   * 插槽内容（包含默认插槽和"更多"插槽）
   */
  getSlot: ComputedRef<{
    showSlotMore: boolean;
    slotDefault: VNodeArrayChildren;
    slotMore: VNodeArrayChildren;
  }>;
}

/**
 * 菜单核心逻辑组合式函数
 *
 * @param options - 选项对象，包含 props 和 emit
 * @returns 菜单状态、方法及模板所需的数据
 */
function useMenuLogic(options: UseMenuLogicOptions): UseMenuLogicReturn {
  const { props, emit } = options;

  const slots: SetupContext['slots'] = useSlots();
  const menu = ref<HTMLUListElement>();
  const sliceIndex = ref(-1);
  const openedMenus = ref<MenuProvider['openedMenus']>(
    props.defaultOpeneds && !props.collapse ? [...props.defaultOpeneds] : [],
  );
  const activePath = ref<MenuProvider['activePath']>(props.defaultActive);
  const items = ref<MenuProvider['items']>({});
  const subMenus = ref<MenuProvider['subMenus']>({});
  const mouseInChild = ref(false);

  const isMenuPopup = computed<MenuProvider['isMenuPopup']>(() => {
    return (
      props.mode === 'horizontal' || (props.mode === 'vertical' && props.collapse)
    );
  });

  const getSlot = computed(() => {
    // 更新插槽内容
    const defaultSlots: VNodeArrayChildren = slots.default?.() ?? [];

    const originalSlot = flattedChildren(defaultSlots) as VNodeArrayChildren;
    const slotDefault =
      sliceIndex.value === -1
        ? originalSlot
        : originalSlot.slice(0, sliceIndex.value);

    const slotMore =
      sliceIndex.value === -1 ? [] : originalSlot.slice(sliceIndex.value);

    return { showSlotMore: slotMore.length > 0, slotDefault, slotMore };
  });

  watch(
    () => props.collapse,
    (value) => {
      if (value) openedMenus.value = [];
    },
  );

  watch(items.value, initMenu);

  watch(
    () => props.defaultActive,
    (currentActive = '') => {
      if (!items.value[currentActive]) {
        activePath.value = '';
      }
      updateActiveName(currentActive);
    },
  );

  let resizeStopper: UseResizeObserverReturn['stop'];
  watchEffect(() => {
    if (props.mode === 'horizontal') {
      resizeStopper = useResizeObserver(menu, handleResize).stop;
    } else {
      resizeStopper?.();
    }
  });

  // 注入上下文
  createMenuContext(
    reactive({
      activePath,
      addMenuItem,
      addSubMenu,
      closeMenu,
      handleMenuItemClick,
      handleSubMenuClick,
      isMenuPopup,
      openedMenus,
      openMenu,
      props,
      removeMenuItem,
      removeSubMenu,
      subMenus,
      theme: toRef(props, 'theme'),
      items,
    }),
  );

  createSubMenuContext({
    addSubMenu,
    level: 1,
    mouseInChild,
    removeSubMenu,
  });

  function calcMenuItemWidth(menuItem: HTMLElement) {
    const computedStyle = getComputedStyle(menuItem);
    const marginLeft = Number.parseInt(computedStyle.marginLeft, 10);
    const marginRight = Number.parseInt(computedStyle.marginRight, 10);
    return menuItem.offsetWidth + marginLeft + marginRight || 0;
  }

  function calcSliceIndex() {
    if (!menu.value) {
      return -1;
    }
    const items = [...(menu.value?.childNodes ?? [])].filter(
      (item) =>
        // remove comment type node #12634
        item.nodeName !== '#comment' &&
        (item.nodeName !== '#text' || item.nodeValue),
    ) as HTMLElement[];

    const moreItemWidth = 46;
    const computedMenuStyle = getComputedStyle(menu?.value);

    const paddingLeft = Number.parseInt(computedMenuStyle.paddingLeft, 10);
    const paddingRight = Number.parseInt(computedMenuStyle.paddingRight, 10);
    const menuWidth = menu.value?.clientWidth - paddingLeft - paddingRight;

    let calcWidth = 0;
    let sliceIndex = 0;
    items.forEach((item, index) => {
      calcWidth += calcMenuItemWidth(item);
      if (calcWidth <= menuWidth - moreItemWidth) {
        sliceIndex = index + 1;
      }
    });
    return sliceIndex === items.length ? -1 : sliceIndex;
  }

  function debounce(fn: () => void, wait = 33.34) {
    let timer: null | ReturnType<typeof setTimeout>;
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        fn();
      }, wait);
    };
  }

  let isFirstTimeRender = true;
  function handleResize() {
    if (sliceIndex.value === calcSliceIndex()) {
      return;
    }
    const callback = () => {
      sliceIndex.value = -1;
      nextTick(() => {
        sliceIndex.value = calcSliceIndex();
      });
    };
    callback();
    // // execute callback directly when first time resize to avoid shaking
    if (isFirstTimeRender) {
      callback();
    } else {
      debounce(callback)();
    }
    isFirstTimeRender = false;
  }

  const enableScroll = computed(
    () => props.scrollToActive && props.mode === 'vertical' && !props.collapse,
  );

  const { scrollToActiveItem } = useMenuScroll(activePath, {
    enable: enableScroll,
    delay: 320,
  });

  // 监听 activePath 变化，自动滚动到激活项
  watch(activePath, () => {
    scrollToActiveItem();
  });

  // 默认展开菜单
  function initMenu() {
    const parentPaths = getActivePaths();

    // 展开该菜单项的路径上所有子菜单
    // expand all subMenus of the menu item
    parentPaths.forEach((path) => {
      const subMenu = subMenus.value[path];
      if (subMenu) {
        openMenu(path, subMenu.parentPaths);
      }
    });
  }

  function updateActiveName(val: string) {
    const itemsInData = items.value;
    const item =
      itemsInData[val] ||
      (activePath.value && itemsInData[activePath.value]) ||
      itemsInData[props.defaultActive || ''];

    activePath.value = item ? item.path : val;
  }

  function handleMenuItemClick(data: MenuItemClicked) {
    const { collapse, mode } = props;
    if (mode === 'horizontal' || collapse) {
      openedMenus.value = [];
    }
    const { parentPaths, path } = data;
    if (!path || !parentPaths) {
      return;
    }

    emit('select', path, parentPaths);
  }

  function handleSubMenuClick({ parentPaths, path }: MenuItemRegistered) {
    const isOpened = openedMenus.value.includes(path);

    if (isOpened) {
      closeMenu(path, parentPaths);
    } else {
      openMenu(path, parentPaths);
    }
  }

  function close(path: string) {
    const i = openedMenus.value.indexOf(path);

    if (i !== -1) {
      openedMenus.value.splice(i, 1);
    }
  }

  /**
   * 关闭、折叠菜单
   */
  function closeMenu(path: string, parentPaths: string[]) {
    if (props.accordion) {
      openedMenus.value = subMenus.value[path]?.parentPaths ?? [];
    }

    close(path);

    emit('close', path, parentPaths);
  }

  /**
   * 点击展开菜单
   */
  function openMenu(path: string, parentPaths: string[]) {
    if (openedMenus.value.includes(path)) {
      return;
    }
    // 手风琴模式菜单
    if (props.accordion) {
      const activeParentPaths = getActivePaths();
      if (activeParentPaths.includes(path)) {
        parentPaths = activeParentPaths;
      }
      openedMenus.value = openedMenus.value.filter((path: string) =>
        parentPaths.includes(path),
      );
    }
    openedMenus.value.push(path);
    emit('open', path, parentPaths);
  }

  function addMenuItem(item: MenuItemRegistered) {
    items.value[item.path] = item;
  }

  function addSubMenu(subMenu: MenuItemRegistered) {
    subMenus.value[subMenu.path] = subMenu;
  }

  function removeSubMenu(subMenu: MenuItemRegistered) {
    Reflect.deleteProperty(subMenus.value, subMenu.path);
  }

  function removeMenuItem(item: MenuItemRegistered) {
    Reflect.deleteProperty(items.value, item.path);
  }

  function getActivePaths() {
    const activeItem = activePath.value && items.value[activePath.value];

    if (!activeItem || props.mode === 'horizontal' || props.collapse) {
      return [];
    }

    return activeItem.parentPaths;
  }

  return {
    activePath,
    addMenuItem,
    addSubMenu,
    closeMenu,
    getSlot,
    handleMenuItemClick,
    handleSubMenuClick,
    isMenuPopup,
    items,
    menu,
    mouseInChild,
    openedMenus,
    openMenu,
    removeMenuItem,
    removeSubMenu,
    scrollToActiveItem,
    subMenus,
  };
}

export { useMenuLogic };
export type { UseMenuLogicOptions, UseMenuLogicReturn };
