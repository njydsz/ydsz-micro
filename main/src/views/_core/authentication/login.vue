<!--
 * login 页面组件
 *
 * @path main\src\views\_core\authentication\login.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { YdFormSchema } from '@ydsz/common-ui';
import type { BasicOption } from '@ydsz/types';

import { computed, markRaw } from 'vue';

import { AuthenticationLogin, YdSliderCaptcha, z } from '@ydsz/common-ui';
import { $t } from '@ydsz/locales';

import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

const MOCK_TENANT_OPTIONS: BasicOption[] = [
  {
    label: $t('page.auth.tenantPlatform'),
    value: 'YDSZ',
  },
  {
    label: $t('page.auth.tenantTestA'),
    value: 'tenant-a',
  },
  {
    label: $t('page.auth.tenantTestB'),
    value: 'tenant-b',
  },
];

const formSchema = computed((): YdFormSchema[] => {
  return [
    {
      component: 'YdSelect',
      componentProps: {
        options: MOCK_TENANT_OPTIONS,
        placeholder: $t('page.auth.tenantPlaceholder'),
      },
      fieldName: 'tenant',
      label: $t('page.auth.tenant'),
      rules: z
        .string()
        .min(1, { message: $t('page.auth.tenantPlaceholder') })
        .optional()
        .default('YDSZ'),
    },
    {
      component: 'YDSZInput',
      componentProps: {
        placeholder: $t('page.auth.accountPlaceholder'),
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('page.auth.accountPlaceholder') }),
    },
    {
      component: 'YdInputPassword',
      componentProps: {
        placeholder: $t('page.auth.passwordPlaceholder'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('page.auth.passwordPlaceholder') }),
    },
    {
      component: markRaw(YdSliderCaptcha),
      fieldName: 'captcha',
      rules: z.boolean().refine((value) => value, {
        message: $t('authentication.verifyRequiredTip'),
      }),
    },
  ];
});
</script>

<template>
  <AuthenticationLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    @submit="authStore.authLogin"
  />
</template>
