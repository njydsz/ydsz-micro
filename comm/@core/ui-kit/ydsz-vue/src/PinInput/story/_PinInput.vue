<script setup lang="ts">
import { ref } from 'vue';
import { PinInputInput, PinInputRoot, type PinInputRootEmits, type PinInputRootProps } from '..';
import { Label } from '../../Label/index.ts';
import { useEmitAsProps } from '../../shared/index.ts';

const props = defineProps<PinInputRootProps>();
const emits = defineEmits<PinInputRootEmits>();

const value = ref<string[]>([]);
</script>

<template>
  <Label for="otp">Test label</Label>
  <PinInputRoot
    v-bind="{ ...props, ...useEmitAsProps(emits) }"
    v-model="value"
    placeholder="*"
    class="flex items-center gap-2"
  >
    <PinInputInput
      v-for="(id, index) in 5"
      :key="id"
      class="text-green10 placeholder:text-mauve5 h-10 w-10 rounded text-center"
      :index="index"
    />
  </PinInputRoot>

  <button @click="value = []">Reset value</button>
</template>
