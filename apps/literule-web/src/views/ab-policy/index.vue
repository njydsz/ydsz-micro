<!--
 * AB 测试策略管理页面
 *
 * @path apps\literule-web\src\views\ab-policy\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * AB 测试策略管理（列表页 + 创建/编辑弹窗 + 评估报表 + 回滚历史）
 * <p>消费后端契约 RuleABPolicyController（apps/literule-web/src/api/abPolicyApi.ts）。
 * <p>支持新增/编辑/删除/评估/回滚历史查看。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RuleABPolicyDTO, RuleABPolicyVO, RuleABRollbackVO } from '#/api/models';
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';
import { Page, useYdModal } from '@ydsz/common-ui';
// TODO: EP → ydsz-ui 迁移暂缓（含 Form/YdInput/YdSelectBase/YdSwitch/InputNumber/YdTable 等复杂组件，需人工评估）
import { ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElInputNumber, ElOption, ElSelect, ElSwitch, ElTable, ElTableColumn, ElTag } from 'element-plus';
import { computed, h, reactive, ref } from 'vue';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { formatJsonResult } from '#/utils/format';
import { createLogger } from '@ydsz-core/shared/utils';
import {
  createABPolicy,
  deleteABPolicy,
  evaluateABPolicy,
  getABRollbackHistory,
  manualRollbackABPolicy,
  pageABPolicies,
  updateABPolicyById,
} from '#/api/abPolicyApi';

const logger = createLogger('literule-ab-policy');

defineOptions({ name: 'ABPolicyManagement' });

