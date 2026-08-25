<!--
 * 文件夹（表单组件）
 *
 * @path apps\nextwiki-web\src\views\file\file-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 文件夹（表单组件）
 * <p>新建文件夹表单，数据提交到后端契约 API file#createFolder（apps/nextwiki-web/src/api/file.ts）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import { ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus';
import { reactive, ref } from 'vue';
import { createFolder } from '#/api/file';

const emit = defineEmits<{ success: [] }>();
const formRef = ref();
/** 新建文件夹表单数据 */
interface FolderFormData {
  name: string;
  parentId: string;
}
const formData = reactive<FolderFormData>({ name: '', parentId: '' });
const rules = {
  name: [{ required: true, message: '请输入文件夹名称', trigger: 'blur' }],
};
const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    Object.assign(formData, { name: '', parentId: '' });
  },
  onConfirm: async () => {
    try { await formRef.value?.validate(); } catch { return; }
    modalApi.lock();
    try {
      await createFolder({ ...formData });
      ElMessage.success('创建成功');
      emit('success');
      modalApi.close();
    } finally { modalApi.unlock(); }
  },
});
</script>
<template>
  <Modal title="新建文件夹">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="文件夹名称" prop="name">
        <ElInput v-model="formData.name" placeholder="请输入文件夹名称" />
      </ElFormItem>
      <ElFormItem label="父目录ID" prop="parentId">
        <ElInput v-model="formData.parentId" placeholder="请输入父目录ID（留空表示根目录）" />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>