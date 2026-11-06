<script setup lang="ts">
import { ref } from 'vue';
import { DismissableLayer } from '../';
import { FocusGuards } from '../../FocusGuards/index.ts';
import { FocusScope } from '../../FocusScope/index.ts';

defineProps<{
  openLabel?: string;
  closeLabel?: string;
}>();

const open = ref(false);
</script>

<template>
  <button
    class="rounded bg-gray-500 py-2 focus:outline focus:outline-blue-500"
    type="button"
    @click="open = !open"
  >
    {{ openLabel }}
  </button>

  <template v-if="open">
    <FocusGuards>
      <Teleport to="body">
        <div class="pointer-event-none fixed bottom-0 left-0 right-0 top-0 bg-black/30" />
      </Teleport>

      <Teleport to="body">
        <DismissableLayer disable-outside-pointer-events as-child @dismiss="open = false">
          <FocusScope
            trapped
            class="min-height-[200px] fixed left-1/2 top-1/2 flex min-w-[300px] -translate-x-1/2 -translate-y-1/2 items-start gap-4 rounded-lg bg-white p-8 shadow-xl"
          >
            <slot />
            <button type="button" @click="open = false">
              {{ closeLabel }}
            </button>
            <input type="text" value="Hello world" />
          </FocusScope>
        </DismissableLayer>
      </Teleport>
    </FocusGuards>
  </template>
</template>
