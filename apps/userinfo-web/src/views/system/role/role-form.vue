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
import { useYdModal } from '@ydsz/common-ui';

import { YdForm, YdFormItem, YdInput, YdNumberFieldInput, YdSelectItem, YdRadioGroupItem, YdRadioGroup, YdSelect, YdSwitch } from '@ydsz-core/ydsz-ui';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { createLogger } from '@ydsz-core/shared/utils';

const { t } = useI18n();
const logger = createLogger('userinfo-role');

import { create, update } from '#/api/role';
import type { RoleDTO, RoleVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();

const formRef = ref();
const isEdit = ref(false);

/** 数据范围选项（契约 dataScope 为字符串 '1'~'5'） */
const DATA_SCOPE_OPTIONS = [
  { label: t('role.dataScopeAll'), value: '1' },
  { label: t('role.dataScopeCustom'), value: '2' },
  { label: t('role.dataScopeDept'), value: '3' },
  { label: t('role.dataScopeDeptBelow'), value: '4' },
  { label: t('role.dataScopeSelf'), value: '5' },
];

/** 表单状态（字段对应 RoleDTO） */
interface RoleFormState {
  id: string;
  roleCode: string;
  roleName: string;
  dataScope: string;
  sort?: number;
  status: string;
  builtIn: boolean;
  description: string;
}

const formData = reactive<RoleFormState>({
  id: '',
  roleCode: '',
  roleName: '',
  dataScope: '3',
  sort: 0,
  status: '1',
  builtIn: false,
  description: '',
});

const rules = {
  roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
};

const [Modal, modalApi] = useYdModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: RoleVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        id: data.record.id ?? '',
roleCode: data.record.roleCode ?? '',
roleName: data.record.roleName ?? '',
sort: data.record.sort ?? 0,
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
sort: 0,
status: '1',
        builtIn: false,
        description: '',
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
      const payload: RoleDTO = {
        roleCode: formData.roleCode,
        roleName: formData.roleName,
dataScope: formData.dataScope,
sort: formData.sort,
status: formData.status,
        builtIn: formData.builtIn,
        description: formData.description,
      };
      if (isEdit.value) {
        await update({ ...payload, id: formData.id || undefined });
        showToast.success('更新成功');
      } else {
        await create(payload);
        showToast.success('创建成功');
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => (isEdit.value ? `${t('page.edit')}${t('page.roleBase')}` : `${t('page.create')}${t('page.roleBase')}`));
</script>

<template>
  <Modal :title="title">
    <YdForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      label-position="right"
    >
      <YdFormItem :label="t('page.roleName')" prop="roleName">
        <YdInput v-model="formData.roleName" :placeholder="t('role.roleNamePlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('page.roleCode')" prop="roleCode">
        <YdInput v-model="formData.roleCode" :placeholder="t('role.roleCodePlaceholder')" :disabled="isEdit" />
      </YdFormItem>
      <YdFormItem :label="t('role.dataScope')">
        <YdSelect v-model="formData.dataScope" :placeholder="t('role.dataScopePlaceholder')" class="w-full">
          <YdSelectItem
            v-for="opt in DATA_SCOPE_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </YdSelect>
      </YdFormItem>
      <YdFormItem :label="t('page.sortOrder')">
        <YdNumberFieldInput v-model="formData.sort" :min="0" :max="999" />
      </YdFormItem>
      <YdFormItem label="内置角色">
        <YdSwitch v-model="formData.builtIn" :active-value="true" :inactive-value="false" />
      </YdFormItem>
      <YdFormItem :label="t('page.status')">
        <YdRadioGroup v-model="formData.status">
          <YdRadioGroupItem value="1">{{ t('page.enabled') }}</YdRadioGroupItem>
          <YdRadioGroupItem value="0">{{ t('page.disabled') }}</YdRadioGroupItem>
        </YdRadioGroup>
      </YdFormItem>
      <YdFormItem label="描述">
        <YdInput
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入描述"
        />
      </YdFormItem>
    </YdForm>
  </Modal>
</template>