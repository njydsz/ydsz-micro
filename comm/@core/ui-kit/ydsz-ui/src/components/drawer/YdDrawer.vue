<!--
 * YdDrawer —— 侧滑式抽屉面板。
 *
 * <p>从屏幕边缘（上下左右）滑入的浮层面板，用于详情展示、表单编辑等「当前任务的中断 / 延续」场景。
 *
 * <p>核心能力：
 * <ul>
 *   <li>四向滑入动画：left / right / top / bottom 四个 direction 均有专属 translateY / X 过渡</li>
 *   <li>ARIA Dialog 语义：role="dialog" + aria-modal + 可控 aria-label</li>
 *   <li>Stacking：通过 useOverlayStack 自动管理 z-index，嵌套抽屉不打架</li>
 *   <li>滚动锁定：打开时锁定 body 滚动</li>
 *   <li>焦点管理：打开时聚焦面板、Tab 在面板内循环、关闭后焦点归还触发元素</li>
 *   <li>键盘：ESC 退出（受 closeOnEsc 控制，且只关最上层浮层）</li>
 *   <li>关闭原因：close 事件携带 close / mask / esc / api 四种 reason</li>
 *   <li>三厢布局：header + body + footer；destroyOnClose 控制关闭后是否销毁内容</li>
 *   <li>Teleport：默认挂到 body，避免祖先 transform / overflow 裁切</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\drawer\YdDrawer.vue
 * @author ydsz-team
 * @since 1.0.0
 -->
<script lang="ts" setup>
import type { DrawerCloseReason, DrawerPosition, YdDrawerEmits, YdDrawerProps } from './types';

import { computed, ref, watch } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { useBodyScrollLock } from '../../composables/use-body-scroll-lock';
import { useFocusTrap } from '../../composables/use-focus-trap';
import { useOverlayEscape } from '../../composables/use-overlay-escape';
import { useOverlayStack } from '../../composables/use-overlay-stack';
import { useLocale } from '../../locale/useLocale';
import { extendPt } from '../../pass-through';

defineOptions({ name: 'YdDrawer' });

const props = withDefaults(defineProps<YdDrawerProps>(), {
  appendTo: 'body',
  closeOnEsc: true,
  destroyOnClose: false,
  header: undefined,
  height: undefined,
  mask: true,
  maskClosable: true,
  open: false,
  position: 'right',
  pt: undefined,
  showClose: true,
  width: undefined,
});

const emits = defineEmits<YdDrawerEmits>();

/* ----- 国际化 ----- */
const { t } = useLocale();

/* ----- 覆盖层栈（z-index 自动管理） ----- */
const overlayHandle = useOverlayStack({ baseZIndex: 1100 });

/* ----- 面板是否已在 DOM 中（懒挂载 + destroyOnClose 销毁） ----- */
const isPanelMounted = ref(false);

/** 面板根元素，焦点约束的作用域 */
const panelRef = ref<HTMLElement>();

/** Teleport 目标；appendTo=false 时原地渲染 */
const teleportTarget = computed(() => (props.appendTo === false ? 'body' : props.appendTo));

/* ----- 响应式样式 ----- */
const isHorizontal = computed(
  () => props.position === 'left' || props.position === 'right',
);

/** 计算内容区尺寸样式 */
const sizeStyle = computed<Record<string, string>>(() => {
  const result: Record<string, string> = {};
  const value = isHorizontal.value ? props.width : props.height;

  if (value !== undefined && value !== null) {
    const size = typeof value === 'number' ? `${value}px` : value;
    if (isHorizontal.value) {
      result.width = size;
      result.maxWidth = size;
      result.height = '100%';
    } else {
      result.height = size;
      result.maxHeight = size;
      result.width = '100%';
    }
  } else if (isHorizontal.value) {
    result.width = '480px';
    result.maxWidth = '480px';
    result.height = '100%';
  }

  return result;
});

const positionContentClasses = computed(() => {
  switch (props.position) {
    case 'left':
      return 'left-0 top-0 bottom-0 border-r border-border-default';
    case 'right':
      return 'right-0 top-0 bottom-0 border-l border-border-default';
    case 'top':
      return 'top-0 left-0 right-0 border-b border-border-default';
    case 'bottom':
      return 'bottom-0 left-0 right-0 border-t border-border-default';
    default:
      return '';
  }
});

const contentClasses = computed(() =>
  cn(
    'bg-surface-2 text-text-primary pointer-events-auto fixed flex flex-col shadow-2xl outline-none overflow-hidden',
    positionContentClasses.value,
    props.class,
  ),
);

/** 平移过渡名称 */
const transitionName = computed<`slide-${DrawerPosition}`>(
  () => `slide-${props.position}`,
);

/* ----- 关闭逻辑 ----- */
function doClose(reason: DrawerCloseReason = 'api'): void {
  emits('close', reason);
  emits('update:open', false);
}

