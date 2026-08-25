<!--
 * 公司表单组件 — 支持新增/编辑公司信息（公司编码、名称、上级公司、联系人、状态）
 *
 * @path apps\userinfo-web\src\views\system\company\company-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 公司（表单组件）
 * <p>公司的创建/编辑表单，字段对应契约 CompanyDTO（src/api/company.ts，auto-generated）：
 * 公司编码、公司名称、上级公司（复用 company.tree() 的层级数据做级联选择）、联系人、
 * 联系电话、地址、状态。提交走 create/update，成功后 emit('success') 并关闭弹窗。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';

import {
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElRadio,
  ElRadioGroup,
  ElTreeSelect,
} from 'element-plus';
import { computed, reactive, ref } from 'vue';

import { create, update } from '#/api/company';
import type { CompanyDTO, CompanyTreeVO, CompanyVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();

const formRef = ref();
const isEdit = ref(false);

/** 上级公司树数据（来自 company.tree()，由列表页传入） */
const treeData = ref<CompanyTreeVO[]>([]);

interface CompanyFormState {
  id: string;
  companyName: string;
  companyCode: string;
  parentId: string;
  contactPerson: string;
  contactPhone: string;
  address: string;
  status: string;
}

const formData = reactive<CompanyFormState>({
  id: '',
  companyName: '',
  companyCode: '',
  parentId: '',
  contactPerson: '',
  contactPhone: '',
  address: '',
  status: '1',
});

const rules = {
  companyName: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
  companyCode: [{ required: true, message: '请输入公司编码', trigger: 'blur' }],
};

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: CompanyVO; treeData?: CompanyTreeVO[] }>();
    treeData.value = data?.treeData ?? [];

    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        id: data.record.id ?? '',
        companyName: data.record.companyName ?? '',
        companyCode: data.record.companyCode ?? '',
        parentId: data.record.parentId ?? '',
        contactPerson: data.record.contactPerson ?? '',
        contactPhone: data.record.contactPhone ?? '',
        address: data.record.address ?? '',
        status: data.record.status ?? '1',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        id: '',
        companyName: '',
        companyCode: '',
        parentId: '',
        contactPerson: '',
        contactPhone: '',
        address: '',
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
      const payload: CompanyDTO = {
        companyName: formData.companyName,
        companyCode: formData.companyCode,
        parentId: formData.parentId || undefined,
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        address: formData.address,
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

const title = computed(() => (isEdit.value ? '编辑公司' : '新增公司'));
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
      <ElFormItem label="上级公司">
        <ElTreeSelect
          v-model="formData.parentId"
          :data="treeData"
          :props="{ label: 'companyName', children: 'children' }"
          node-key="id"
          check-strictly
          clearable
          placeholder="请选择上级公司（留空为顶级）"
          class="w-full"
        />
      </ElFormItem>
      <ElFormItem label="公司名称" prop="companyName">
        <ElInput v-model="formData.companyName" placeholder="请输入公司名称" />
      </ElFormItem>
      <ElFormItem label="公司编码" prop="companyCode">
        <ElInput v-model="formData.companyCode" placeholder="请输入公司编码" />
      </ElFormItem>
      <ElFormItem label="联系人">
        <ElInput v-model="formData.contactPerson" placeholder="请输入联系人" />
      </ElFormItem>
      <ElFormItem label="联系电话">
        <ElInput v-model="formData.contactPhone" placeholder="请输入联系电话" />
      </ElFormItem>
      <ElFormItem label="地址">
        <ElInput v-model="formData.address" type="textarea" :rows="2" placeholder="请输入地址" />
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