<!--
 * 快捷回复（表单组件）
 *
 * @path apps\workflow-web\src\views\quick-comment\quick-comment-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 快捷回复（表单组件）
 * <p>常用意见的创建/编辑表单，字段对应契约 FlowQuickCommentDTO（src/api/flowComment.ts，auto-generated）：
 * content/commentType/sortNum。提交走 createQuickComment / updateQuickComment，
 * 成功后 emit('success') 并关闭弹窗。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import { ElForm, ElFormItem, ElInput, ElInputNumber, ElMessage } from 'element-plus';
import { computed, reactive, ref } from 'vue';
import { createQuickComment, updateQuickComment } from '#/api/flowComment';
import type { FlowQuickCommentDTO, FlowQuickCommentVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();
const formRef = ref();
const isEdit = ref(false);

/** 表单状态（字段对应 FlowQuickCommentDTO） */
interface QuickCommentFormState {
  id: string;
  content: string;
  commentType: string;
  sortNum: number;
}

const formData = reactive<QuickCommentFormState>({
  id: '',
  content: '',
  commentType: '',
  sortNum: 0,
});

const rules = {
  content: [{ required: true, message: '请输入评语内容', trigger: 'blur' }],
};

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: FlowQuickCommentVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        id: data.record.id ?? '',
        content: data.record.content ?? '',
        commentType: data.record.commentType ?? '',
        sortNum: data.record.sortNum ?? 0,
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        id: '',
        content: '',
        commentType: '',
        sortNum: 0,
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
      const payload: FlowQuickCommentDTO = {
        id: formData.id || undefined,
        content: formData.content,
        commentType: formData.commentType || undefined,
        sortNum: formData.sortNum,
      };
      if (isEdit.value) {
        await updateQuickComment(payload);
        ElMessage.success('更新成功');
      } else {
        await createQuickComment(payload);
        ElMessage.success('创建成功');
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => (isEdit.value ? '编辑快捷评语' : '新增快捷评语'));
</script>

<template>
  <Modal :title="title">
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      label-position="right"
    >
      <ElFormItem label="评语内容" prop="content">
        <ElInput
          v-model="formData.content"
          type="textarea"
          :rows="3"
          placeholder="请输入评语内容"
        />
      </ElFormItem>
      <ElFormItem label="意见类型">
        <ElInput v-model="formData.commentType" placeholder="如 APPROVE/REJECT（可选）" />
      </ElFormItem>
      <ElFormItem label="排序">
        <ElInputNumber v-model="formData.sortNum" :min="0" :max="999" />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
