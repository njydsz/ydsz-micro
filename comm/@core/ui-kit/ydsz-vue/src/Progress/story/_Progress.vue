<script setup lang="ts">
import { ref } from 'vue';
import { ProgressIndicator, ProgressRoot } from '../';

const interactive = ref(0);
setTimeout(() => {
  // For some reason, this interval triggers twice in the same tick
  interactive.value = (interactive.value + 50) % 100;
}, 200);
</script>

<template>
  <ProgressRoot
    v-model="interactive"
    class="bg-blackA9 full relative flex h-8 w-full items-center justify-center overflow-hidden rounded-full"
  >
    <ProgressIndicator
      class="h-full w-full bg-white transition-transform duration-1000"
      :style="`transform: translateX(-${100 - interactive}%)`"
    />
    <div
      class="pointer-events-none absolute text-center font-mono text-xs font-bold uppercase tracking-widest text-green-400 mix-blend-normal"
    >
      {{ interactive.toFixed(2) }}%
    </div>
  </ProgressRoot>
</template>
