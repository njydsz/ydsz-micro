<!--
 * DAG 工作流 新增/编辑 弹窗
 *
 * @path apps/agent-web/src/views/dag-workflow/dag-workflow-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * DAG 工作流表单弹窗
 * <p>支持 mode='create'（新建）与 mode='edit'（回填编辑）两种模式。
 */
import { YdButton, YdForm, YdFormItem, YdInput, YdTextarea } from '@ydsz-core/ydsz-ui';
import { useYdModal } from '@ydsz/common-ui';
import { reactive, ref } from 'vue';
import { saveDagWorkflow } from '#/api/dag-workflow';
import type { DagWorkflow } from '#/api/models';

defineOptions({ name: 'DagWorkflowForm' });

/** 表单提交成功后触发，通知父级列表页刷新数据 */
const emit = defineEmits<{ success: [] }>();

type FormMode = 'create' | 'edit';

interface FormData {
  workflowCode: string;
  workflowName: string;
  description: string;
  dslContent: string;
  category: string;
  layoutJson: string;
}

const formRef = ref<InstanceType<typeof YdForm> | null>(null);
const submitting = ref(false);

const form = reactive<FormData>({
  workflowCode: '',
  workflowName: '',
  description: '',
  dslContent: '',
  category: '',
  layoutJson: '',
});

const [Modal, modalApi] = useYdModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ mode: FormMode; record?: DagWorkflow }>();
    if (data?.mode === 'edit' && data.record) {
      const record = data.record;
      Object.assign(form, {
        workflowCode: record.workflowCode ?? '',
        workflowName: record.name ?? '',
        description: record.description ?? '',
        dslContent: record.dsl ?? '',
        category: record.category ?? '',
        layoutJson: '',
      });
    }
  },
});

async function validateForm(): Promise<boolean> {
  if (!form.workflowName.trim()) {
    showToast.warning('请输入工作流名称');
    return false;
  }
  if (!form.dslContent.trim()) {
    showToast.warning('请输入 DSL 内容');
    return false;
  }
  return true;
}

async function handleSubmit(): Promise<void> {
  if (!await validateForm()) return;
  submitting.value = true;
  try {
    await saveDagWorkflow({
      workflowCode: form.workflowCode || undefined,
      workflowName: form.workflowName,
      description: form.description || undefined,
      dslContent: form.dslContent,
      layoutJson: form.layoutJson || undefined,
      category: form.category || undefined,
    });
    showToast.success(form.workflowCode ? '更新成功' : '创建成功');
    emit('success');
    modalApi.close();
  } catch {
    // error handled by interceptor
  } finally {
    submitting.value = false;
  }
}

function handleCancel(): void {
  modalApi.close();
}
</script>

<template>
  <Modal
    :title="form.workflowCode ? '编辑工作流' : '新增工作流'"
    width="640px"
    @close="handleCancel"
  >
    <YdForm ref="formRef" :model="form" label-width="100px">
      <YdFormItem label="工作流编码">
        <YdInput
          v-model="form.workflowCode"
          :disabled="!!form.workflowCode"
          placeholder="留空则自动生成"
        />
      </YdFormItem>
      <YdFormItem label="工作流名称" required>
        <YdInput
          v-model="form.workflowName"
          placeholder="请输入工作流名称"
        />
      </YdFormItem>
      <YdFormItem label="分类">
        <YdInput
          v-model="form.category"
          placeholder="如：数据处理、审批流、对话编排"
        />
      </YdFormItem>
      <YdFormItem label="描述">
        <YdTextarea
          v-model="form.description"
          :rows="2"
          placeholder="工作流用途描述（可选）"
        />
      </YdFormItem>
      <YdFormItem label="YAML DSL" required>
        <YdTextarea
          v-model="form.dslContent"
          :rows="12"
          placeholder="请输入 YAML 格式的 DSL 编排脚本"
          class="font-mono text-sm"
        />
      </YdFormItem>
      <YdFormItem label="布局 JSON">
        <YdTextarea
          v-model="form.layoutJson"
          :rows="3"
          placeholder="可视化布局信息（可选，由设计器自动维护）"
          class="font-mono text-xs"
        />
      </YdFormItem>
    </YdForm>
    <template #footer>
      <div class="flex justify-end gap-2">
        <YdButton variant="secondary" @click="handleCancel">取消</YdButton>
        <YdButton :loading="submitting" @click="handleSubmit">保存</YdButton>
      </div>
    </template>
  </Modal>
</template>
