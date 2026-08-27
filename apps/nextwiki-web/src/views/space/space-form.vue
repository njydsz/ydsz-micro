<!--
 * 空间（表单组件）
 *
 * @path apps\nextwiki-web\src\views\space\space-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 空间（表单组件）
 * <p>新建空间表单，数据提交到后端契约 API space#createSpace（apps/nextwiki-web/src/api/space.ts）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import { ElForm, ElFormItem, ElInput, ElMessage, ElOption, ElSelect } from 'element-plus';
import { reactive, ref } from 'vue';
import { createSpace } from '#/api/space';

defineOptions({ name: 'SpaceForm' });

const emit = defineEmits<{ success: [] }>();
const formRef = ref();

/** 新建空间表单数据 */
interface SpaceFormData {
  name: string;
  description: string;
  visibility: 'PUBLIC' | 'PRIVATE';
}

const formData = reactive<SpaceFormData>({
  name: '',
  description: '',
  visibility: 'PRIVATE',
});

const rules = {
  name: [{ required: true, message: '请输入空间名称', trigger: 'blur' }],
};

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    Object.assign(formData, { name: '', description: '', visibility: 'PRIVATE' });
  },
  onConfirm: async () => {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    modalApi.lock();
    try {
      await createSpace({ ...formData });
      ElMessage.success('创建成功');
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal title="新建空间">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="空间名称" prop="name">
        <ElInput v-model="formData.name" placeholder="请输入空间名称" />
      </ElFormItem>
      <ElFormItem label="空间描述" prop="description">
        <ElInput v-model="formData.description" placeholder="请输入空间描述（选填）" type="textarea" :rows="3" />
      </ElFormItem>
      <ElFormItem label="可见性" prop="visibility">
        <ElSelect v-model="formData.visibility" placeholder="请选择可见性">
          <ElOption label="私有" value="PRIVATE" />
          <ElOption label="公开" value="PUBLIC" />
        </ElSelect>
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
