<script setup lang="ts">
import { Icon } from '@iconify/vue';
import type { CheckboxRootProps } from '../';
import { CheckboxIndicator, CheckboxRoot } from '../';
import { ref } from 'vue';

const props = withDefaults(defineProps<CheckboxRootProps>(), {
  checked: undefined,
});
const checked = ref(props.checked);
</script>

<template>
  <label class="flex flex-row items-center gap-4 [&>.checkbox]:hover:bg-neutral-100" for="test">
    Test
  </label>
  <CheckboxRoot
    v-bind="props"
    v-model:checked="checked"
    name="test"
    class="shadow-blackA7 hover:bg-violet3 flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-[4px] bg-white shadow-[0_2px_10px] outline-none focus-within:shadow-[0_0_0_2px_black]"
    aria-label="Test"
  >
    <CheckboxIndicator
      data-testid="test-indicator"
      class="flex h-full w-full items-center justify-center rounded bg-white"
    >
      <Icon icon="radix-icons:check" class="h-3 w-3 text-black" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
