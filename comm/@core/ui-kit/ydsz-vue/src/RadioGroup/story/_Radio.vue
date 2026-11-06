<script setup lang="ts">
import Radio from '../Radio.vue';
</script>

<template>
  <div class="flex items-center">
    <Radio
      id="r1"
      aria-label="Default"
      class="shadow-blackA7 hover:bg-violet3 h-[25px] w-[25px] cursor-default rounded-full bg-white shadow-[0_2px_10px] outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[disabled]:bg-red-500"
      value="true"
      name="test"
    />
    <label class="pl-[15px] text-[15px] leading-none text-white" for="r1"> Default </label>
  </div>
</template>
