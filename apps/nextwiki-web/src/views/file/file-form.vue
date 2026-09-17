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
import { useYdModal } from '@ydsz/common-ui';
import { createLogger } from '@ydsz-core/shared/utils';
import { useI18n } from 'vue-i18n';
import { YdForm, YdFormItem } from '@ydsz-core/ydsz-ui';
import { YdInput } from '@ydsz-core/ydsz-ui';
const logger = createLogger('nextwiki-file');
const { t } = useI18n();
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
  name: [{ required: true, message: () => t('folderNamePlaceholder'), trigger: 'blur' }],
};
const [Modal, modalApi] = useYdModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    Object.assign(formData, { name: '', parentId: '' });
  },
  onConfirm: async () => {
    try { await formRef.value?.validate(); } catch (error) { logger.debug("表单校验未通过: {}", error); return; }
    modalApi.lock();
    try {
      await createFolder({ ...formData });
      showToast.success('创建成功');
      emit('success');
      modalApi.close();
    } finally { modalApi.unlock(); }
  },
});
</script>
<template>
  <Modal :title="t('newFolderTitle')">
    <YdForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <YdFormItem :label="t('folderName')" prop="name">
        <YdInput v-model="formData.name" :placeholder="t('folderNamePlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('parentId')" prop="parentId">
        <YdInput v-model="formData.parentId" :placeholder="t('parentIdPlaceholder')" />
      </YdFormItem>
    </YdForm>
  </Modal>
</template>