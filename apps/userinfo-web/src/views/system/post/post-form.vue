<!--
 * 岗位表单组件 — 支持新增/编辑岗位信息（岗位名称、编码、描述、排序、状态）
 *
 * @path apps\userinfo-web\src\views\system\post\post-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 岗位（表单组件）
 * <p>岗位的创建/编辑弹窗，字段对应契约 PostDTO（src/api/post.ts，auto-generated）：
 * 岗位名称、岗位编码、描述、排序、状态。提交走 create/update，
 * 成功后 emit('success') 并关闭弹窗。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';

import {
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElRadio,
  ElRadioGroup,
} from 'element-plus';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { createLogger } from '@YDSZ-core/shared/utils';

import { create, update } from '#/api/post';
import type { PostDTO, PostVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();

const logger = createLogger('userinfo-post');
const { t } = useI18n();

const formRef = ref();
const isEdit = ref(false);

/** 表单状态（字段对应 PostDTO） */
interface PostFormState {
  id: string;
  postName: string;
  postCode: string;
  description: string;
  sortOrder: number;
  status: string;
}

const formData = reactive<PostFormState>({
  id: '',
  postName: '',
  postCode: '',
  description: '',
  sortOrder: 0,
  status: '1',
});

const rules = {
  postName: [{ required: true, message: t('post.postNamePlaceholder'), trigger: 'blur' }],
  postCode: [{ required: true, message: t('post.postCodePlaceholder'), trigger: 'blur' }],
};

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: PostVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        id: data.record.id ?? '',
        postName: data.record.postName ?? '',
        postCode: data.record.postCode ?? '',
        description: data.record.description ?? '',
        sortOrder: data.record.sortOrder ?? 0,
        status: data.record.status ?? '1',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        id: '',
        postName: '',
        postCode: '',
        description: '',
        sortOrder: 0,
        status: '1',
      });
    }
  },
  onConfirm: async () => {
    try {
      await formRef.value?.validate();
    } catch (error) {
      logger.warn('表单校验失败: {}', error);
      return;
    }
    modalApi.lock();
    try {
      const payload: PostDTO = {
        postName: formData.postName,
        postCode: formData.postCode,
        description: formData.description,
        sortOrder: formData.sortOrder,
        status: formData.status,
      };
      if (isEdit.value) {
        await update({ ...payload, id: formData.id || undefined });
        ElMessage.success(t('page.updateSuccess'));
      } else {
        await create(payload);
        ElMessage.success(t('page.createSuccess'));
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => (isEdit.value ? `${t('page.edit')}${t('page.postBase')}` : `${t('page.create')}${t('page.postBase')}`));
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
      <ElFormItem :label="t('page.postName')" prop="postName">
        <ElInput v-model="formData.postName" :placeholder="t('post.postNamePlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="t('page.postCode')" prop="postCode">
        <ElInput v-model="formData.postCode" :placeholder="t('post.postCodePlaceholder')" :disabled="isEdit" />
      </ElFormItem>
      <ElFormItem :label="t('page.description')">
        <ElInput
          v-model="formData.description"
          type="textarea"
          :rows="2"
          :placeholder="t('page.descriptionPlaceholder')"
        />
      </ElFormItem>
      <ElFormItem :label="t('page.sortOrder')">
        <ElInputNumber v-model="formData.sortOrder" :min="0" :max="999" />
      </ElFormItem>
      <ElFormItem :label="t('page.status')">
        <ElRadioGroup v-model="formData.status">
          <ElRadio value="1">{{ t('page.enabled') }}</ElRadio>
          <ElRadio value="0">{{ t('page.disabled') }}</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
    </ElForm>
  </Modal>
</template>