<!--
 * 角色表单组件 — 支持新增/编辑角色信息（角色编码、名称、数据范围、排序、状态、内置标识、描述）
 *
 * @path apps\userinfo-web\src\views\system\role\role-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 角色（表单组件）
 * <p>角色的创建/编辑弹窗，字段对应契约 RoleDTO（src/api/role.ts，auto-generated）：
 * 角色编码、角色名称、数据范围（字符串 '1'~'5'）、排序、状态、内置标识、描述。
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
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
  ElSwitch,
} from 'element-plus';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { create, update } from '#/api/role';
import type { RoleDTO, RoleVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();

const formRef = ref();
const isEdit = ref(false);

/** 数据范围选项（契约 dataScope 为字符串 '1'~'5'） */
const DATA_SCOPE_OPTIONS = [
  { label: '全部数据', value: '1' },
  { label: '自定义数据', value: '2' },
  { label: '本部门', value: '3' },
  { label: '本部门及以下', value: '4' },
  { label: '仅本人', value: '5' },
];

/** 表单状态（字段对应 RoleDTO） */
interface RoleFormState {
  id: string;
  roleCode: string;
  roleName: string;
  dataScope: string;
  sortOrder: number;
  status: string;
  builtIn: boolean;
  description: string;
}

const formData = reactive<RoleFormState>({
  id: '',
  roleCode: '',
  roleName: '',
  dataScope: '3',
  sortOrder: 0,
  status: '1',
  builtIn: false,
  description: '',
});

const rules = {
  roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
};

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: RoleVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        id: data.record.id ?? '',
        roleCode: data.record.roleCode ?? '',
        roleName: data.record.roleName ?? '',
        sortOrder: data.record.sortOrder ?? 0,
        status: data.record.status ?? '1',
        builtIn: data.record.builtIn ?? false,
        description: data.record.description ?? '',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        id: '',
        roleCode: '',
        roleName: '',
        dataScope: '3',
        sortOrder: 0,
        status: '1',
        builtIn: false,
        description: '',
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
      const payload: RoleDTO = {
        roleCode: formData.roleCode,
        roleName: formData.roleName,
        dataScope: formData.dataScope,
        sortOrder: formData.sortOrder,
        status: formData.status,
        builtIn: formData.builtIn,
        description: formData.description,
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

const title = computed(() => (isEdit.value ? `${t('page.edit')}角色` : `${t('page.create')}角色`));
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
      <ElFormItem :label="t('page.roleName')" prop="roleName">
        <ElInput v-model="formData.roleName" placeholder="请输入角色名称" />
      </ElFormItem>
      <ElFormItem :label="t('page.roleCode')" prop="roleCode">
        <ElInput v-model="formData.roleCode" placeholder="请输入角色编码" :disabled="isEdit" />
      </ElFormItem>
      <ElFormItem label="数据范围">
        <ElSelect v-model="formData.dataScope" placeholder="请选择数据范围" class="w-full">
          <ElOption
            v-for="opt in DATA_SCOPE_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="t('page.sortOrder')">
        <ElInputNumber v-model="formData.sortOrder" :min="0" :max="999" />
      </ElFormItem>
      <ElFormItem label="内置角色">
        <ElSwitch v-model="formData.builtIn" :active-value="true" :inactive-value="false" />
      </ElFormItem>
      <ElFormItem :label="t('page.status')">
        <ElRadioGroup v-model="formData.status">
          <ElRadio value="1">{{ t('page.enabled') }}</ElRadio>
          <ElRadio value="0">{{ t('page.disabled') }}</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="描述">
        <ElInput
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入描述"
        />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>