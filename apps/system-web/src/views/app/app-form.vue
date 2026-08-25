<!--
 * 应用表单组件 — 支持新增/编辑应用注册信息
 *
 * @path apps\system-web\src\views\app\app-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 应用（表单组件）
 * <p>消费后端契约 AppInfoController（src/api/appInfo.ts，auto-generated）的应用创建/编辑表单，
 * 字段对应契约 AppInfoDTO，提交走 save/update。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import { ElForm, ElFormItem, ElInput, ElMessage, ElRadio, ElRadioGroup } from 'element-plus';
import { computed, reactive, ref } from 'vue';

import { save, update } from '#/api/appInfo';
import type { AppInfoVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();

const formRef = ref();
const isEdit = ref(false);

/** 表单状态（字段对齐契约 AppInfoDTO，status 为字符串 '1'/'0'） */
interface AppFormState {
  id?: string;
  appCode: string;
  appName: string;
  appKey: string;
  redirectUrl: string;
  scopes: string;
  boundIps: string;
  description: string;
  status: string;
}

const formData = reactive<AppFormState>({
  id: '',
  appCode: '',
  appName: '',
  appKey: '',
  redirectUrl: '',
  scopes: '',
  boundIps: '',
  description: '',
  status: '1',
});

const rules = {
  appCode: [{ required: true, message: '请输入应用编码', trigger: 'blur' }],
  appName: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
};

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: AppInfoVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        id: data.record.id ?? '',
        appCode: data.record.appCode ?? '',
        appName: data.record.appName ?? '',
        appKey: data.record.appKey ?? '',
        redirectUrl: data.record.redirectUrl ?? '',
        scopes: data.record.scopes ?? '',
        boundIps: data.record.boundIps ?? '',
        description: data.record.description ?? '',
        status: data.record.status ?? '1',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        id: '',
        appCode: '',
        appName: '',
        appKey: '',
        redirectUrl: '',
        scopes: '',
        boundIps: '',
        description: '',
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
      if (isEdit.value) {
        await update(formData);
        ElMessage.success('更新成功');
      } else {
        await save(formData);
        ElMessage.success('创建成功');
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => (isEdit.value ? '编辑应用' : '新增应用'));
</script>

<template>
  <Modal :title="title">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="应用编码" prop="appCode">
        <ElInput v-model="formData.appCode" placeholder="请输入应用编码" :disabled="isEdit" />
      </ElFormItem>
      <ElFormItem label="应用名称" prop="appName">
        <ElInput v-model="formData.appName" placeholder="请输入应用名称" />
      </ElFormItem>
      <ElFormItem label="应用 Key" prop="appKey">
        <ElInput v-model="formData.appKey" placeholder="请输入应用 Key" />
      </ElFormItem>
      <ElFormItem label="回调地址" prop="redirectUrl">
        <ElInput v-model="formData.redirectUrl" placeholder="请输入回调地址" />
      </ElFormItem>
      <ElFormItem label="授权范围" prop="scopes">
        <ElInput v-model="formData.scopes" placeholder="请输入授权范围（逗号分隔）" />
      </ElFormItem>
      <ElFormItem label="绑定 IP" prop="boundIps">
        <ElInput v-model="formData.boundIps" placeholder="请输入绑定 IP（逗号分隔）" />
      </ElFormItem>
      <ElFormItem label="描述">
        <ElInput v-model="formData.description" type="textarea" :rows="2" placeholder="请输入描述" />
      </ElFormItem>
      <ElFormItem label="状态" prop="status">
        <ElRadioGroup v-model="formData.status">
          <ElRadio value="1">启用</ElRadio>
          <ElRadio value="0">禁用</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
    </ElForm>
  </Modal>
</template>