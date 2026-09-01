<!--
 * 消息订阅管理列表页面
 *
 * <p>管理用户的消息订阅关系，支持按用户/主题查询、订阅/退订操作。
 *
 * @path apps/message-web/src/views/subscription/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 消息订阅管理（列表页）
 * <p>消费后端契约 SubscriptionController（apps/message-web/src/api/subscription.ts）：
 * upsert() 新增/更新订阅，listByUser() 按用户查询订阅，
 * listByTopic() 按主题查询订阅，unsubscribe() 退订。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';
import { Page, useYDSZModal } from '@ydsz/common-ui';
import {
  ElButton,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus';
import { h, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { listByTopic, listByUser, unsubscribe } from '#/api/subscription';
import type { MsgSubscriptionVO } from '#/api/models';

import SubscriptionForm from './subscription-form.vue';

defineOptions({ name: 'SubscriptionManagement' });

const { t } = useI18n();

/** 当前激活的标签页 */
const activeTab = ref('user');

/** 当前用户 ID（用于按用户查询） */
const currentUserId = ref('');

/** 当前主题编码（用于按主题查询） */
const currentTopicCode = ref('');

/** 当前通道（用于按主题查询） */
const currentChannel = ref('EMAIL');

/** 订阅状态标签类型 */
function getSubscriptionStatusType(status?: string): 'success' | 'info' | 'warning' {
  const upper = (status ?? '').toUpperCase();
  if (upper === 'ACTIVE' || upper === 'SUBSCRIBED') return 'success';
  if (upper === 'PENDING') return 'warning';
  return 'info';
}

/** 订阅状态标签文本 */
function getSubscriptionStatusLabel(status?: string): string {
  const labels: Record<string, string> = {
    ACTIVE: '已订阅',
    SUBSCRIBED: '已订阅',
    PENDING: '待确认',
    UNSUBSCRIBED: '已退订',
  };
  return labels[(status ?? '').toUpperCase()] ?? status ?? '-';
}

const gridOptions: VxeTableGridOptions<MsgSubscriptionVO> = {
  columns: [
    { type: 'seq', width: 50, title: t('common.seq') },
    { field: 'userId', title: '用户ID', width: 140 },
    { field: 'topicCode', title: '主题编码', width: 150 },
    { field: 'topicName', title: '主题名称', width: 160 },
    { field: 'channel', title: '通道', width: 100 },
    {
      field: 'status',
      title: t('common.status'),
      width: 100,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: getSubscriptionStatusType(row.status) }, () =>
            getSubscriptionStatusLabel(row.status),
          ),
      },
    },
    { field: 'createdAt', label: '订阅时间', width: 170 },
    { field: 'updatedAt', title: t('updateTime'), width: 170 },
    {
      field: 'action',
      title: t('common.actions'),
      width: 200,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(
              ElButton,
              { size: 'small', link: true, type: 'primary', onClick: () => handleEdit(row) },
              () => t('common.edit'),
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'danger', onClick: () => handleUnsubscribe(row) },
              () => '退订',
            ),
          ]),
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async () => {
        let items: MsgSubscriptionVO[] = [];
        if (activeTab.value === 'user' && currentUserId.value) {
          items = await listByUser({ userId: currentUserId.value });
        } else if (activeTab.value === 'topic' && currentTopicCode.value) {
          items = await listByTopic({
            topicCode: currentTopicCode.value,
            channel: currentChannel.value,
          });
        }
        return { items, total: items.length };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });
const [SubscriptionFormModal, subscriptionFormApi] = useYDSZModal({
  connectedComponent: SubscriptionForm,
});

/** 新增订阅 */
function handleAdd(): void {
  subscriptionFormApi.open();
}

/** 编辑订阅 */
function handleEdit(row: MsgSubscriptionVO): void {
  subscriptionFormApi.setData({ record: row });
  subscriptionFormApi.open();
}

/** 退订 */
async function handleUnsubscribe(row: MsgSubscriptionVO): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确定要退订主题「${row.topicName ?? row.topicCode}」的${row.channel ?? ''}通知吗？`,
      '退订确认',
      { type: 'warning' },
    );
    await unsubscribe({
      userId: row.userId,
      topicCode: row.topicCode,
      channel: row.channel,
    });
    ElMessage.success('退订成功');
    gridApi.query();
  } catch {
    // 用户取消或请求失败
  }
}

/** 按用户查询 */
function handleQueryByUser(): void {
  if (!currentUserId.value.trim()) {
    ElMessage.warning('请输入用户ID');
    return;
  }
  gridApi.query();
}

/** 按主题查询 */
function handleQueryByTopic(): void {
  if (!currentTopicCode.value.trim()) {
    ElMessage.warning('请输入主题编码');
    return;
  }
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="订阅管理">
      <template #toolbar-tools>
        <ElButton type="primary" @click="handleAdd">{{ t('common.create') }}</ElButton>
      </template>
      <template #toolbar-tools-after>
        <ElTabs v-model="activeTab" class="mt-2">
          <ElTabPane label="按用户查询" name="user">
            <div class="flex gap-2 py-2">
              <ElInput v-model="currentUserId" placeholder="请输入用户ID" class="w-64" clearable />
              <ElButton type="primary" @click="handleQueryByUser">{{ t('common.search') }}</ElButton>
            </div>
          </ElTabPane>
          <ElTabPane label="按主题查询" name="topic">
            <div class="flex gap-2 py-2">
              <ElInput
                v-model="currentTopicCode"
                placeholder="请输入主题编码"
                class="w-48"
                clearable
              />
              <ElSelect v-model="currentChannel" class="w-32">
                <ElOption label="邮件" value="EMAIL" />
                <ElOption label="短信" value="SMS" />
                <ElOption label="站内信" value="INBOX" />
                <ElOption label="Webhook" value="WEBHOOK" />
              </ElSelect>
              <ElButton type="primary" @click="handleQueryByTopic">{{ t('common.search') }}</ElButton>
            </div>
          </ElTabPane>
        </ElTabs>
      </template>
    </Grid>
    <SubscriptionFormModal @success="gridApi.query()" />
  </Page>
</template>
