<!--
 * WebHook 订阅配置面板
 *
 * <p>嵌入任务配置，提供 WebHook 事件订阅的增删改查与测试能力。
 *
 * @path apps\cronjob-web\src\views\job\components\WebhookConfigPanel.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * WebHook 配置面板
 * <p>消费后端契约 JobWebhookController（apps/cronjob-web/src/api/jobWebhook.ts）：
 * page()/create()/update()/deleteApi()/getById()/testWebhook()。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { YdBadge, YdButton, YdDialog, YdDialogContent, YdDialogFooter, YdDialogHeader, YdDialogTitle, YdInput, YdRadioGroup, YdRadioGroupItem, YdSelectBase, YdSelectContentBase, YdSelectItemBase, YdSelectTriggerBase, YdSwitch, YdTextarea, YdTable, YdTableColumn, YdForm, YdFormItem } from '@ydsz-core/ydsz-ui';
import { nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  create as createWebhook,
  deleteApi as deleteWebhook,
  getById as getWebhookById,
  page as listWebhooks,
  testWebhook,
  update as updateWebhook,
} from '#/api/jobWebhook';
import type { JobWebhookPostDTO, JobWebhookPutDTO, JobWebhookVO } from '#/api/models';

import { createLogger } from '@ydsz-core/shared/utils';

const logger = createLogger('cronjob-webhook-panel');

const { t } = useI18n();

/** 关联任务 ID */
const props = defineProps<{
  /** 关联的任务 ID（空=全局订阅） */
  jobId?: string;
}>();

/** 订阅列表 */
const webhookList = ref<JobWebhookVO[]>([]);
const loading = ref(false);

/** 弹窗可见性 */
const dialogVisible = ref(false);
const editingId = ref<string | undefined>(undefined);
const formRef = ref<InstanceType<typeof YdForm> | null>(null);

/** 表单数据 */
const formData = ref<JobWebhookPostDTO & { id?: string }>({
  name: '',
  eventType: 'TASK_FAILED',
  jobKey: '',
  jobGroup: '',
  callbackUrl: '',
  httpMethod: 'POST',
  headers: '',
  secret: '',
  webhookStatus: 'ACTIVE',
});

/** 事件类型选项 */
const eventTypeOptions = [
  { label: '任务开始', value: 'TASK_STARTED' },
  { label: '任务成功', value: 'TASK_SUCCESS' },
  { label: '任务失败', value: 'TASK_FAILED' },
  { label: '任务超时', value: 'TASK_TIMEOUT' },
  { label: 'DAG完成', value: 'DAG_COMPLETED' },
];

/** 表单校验规则 */
const formRules = {
  name: [{ required: true, message: '请输入订阅名称', trigger: 'blur' }],
  eventType: [{ required: true, message: '请选择事件类型', trigger: 'change' }],
  callbackUrl: [
    { required: true, message: '请输入回调 URL', trigger: 'blur' },
    { type: 'url' as const, message: '请输入有效的 URL', trigger: 'blur' },
  ],
  httpMethod: [{ required: true, message: '请选择请求方法', trigger: 'change' }],
};

/** 加载订阅列表 */
async function loadList(): Promise<void> {
  loading.value = true;
  try {
    const res = await listWebhooks({});
    webhookList.value = res.data ?? [];
  } catch (e) {
    logger.warn('加载 Webhook 列表失败', e);
  } finally {
    loading.value = false;
  }
}

/** 新增订阅 */
function handleCreate(): void {
  editingId.value = undefined;
  formData.value = {
    name: '',
    eventType: 'TASK_FAILED',
    jobKey: '',
    jobGroup: '',
    callbackUrl: '',
    httpMethod: 'POST',
    headers: '',
    secret: '',
    webhookStatus: 'ACTIVE',
  };
  dialogVisible.value = true;
  nextTick(() => formRef.value?.clearValidate());
}

/** 编辑订阅 */
async function handleEdit(row: JobWebhookVO): Promise<void> {
  if (!row.id) {
    return;
  }
  const detail = await getWebhookById(row.id);
  const data = detail.data ?? detail;
  formData.value = {
    id: data.id,
    name: data.name ?? '',
    eventType: data.eventType ?? 'TASK_FAILED',
    jobKey: data.jobKey ?? '',
    jobGroup: data.jobGroup ?? '',
    callbackUrl: data.callbackUrl ?? '',
    httpMethod: data.httpMethod ?? 'POST',
    headers: data.headers ?? '',
    secret: data.secret ?? '',
    webhookStatus: data.webhookStatus ?? 'ACTIVE',
  };
  editingId.value = data.id;
  dialogVisible.value = true;
}

/** 提交表单 */
async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  const payload = { ...formData.value };
  if (editingId.value) {
    const putData: JobWebhookPutDTO = { ...payload, id: editingId.value };
    await updateWebhook(putData);
    showToast.success('更新订阅成功');
  } else {
    const postData: JobWebhookPostDTO = { ...payload };
    await createWebhook(postData);
    showToast.success('新增订阅成功');
  }
  dialogVisible.value = false;
  loadList();
}

