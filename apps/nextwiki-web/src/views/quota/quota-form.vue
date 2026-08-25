<!--
 * 存储配额（表单组件）
 *
 * @path apps\nextwiki-web\src\views\quota\quota-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 存储配额（表单组件）
 * <p>调整配额表单，数据提交到后端契约 API quota#setQuota（apps/nextwiki-web/src/api/quota.ts）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import { ElForm, ElFormItem, ElInput, ElInputNumber, ElMessage } from 'element-plus';
import { reactive, ref } from 'vue';
import { setQuota } from '#/api/quota';

const emit = defineEmits<{ success: [] }>();
const formRef = ref();
/** 调整配额表单数据 */
interface QuotaFormData {
  scopeType: string;
  scopeId: string;
  quotaLimit: number;
  fileCountLimit: number;
}
const formData = reactive<QuotaFormData>({
  scopeType: '',
  scopeId: '',
  quotaLimit: 0,
  fileCountLimit: 0,
});
const rules = {
  quotaLimit: [{ required: true, message: '请输入配额上限（字节）', trigger: 'blur' }],
};
const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    Object.assign(formData, { scopeType: '', scopeId: '', quotaLimit: 0, fileCountLimit: 0 });
  },
  onConfirm: async () => {
    try { await formRef.value?.validate(); } catch { return; }
    modalApi.lock();
    try {
      await setQuota({ ...formData });
      ElMessage.success('设置成功');
      emit('success');
      modalApi.close();
    } finally { modalApi.unlock(); }
  },
});
</script>
<template>
  <Modal title="调整配额">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="110px" label-position="right">
      <ElFormItem label="存储范围类型" prop="scopeType">
        <ElInput v-model="formData.scopeType" placeholder="如 USER / SPACE，留空表示全局（可选）" />
      </ElFormItem>
      <ElFormItem label="存储范围ID" prop="scopeId">
        <ElInput v-model="formData.scopeId" placeholder="存储范围ID（可选）" />
      </ElFormItem>
      <ElFormItem label="配额上限(字节)" prop="quotaLimit">
        <ElInputNumber v-model="formData.quotaLimit" :min="0" :max="Number.MAX_SAFE_INTEGER" style="width: 100%" />
      </ElFormItem>
      <ElFormItem label="文件数上限" prop="fileCountLimit">
        <ElInputNumber v-model="formData.fileCountLimit" :min="0" :max="Number.MAX_SAFE_INTEGER" style="width: 100%" />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>