<!--
 * 封禁信息弹窗组件
 *
 * <p>显示用户封禁详情（类型/原因/到期时间/操作人），由父页面通过 useYdModal connectedComponent 模式调用。
 *
 * @path apps\userinfo-web\src\views\system\session\ban-info-modal.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 封禁信息弹窗
 * <p>消费后端 getBanInfo() 查询并展示封禁详情。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYdModal } from '@ydsz/common-ui';
import { YdBadge } from '@ydsz-core/shadcn-ui';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { getBanInfo } from '#/api/adminSession';
import type { BanInfoVO } from '#/api/models';

defineOptions({ name: 'BanInfoModal' });

const { t } = useI18n();

const [Modal, modalApi] = useYdModal({
  onOpenChange: async (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ userId: string }>();
    if (!data.userId) return;
    loading.value = true;
    try {
      banInfo.value = await getBanInfo({ userId: data.userId });
    } finally {
      loading.value = false;
    }
  },
});

const banInfo = ref<BanInfoVO>({});
const loading = ref(false);
</script>

<template>
  <Modal>
    <div v-loading="loading" class="space-y-3">
      <div class="mb-3 border-b pb-2">
        <span class="text-base font-medium">{{ t('session.banInfo') }}</span>
      </div>
      <div class="flex items-center">
        <span class="w-24 text-gray-500">{{ t('session.banStatus') }}</span>
        <YdBadge :variant="banInfo.isBanned ? 'destructive' : 'default'" :class="banInfo.isBanned ? '' : 'bg-green-500 text-white hover:bg-green-600'" class="text-xs">
          {{ banInfo.isBanned ? t('session.banned') : t('session.notBanned') }}
        </YdBadge>
      </div>
      <div class="flex items-center">
        <span class="w-24 text-gray-500">{{ t('session.banType') }}</span>
        <span class="text-sm">{{ banInfo.banType ?? '-' }}</span>
      </div>
      <div class="flex items-center">
        <span class="w-24 text-gray-500">{{ t('session.banReasonLabel') }}</span>
        <span class="text-sm">{{ banInfo.banReason ?? '-' }}</span>
      </div>
      <div class="flex items-center">
        <span class="w-24 text-gray-500">{{ t('session.banExpireAt') }}</span>
        <span class="text-sm">{{ banInfo.banExpireAt ?? t('session.permanent') }}</span>
      </div>
      <div class="flex items-center">
        <span class="w-24 text-gray-500">{{ t('session.bannedBy') }}</span>
        <span class="text-sm">{{ banInfo.bannedBy ?? '-' }}</span>
      </div>
      <div class="flex items-center">
        <span class="w-24 text-gray-500">{{ t('session.bannedAt') }}</span>
        <span class="text-sm">{{ banInfo.bannedAt ?? '-' }}</span>
      </div>
    </div>
  </Modal>
</template>
