<!--
 * resize 通用组件
 *
 * @path comm\effects\common-ui\src\components\resize\resize.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * This components is refactored from vue-drag-resize: https://github.com/kirillmurashov/vue-drag-resize
 */

import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  toRefs,
  watch,
} from 'vue';

import {
  bodyDown,
  bodyMove,
  bodyUp,
  calcDragLimitation,
  calcResizeLimits,
  createPositionStyle,
  createSizeStyle,
  createStickStyles,
  deselect,
  move,
  saveDimensionsBeforeMove,
  stickDown,
  stickMove,
  stickUp,
  up,
} from './composables/use-resize';
import type {
  DimensionsBeforeMove,
  Limits,
  Rect,
  ResizeState,
} from './composables/use-resize';

import { addEvents, removeEvents } from './composables/use-resize-events';
import { useResizeWatchers } from './composables/use-resize-watchers';
import { useValidation } from './utils/validators';

interface ResizeProps {
  stickSize?: number;
  parentScaleX?: number;
  parentScaleY?: number;
  isActive?: boolean;
  preventActiveBehavior?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
  aspectRatio?: boolean;
  parentLimitation?: boolean;
  snapToGrid?: boolean;
  gridX?: number;
  gridY?: number;
  parentW?: number;
  parentH?: number;
  w?: string | number;
  h?: string | number;
  minw?: number;
  minh?: number;
  x?: number;
  y?: number;
  z?: string | number;
  dragHandle?: string | null;
  dragCancel?: string | null;
  sticks?: Array<'bl' | 'bm' | 'br' | 'ml' | 'mr' | 'tl' | 'tm' | 'tr'>;
  axis?: string;
  contentClass?: string;
}

const props = withDefaults(defineProps<ResizeProps>(), {
  stickSize: 8,
  parentScaleX: 1,
  parentScaleY: 1,
  isActive: false,
  preventActiveBehavior: false,
  isDraggable: true,
  isResizable: true,
  aspectRatio: false,
  parentLimitation: false,
  snapToGrid: false,
  gridX: 50,
  gridY: 50,
  parentW: 0,
  parentH: 0,
  w: 200,
  h: 200,
  minw: 50,
  minh: 50,
  x: 0,
  y: 0,
  z: 'auto',
  dragHandle: null,
  dragCancel: null,
  sticks: () => ['tl', 'tm', 'tr', 'mr', 'br', 'bm', 'bl', 'ml'],
  axis: 'both',
  contentClass: '',
});

// 属性验证
useValidation(props);

const emit = defineEmits([
  'clicked',
  'dragging',
  'dragstop',
  'resizing',
  'resizestop',
  'activated',
  'deactivated',
]);

const {
  stickSize,
  parentScaleX,
  parentScaleY,
  isActive,
  preventActiveBehavior,
  isDraggable,
  isResizable,
  aspectRatio,
  parentLimitation,
  snapToGrid,
  gridX,
  gridY,
  parentW,
  parentH,
  w,
  h,
  minw,
  minh,
  x,
  y,
  z,
  dragHandle,
  dragCancel,
  sticks,
  axis,
  contentClass,
} = toRefs(props);

// states
const active = ref(false);
const zIndex = ref<null | number>(null);
const parentWidth = ref<null | number>(null);
const parentHeight = ref<null | number>(null);
const left = ref<null | number>(null);
const top = ref<null | number>(null);
const right = ref<null | number>(null);
const bottom = ref<null | number>(null);

const aspectFactor = ref<null | number>(null);

// state end

const stickDrag = ref(false);
const bodyDrag = ref(false);
const dimensionsBeforeMove = ref<DimensionsBeforeMove>({
  pointerX: 0,
  pointerY: 0,
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: 0,
  height: 0,
});
const limits = ref<Limits>({
  left: { min: null as null | number, max: null as null | number },
  right: { min: null as null | number, max: null as null | number },
  top: { min: null as null | number, max: null as null | number },
  bottom: { min: null as null | number, max: null as null | number },
});
const currentStick = ref<null | string>(null);

const parentElement = ref<HTMLElement | null>(null);

const width = computed(() => parentWidth.value! - left.value! - right.value!);
const height = computed(() => parentHeight.value! - top.value! - bottom.value!);

const rect = computed<Rect>(() => ({
  left: Math.round(left.value!),
  top: Math.round(top.value!),
  width: Math.round(width.value),
  height: Math.round(height.value),
}));

