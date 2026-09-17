<!--
 * language-toggle 布局组件
 *
 * <p>顶栏/登录页语言切换入口，委托给 language-picker 渲染。
 * 当偏好设置中关闭语言切换部件时，本组件不渲染。
 *
 * @path comm\effects\layouts\src\widgets\language-toggle.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import LanguagePicker from './language-picker.vue';

defineOptions({
  name: 'LanguageToggle',
});
</script>

<template>
  <div>
    <LanguagePicker />
  </div>
</template>
