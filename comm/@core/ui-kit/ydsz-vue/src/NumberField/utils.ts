import {
  type NumberFormatter,
  type NumberParser,
  NumberFormatter as NumberFormatterImpl,
  NumberParser as NumberParserImpl,
} from '@internationalized/number';
import { type MaybeComputedElementRef, unrefElement, useEventListener } from '@vueuse/core';
import { createEventHook, isClient, reactiveComputed } from '@vueuse/shared';
import { type ComputedRef, type Ref, computed, ref } from 'vue';

export function usePressedHold(options: {
  target?: MaybeComputedElementRef;
  disabled: Ref<boolean>;
}) {
  const { disabled } = options;
  const timeout = ref<number>();
  const triggerHook = createEventHook();
  const resetTimeout = () => window.clearTimeout(timeout.value);

  const onIncrementPressStart = (delay: number) => {
    resetTimeout();
    if (disabled.value) return;

    triggerHook.trigger();

    timeout.value = window.setTimeout(() => {
      onIncrementPressStart(60);
    }, delay);
  };

  const handlePressStart = () => {
    onIncrementPressStart(400);
  };

  const handlePressEnd = () => {
    resetTimeout();
  };

  // Handle press event, modified version of useMousePressed
  const isPressed = ref(false);
  const target = computed(() => unrefElement(options.target));

  const onPressStart = (event: PointerEvent) => {
    // Only handle left clicks, and ignore events that bubbled through portals.
    if (event.button !== 0 || isPressed.value) return;

    event.preventDefault();
    isPressed.value = true;
    handlePressStart();
  };

  const onPressRelease = () => {
    isPressed.value = false;
    handlePressEnd();
  };

  if (isClient) {
    useEventListener(target || window, 'pointerdown', onPressStart);
    useEventListener(window, 'pointerup', onPressRelease);
    useEventListener(window, 'pointercancel', onPressRelease);
  }

  return {
    isPressed,
    onTrigger: triggerHook.on,
  };
}

/** `useNumberFormatter` 的返回契约：响应式数字格式化器。 */
export function useNumberFormatter(
  locale: Ref<string>,
  options: Ref<Intl.NumberFormatOptions | undefined> = ref({}),
): ComputedRef<NumberFormatter> {
  return reactiveComputed(() => new NumberFormatterImpl(locale.value, options.value));
}

/** `useNumberParser` 的返回契约：响应式数字解析器。 */
export function useNumberParser(
  locale: Ref<string>,
  options: Ref<Intl.NumberFormatOptions | undefined> = ref({}),
): ComputedRef<NumberParser> {
  return reactiveComputed(() => new NumberParserImpl(locale.value, options.value));
}

export function handleDecimalOperation(
  operator: '-' | '+',
  value1: number,
  value2: number,
): number {
  let result = operator === '+' ? value1 + value2 : value1 - value2;

  // Check if we have decimals
  if (value1 % 1 !== 0 || value2 % 1 !== 0) {
    const value1Decimal = value1.toString().split('.');
    const value2Decimal = value2.toString().split('.');
    const value1DecimalLength = (value1Decimal[1] && value1Decimal[1].length) || 0;
    const value2DecimalLength = (value2Decimal[1] && value2Decimal[1].length) || 0;
    const multiplier = 10 ** Math.max(value1DecimalLength, value2DecimalLength);

    // Transform the decimals to integers based on the precision
    value1 = Math.round(value1 * multiplier);
    value2 = Math.round(value2 * multiplier);

    // Perform the operation on integers values to make sure we don't get a fancy decimal value
    result = operator === '+' ? value1 + value2 : value1 - value2;

    // Transform the integer result back to decimal
    result /= multiplier;
  }

  return result;
}
