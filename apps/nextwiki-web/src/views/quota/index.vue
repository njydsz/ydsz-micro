<!--
 * 存储配额（展示页）
 *
 * @path apps\nextwiki-web\src\views\quota\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 存储配额（展示页）
 * <p>消费后端契约 QuotaController（apps/nextwiki-web/src/api/quota.ts）：
 * 按存储范围（scopeType/scopeId，缺省查全局）调 getQuota 展示配额使用情况（逐字段判空展示），
 * 「调整配额」按钮打开 quota-form.vue 提交 setQuota。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { Page, useYDSZModal } from '@ydsz/common-ui';
import { ElButton, ElDescriptions, ElDescriptionsItem, ElInput, ElMessage, ElProgress } from 'element-plus';
import { computed, reactive, ref } from 'vue';
import { getQuota } from '#/api/quota';
import type { StorageQuotaVO } from '#/api/models';
import QuotaForm from './quota-form.vue';
defineOptions({ name: 'QuotaManagement' });

/** 查询条件（scopeType/scopeId 均可选，缺省查全局配额） */
const queryForm = reactive({ scopeType: '', scopeId: '' });
/** 配额信息（真实 VO：StorageQuotaVO，字段判空展示） */
const quotaInfo = ref<StorageQuotaVO>({});

/** 已用容量占配额上限的百分比 */
const quotaPercent = computed(() => {
  const limit = quotaInfo.value.quotaLimit;
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.round(((quotaInfo.value.quotaUsed ?? 0) / limit) * 100));
});
/** 已用文件数占文件数上限的百分比 */
const fileCountPercent = computed(() => {
  const limit = quotaInfo.value.fileCountLimit;
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.round(((quotaInfo.value.fileCountUsed ?? 0) / limit) * 100));
});

/** 查询配额 */
async function handleQuery() {
  try {
    quotaInfo.value = await getQuota({
      scopeType: queryForm.scopeType || undefined,
      scopeId: queryForm.scopeId || undefined,
    });
    ElMessage.success('查询成功');
  } catch {}
}

const [QuotaFormModal, quotaFormApi] = useYDSZModal({ connectedComponent: QuotaForm });
function handleAdjust() { quotaFormApi.open(); }
</script>
<template>
  <Page auto-content-height>
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <ElInput v-model="queryForm.scopeType" placeholder="存储范围类型（如 USER / SPACE，可选）" class="w-64" clearable />
      <ElInput v-model="queryForm.scopeId" placeholder="存储范围ID（可选）" class="w-64" clearable @keyup.enter="handleQuery" />
      <ElButton type="primary" @click="handleQuery">查询配额</ElButton>
      <ElButton type="primary" @click="handleAdjust">调整配额</ElButton>
    </div>
    <div class="mb-4">
      <div class="mb-1 text-sm text-gray-600">容量使用（{{ quotaInfo.quotaUsed ?? 0 }} / {{ quotaInfo.quotaLimit ?? 0 }} 字节）</div>
      <ElProgress :percentage="quotaPercent" :stroke-width="14" />
      <div class="mt-2 mb-1 text-sm text-gray-600">文件数使用（{{ quotaInfo.fileCountUsed ?? 0 }} / {{ quotaInfo.fileCountLimit ?? 0 }}）</div>
      <ElProgress :percentage="fileCountPercent" :stroke-width="14" status="success" />
    </div>
    <ElDescriptions :column="2" border>
      <ElDescriptionsItem label="存储范围类型">{{ quotaInfo.scopeType ?? '--' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="存储范围ID">{{ quotaInfo.scopeId ?? '--' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="配额上限（字节）">{{ quotaInfo.quotaLimit ?? '--' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="已用容量（字节）">{{ quotaInfo.quotaUsed ?? '--' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="文件数上限">{{ quotaInfo.fileCountLimit ?? '--' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="已用文件数">{{ quotaInfo.fileCountUsed ?? '--' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="更新时间">{{ quotaInfo.updatedAt ?? '--' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="更新人">{{ quotaInfo.updatedBy ?? '--' }}</ElDescriptionsItem>
    </ElDescriptions>
    <QuotaFormModal @success="handleQuery" />
  </Page>
</template>