/** ==================== 策略列表 ==================== */
const gridOptions: VxeTableGridOptions<RuleABPolicyVO> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'ruleCode', title: '关联规则编码', width: 160 },
    { field: 'description', title: '策略描述', minWidth: 180 },
    {
      field: 'isAutoRollbackEnabled',
      title: '自动回滚',
      width: 90,
      slots: {
        default: ({ row }) =>
          h(
            ElTag,
            { type: row.isAutoRollbackEnabled ? 'success' : 'info' },
            () => (row.isAutoRollbackEnabled ? '启用' : '关闭'),
          ),
      },
    },
    { field: 'errorRateThreshold', title: '错误率阈值', width: 110 },
    { field: 'minSampleSize', title: '最小样本量', width: 100 },
    { field: 'checkWindowMinutes', title: '评估窗口(分钟)', width: 120 },
    { field: 'notifyChannels', title: '通知渠道', width: 130 },
    { field: 'lastEvaluatedAt', title: '最近评估时间', width: 170 },
    {
      field: 'action',
      title: '操作',
      width: 260,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(
              ElButton,
              { size: 'small', link: true, type: 'primary', onClick: () => handleEdit(row) },
              () => '编辑',
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'success', onClick: () => handleEvaluate(row) },
              () => '评估',
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'warning', onClick: () => handleRollbackHistory(row) },
              () => '回滚历史',
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'danger', onClick: () => handleDelete(row) },
              () => '删除',
            ),
          ]),
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async ({ page }: { page: { currentPage: number; pageSize: number } }) => {
        const result = await pageABPolicies({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
        });
        return { items: result.items ?? [], total: result.total ?? 0 };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

/** ==================== 创建/编辑弹窗表单数据 ==================== */
interface ABFormData {
  id: string;
  ruleCode: string;
  isAutoRollbackEnabled: boolean;
  rollbackAction: string;
  errorRateThreshold: number;
  minSampleSize: number;
  checkWindowMinutes: number;
  notifyChannels: string;
  description: string;
}

const defaultFormData = (): ABFormData => ({
  id: '',
  ruleCode: '',
  isAutoRollbackEnabled: false,
  rollbackAction: 'ROLLBACK',
  errorRateThreshold: 5,
  minSampleSize: 100,
  checkWindowMinutes: 30,
  notifyChannels: '',
  description: '',
});

const formData = reactive<ABFormData>(defaultFormData());
const formRef = ref();
const isEdit = ref(false);

const [Modal, modalApi] = useYdModal({
  onOpenChange: (open: boolean) => {
    if (!open) return;
    const data = modalApi.getData<{ record?: RuleABPolicyVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, defaultFormData(), {
        id: data.record.id ?? '',
        ruleCode: data.record.ruleCode ?? '',
        isAutoRollbackEnabled: data.record.isAutoRollbackEnabled ?? false,
        rollbackAction: data.record.rollbackAction ?? 'ROLLBACK',
        errorRateThreshold: data.record.errorRateThreshold ?? 5,
        minSampleSize: data.record.minSampleSize ?? 100,
        checkWindowMinutes: data.record.checkWindowMinutes ?? 30,
        notifyChannels: data.record.notifyChannels ?? '',
        description: data.record.description ?? '',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, defaultFormData());
    }
  },
  onConfirm: async () => {
    try {
      await formRef.value?.validate();
    } catch (error) {
      logger.debug('表单校验未通过: {}', error);
      return;
    }
    modalApi.lock();
    try {
      const dto: RuleABPolicyDTO = {
        ruleCode: formData.ruleCode || undefined,
        isAutoRollbackEnabled: formData.isAutoRollbackEnabled,
        rollbackAction: formData.rollbackAction || undefined,
        errorRateThreshold: formData.errorRateThreshold,
        minSampleSize: formData.minSampleSize,
        checkWindowMinutes: formData.checkWindowMinutes,
        notifyChannels: formData.notifyChannels || undefined,
        description: formData.description || undefined,
      };
      if (isEdit.value && formData.id) {
        dto.id = formData.id;
        await updateABPolicyById({ id: formData.id }, dto);
        showToast.success('更新成功');
      } else {
        await createABPolicy(dto);
        showToast.success('创建成功');
      }
      gridApi.query();
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const modalTitle = computed(() => (isEdit.value ? '编辑 AB 策略' : '新增 AB 策略'));

function handleEdit(row: RuleABPolicyVO) {
  modalApi.setData({ record: row });
  modalApi.open();
}

function handleCreate() {
  modalApi.setData({});
  modalApi.open();
}

async function handleDelete(row: RuleABPolicyVO) {
  if (!row.id) return;
  try {
    await ydszConfirm(
      `确定删除 AB 策略「${row.ruleCode}」吗？`,
      '删除确认',
      { type: 'warning' },
    );
    await deleteABPolicy({ id: row.id });
    showToast.success('删除成功');
    gridApi.query();
  } catch {
    /* 错误提示由请求拦截器统一处理 */
  }
}

/** ==================== 评估报表 ==================== */
const evaluateVisible = ref(false);
const evaluateLoading = ref(false);
const evaluateResult = ref<Record<string, unknown> | null>(null);
const evaluateRuleCode = ref('');

async function handleEvaluate(row: RuleABPolicyVO) {
  if (!row.id) return;
  evaluateRuleCode.value = row.ruleCode ?? '';
  evaluateVisible.value = true;
  evaluateLoading.value = true;
  try {
    evaluateResult.value = await evaluateABPolicy({ id: row.id });
  } catch {
    evaluateResult.value = null;
  } finally {
    evaluateLoading.value = false;
  }
}

/** ==================== 回滚历史 ==================== */
const rollbackHistoryVisible = ref(false);
const rollbackHistoryLoading = ref(false);
const rollbackHistoryList = ref<RuleABRollbackVO[]>([]);
const currentABPolicyId = ref('');

async function handleRollbackHistory(row: RuleABPolicyVO) {
  if (!row.id) return;
  currentABPolicyId.value = row.id;
  rollbackHistoryVisible.value = true;
  rollbackHistoryLoading.value = true;
  try {
    rollbackHistoryList.value = (await getABRollbackHistory({ id: row.id })) ?? [];
  } catch {
    rollbackHistoryList.value = [];
  } finally {
    rollbackHistoryLoading.value = false;
  }
}

/** 手动回滚 */
async function handleManualRollback(): Promise<void> {
  if (!currentABPolicyId.value) return;
  try {
    await ydszConfirm('确定手动回滚该策略到 A 版本吗？', { title: '手动回滚', type: 'warning', });
    await manualRollbackABPolicy({ id: currentABPolicyId.value }, { reason: '手动回滚' });
    showToast.success('回滚成功');
    rollbackHistoryLoading.value = true;
    try {
      rollbackHistoryList.value = (await getABRollbackHistory({ id: currentABPolicyId.value })) ?? [];
    } catch {
      /* 错误提示由请求拦截器统一处理 */
    } finally {
      rollbackHistoryLoading.value = false;
    }
  } catch {
    logger.debug('用户取消手动回滚');
  }
}
</script>

<template>
  <Page auto-content-height>
    <div class="flex flex-col gap-3 p-4">
      <Grid table-title="AB 策略列表">
        <template #toolbar-tools>
          <ElButton type="primary" @click="handleCreate">新增策略</ElButton>
        </template>
      </Grid>
    </div>

    <!-- 创建/编辑弹窗 -->
    <Modal :title="modalTitle">
      <ElForm ref="formRef" :model="formData" label-width="110px" label-position="right">
        <ElFormItem label="关联规则编码" required>
          <ElInput v-model="formData.ruleCode" :disabled="isEdit" placeholder="请输入关联的规则编码" />
        </ElFormItem>
        <ElFormItem label="启用自动回滚">
          <ElSwitch v-model="formData.isAutoRollbackEnabled" />
        </ElFormItem>
        <ElFormItem label="回滚动作">
          <ElSelect v-model="formData.rollbackAction">
            <ElOption label="自动回滚" value="ROLLBACK" />
            <ElOption label="仅通知" value="NOTIFY_ONLY" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="错误率阈值(%)">
          <ElInputNumber v-model="formData.errorRateThreshold" :min="0" :max="100" class="!w-full" />
        </ElFormItem>
        <ElFormItem label="最小样本量">
          <ElInputNumber v-model="formData.minSampleSize" :min="1" class="!w-full" />
        </ElFormItem>
        <ElFormItem label="评估窗口(分钟)">
          <ElInputNumber v-model="formData.checkWindowMinutes" :min="1" class="!w-full" />
        </ElFormItem>
        <ElFormItem label="通知渠道">
          <ElInput v-model="formData.notifyChannels" placeholder="如 sms,email,dingtalk" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput
            v-model="formData.description"
            type="textarea"
            :rows="2"
            placeholder="请输入策略描述"
          />
        </ElFormItem>
      </ElForm>
    </Modal>

    <!-- 评估报表弹窗 -->
    <ElDialog
      v-model="evaluateVisible"
      :title="`A/B 策略评估 - ${evaluateRuleCode}`"
      width="640px"
      top="8vh"
    >
      <div v-loading="evaluateLoading">
        <div v-if="evaluateResult">
          <div
            v-for="(value, key) in evaluateResult"
            :key="String(key)"
            class="mb-3 rounded border border-gray-200 bg-gray-50 p-3"
          >
            <div class="text-xs font-medium text-gray-500">{{ key }}</div>
            <div class="mt-1 whitespace-pre-wrap text-sm">{{ formatJsonResult(value) }}</div>
          </div>
        </div>
        <div v-else class="py-8 text-center text-sm text-gray-400">暂无评估数据</div>
      </div>
    </ElDialog>

    <!-- 回滚历史弹窗 -->
    <ElDialog v-model="rollbackHistoryVisible" title="回滚历史" width="720px" top="8vh">
      <ElTable
        :data="rollbackHistoryList"
        border
        size="small"
        :loading="rollbackHistoryLoading"
        empty-text="暂无回滚记录"
      >
        <ElTableColumn type="seq" label="序号" width="60" />
        <ElTableColumn prop="triggerReason" label="触发原因" width="140" />
        <ElTableColumn prop="errorRate" label="回滚时错误率" width="120" />
        <ElTableColumn prop="sampleSize" label="样本量" width="90" />
        <ElTableColumn prop="operator" label="操作人" width="100" />
        <ElTableColumn prop="notifyStatus" label="通知状态" width="100">
          <template #default="{ row }">
            <ElTag :type="row.notifyStatus === 'SUCCESS' ? 'success' : 'info'">
              {{ row.notifyStatus ?? '-' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="createdAt" label="操作时间" width="170" />
      </ElTable>
      <template #footer>
        <ElButton @click="rollbackHistoryVisible = false">关闭</ElButton>
        <ElButton type="warning" @click="handleManualRollback">手动回滚</ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
