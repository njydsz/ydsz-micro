<!--
 * qrcode-login 页面组件
 *
 * @path main\src\views\_core\authentication\qrcode-login.vue
 * @author remi-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { AuthenticationQrCodeLogin } from '@remi/common-ui';
import { LOGIN_PATH } from '@remi/constants';

defineOptions({ name: 'QrCodeLogin' });
</script>

<template>
  <AuthenticationQrCodeLogin :login-path="LOGIN_PATH" />
</template>