/** 删除订阅 */
async function handleDelete(row: JobWebhookVO): Promise<void> {
  if (!row.id) {
    return;
  }
  await deleteWebhook(row.id);
  showToast.success('删除订阅成功');
  loadList();
}

/** 测试 Webhook */
async function handleTest(row: JobWebhookVO): Promise<void> {
  if (!row.id) {
    return;
  }
  await testWebhook(row.id);
  showToast.success('测试请求已发送');
}

/** 状态变更 */
function formatStatus(status?: string): { type: 'success' | 'info'; label: string } {
  if (status === 'ACTIVE') {
    return { type: 'success', label: '已启用' };
  }
  return { type: 'info', label: '已禁用' };
}

watch(() => props.jobId, loadList, { immediate: false });
onMounted(loadList);
</script>

<template>
  <div class="webhook-config-panel">
    <!-- 操作栏 -->
    <div class="mb-3 flex items-center justify-between">
      <span class="text-sm font-medium">WebHook 事件订阅</span>
      <YdButton size="sm" @click="handleCreate">新增订阅</YdButton>
    </div>

    <!-- 订阅列表 -->
    <YdTable :data="webhookList" :loading="loading" border stripe size="small">
      <YdTableColumn prop="name" label="订阅名称" min-width="140" />
      <YdTableColumn prop="eventType" label="事件类型" width="120">
        <template #default="{ row }">
          <YdBadge variant="outline">{{ row.eventType }}</YdBadge>
        </template>
      </YdTableColumn>
      <YdTableColumn prop="callbackUrl" label="回调 URL" min-width="200" show-overflow-tooltip />
      <YdTableColumn prop="httpMethod" label="方法" width="80" />
      <YdTableColumn prop="webhookStatus" label="状态" width="90">
        <template #default="{ row }">
          <YdBadge :variant="formatStatus(row.webhookStatus).type === 'success' ? 'default' : 'secondary'" size="sm">
            {{ formatStatus(row.webhookStatus).label }}
          </YdBadge>
        </template>
      </YdTableColumn>
      <YdTableColumn label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <YdButton size="sm" variant="link" @click="handleTest(row)">测试</YdButton>
          <YdButton size="sm" variant="link" @click="handleEdit(row)">编辑</YdButton>
          <YdButton size="sm" variant="link" @click="handleDelete(row)">删除</YdButton>
        </template>
      </YdTableColumn>
    </YdTable>

    <!-- 编辑弹窗 -->
    <YdDialog v-model:open="dialogVisible">
      <YdDialogContent class="sm:max-w-[560px]">
        <YdDialogHeader>
          <YdDialogTitle>{{ editingId ? '编辑订阅' : '新增订阅' }}</YdDialogTitle>
        </YdDialogHeader>
        <YdForm ref="formRef" :model="formData" :rules="formRules" label-width="100px">
          <YdFormItem label="订阅名称" prop="name">
            <YdInput v-model="formData.name" placeholder="请输入订阅名称" />
          </YdFormItem>
          <YdFormItem label="事件类型" prop="eventType">
            <YdSelectBase v-model="formData.eventType">
              <YdSelectTriggerBase placeholder="请选择事件类型" />
              <YdSelectContentBase>
                <YdSelectItemBase
                  v-for="item in eventTypeOptions"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </YdSelectItemBase>
              </YdSelectContentBase>
            </YdSelectBase>
          </YdFormItem>
          <YdFormItem label="回调 URL" prop="callbackUrl">
            <YdInput v-model="formData.callbackUrl" placeholder="https://example.com/webhook" />
          </YdFormItem>
          <YdFormItem label="请求方法" prop="httpMethod">
            <YdRadioGroup v-model="formData.httpMethod">
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <YdRadioGroupItem id="method-post" value="POST" />
                  <label for="method-post" class="cursor-pointer text-sm">POST</label>
                </div>
                <div class="flex items-center gap-2">
                  <YdRadioGroupItem id="method-put" value="PUT" />
                  <label for="method-put" class="cursor-pointer text-sm">PUT</label>
                </div>
              </div>
            </YdRadioGroup>
          </YdFormItem>
          <YdFormItem label="请求头">
            <YdTextarea v-model="formData.headers" placeholder="JSON 格式，可选" :rows="2" />
          </YdFormItem>
          <YdFormItem label="签名密钥">
            <YdInput v-model="formData.secret" placeholder="用于签名验证，可选" type="password" />
          </YdFormItem>
          <YdFormItem label="状态" prop="webhookStatus">
            <YdSwitch
              :checked="formData.webhookStatus === 'ACTIVE'"
              @update:checked="formData.webhookStatus = $event ? 'ACTIVE' : 'INACTIVE'"
            />
          </YdFormItem>
        </YdForm>
        <YdDialogFooter>
          <YdButton variant="outline" @click="dialogVisible = false">取消</YdButton>
          <YdButton @click="handleSubmit">确定</YdButton>
        </YdDialogFooter>
      </YdDialogContent>
    </YdDialog>
  </div>
</template>
