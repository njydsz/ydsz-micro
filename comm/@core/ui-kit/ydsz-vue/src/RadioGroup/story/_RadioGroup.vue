<script setup lang="ts">
import { ref } from 'vue';
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from '../';

defineProps<{
  disabled?: boolean;
}>();
const radioStateSingle = ref('default');
</script>

<template>
  <RadioGroupRoot
    v-model="radioStateSingle"
    :loop="false"
    :disabled="disabled"
    class="flex flex-col gap-2.5"
    aria-label="View density"
    orientation="vertical"
  >
    <div class="flex items-center">
      <RadioGroupItem
        id="r1"
        aria-label="Default"
        class="shadow-blackA7 hover:bg-violet3 h-[25px] w-[25px] cursor-default rounded-full bg-white shadow-[0_2px_10px] outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[disabled]:bg-red-500"
        value="default"
      >
        <RadioGroupIndicator
          class="after:bg-violet11 relative flex h-full w-full items-center justify-center after:block after:h-[11px] after:w-[11px] after:rounded-[50%] after:content-['']"
        />
      </RadioGroupItem>
      <label class="pl-[15px] text-[15px] leading-none text-white" for="r1"> Default </label>
    </div>
    <div class="flex items-center">
      <RadioGroupItem
        id="r2"
        aria-label="Comfortable"
        disabled
        class="shadow-blackA7 hover:bg-violet3 h-[25px] w-[25px] cursor-default rounded-full bg-white shadow-[0_2px_10px] outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[disabled]:bg-red-500"
        value="comfortable"
      >
        <RadioGroupIndicator
          class="after:bg-violet11 relative flex h-full w-full items-center justify-center after:block after:h-[11px] after:w-[11px] after:rounded-[50%] after:content-['']"
        />
      </RadioGroupItem>
      <label class="pl-[15px] text-[15px] leading-none text-white" for="r2"> Comfortable </label>
    </div>
    <div class="flex items-center">
      <RadioGroupItem
        id="r3"
        aria-label="Compact"
        as-child
        class="shadow-blackA7 hover:bg-violet3 h-[25px] w-[25px] cursor-default rounded-full bg-white shadow-[0_2px_10px] outline-none focus:shadow-[0_0_0_2px] focus:shadow-black"
        value="compact"
      >
        <button>
          <RadioGroupIndicator
            class="after:bg-violet11 relative flex h-full w-full items-center justify-center after:block after:h-[11px] after:w-[11px] after:rounded-[50%] after:content-['']"
          />
        </button>
      </RadioGroupItem>
      <label class="pl-[15px] text-[15px] leading-none text-white" for="r3"> Compact </label>
    </div>
  </RadioGroupRoot>
</template>
