<!--
 * 租户（表单组件）
 *
 * @path apps\system-web\src\views\tenant\tenant-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 租户（表单组件）
 * <p>新增/编辑租户表单，数据提交到后端契约 API tenant#save / tenant#update（apps/system-web/src/api/tenant.ts）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import { ElDatePicker, ElForm, ElFormItem, ElInput, ElMessage, ElOption, ElSelect } from 'element-plus';
import { computed, reactive, ref, watch } from 'vue';
import { save, update } from '#/api/tenant';
import type { TenantDTO, TenantVO } from '#/api/models';

defineOptions({ name: 'TenantForm' });

const emit = defineEmits<{ success: [] }>();
const formRef = ref();

/** 租户表单数据 */
interface TenantFormData {
  id: string;
  tenantCode: string;
  tenantName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  planId: string;
  expireAt: string;
  datasourceKey: string;
  status: string;
}

const formData = reactive<TenantFormData>({
  id: '',
  tenantCode: '',
  tenantName: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  planId: '',
  expireAt: '',
  datasourceKey: '',
  status: 'ACTIVE',
});

const rules = {
  tenantCode: [{ required: true, message: '请输入租户编码', trigger: 'blur' }],
  tenantName: [{ required: true, message: '请输入租户名称', trigger: 'blur' }],
};

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData() as { mode?: string; record?: TenantVO } | undefined;
    if (data?.mode === 'edit' && data.record) {
      Object.assign(formData, {
        id: data.record.id ?? '',
        tenantCode: data.record.tenantCode ?? '',
        tenantName: data.record.tenantName ?? '',
        contactName: data.record.contactName ?? '',
        contactPhone: data.record.contactPhone ?? '',
        contactEmail: data.record.contactEmail ?? '',
        planId: data.record.planId ?? '',
        expireAt: data.record.expireAt ?? '',
        datasourceKey: data.record.datasourceKey ?? '',
        status: data.record.status ?? 'ACTIVE',
      });
    } else {
      Object.assign(formData, {
        id: '',
        tenantCode: '',
        tenantName: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        planId: '',
        expireAt: '',
        datasourceKey: '',
        status: 'ACTIVE',
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
      const dto: TenantDTO = { ...formData };
      if (formData.id) {
        await update(dto);
        ElMessage.success('更新成功');
      } else {
        await save(dto);
        ElMessage.success('创建成功');
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const isEdit = computed(() => !!formData.id);
</script>

<template>
  <Modal :title="isEdit ? '编辑租户' : '新增租户'">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="租户编码" prop="tenantCode">
        <ElInput v-model="formData.tenantCode" placeholder="请输入租户编码" :disabled="isEdit" />
      </ElFormItem>
      <ElFormItem label="租户名称" prop="tenantName">
        <ElInput v-model="formData.tenantName" placeholder="请输入租户名称" />
      </ElFormItem>
      <ElFormItem label="联系人" prop="contactName">
        <ElInput v-model="formData.contactName" placeholder="请输入联系人" />
      </ElFormItem>
      <ElFormItem label="联系电话" prop="contactPhone">
        <ElInput v-model="formData.contactPhone" placeholder="请输入联系电话" />
      </ElFormItem>
      <ElFormItem label="联系邮箱" prop="contactEmail">
        <ElInput v-model="formData.contactEmail" placeholder="请输入联系邮箱" />
      </ElFormItem>
      <ElFormItem label="套餐ID" prop="planId">
        <ElInput v-model="formData.planId" placeholder="请输入套餐ID" />
      </ElFormItem>
      <ElFormItem label="过期时间" prop="expireAt">
        <ElDatePicker v-model="formData.expireAt" type="datetime" placeholder="选择过期时间" class="w-full" />
      </ElFormItem>
      <ElFormItem label="数据源" prop="datasourceKey">
        <ElInput v-model="formData.datasourceKey" placeholder="请输入数据源标识" />
      </ElFormItem>
      <ElFormItem label="状态" prop="status">
        <ElSelect v-model="formData.status" placeholder="请选择状态">
          <ElOption label="启用" value="ACTIVE" />
          <ElOption label="禁用" value="INACTIVE" />
        </ElSelect>
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
