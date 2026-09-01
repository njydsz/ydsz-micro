/**
 * 表单展开 / 收起：计算收起状态下应保留到第几个表单项。
 *
 * 表单项按栅格自动换行，每行的项数随视口宽度变化，因此「收起 N 行」无法在
 * 编译期确定，只能在挂载后测量各子元素的 offsetTop 建立「行号 → 项索引」映射，
 * 再据此推算折叠断点。
 * 测量依赖元素可见性（useElementVisibility），故在隐藏容器中挂载时不会触发计算，
 * isCalculated 保持 false，直到容器真正可见。
 *
 * @path comm\@core\ui-kit\form-ui\src\form-render\expandable.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { FormRenderProps } from '../types';

import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue';

import {
  breakpointsTailwind,
  useBreakpoints,
  useElementVisibility,
} from '@vueuse/core';

/**
 * 动态计算行数
 */
export function useExpandable(props: FormRenderProps) {
  const wrapperRef = useTemplateRef<HTMLElement>('wrapperRef');
  const isVisible = useElementVisibility(wrapperRef);
  const rowMapping = ref<Record<number, number>>({});
  // 是否已经计算过一次
  const isCalculated = ref(false);

  const breakpoints = useBreakpoints(breakpointsTailwind);

  const keepFormItemIndex = computed(() => {
    const rows = props.collapsedRows ?? 1;
    const mapping = rowMapping.value;
    let maxItem = 0;
    for (let index = 1; index <= rows; index++) {
      maxItem += mapping?.[index] ?? 0;
    }
    // 保持一行
    return maxItem - 1 || 1;
  });

  watch(
    [
      () => props.showCollapseButton,
      () => breakpoints.active().value,
      () => props.schema?.length,
      () => isVisible.value,
    ],
    async ([val]) => {
      if (val) {
        await nextTick();
        rowMapping.value = {};
        isCalculated.value = false;
        await calculateRowMapping();
      }
    },
  );

  async function calculateRowMapping() {
    if (!props.showCollapseButton) {
      return;
    }

    await nextTick();
    if (!wrapperRef.value) {
      return;
    }
    // 小屏幕不计算
    // if (breakpoints.smaller('sm').value) {
    //   // 保持一行
    //   rowMapping.value = { 1: 2 };
    //   return;
    // }

    const formItems = [...wrapperRef.value.children];

    const container = wrapperRef.value;
    const containerStyles = window.getComputedStyle(container);
    const rowHeights = containerStyles
      .getPropertyValue('grid-template-rows')
      .split(' ');

    const containerRect = container?.getBoundingClientRect();

    formItems.forEach((el) => {
      const itemRect = el.getBoundingClientRect();

      // 计算元素在第几行
      const itemTop = itemRect.top - containerRect.top;
      let rowStart = 0;
      let cumulativeHeight = 0;

      for (const [i, rowHeight] of rowHeights.entries()) {
        cumulativeHeight += Number.parseFloat(rowHeight);
        if (itemTop < cumulativeHeight) {
          rowStart = i + 1;
          break;
        }
      }
      if (rowStart > (props?.collapsedRows ?? 1)) {
        return;
      }
      rowMapping.value[rowStart] = (rowMapping.value[rowStart] ?? 0) + 1;
      isCalculated.value = true;
    });
  }

  onMounted(() => {
    calculateRowMapping();
  });

  return { isCalculated, keepFormItemIndex, wrapperRef };
}