// 核心逻辑状态对象
const resizeState = {
  left,
  top,
  right,
  bottom,
  parentWidth,
  parentHeight,
  width,
  height,
  aspectFactor,
  dimensionsBeforeMove,
  limits,
  currentStick,
  stickDrag,
  bodyDrag,
  active,
  zIndex,
  parentElement,
};

const positionStyle = createPositionStyle({ top, left, zIndex });
const sizeStyle = createSizeStyle(w, width, h, height);
const stickStyles = createStickStyles(stickSize, parentScaleX, parentScaleY);

const domEvents = ref(
  new Map([
    ['mousedown', deselect],
    ['mouseleave', up],
    ['mousemove', move],
    ['mouseup', up],
    ['touchcancel', up],
    ['touchend', up],
    ['touchmove', move],
    ['touchstart', up],
  ]),
);

const container = ref<HTMLDivElement>();

onMounted(() => {
  const currentInstance = getCurrentInstance();
  const $el = currentInstance?.vnode.el as HTMLElement;

  parentElement.value = $el?.parentNode as HTMLElement;
  parentWidth.value = parentW.value ?? parentElement.value?.clientWidth;
  parentHeight.value = parentH.value ?? parentElement.value?.clientHeight;

  left.value = x.value;
  top.value = y.value;
  right.value = (parentWidth.value -
    (w.value === 'auto' ? container.value!.scrollWidth : (w.value as number)) -
    left.value) as number;
  bottom.value = (parentHeight.value -
    (h.value === 'auto' ? container.value!.scrollHeight : (h.value as number)) -
    top.value) as number;

  addEvents(domEvents.value);

  if (dragHandle.value) {
    [...($el?.querySelectorAll(dragHandle.value) || [])].forEach(
      (dragHandle) => {
        (dragHandle as HTMLElement).dataset.dragHandle = String(
          currentInstance?.uid,
        );
      },
    );
  }

  if (dragCancel.value) {
    [...($el?.querySelectorAll(dragCancel.value) || [])].forEach(
      (cancelHandle) => {
        (cancelHandle as HTMLElement).dataset.dragCancel = String(
          currentInstance?.uid,
        );
      },
    );
  }
});

onBeforeUnmount(() => {
  removeEvents(domEvents.value);
});

// 设置所有 watchers
useResizeWatchers(
  { x, y, w, h, z, parentW, parentH, isActive },
  resizeState,
  rect.value,
  emit,
);
</script>

<template>
  <div
    :class="`${active || isActive ? 'active' : 'inactive'} ${contentClass ? contentClass : ''}`"
    :style="positionStyle"
    class="resize"
    @mousedown="bodyDown($event as TouchEvent & MouseEvent, resizeState, saveDimensionsBeforeMove, calcDragLimitation, emit)"
    @touchend="up"
    @touchstart="bodyDown($event as TouchEvent & MouseEvent, resizeState, saveDimensionsBeforeMove, calcDragLimitation, emit)"
  >
    <div ref="container" :style="sizeStyle" class="content-container">
      <slot></slot>
    </div>
    <div
      v-for="(stick, index) of sticks"
      :key="`stick-${stick}`"
      :class="[`resize-stick-${stick}`, isResizable ? '' : 'not-resizable']"
      :style="stickStyles(stick)"
      class="resize-stick"
      @mousedown.stop.prevent="
        stickDown(stick, $event as TouchEvent & MouseEvent, resizeState, saveDimensionsBeforeMove, calcResizeLimits)
      "
      @touchstart.stop.prevent="
        stickDown(stick, $event as TouchEvent & MouseEvent, resizeState, saveDimensionsBeforeMove, calcResizeLimits)
      "
    ></div>
  </div>
</template>

<style lang="css" scoped>
.resize {
  position: absolute;
  box-sizing: border-box;
}

.resize.active::before {
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  outline: 1px dashed #d6d6d6;
  content: '';
}

.resize-stick {
  position: absolute;
  box-sizing: border-box;
  font-size: 1px;
  background: #fff;
  border: 1px solid #6c6c6c;
  box-shadow: 0 0 2px #bbb;
}

.inactive .resize-stick {
  display: none;
}

.resize-stick-tl,
.resize-stick-br {
  cursor: nwse-resize;
}

.resize-stick-tm,
.resize-stick-bm {
  left: 50%;
  cursor: ns-resize;
}

.resize-stick-tr,
.resize-stick-bl {
  cursor: nesw-resize;
}

.resize-stick-ml,
.resize-stick-mr {
  top: 50%;
  cursor: ew-resize;
}

.resize-stick.not-resizable {
  display: none;
}

.content-container {
  position: relative;
  display: block;
}
</style>
