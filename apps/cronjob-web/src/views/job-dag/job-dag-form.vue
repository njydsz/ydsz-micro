<!--
 * 任务 DAG（表单组件）
 *
 * @path apps\cronjob-web\src\views\jobDag\jobDag-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 任务 DAG（表单组件）
 * <p>DAG 的创建/编辑弹窗，字段对应契约 JobDagPostDTO/JobDagPutDTO（src/api/jobDag.ts，auto-generated）：
 * 标识、名称、DSL 定义（支持 validateDag 校验）、触发类型、Cron、最大并发、失败策略、描述。
 * 提交走 createDag/updateDag，成功后 emit('success') 并关闭弹窗。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import { ElButton, ElForm, ElFormItem, ElInput, ElInputNumber, ElMessage, ElSelect, ElOption } from 'element-plus';
import { computed, reactive, ref } from 'vue';

import { createDag, updateDag, validateDag } from '#/api/jobDag';
import type { JobDagVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();

const formRef = ref();
const isEdit = ref(false);

/** 表单状态（字段对应 JobDagPostDTO / JobDagPutDTO） */
interface JobDagFormState {
  dagKey: string;
  dagName: string;
  dagDefinition: string;
  triggerType: string;
  cronExpression: string;
  maxConcurrentInstances: number;
  failStrategy: string;
  description: string;
}

const formData = reactive<JobDagFormState>({
  dagKey: '',
  dagName: '',
  dagDefinition: '',
  triggerType: 'MANUAL',
  cronExpression: '',
  maxConcurrentInstances: 1,
  failStrategy: 'FAIL_FAST',
  description: '',
});

const rules = {
  dagKey: [{ required: true, message: '请输入DAG标识', trigger: 'blur' }],
  dagName: [{ required: true, message: '请输入DAG名称', trigger: 'blur' }],
  dagDefinition: [{ required: true, message: '请输入DSL定义', trigger: 'blur' }],
};

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: JobDagVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        dagKey: data.record.dagKey ?? '',
        dagName: data.record.dagName ?? '',
        dagDefinition: data.record.dagDefinition ?? '',
        triggerType: data.record.triggerType ?? 'MANUAL',
        cronExpression: data.record.cronExpression ?? '',
        maxConcurrentInstances: data.record.maxConcurrentInstances ?? 1,
        failStrategy: data.record.failStrategy ?? 'FAIL_FAST',
        description: data.record.description ?? '',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        dagKey: '',
        dagName: '',
        dagDefinition: '',
        triggerType: 'MANUAL',
        cronExpression: '',
        maxConcurrentInstances: 1,
        failStrategy: 'FAIL_FAST',
        description: '',
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
      const payload = {
        dagKey: formData.dagKey,
        dagName: formData.dagName,
        dagDefinition: formData.dagDefinition,
        triggerType: formData.triggerType,
        cronExpression: formData.cronExpression,
        maxConcurrentInstances: formData.maxConcurrentInstances,
        failStrategy: formData.failStrategy,
        description: formData.description,
      };
      if (isEdit.value) {
        const record = modalApi.getData<{ record?: JobDagVO }>().record;
        await updateDag({ dagId: record?.id ?? '' }, payload);
        ElMessage.success('更新成功');
      } else {
        await createDag(payload);
        ElMessage.success('创建成功');
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => (isEdit.value ? '编辑DAG' : '新增DAG'));

/** 校验 DSL 定义（validateDag 返回 boolean，仅做成功/失败提示） */
async function handleValidateDag() {
  if (!formData.dagDefinition) {
    ElMessage.warning('请先输入DSL定义');
    return;
  }
  try {
    const ok = await validateDag(formData.dagDefinition);
    if (ok) {
      ElMessage.success('DSL 校验通过');
    } else {
      ElMessage.error('DSL 校验失败');
    }
  } catch {
    ElMessage.error('DSL 校验失败');
  }
}
</script>

<template>
  <Modal :title="title" width="640px">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="DAG标识" prop="dagKey">
        <ElInput v-model="formData.dagKey" placeholder="请输入DAG标识" />
      </ElFormItem>
      <ElFormItem label="DAG名称" prop="dagName">
        <ElInput v-model="formData.dagName" placeholder="请输入DAG名称" />
      </ElFormItem>
      <ElFormItem label="DSL定义" prop="dagDefinition">
        <div class="flex w-full gap-2">
          <ElInput v-model="formData.dagDefinition" type="textarea" :rows="6" placeholder="请输入DAG DSL定义" />
          <ElButton class="shrink-0" @click="handleValidateDag">校验</ElButton>
        </div>
      </ElFormItem>
      <ElFormItem label="触发类型" prop="triggerType">
        <ElSelect v-model="formData.triggerType" placeholder="请选择触发类型">
          <ElOption label="手动" value="MANUAL" />
          <ElOption label="Cron" value="CRON" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem v-if="formData.triggerType === 'CRON'" label="Cron表达式" prop="cronExpression">
        <ElInput v-model="formData.cronExpression" placeholder="请输入Cron表达式" />
      </ElFormItem>
      <ElFormItem label="最大并发数" prop="maxConcurrentInstances">
        <ElInputNumber v-model="formData.maxConcurrentInstances" :min="1" :max="100" />
      </ElFormItem>
      <ElFormItem label="失败策略" prop="failStrategy">
        <ElSelect v-model="formData.failStrategy" placeholder="请选择失败策略">
          <ElOption label="快速失败" value="FAIL_FAST" />
          <ElOption label="继续执行" value="CONTINUE" />
          <ElOption label="补偿处理" value="COMPENSATE" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="描述" prop="description">
        <ElInput v-model="formData.description" type="textarea" :rows="2" placeholder="请输入描述" />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>