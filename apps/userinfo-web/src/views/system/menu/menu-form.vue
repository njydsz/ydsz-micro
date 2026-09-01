<!--
 * 菜单表单组件 — 支持新增/编辑菜单项（上级菜单、名称、编码、类型、路由、组件、权限标识等）
 *
 * @path apps\userinfo-web\src\views\system\menu\menu-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 菜单（表单组件）
 * <p>菜单的创建/编辑弹窗，字段对应契约 MenuDTO（src/api/menu.ts，auto-generated）：
 * 上级菜单（ElTreeSelect 级联选择）、菜单名称、菜单编码、菜单类型（目录/菜单/按钮）、
 * 路由路径、组件路径、图标、权限标识、排序、可见、状态。
 * 提交走 create/update，成功后 emit('success') 并关闭弹窗。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';

import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
  ElTreeSelect,
} from 'element-plus';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { create, update } from '#/api/menu';
import type { MenuDTO, MenuTreeVO } from '#/api/models';

import IconPicker from './components/IconPicker.vue';

const emit = defineEmits<{ success: [] }>();

const formRef = ref();
const isEdit = ref(false);
const iconPickerRef = ref<InstanceType<typeof IconPicker> | null>(null);

/** 打开图标选择器 */
function openIconPicker(): void {
  iconPickerRef.value?.open();
}

/** 处理图标选择 */
function handleIconSelect(icon: string): void {
  formData.icon = icon;
}

/** 菜单树（来自 menu.tree()，由列表页传入，用于上级菜单选择） */
const treeData = ref<MenuTreeVO[]>([]);

/** 菜单类型选项（契约 menuType 为字符串，兼容 'DIRECTORY'/'MENU'/'BUTTON' 与 '0'/'1'/'2'） */
const MENU_TYPE_OPTIONS = [
  { label: '目录', value: 'DIRECTORY' },
  { label: '菜单', value: 'MENU' },
  { label: '按钮', value: 'BUTTON' },
];

/** 表单状态（字段对应 MenuDTO） */
interface MenuFormState {
  id: string;
  parentId: string;
  menuName: string;
  menuCode: string;
  menuType: string;
  path: string;
  component: string;
  icon: string;
  permissionCode: string;
  sortOrder: number;
  visible: number;
  status: string;
}

const formData = reactive<MenuFormState>({
  id: '',
  parentId: '',
  menuName: '',
  menuCode: '',
  menuType: 'MENU',
  path: '',
  component: '',
  icon: '',
  permissionCode: '',
  sortOrder: 0,
  visible: 1,
  status: '1',
});

const rules = {
  menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  menuType: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
};

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{
      record?: MenuTreeVO;
      treeData?: MenuTreeVO[];
      parentId?: string;
    }>();
    treeData.value = data?.treeData ?? [];

    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        id: data.record.id ?? '',
        parentId: data.record.parentId ?? '',
        menuName: data.record.menuName ?? '',
        menuCode: data.record.menuCode ?? '',
        menuType: data.record.menuType ?? 'MENU',
        path: data.record.path ?? '',
        component: data.record.component ?? '',
        icon: data.record.icon ?? '',
        permissionCode: data.record.permissionCode ?? '',
        sortOrder: data.record.sortOrder ?? 0,
        visible: data.record.visible ?? 1,
        status: data.record.status ?? '1',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        id: '',
        parentId: data?.parentId ?? '',
        menuName: '',
        menuCode: '',
        menuType: 'MENU',
        path: '',
        component: '',
        icon: '',
        permissionCode: '',
        sortOrder: 0,
        visible: 1,
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
      const payload: MenuDTO = {
        parentId: formData.parentId || undefined,
        menuName: formData.menuName,
        menuCode: formData.menuCode,
        menuType: formData.menuType,
        path: formData.path,
        component: formData.component,
        icon: formData.icon,
        permissionCode: formData.permissionCode,
        sortOrder: formData.sortOrder,
        visible: formData.visible,
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

const title = computed(() => (isEdit.value ? `${t('page.edit')}菜单` : `${t('page.create')}菜单`));
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
      <ElFormItem label="上级菜单" prop="parentId">
        <ElTreeSelect
          v-model="formData.parentId"
          :data="[{ id: '', label: '顶级菜单', children: treeData }]"
          :props="{ label: 'label', children: 'children' }"
          node-key="id"
          check-strictly
          clearable
          placeholder="请选择上级菜单"
          class="w-full"
        />
      </ElFormItem>
      <ElFormItem :label="t('page.menuName')" prop="menuName">
        <ElInput v-model="formData.menuName" placeholder="请输入菜单名称" />
      </ElFormItem>
      <ElFormItem label="菜单编码" prop="menuCode">
        <ElInput v-model="formData.menuCode" placeholder="请输入菜单编码" />
      </ElFormItem>
      <ElFormItem :label="t('page.menuType')" prop="menuType">
        <ElSelect v-model="formData.menuType" placeholder="请选择菜单类型" class="w-full">
          <ElOption
            v-for="opt in MENU_TYPE_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="t('page.menuPath')">
        <ElInput v-model="formData.path" placeholder="请输入路由路径（如 /system/menu）" />
      </ElFormItem>
      <ElFormItem :label="t('page.component')">
        <ElInput v-model="formData.component" placeholder="请输入组件路径" />
      </ElFormItem>
      <ElFormItem :label="t('page.icon')">
        <div class="flex w-full gap-2">
          <ElInput v-model="formData.icon" placeholder="请输入图标名称或点击选择" readonly @click="openIconPicker" />
          <ElButton @click="openIconPicker">选择图标</ElButton>
        </div>
      </ElFormItem>
      <ElFormItem :label="t('page.permission')">
        <ElInput v-model="formData.permissionCode" placeholder="请输入权限标识（如 system:menu:add）" />
      </ElFormItem>
      <ElFormItem :label="t('page.sortOrder')">
        <ElInputNumber v-model="formData.sortOrder" :min="0" :max="999" />
      </ElFormItem>
      <ElFormItem label="可见">
        <ElRadioGroup v-model="formData.visible">
          <ElRadio :value="1">显示</ElRadio>
          <ElRadio :value="0">隐藏</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem :label="t('page.status')">
        <ElRadioGroup v-model="formData.status">
          <ElRadio value="1">{{ t('page.enabled') }}</ElRadio>
          <ElRadio value="0">{{ t('page.disabled') }}</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
    </ElForm>
    <IconPicker ref="iconPickerRef" @select="handleIconSelect" />
  </Modal>
</template>