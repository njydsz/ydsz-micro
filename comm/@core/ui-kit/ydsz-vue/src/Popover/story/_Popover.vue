<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { ref } from 'vue';
import {
  PopoverArrow,
  PopoverClose,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from '../';

const toggleState = ref(false);
</script>

<template>
  <PopoverRoot v-model:open="toggleState" :modal="false">
    <PopoverTrigger
      class="text-violet11 shadow-blackA7 hover:bg-violet3 inline-flex h-[35px] w-[35px] cursor-default items-center justify-center rounded-full bg-white shadow-[0_2px_10px] outline-none focus:shadow-[0_0_0_2px] focus:shadow-black"
      aria-label="Update dimensions"
    >
      <Icon icon="radix-icons:mixer-horizontal" />
      Open
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        side="bottom"
        :side-offset="5"
        class="data-[state=open]:data-[side=top]:animate-slideDownAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade w-[260px] rounded bg-white p-5 shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2)] will-change-[transform,opacity] focus:shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2),0_0_0_2px_theme(colors.violet7)]"
      >
        <div class="flex flex-col gap-2.5">
          <p class="text-mauve12 mb-2.5 text-[15px] font-medium leading-[19px]">Dimensions</p>
        </div>
        <PopoverClose
          class="text-violet11 hover:bg-violet4 focus:shadow-violet7 absolute right-[5px] top-[5px] inline-flex h-[25px] w-[25px] cursor-default items-center justify-center rounded-full outline-none focus:shadow-[0_0_0_2px]"
          aria-label="Close"
        >
          Close
        </PopoverClose>
        <PopoverArrow class="fill-white" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
