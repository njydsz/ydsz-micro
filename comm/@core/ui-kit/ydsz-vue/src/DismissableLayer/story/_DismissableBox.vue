<script setup lang="ts">
import { ref } from 'vue';
import { DismissableLayer } from '../';

// 递归自引用：逐层嵌套的浮层示例，Vue SFC 支持该写法
import DismissableBox from './_DismissableBox.vue';

const open = ref(false);
const buttonRef = ref<HTMLElement>();
</script>

<template>
  <DismissableLayer v-bind="{ ...$attrs }" class="rounded-xl bg-gray-100/10 p-4">
    <button ref="buttonRef" type="button" @click="open = !open">
      {{ open ? 'Close' : 'Open' }} new layer
    </button>

    <DismissableBox
      v-if="open"
      @dismiss="open = false"
      @focus-outside.prevent
      @pointer-down-outside="
        (ev) => {
          if (ev.target === buttonRef) {
            ev.preventDefault();
          }
        }
      "
    />
  </DismissableLayer>
</template>
