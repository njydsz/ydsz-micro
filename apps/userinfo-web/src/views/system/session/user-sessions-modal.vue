<!--
 * 用户全部会话弹窗组件
 *
 * <p>显示某用户的全部会话列表（跨设备），由父页面通过 useYDSZModal connectedComponent 模式调用。
 *
 * @path apps\userinfo-web\src\views\system\session\user-sessions-modal.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 用户全部会话弹窗
 * <p>消费后端 getUserSessions() 查询并展示会话列表。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import { ElEmpty, ElTable, ElTableColumn } from 'element-plus';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { getUserSessions } from '#/api/adminSession';
import type { UserSessionVO } from '#/api/models';

defineOptions({ name: 'UserSessionsModal' });

const { t } = useI18n();

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: async (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ userId: string }>();
    if (!data.userId) return;
    loading.value = true;
    try {
      userSessions.value = await getUserSessions({ userId: data.userId });
    } finally {
      loading.value = false;
    }
  },
});

const userSessions = ref<UserSessionVO[]>([]);
const loading = ref(false);
</script>

<template>
  <Modal>
    <div v-loading="loading">
      <div class="mb-3 border-b pb-2">
        <span class="text-base font-medium">{{ t('session.userSessions') }}</span>
      </div>
      <ElTable :data="userSessions" border max-height="400">
        <ElTableColumn prop="username" :label="t('page.username')" width="120" />
        <ElTableColumn prop="loginIp" :label="t('session.loginIp')" width="140" />
        <ElTableColumn prop="device" :label="t('session.device')" width="100" />
        <ElTableColumn prop="loginTime" :label="t('session.loginTime')" width="170" />
        <ElTableColumn prop="expireTime" :label="t('session.expireTime')" width="170" />
      </ElTable>
      <ElEmpty v-if="userSessions.length === 0 && !loading" :description="t('session.noUserSessions')" :image-size="60" />
    </div>
  </Modal>
</template>
