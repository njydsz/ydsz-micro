<!--
 * RAG 文档导入（弹窗组件）
 *
 * @path apps/agent-web/src/views/rag/rag-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * RAG 文档导入（弹窗组件）
 * <p>向知识库导入单个文档，字段对齐后端 DocumentIngestDTO（documentId/content/documentTitle/source），
 * 提交调用 ingest()。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import { ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus';
import { reactive, ref } from 'vue';
import { ingest } from '#/api/rag';
import type { DocumentIngestDTO } from '#/api/models';
/** 导入成功后触发，通知父级刷新统计 */
const emit = defineEmits<{ success: [] }>();
const formRef = ref();
const formData = reactive<DocumentIngestDTO>({
  documentId: '',
  content: '',
  documentTitle: '',
  source: '',
});
const rules = {
  content: [{ required: true, message: '请输入文档内容', trigger: 'blur' }],
};
const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen) => {
    if (!isOpen) return;
    Object.assign(formData, { documentId: '', content: '', documentTitle: '', source: '' });
  },
  onConfirm: async () => {
    try { await formRef.value?.validate(); } catch { return; }
    modalApi.lock();
    try {
      await ingest({ ...formData });
      ElMessage.success('导入成功');
      emit('success');
      modalApi.close();
    } finally { modalApi.unlock(); }
  },
});
</script>
<template>
  <Modal title="导入文档">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="文档ID" prop="documentId">
        <ElInput v-model="formData.documentId" placeholder="请输入文档ID（可选）" />
      </ElFormItem>
      <ElFormItem label="文档标题">
        <ElInput v-model="formData.documentTitle" placeholder="请输入文档标题（可选）" />
      </ElFormItem>
      <ElFormItem label="来源">
        <ElInput v-model="formData.source" placeholder="请输入来源（可选）" />
      </ElFormItem>
      <ElFormItem label="文档内容" prop="content">
        <ElInput v-model="formData.content" type="textarea" :rows="6" placeholder="请输入文档内容" />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>