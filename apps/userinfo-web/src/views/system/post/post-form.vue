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

import { create, update } from '#/api/post';
import type { PostDTO, PostVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();

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
  postName: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
  postCode: [{ required: true, message: '请输入岗位编码', trigger: 'blur' }],
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
    } catch {
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
        ElMessage.success('更新成功');
      } else {
        await create(payload);
        ElMessage.success('创建成功');
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => (isEdit.value ? '编辑岗位' : '新增岗位'));
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
      <ElFormItem label="岗位名称" prop="postName">
        <ElInput v-model="formData.postName" placeholder="请输入岗位名称" />
      </ElFormItem>
      <ElFormItem label="岗位编码" prop="postCode">
        <ElInput v-model="formData.postCode" placeholder="请输入岗位编码" :disabled="isEdit" />
      </ElFormItem>
      <ElFormItem label="描述">
        <ElInput
          v-model="formData.description"
          type="textarea"
          :rows="2"
          placeholder="请输入描述"
        />
      </ElFormItem>
      <ElFormItem label="排序">
        <ElInputNumber v-model="formData.sortOrder" :min="0" :max="999" />
      </ElFormItem>
      <ElFormItem label="状态">
        <ElRadioGroup v-model="formData.status">
          <ElRadio value="1">启用</ElRadio>
          <ElRadio value="0">禁用</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
    </ElForm>
  </Modal>
</template>