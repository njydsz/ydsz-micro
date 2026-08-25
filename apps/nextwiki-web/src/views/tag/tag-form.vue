<!--
 * 文件标签（表单组件）
 *
 * @path apps\nextwiki-web\src\views\tag\tag-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 文件标签（表单组件）
 * <p>新建标签表单，数据提交到后端契约 API tag#createTag（apps/nextwiki-web/src/api/tag.ts）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import { ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus';
import { reactive, ref } from 'vue';
import { createTag } from '#/api/tag';

const emit = defineEmits<{ success: [] }>();
const formRef = ref();
/** 新建标签表单数据 */
interface TagFormData {
  name: string;
  color: string;
}
const formData = reactive<TagFormData>({ name: '', color: '' });
const rules = {
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
};
const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    Object.assign(formData, { name: '', color: '' });
  },
  onConfirm: async () => {
    try { await formRef.value?.validate(); } catch { return; }
    modalApi.lock();
    try {
      await createTag({ ...formData });
      ElMessage.success('创建成功');
      emit('success');
      modalApi.close();
    } finally { modalApi.unlock(); }
  },
});
</script>
<template>
  <Modal title="新增标签">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="标签名称" prop="name">
        <ElInput v-model="formData.name" placeholder="请输入标签名称" />
      </ElFormItem>
      <ElFormItem label="标签颜色" prop="color">
        <ElInput v-model="formData.color" placeholder="如 #409eff（可选）" />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>