<!--
 * 用户账号表单组件 — 支持新增/编辑用户账号（账号、密码、姓名、公司/部门/岗位、角色）
 *
 * @path apps\userinfo-web\src\views\system\user\user-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 用户（表单组件）
 * <p>用户账号的创建/编辑弹窗，字段对应契约 UserAccountDTO
 * （src/api/userAccount.ts，auto-generated）：
 * 用户名（编辑时锁定）、密码（仅新增）、真实姓名、手机号、邮箱、
 * 公司/部门/岗位（下拉数据由列表页传入）、角色（多选）、状态。
 * 提交走 create/update，成功后 emit('success') 并关闭弹窗。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import { useI18n } from 'vue-i18n';

import {
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
  ElTreeSelect,
} from 'element-plus';
import { computed, reactive, ref } from 'vue';

import { create, update } from '#/api/userAccount';
import type {
  CompanyVO,
  DepartmentTreeVO,
  PostVO,
  RoleVO,
  UserAccountDTO,
  UserAccountVO,
} from '#/api/models';

const { t } = useI18n();

const emit = defineEmits<{ success: [] }>();

const formRef = ref();
const isEdit = ref(false);

/** 下拉选项数据（由列表页在打开弹窗前传入） */
const companyList = ref<CompanyVO[]>([]);
const deptTreeData = ref<DepartmentTreeVO[]>([]);
const postList = ref<PostVO[]>([]);
const roleList = ref<RoleVO[]>([]);

/** 表单状态（字段对应 UserAccountDTO；status 契约为字符串 '1'/'0'） */
interface UserFormState {
  id: string;
  username: string;
  password: string;
  realName: string;
  phone: string;
  email: string;
  companyId: string;
  deptId: string;
  positionCode: string;
  roleIds: string[];
  status: string;
}

const formData = reactive<UserFormState>({
  id: '',
  username: '',
  password: '',
  realName: '',
  phone: '',
  email: '',
  companyId: '',
  deptId: '',
  positionCode: '',
  roleIds: [],
  status: '1',
});

const rules = {
  username: [{ required: true, message: t('user.usernamePlaceholder'), trigger: 'blur' }],
  password: [{ required: true, message: t('user.passwordPlaceholder'), trigger: 'blur' }],
  realName: [{ required: true, message: t('user.realNamePlaceholder'), trigger: 'blur' }],
};

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{
      record?: UserAccountVO;
      companyList?: CompanyVO[];
      deptTreeData?: DepartmentTreeVO[];
      postList?: PostVO[];
      roleList?: RoleVO[];
    }>();
    companyList.value = data?.companyList ?? [];
    deptTreeData.value = data?.deptTreeData ?? [];
    postList.value = data?.postList ?? [];
    roleList.value = data?.roleList ?? [];

    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        id: data.record.id ?? '',
        username: data.record.username ?? '',
        password: '',
        realName: data.record.realName ?? '',
        phone: data.record.phone ?? '',
        email: data.record.email ?? '',
        companyId: data.record.companyId ?? '',
        deptId: data.record.deptId ?? '',
        positionCode: data.record.positionCode ?? '',
        roleIds: [],
        status: data.record.status === 0 ? '0' : '1',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        id: '',
        username: '',
        password: '',
        realName: '',
        phone: '',
        email: '',
        companyId: '',
        deptId: '',
        positionCode: '',
        roleIds: [],
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
      const payload: UserAccountDTO = {
        username: formData.username,
        realName: formData.realName,
        phone: formData.phone,
        email: formData.email,
        companyId: formData.companyId || undefined,
        deptId: formData.deptId || undefined,
        positionCode: formData.positionCode || undefined,
        roleIds: formData.roleIds,
        status: formData.status,
      };
      if (isEdit.value) {
        await update({ ...payload, id: formData.id || undefined });
        ElMessage.success(t('user.updateSuccess'));
      } else {
        await create({ ...payload, password: formData.password });
        ElMessage.success(t('user.createSuccess'));
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => (isEdit.value ? t('user.editUser') : t('user.createUser')));
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
      <ElFormItem :label="t('user.username')" prop="username">
        <ElInput
          v-model="formData.username"
          :placeholder="t('user.usernamePlaceholder')"
          :disabled="isEdit"
        />
      </ElFormItem>
      <ElFormItem v-if="!isEdit" :label="t('user.password')" prop="password">
        <ElInput
          v-model="formData.password"
          type="password"
          :placeholder="t('user.passwordPlaceholder')"
          show-password
        />
      </ElFormItem>
      <ElFormItem :label="t('user.realName')" prop="realName">
        <ElInput v-model="formData.realName" :placeholder="t('user.realNamePlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="t('user.phone')">
        <ElInput v-model="formData.phone" :placeholder="t('user.phonePlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="t('user.email')">
        <ElInput v-model="formData.email" :placeholder="t('user.emailPlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="t('user.company')">
        <ElSelect
          v-model="formData.companyId"
          :placeholder="t('user.companyPlaceholder')"
          clearable
          class="w-full"
        >
          <ElOption
            v-for="item in companyList"
            :key="item.id"
            :label="item.companyName"
            :value="item.id ?? ''"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="t('user.dept')">
        <ElTreeSelect
          v-model="formData.deptId"
          :data="deptTreeData"
          :props="{ label: 'deptName', children: 'children' }"
          node-key="id"
          check-strictly
          clearable
          :placeholder="t('user.deptPlaceholder')"
          class="w-full"
        />
      </ElFormItem>
      <ElFormItem :label="t('user.position')">
        <ElSelect
          v-model="formData.positionCode"
          :placeholder="t('user.positionPlaceholder')"
          clearable
          class="w-full"
        >
          <ElOption
            v-for="item in postList"
            :key="item.postCode"
            :label="item.postName"
            :value="item.postCode ?? ''"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="t('user.role')">
        <ElSelect
          v-model="formData.roleIds"
          multiple
          :placeholder="t('user.rolePlaceholder')"
          clearable
          class="w-full"
        >
          <ElOption
            v-for="item in roleList"
            :key="item.id"
            :label="item.roleName"
            :value="item.id ?? ''"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="t('user.status')">
        <ElRadioGroup v-model="formData.status">
          <ElRadio value="1">{{ t('user.enabled') }}</ElRadio>
          <ElRadio value="0">{{ t('user.disabled') }}</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
    </ElForm>
  </Modal>
</template>