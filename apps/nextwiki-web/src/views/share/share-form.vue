<!--
 * 文件分享（表单组件）
 *
 * @path apps\nextwiki-web\src\views\share\share-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 文件分享（表单组件）
 * <p>新建分享表单，数据提交到后端契约 API share#createShare（apps/nextwiki-web/src/api/share.ts）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import { ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus';
import { reactive, ref } from 'vue';
import { createShare } from '#/api/share';

const emit = defineEmits<{ success: [] }>();
const formRef = ref();
/** 新建分享表单数据 */
interface ShareFormData {
  title: string;
  fileNodeId: string;
  shareType: string;
  expireTime: string;
}
const formData = reactive<ShareFormData>({
  title: '',
  fileNodeId: '',
  shareType: 'LINK',
  expireTime: '',
});
const rules = {
  fileNodeId: [{ required: true, message: '请输入文件节点ID', trigger: 'blur' }],
};
const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    Object.assign(formData, { title: '', fileNodeId: '', shareType: 'LINK', expireTime: '' });
  },
  onConfirm: async () => {
    try { await formRef.value?.validate(); } catch { return; }
    modalApi.lock();
    try {
      await createShare({ ...formData });
      ElMessage.success('创建成功');
      emit('success');
      modalApi.close();
    } finally { modalApi.unlock(); }
  },
});
</script>
<template>
  <Modal title="新建分享">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="分享标题" prop="title">
        <ElInput v-model="formData.title" placeholder="请输入分享标题（可选）" />
      </ElFormItem>
      <ElFormItem label="文件节点ID" prop="fileNodeId">
        <ElInput v-model="formData.fileNodeId" placeholder="请输入文件节点ID" />
      </ElFormItem>
      <ElFormItem label="分享类型" prop="shareType">
        <ElInput v-model="formData.shareType" placeholder="如 LINK / PASSWORD" />
      </ElFormItem>
      <ElFormItem label="过期时间" prop="expireTime">
        <ElInput v-model="formData.expireTime" placeholder="格式 yyyy-MM-dd HH:mm:ss，留空永久有效" />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>