/* ----- 遮罩点击 ----- */
function onOverlayClick(): void {
  if (props.maskClosable) {
    doClose('mask');
  }
}

/* ----- 键盘 / 焦点 / 滚动锁定 ----- */
const isOpenRef = computed(() => props.open);

useOverlayEscape(isOpenRef, () => {
  if (props.closeOnEsc) doClose('esc');
});

useFocusTrap({ active: isOpenRef, container: panelRef });

useBodyScrollLock(isOpenRef);

/* ----- open 切换时注册/注销栈、控制内容挂载 ----- */
watch(
  () => props.open,
  (visible) => {
    if (visible) {
      overlayHandle.register();
      isPanelMounted.value = true;
    } else {
      overlayHandle.unregister();
    }
  },
  { immediate: true },
);

/* ----- 过渡钩子 ----- */
function onAfterEnter(): void {
  emits('opened');
}

function onAfterLeave(): void {
  emits('closed');
  // 退场动画结束后再销毁内容，避免面板先空后滑
  if (props.destroyOnClose) isPanelMounted.value = false;
}

/* ----- pt 解析（PtOptions 的类名字段是 className，写成 class 会被当成 attr 丢掉） ----- */
const parsedRootPt = computed(() =>
  extendPt({ className: 'yd-drawer pointer-events-none fixed inset-0' }, props.pt?.root),
);
const parsedOverlayPt = computed(() =>
  extendPt(
    { className: 'yd-drawer-overlay bg-overlay/50 pointer-events-auto fixed inset-0' },
    props.pt?.overlay,
  ),
);
const parsedClosePt = computed(() =>
  extendPt(
    {
      className:
        'data-[state=open]:bg-accent hover:bg-accent text-text-secondary flex-center absolute z-10 rounded-full right-4 top-4 size-8',
    },
    props.pt?.close,
  ),
);
const parsedHeaderPt = computed(() =>
  extendPt(
    {
      className:
        'flex items-center gap-2 px-5 py-4 border-b border-border-default text-base font-semibold',
    },
    props.pt?.header,
  ),
);
const parsedBodyPt = computed(() =>
  extendPt({ className: 'flex-1 overflow-auto p-5' }, props.pt?.body),
);
const parsedFooterPt = computed(() =>
  extendPt(
    { className: 'flex items-center justify-end gap-2 px-5 py-3 border-t border-border-default' },
    props.pt?.footer,
  ),
);
</script>

<template>
  <Teleport :disabled="props.appendTo === false" :to="teleportTarget">
    <!-- 根容器：首次打开才入 DOM；自身不吃指针事件，遮罩与面板各自恢复 -->
    <div
      v-if="isPanelMounted"
      :class="parsedRootPt.class"
      :style="{ zIndex: overlayHandle.zIndex }"
    >
      <!-- 遮罩 -->
      <Transition name="fade">
        <div
          v-if="props.mask && props.open"
          :class="parsedOverlayPt.class"
          aria-hidden="true"
          @click="onOverlayClick"
        />
      </Transition>

      <!-- 内容面板 -->
      <Transition
        :name="transitionName"
        appear
        @after-enter="onAfterEnter"
        @after-leave="onAfterLeave"
      >
        <div
          v-show="props.open"
          ref="panelRef"
          :aria-label="props.header || t('drawer.ariaLabel')"
          aria-modal="true"
          :class="cn('yd-drawer-content', contentClasses)"
          role="dialog"
          :style="sizeStyle"
          tabindex="-1"
        >
          <!-- 关闭按钮 -->
          <button
            v-if="props.showClose"
            :aria-label="t('drawer.closeAriaLabel')"
            :class="cn('yd-drawer-close', parsedClosePt.class)"
            type="button"
            @click="doClose('close')"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L13 13M13 1L1 13"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <!-- 头部 -->
          <header
            v-if="$slots.header || props.header"
            :class="cn('yd-drawer-header', parsedHeaderPt.class)"
          >
            <slot name="header">
              <span class="yd-drawer-header-title">{{ props.header }}</span>
            </slot>
          </header>

          <!-- 主体 -->
          <main :class="cn('yd-drawer-body', parsedBodyPt.class)">
            <slot />
          </main>

          <!-- 底部 -->
          <footer v-if="$slots.footer" :class="cn('yd-drawer-footer', parsedFooterPt.class)">
            <slot name="footer" />
          </footer>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
/* ============================================================ */

/* Fade transition —— 遮罩层                                     */

/* ============================================================ */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ============================================================ */

/* Slide transitions —— 抽屉面板四向滑入                            */

/* ============================================================ */

/* right */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

/* left */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
}

/* top */
.slide-top-enter-active,
.slide-top-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-top-enter-from,
.slide-top-leave-to {
  transform: translateY(-100%);
}

/* bottom */
.slide-bottom-enter-active,
.slide-bottom-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-bottom-enter-from,
.slide-bottom-leave-to {
  transform: translateY(100%);
}
</style>
