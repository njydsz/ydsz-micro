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
 *   <li>键盘：ESC 退出（受 closeOnEsc 控制）</li>
 *   <li>三厢布局：header + body + footer</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\drawer\YdDrawer.vue
 * @author ydsz-team
 * @since 1.0.0
 -->
<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { extendPt } from '../../pass-through';
import { useComponentI18n } from '../../composables/use-component-i18n';
import { useOverlayStack } from '../../composables/use-overlay-stack';

import type { DrawerPosition, YdDrawerEmits, YdDrawerProps } from './types';

defineOptions({ name: 'YdDrawer' });

const props = withDefaults(defineProps<YdDrawerProps>(), {
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
const { t } = useComponentI18n({
  messages: {
    en: {
      'drawer.close': 'Close',
      'drawer.closeAriaLabel': 'Close drawer',
    },
    zh: {
      'drawer.close': '关闭',
      'drawer.closeAriaLabel': '关闭抽屉',
    },
  },
});

/* ----- 覆盖层栈（z-index 自动管理） ----- */
const overlayHandle = useOverlayStack({ baseZIndex: 1100 });

/* ----- SSR hydration guard ----- */
const isReady = ref(false);

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
    'bg-surface-2 text-text-primary fixed flex flex-col shadow-2xl outline-none overflow-hidden',
    positionContentClasses.value,
    props.class,
  ),
);

/** 平移过渡名称 */
const transitionName = computed<`slide-${DrawerPosition}`>(
  () => `slide-${props.position}`,
);

/* ----- 关闭逻辑 ----- */
function doClose(_reason: 'mask' | 'close' | 'esc' | 'api' = 'api'): void {
  emits('update:open', false);
  emits('close');
}

/* ----- 遮罩点击 ----- */
function onOverlayClick(): void {
  if (props.maskClosable) {
    doClose('mask');
  }
}

/* ----- ESC 键处理 ----- */
function onRootKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && props.open) {
    if (props.closeOnEsc) {
      doClose('esc');
    }
  }
}

/* ----- open 切换时注册/注销栈 ----- */
watch(
  () => props.open,
  (visible) => {
    if (visible) {
      overlayHandle.register();
    } else {
      overlayHandle.unregister();
    }
  },
);

/* ----- 过渡钩子 ----- */
function onAfterEnter(): void {
  emits('opened');
}
function onAfterLeave(): void {
  emits('closed');
}

/* ----- pt 解析 ----- */
const parsedOverlayPt = computed(() => extendPt({ class: 'bg-overlay/50 fixed inset-0' }, props.pt?.overlay));
const parsedClosePt = computed(() =>
  extendPt(
    {
      class:
        'data-[state=open]:bg-accent hover:bg-accent text-text-secondary flex-center absolute z-10 rounded-full right-4 top-4 size-8',
    },
    props.pt?.close,
  ),
);
const parsedHeaderPt = computed(() =>
  extendPt(
    {
      class:
        'flex items-center gap-2 px-5 py-4 border-b border-border-default text-base font-semibold',
    },
    props.pt?.header,
  ),
);
const parsedBodyPt = computed(() => extendPt({ class: 'flex-1 overflow-auto p-5' }, props.pt?.body));
const parsedFooterPt = computed(() =>
  extendPt(
    { class: 'flex items-center justify-end gap-2 px-5 py-3 border-t border-border-default' },
    props.pt?.footer,
  ),
);

onMounted(() => {
  isReady.value = true;
  if (props.open) {
    overlayHandle.register();
  }
});
</script>

<template>
  <!-- 根容器 -->
  <div
    v-if="isReady && open"
    class="yd-drawer fixed inset-0"
    :style="{ zIndex: overlayHandle.zIndex }"
    @keydown="onRootKeydown"
  >
    <!-- 遮罩 -->
    <Transition name="fade">
      <div
        v-if="mask && open"
        :class="cn('yd-drawer-overlay', parsedOverlayPt.class)"
        aria-hidden="true"
        @click="onOverlayClick"
      />
    </Transition>

    <!-- 内容面板 -->
    <Transition :name="transitionName" @after-enter="onAfterEnter" @after-leave="onAfterLeave">
      <div
        v-if="open"
        role="dialog"
        :aria-label="header || '抽屉'"
        aria-modal="true"
        :class="cn('yd-drawer-content', contentClasses)"
        :style="sizeStyle"
      >
        <!-- 关闭按钮 -->
        <button
          v-if="showClose"
          type="button"
          :aria-label="t('drawer.closeAriaLabel')"
          :class="cn('yd-drawer-close', parsedClosePt.class)"
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
        <header v-if="$slots.header || header" :class="cn('yd-drawer-header', parsedHeaderPt.class)">
          <slot name="header">
            <span class="yd-drawer-header-title">{{ header }}</span>
          </slot>
        </header>

        <!-- 主体 -->
        <main :class="cn('yd-drawer-body', parsedBodyPt.class)">
          <slot />
        </main>

        <!-- 底部 -->
        <footer
          v-if="$slots.footer"
          :class="cn('yd-drawer-footer', parsedFooterPt.class)"
        >
          <slot name="footer" />
        </footer>
      </div>
    </Transition>
  </div>
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
