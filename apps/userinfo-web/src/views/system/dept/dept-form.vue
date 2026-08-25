<!--
 * 部门表单组件 — 支持新增/编辑部门信息（部门编码、名称、上级部门、描述、排序、状态）
 *
 * @path apps\userinfo-web\src\views\system\dept\dept-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 部门（表单组件）
 * <p>部门的创建/编辑弹窗，字段对应契约 DepartmentDTO（src/api/department.ts，auto-generated）：
 * 部门编码、部门名称、上级部门（ElTreeSelect 级联选择）、描述、排序、状态。
 * 提交走 create/update，成功后 emit('success') 并关闭弹窗。
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
  ElTreeSelect,
} from 'element-plus';
import { computed, reactive, ref } from 'vue';

import { create, update } from '#/api/department';
import type { DepartmentDTO, DepartmentTreeVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();

const formRef = ref();
const isEdit = ref(false);

/** 部门树（来自 department.tree()，由列表页传入，用于上级部门选择） */
const treeData = ref<DepartmentTreeVO[]>([]);

/** 表单状态（字段对应 DepartmentDTO） */
interface DeptFormState {
  id: string;
  deptCode: string;
  deptName: string;
  parentId: string;
  description: string;
  sortOrder: number;
  status: string;
}

const formData = reactive<DeptFormState>({
  id: '',
  deptCode: '',
  deptName: '',
  parentId: '',
  description: '',
  sortOrder: 0,
  status: '1',
});

const rules = {
  deptName: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
};

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{
      record?: DepartmentTreeVO;
      treeData?: DepartmentTreeVO[];
      parentId?: string;
    }>();
    treeData.value = data?.treeData ?? [];

    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        id: data.record.id ?? '',
        deptCode: data.record.deptCode ?? '',
        deptName: data.record.deptName ?? '',
        parentId: data.record.parentId ?? '',
        description: '',
        sortOrder: data.record.sortOrder ?? 0,
        status: data.record.status ?? '1',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        id: '',
        deptCode: '',
        deptName: '',
        parentId: data?.parentId ?? '',
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
      const payload: DepartmentDTO = {
        deptCode: formData.deptCode,
        deptName: formData.deptName,
        parentId: formData.parentId || undefined,
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

const title = computed(() => (isEdit.value ? '编辑部门' : '新增部门'));
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
      <ElFormItem label="上级部门" prop="parentId">
        <ElTreeSelect
          v-model="formData.parentId"
          :data="[{ id: '', label: '顶级部门', children: treeData }]"
          :props="{ label: 'label', children: 'children' }"
          node-key="id"
          check-strictly
          clearable
          placeholder="请选择上级部门"
          class="w-full"
        />
      </ElFormItem>
      <ElFormItem label="部门名称" prop="deptName">
        <ElInput v-model="formData.deptName" placeholder="请输入部门名称" />
      </ElFormItem>
      <ElFormItem label="部门编码" prop="deptCode">
        <ElInput v-model="formData.deptCode" placeholder="请输入部门编码" />
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