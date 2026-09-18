/**
 * useTouch — 触摸/手势交互组合式 API。
 *
 * <p>为移动端场景提供滑动方向识别和触摸目标尺寸校验。
 *
 * @path comm\@core\ui-kit\mobile-bridge\src\composables\use-touch.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { ref } from 'vue';

/** 滑动方向 */
export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | 'none';

/** 触摸起点记录 */
interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

/** 滑动识别阈值（px） */
const SWIPE_THRESHOLD = 30;

/** 快扫速度阈值（ms） */
const SWIPE_FAST_TIME = 300;

/**
 * 触摸/手势组合式 API。
 *
 * @return 手势状态和处理函数
 */
export function useTouch() {
  const startPoint = ref<TouchPoint | null>(null);
  const swipeDirection = ref<SwipeDirection>('none');
  const isSwiping = ref<boolean>(false);

  /**
   * 记录触摸起点。
   */
  function onTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    startPoint.value = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    isSwiping.value = true;
    swipeDirection.value = 'none';
  }

  /**
   * 监听触摸终点并识别滑动方向。
   */
  function onTouchEnd(event: TouchEvent): void {
    if (!startPoint.value) {
      return;
    }
    const touch = event.changedTouches[0];
    if (!touch) {
      isSwiping.value = false;
      return;
    }
    const deltaX = touch.clientX - startPoint.value.x;
    const deltaY = touch.clientY - startPoint.value.y;
    const elapsed = Date.now() - startPoint.value.time;

    // 速度太慢不算扫动
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < SWIPE_THRESHOLD
      && elapsed > SWIPE_FAST_TIME) {
      swipeDirection.value = 'none';
    } else if (Math.abs(deltaX) > Math.abs(deltaY)) {
      swipeDirection.value = deltaX > 0 ? 'right' : 'left';
    } else {
      swipeDirection.value = deltaY > 0 ? 'down' : 'up';
    }

    isSwiping.value = false;
    startPoint.value = null;
  }

  /**
   * 校验元素尺寸是否满足最小触摸目标（44px）。
   *
   * @param width 元素宽度
   * @param height 元素高度
   * @return 是否合规
   */
  function isTouchTargetCompliant(width: number, height: number): boolean {
    return width >= 44 && height >= 44;
  }

  return {
    startPoint,
    swipeDirection,
    isSwiping,
    onTouchStart,
    onTouchEnd,
    isTouchTargetCompliant,
  };
}
