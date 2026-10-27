<!--
 * 定长验证码输入：分格输入并在填满后一次性抛出完整值。
 *
 * 用于短信 / 邮箱验证码这类定长码场景；分格呈现比单个长输入框更易核对，
 * 且能自动处理粘贴整串验证码的拆分。
 * 完成与变更分别以事件抛出，便于上层区分「填满」与「正在输入」两种时机。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\pin-input\YdPinInputSmart.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { PinInputProps } from './types';

import { computed, onBeforeUnmount, ref, useId, watch } from 'vue';

import { createLogger } from '@ydsz-core/shared/utils';

import { useLocale } from '../../locale/useLocale';

import YdPinInput from './YdPinInput.vue';
import YdPinInputGroup from './YdPinInputGroup.vue';
import YdPinInputInput from './YdPinInputInput.vue';
import { YdButtonSmart } from '.././button';

// 云顶规范 §14.5：统一日志模块，禁止裸 console
const logger = createLogger('YdPinInputSmart');

defineOptions({
  inheritAttrs: false,
});

const {
  codeLength = 6,
  createText = async () => {},
  disabled = false,
  handleSendCode = async () => {},
  loading = false,
  maxTime = 60,
} = defineProps<PinInputProps>();

const emit = defineEmits<{
  complete: [];
  sendError: [error: any];
}>();

const { t } = useLocale();

const timer = ref<ReturnType<typeof setTimeout>>();

const modelValue = defineModel<string>();

const inputValue = ref<string[]>([]);
const countdown = ref(0);

const btnText = computed(() => {
  const countdownValue = countdown.value;
  return createText?.(countdownValue);
});

const btnLoading = computed(() => {
  return loading || countdown.value > 0;
});

watch(
  () => modelValue.value,
  () => {
    inputValue.value = modelValue.value?.split('') ?? [];
  },
);

watch(inputValue, (val) => {
  modelValue.value = val.join('');
});

function handleComplete(e: string[]) {
  modelValue.value = e.join('');
  emit('complete');
}

async function handleSend(e: Event) {
  try {
    e?.preventDefault();
    await handleSendCode();
    countdown.value = maxTime;
    startCountdown();
  } catch (error) {
    logger.error('Failed to send code:', error);
    // Consider emitting an error event or showing a notification
    emit('sendError', error);
  }
}

function startCountdown() {
  if (countdown.value > 0) {
    timer.value = setTimeout(() => {
      countdown.value--;
      startCountdown();
    }, 1000);
  }
}

onBeforeUnmount(() => {
  countdown.value = 0;
  clearTimeout(timer.value);
});

const id = useId();
</script>

<template>
  <YdPinInput
    :id="id"
    v-model="inputValue"
    :disabled="disabled"
    class="flex w-full justify-between"
    otp
    placeholder="○"
    type="number"
    :aria-label="t('pinInput.ariaLabel')"
    @complete="handleComplete"
  >
    <div class="relative flex w-full">
      <YdPinInputGroup class="mr-2" :aria-label="t('pinInput.groupAriaLabel')">
        <YdPinInputInput
          v-for="(item, index) in codeLength"
          :key="item"
          :index="index"
          :aria-label="t('pinInput.itemAriaLabel', { index: index + 1 })"
        />
      </YdPinInputGroup>
      <YdButtonSmart
        :disabled="disabled"
        :loading="btnLoading"
        class="flex-grow"
        size="lg"
        variant="outline"
        :aria-label="btnLoading ? t('pinInput.sendingAriaLabel') : t('pinInput.sendAriaLabel')"
        @click="handleSend"
      >
        {{ btnText }}
      </YdButtonSmart>
    </div>
  </YdPinInput>
</template>

