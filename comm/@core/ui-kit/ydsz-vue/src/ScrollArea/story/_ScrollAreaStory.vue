<script setup lang="ts">
import {
  ScrollAreaCorner,
  ScrollAreaRoot,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from '../';
import type { ScrollAreaRootProps } from '../ScrollAreaRoot.vue';

interface Props extends ScrollAreaRootProps {
  animated?: boolean;
  vertical?: boolean;
  horizontal?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  animated: false,
  vertical: true,
  horizontal: true,
});
</script>

<template>
  <ScrollAreaRoot
    class="h-[200px] w-[200px] overflow-hidden rounded bg-white text-gray-900 shadow-lg"
    style="--scrollbar-size: 10px"
    v-bind="props"
  >
    <ScrollAreaViewport class="h-full w-full border-[inherit]">
      <div class="p-5">
        <slot />
      </div>
    </ScrollAreaViewport>
    <ScrollAreaScrollbar
      v-if="vertical"
      class="flex touch-none select-none bg-black/10 p-0.5 transition hover:bg-black/20 data-[orientation=vertical]:w-[var(--scrollbar-size)]"
      orientation="vertical"
    >
      <ScrollAreaThumb
        :class="
          animated && 'data-[state=visible]:animate-fadeIn data-[state=hidden]:animate-fadeOut'
        "
        class="relative flex-1 rounded-[var(--scrollbar-size)] bg-gray-400"
      />
    </ScrollAreaScrollbar>

    <ScrollAreaScrollbar
      v-if="horizontal"
      class="flex touch-none select-none bg-black/10 p-0.5 transition hover:bg-black/20 data-[orientation=horizontal]:h-[var(--scrollbar-size)] data-[orientation=horizontal]:flex-col"
      orientation="horizontal"
    >
      <ScrollAreaThumb
        :class="
          animated && 'data-[state=visible]:animate-fadeIn data-[state=hidden]:animate-fadeOut'
        "
        class="relative flex-1 rounded-[var(--scrollbar-size)] bg-gray-400"
      />
    </ScrollAreaScrollbar>

    <ScrollAreaCorner class="bg-gray-300" />
  </ScrollAreaRoot>
</template>
