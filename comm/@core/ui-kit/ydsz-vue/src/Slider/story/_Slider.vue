<script setup lang="ts">
import { ref } from 'vue';
import type { SliderRootEmits, SliderRootProps } from '../';
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from '../';
import { useForwardPropsEmits } from '../../shared/index.ts';

const props = defineProps<SliderRootProps>();
const emits = defineEmits<SliderRootEmits>();

const sliderValue = ref([50]);

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <SliderRoot
    v-bind="forwarded"
    v-model="sliderValue"
    name="slider"
    class="relative flex h-5 w-[200px] touch-none select-none items-center"
  >
    <SliderTrack class="bg-blackA10 relative h-[3px] grow rounded-full">
      <SliderRange class="absolute h-full rounded-full bg-white" />
    </SliderTrack>
    <SliderThumb
      class="shadow-blackA7 hover:bg-violet3 focus:shadow-blackA8 block h-5 w-5 rounded-[10px] bg-white shadow-[0_2px_10px] focus:shadow-[0_0_0_5px] focus:outline-none"
    />
  </SliderRoot>
</template>
