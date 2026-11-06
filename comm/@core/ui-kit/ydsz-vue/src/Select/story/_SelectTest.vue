<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { ref } from 'vue';
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from '../';

const fruit = ref('');

const options = ['Apple', 'Banana', 'Blueberry', 'Grapes', 'Pineapple'];
</script>

<template>
  <div>
    <SelectRoot v-model="fruit" name="test" aria-label="Fruits">
      <SelectTrigger
        class="text-violet11 hover:bg-mauve3 data-[placeholder]:text-violet9 inline-flex h-[35px] min-w-[160px] items-center justify-between gap-[5px] rounded bg-white px-[15px] text-[13px] leading-none shadow-[0_2px_10px] shadow-black/10 outline-none focus:shadow-[0_0_0_2px] focus:shadow-black"
        aria-label="Customise options"
      >
        <SelectValue placeholder="Please select a fruit">
          {{ fruit }}
        </SelectValue>
        <Icon icon="radix-icons:chevron-down" class="h-4 w-4" />
      </SelectTrigger>

      <SelectPortal to="#here">
        <SelectContent
          class="data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade min-w-[160px] overflow-hidden rounded bg-white shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform]"
          :side-offset="5"
          position="popper"
        >
          <SelectViewport class="p-[5px]">
            <SelectLabel class="text-mauve11 px-[25px] text-xs leading-[25px]">
              Fruits
            </SelectLabel>
            <SelectGroup>
              <SelectItem
                v-for="(option, index) in options"
                :key="index"
                class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 relative flex h-[25px] select-none items-center rounded-[3px] pl-[25px] pr-[35px] text-[13px] leading-none data-[disabled]:pointer-events-none data-[highlighted]:outline-none"
                :value="option"
              >
                <SelectItemIndicator
                  class="absolute left-0 inline-flex w-[25px] items-center justify-center"
                >
                  <Icon icon="radix-icons:check" />
                </SelectItemIndicator>
                <SelectItemText>
                  {{ option }}
                </SelectItemText>
              </SelectItem>
            </SelectGroup>
            <SelectSeparator class="bg-violet6 m-[5px] h-[1px]" />
            <SelectLabel class="text-mauve11 px-[25px] text-xs leading-[25px]">
              Vegetables
            </SelectLabel>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>

    <div id="here" />
  </div>
</template>
