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
import { Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ydsz-core/ui-kit/shadcn-ui';
// SKIP: ElTabPane/ElTabs 不在 shadcn 映射表，保留 EP
import { ElTabPane, ElTabs } from 'element-plus';
import { h, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { createLogger } from '@ydsz-core/shared/utils';

const logger = createLogger('message-subscription');
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
    ACTIVE: t('subscription.status.active'),
    SUBSCRIBED: t('subscription.status.subscribed'),
    PENDING: t('subscription.status.pending'),
    UNSUBSCRIBED: t('subscription.status.unsubscribed'),
  };
  return labels[(status ?? '').toUpperCase()] ?? status ?? '-';
}

const gridOptions: VxeTableGridOptions<MsgSubscriptionVO> = {
  columns: [
    { type: 'seq', width: 50, title: t('common.seq') },
    { field: 'userId', title: t('subscription.userId'), width: 140 },
    { field: 'topicCode', title: t('subscription.topicCode'), width: 150 },
    { field: 'topicName', title: t('subscription.topicName'), width: 160 },
    { field: 'channel', title: t('subscription.channel'), width: 100 },
    {
      field: 'status',
      title: t('common.status'),
      width: 100,
      slots: {
        default: ({ row }) =>
          h(Badge, { variant: getSubscriptionStatusType(row.status) === 'success' ? 'default' : getSubscriptionStatusType(row.status) === 'warning' ? 'outline' : 'secondary' }, () =>
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
              Button,
              { size: 'sm', variant: 'link', onClick: () => handleEdit(row) },
              () => t('common.edit'),
            ),
            h(
              Button,
              { size: 'sm', variant: 'link', onClick: () => handleUnsubscribe(row) },
              () => t('subscription.unsubscribe'),
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
  // 步骤1：确认弹窗（用户取消直接返回）
  try {
    await ydszConfirm(
      t('subscription.unsubscribeConfirm', { topic: row.topicName ?? row.topicCode, channel: row.channel ?? '' }),
      t('subscription.unsubscribeConfirmTitle'),
      { type: 'warning' },
    );
  } catch {
    logger.debug('用户取消退订操作');
    return;
  }
  // 步骤2：执行退订 API（失败提示由 errorMessageResponseInterceptor 统一处理）
  try {
    await unsubscribe({
      userId: row.userId,
      topicCode: row.topicCode,
      channel: row.channel,
    });
    showToast.success(t('subscription.unsubscribeSuccess'));
    gridApi.query();
  } catch (error) {
    logger.warn('退订失败: {}', error);
    // 用户提示由 errorMessageResponseInterceptor 统一处理
  }
}

/** 按用户查询 */
function handleQueryByUser(): void {
  if (!currentUserId.value.trim()) {
    showToast.warning('请输入用户ID');
    return;
  }
  gridApi.query();
}

/** 按主题查询 */
function handleQueryByTopic(): void {
  if (!currentTopicCode.value.trim()) {
    showToast.warning('请输入主题编码');
    return;
  }
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="订阅管理">
      <template #toolbar-tools>
        <Button @click="handleAdd">{{ t('common.create') }}</Button>
      </template>
      <template #toolbar-tools-after>
        <ElTabs v-model="activeTab" class="mt-2">
          <ElTabPane label="按用户查询" name="user">
            <div class="flex gap-2 py-2">
              <Input v-model="currentUserId" placeholder="请输入用户ID" class="w-64" />
              <Button @click="handleQueryByUser">{{ t('common.search') }}</Button>
            </div>
          </ElTabPane>
          <ElTabPane label="按主题查询" name="topic">
            <div class="flex gap-2 py-2">
              <Input
                v-model="currentTopicCode"
                placeholder="请输入主题编码"
                class="w-48"
              />
              <Select v-model="currentChannel">
                <SelectTrigger class="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">邮件</SelectItem>
                  <SelectItem value="SMS">短信</SelectItem>
                  <SelectItem value="INBOX">站内信</SelectItem>
                  <SelectItem value="WEBHOOK">Webhook</SelectItem>
                </SelectContent>
              </Select>
              <Button @click="handleQueryByTopic">{{ t('common.search') }}</Button>
            </div>
          </ElTabPane>
        </ElTabs>
      </template>
    </Grid>
    <SubscriptionFormModal @success="gridApi.query()" />
  </Page>
</template>
