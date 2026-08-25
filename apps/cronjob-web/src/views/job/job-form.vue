<!--
 * 定时任务（表单组件）
 *
 * @path apps\cronjob-web\src\views\job\job-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 定时任务（表单组件）
 * <p>定时任务的创建/编辑弹窗，字段对应契约 JobPostDTO/JobPutDTO（src/api/job.ts，auto-generated）：
 * 任务名称、标识、分组、执行器、Cron 表达式（支持 validateCron 校验）、调度类型、备注。
 * 提交走 create/update，成功后 emit('success') 并关闭弹窗。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import { ElButton, ElForm, ElFormItem, ElInput, ElMessage, ElSelect, ElOption } from 'element-plus';
import { computed, reactive, ref } from 'vue';

import { create, update, validateCron } from '#/api/job';
import type { JobVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();

const formRef = ref();
const isEdit = ref(false);

/** 表单状态（字段对应 JobPostDTO / JobPutDTO） */
interface JobFormState {
  id: string;
  jobName: string;
  jobKey: string;
  jobGroup: string;
  handler: string;
  cronExpression: string;
  scheduleType: string;
  remark: string;
}

const formData = reactive<JobFormState>({
  id: '',
  jobName: '',
  jobKey: '',
  jobGroup: '',
  handler: '',
  cronExpression: '',
  scheduleType: 'CRON',
  remark: '',
});

const rules = {
  jobName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  cronExpression: [{ required: true, message: '请输入Cron表达式', trigger: 'blur' }],
};

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: JobVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        id: data.record.id ?? '',
        jobName: data.record.jobName ?? '',
        jobKey: data.record.jobKey ?? '',
        jobGroup: data.record.jobGroup ?? '',
        handler: data.record.handler ?? '',
        cronExpression: data.record.cronExpression ?? '',
        scheduleType: data.record.scheduleType ?? 'CRON',
        remark: data.record.jobRemark ?? '',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        id: '',
        jobName: '',
        jobKey: '',
        jobGroup: '',
        handler: '',
        cronExpression: '',
        scheduleType: 'CRON',
        remark: '',
      });
    }
  },
  onConfirm: async () => {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    modalApi.lock();
    try {
      if (isEdit.value) {
        await update({
          id: formData.id || undefined,
          jobName: formData.jobName,
          jobKey: formData.jobKey,
          jobGroup: formData.jobGroup,
          handler: formData.handler,
          cronExpression: formData.cronExpression,
          scheduleType: formData.scheduleType,
          remark: formData.remark,
        });
        ElMessage.success('更新成功');
      } else {
        await create({
          jobName: formData.jobName,
          jobKey: formData.jobKey,
          jobGroup: formData.jobGroup,
          handler: formData.handler,
          cronExpression: formData.cronExpression,
          scheduleType: formData.scheduleType,
          remark: formData.remark,
        });
        ElMessage.success('创建成功');
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => (isEdit.value ? '编辑定时任务' : '新增定时任务'));

/** 校验 Cron 表达式（validateCron 返回 unknown，仅做成功提示与失败提示） */
async function handleValidateCron() {
  if (!formData.cronExpression) {
    ElMessage.warning('请先输入Cron表达式');
    return;
  }
  try {
    await validateCron({ expr: formData.cronExpression });
    ElMessage.success('Cron 表达式校验通过');
  } catch {
    ElMessage.error('Cron 表达式无效');
  }
}
</script>

<template>
  <Modal :title="title">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="任务名称" prop="jobName">
        <ElInput v-model="formData.jobName" placeholder="请输入任务名称" />
      </ElFormItem>
      <ElFormItem label="任务标识" prop="jobKey">
        <ElInput v-model="formData.jobKey" placeholder="请输入任务标识" />
      </ElFormItem>
      <ElFormItem label="任务分组" prop="jobGroup">
        <ElInput v-model="formData.jobGroup" placeholder="请输入任务分组" />
      </ElFormItem>
      <ElFormItem label="执行器" prop="handler">
        <ElInput v-model="formData.handler" placeholder="请输入执行器 Handler" />
      </ElFormItem>
      <ElFormItem label="Cron表达式" prop="cronExpression">
        <div class="flex w-full gap-2">
          <ElInput v-model="formData.cronExpression" placeholder="请输入Cron表达式" />
          <ElButton @click="handleValidateCron">校验</ElButton>
        </div>
      </ElFormItem>
      <ElFormItem label="调度类型" prop="scheduleType">
        <ElSelect v-model="formData.scheduleType" placeholder="请选择调度类型">
          <ElOption label="Cron" value="CRON" />
          <ElOption label="固定速率" value="FIXED_RATE" />
          <ElOption label="固定延迟" value="FIXED_DELAY" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="备注" prop="remark">
        <ElInput v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>