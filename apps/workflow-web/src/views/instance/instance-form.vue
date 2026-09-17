<!--
 * 流程实例（发起流程表单组件）
 *
 * @path apps\workflow-web\src\views\instance\instance-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 流程实例（发起流程表单组件）
 * <p>「发起流程」弹窗，字段对应契约 FlowStartProcessDTO（src/api/flowInstance.ts，auto-generated）：
 * flowCode/title/businessType/businessNo/initiatorName 等，提交走 startProcess。
 * 新增「保存草稿」按钮，调用 saveDraft 接口暂存待审。
 * 成功后 emit('success') 并关闭弹窗。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYdModal } from '@ydsz/common-ui';
import { YdForm, YdFormItem } from '@ydsz-core/ydsz-ui';
import { YdButtonBase, YdInput } from '@ydsz-core/ydsz-ui';
import { reactive, ref } from 'vue';
import { saveDraft, startProcess } from '#/api/flowInstance';
import type { FlowSaveDraftDTO, FlowStartProcessDTO } from '#/api/models';
import { $t } from '#/locales';
import { createLogger } from '@ydsz-core/shared/utils';

const logger = createLogger('workflow-instance');
const emit = defineEmits<{ success: [] }>();
const formRef = ref();

/** 发起流程表单状态（字段对应 FlowStartProcessDTO） */
interface StartProcessState {
  flowCode: string;
  title: string;
  businessType: string;
  businessId: string;
  businessNo: string;
  initiatorName: string;
}

const formData = reactive<StartProcessState>({
  flowCode: '',
  title: '',
  businessType: '',
  businessId: '',
  businessNo: '',
  initiatorName: '',
});

const rules = {
  flowCode: [{ required: true, message: $t('wf.inputFlowCode'), trigger: 'blur' }],
};

/** 草稿保存中状态 */
const savingDraft = ref(false);

const [Modal, modalApi] = useYdModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    Object.assign(formData, {
      flowCode: '',
      title: '',
      businessType: '',
      businessId: '',
      businessNo: '',
      initiatorName: '',
    });
  },
  onConfirm: async () => {
    try {
      await formRef.value?.validate();
    } catch (error) {
      logger.warn('发起流程表单验证失败', error);
      return;
    }
    modalApi.lock();
    try {
      const payload: FlowStartProcessDTO = {
        flowCode: formData.flowCode,
        title: formData.title || undefined,
        businessType: formData.businessType || undefined,
        businessId: formData.businessId || undefined,
        businessNo: formData.businessNo || undefined,
        initiatorName: formData.initiatorName || undefined,
      };
      await startProcess(payload);
      showToast.success($t('wf.startSuccess'));
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

/**
 * 保存草稿
 *
 * <p>借鉴 Flowlong「暂存待审」概念，用户可保存已填写的表单数据为草稿，
 * 后续在我的发起列表修改后重新提交。草稿不触发流程流转。
 */
async function handleSaveDraft(): Promise<void> {
  if (!formData.flowCode) {
    showToast.warning($t('wf.inputFlowCode'));
    return;
  }
  savingDraft.value = true;
  try {
    const payload: FlowSaveDraftDTO = {
      flowCode: formData.flowCode,
      title: formData.title || undefined,
      businessType: formData.businessType || undefined,
      businessId: formData.businessId || undefined,
      businessNo: formData.businessNo || undefined,
      initiatorName: formData.initiatorName || undefined,
      draftData: {
        title: formData.title,
        businessNo: formData.businessNo,
        initiatorName: formData.initiatorName,
      },
    };
    const draftId = await saveDraft(payload);
    showToast.success(`${$t('wf.draftSuccess')}（ID: ${draftId.slice(0, 8)}...）`);
    emit('success');
    modalApi.close();
  } finally {
    savingDraft.value = false;
  }
}
</script>

<template>
  <Modal :title="$t('wf.startFlow')">
    <YdForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="110px"
      label-position="right"
    >
      <YdFormItem :label="$t('wf.flowCode')" prop="flowCode">
        <YdInput v-model="formData.flowCode" :placeholder="$t('wf.inputFlowCode')" />
      </YdFormItem>
      <YdFormItem :label="$t('wf.title')">
        <YdInput v-model="formData.title" :placeholder="$t('wf.titlePlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="$t('wf.businessType')">
        <YdInput v-model="formData.businessType" :placeholder="$t('wf.businessTypePlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="$t('wf.businessId')">
        <YdInput v-model="formData.businessId" :placeholder="$t('wf.businessIdPlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="$t('wf.businessNo')">
        <YdInput v-model="formData.businessNo" :placeholder="$t('wf.businessNoPlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="$t('wf.initiator')">
        <YdInput v-model="formData.initiatorName" :placeholder="$t('wf.initiatorPlaceholder')" />
      </YdFormItem>
    </YdForm>
    <!-- 草稿保存按钮（置于弹窗底部操作区左侧） -->
    <template #footer>
      <YdButtonBase :loading="savingDraft" variant="secondary" @click="handleSaveDraft"> {{ $t('wf.saveDraft') }} </YdButtonBase>
    </template>
  </Modal>
</template>
