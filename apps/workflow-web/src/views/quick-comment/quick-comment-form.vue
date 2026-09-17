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
import { useYdModal } from '@ydsz/common-ui';
// TODO: ElForm / YdFormItem / ElInputNumber 暂不迁移，保留 element-plus 导入
import { ElForm, ElFormItem, ElInputNumber } from 'element-plus';
import { YdInput, YdTextarea } from '@ydsz-core/ydsz-ui';
import { computed, reactive, ref } from 'vue';
import { createQuickComment, updateQuickComment } from '#/api/flowComment';
import type { FlowQuickCommentDTO, FlowQuickCommentVO } from '#/api/models';
import { createLogger } from '@ydsz-core/shared/utils';
import { useI18n } from 'vue-i18n';

const logger = createLogger('workflow-quick-comment');
const { t } = useI18n();

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
  content: [{ required: true, message: t('quickComment.content.required'), trigger: 'blur' }],
};

const [Modal, modalApi] = useYdModal({
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
    } catch (error) {
      logger.warn('快捷评语表单验证失败', error);
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
        showToast.success(t('quickComment.update.success'));
      } else {
        await createQuickComment(payload);
        showToast.success(t('quickComment.create.success'));
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => (isEdit.value ? t('quickComment.edit.title') : t('quickComment.add.title')));
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
      <ElFormItem :label="t('quickComment.content.label')" prop="content">
        <YdTextarea
          v-model="formData.content"
          :placeholder="t('quickComment.content.placeholder')"
        />
      </ElFormItem>
      <ElFormItem :label="t('quickComment.type.label')">
        <YdInput v-model="formData.commentType" :placeholder="t('quickComment.type.placeholder')" />
      </ElFormItem>
      <ElFormItem :label="t('quickComment.sort.label')">
        <ElInputNumber v-model="formData.sortNum" :min="0" :max="999" />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
