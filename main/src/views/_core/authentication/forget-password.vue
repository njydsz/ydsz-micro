<!--
 * forget-password 页面组件
 *
 * @path main\src\views\_core\authentication\forget-password.vue
 * @author remi-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { REMIFormSchema } from '@remi/common-ui';
import type { Recordable } from '@remi/types';

import { computed, ref } from 'vue';

import { AuthenticationForgetPassword, z } from '@remi/common-ui';
import { $t } from '@remi/locales';

defineOptions({ name: 'ForgetPassword' });

const loading = ref(false);

const formSchema = computed((): REMIFormSchema[] => {
  return [
    {
      component: 'REMIInput',
      componentProps: {
        placeholder: 'example@example.com',
      },
      fieldName: 'email',
      label: $t('authentication.email'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.emailTip') })
        .email($t('authentication.emailValidErrorTip')),
    },
  ];
});

function handleSubmit(value: Recordable<any>) {
  // eslint-disable-next-line no-console
  console.log('reset email:', value);
}
</script>

<template>
  <AuthenticationForgetPassword
    :form-schema="formSchema"
    :loading="loading"
    @submit="handleSubmit"
  />
</template>
