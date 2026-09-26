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
 * 上级菜单（YdTreeSelect 级联选择）、菜单名称、菜单编码、菜单类型（目录/菜单/按钮）、
 * 路由路径、组件路径、图标、权限标识、排序、可见、状态。
 * 提交走 create/update，成功后 emit('success') 并关闭弹窗。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYdModal } from '@ydsz/common-ui';

import { YdButton, YdForm, YdFormItem, YdInput, YdNumberFieldInput, YdSelectItem, YdRadioGroupItem, YdRadioGroup, YdSelect, YdTreeSelect } from '@ydsz-core/ydsz-ui';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { createLogger } from '@ydsz-core/shared/utils';
const logger = createLogger('userinfo-menu');

import { create, update } from '#/api/menu';
import type { MenuDTO, MenuTreeVO } from '#/api/models';

import YdIconPicker from './components/YdIconPicker.vue';

const emit = defineEmits<{ success: [] }>();

const formRef = ref();
const isEdit = ref(false);
const iconPickerRef = ref<InstanceType<typeof YdIconPicker> | null>(null);

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

/** 将 MenuTreeVO 树转换为 YdTreeSelect 所需的 options 格式 */
const treeOptions = computed(() => {
  const mapped = treeData.value.map(node => mapMenuTreeToOption(node));
  return [{ label: t('menu.topMenu'), value: '', children: mapped }];
});

function mapMenuTreeToOption(node: MenuTreeVO): { label: string; value: string; children?: { label: string; value: string }[] } {
  return {
    label: node.menuName ?? '',
    value: node.id ?? '',
    ...(node.children?.length && { children: node.children.map(mapMenuTreeToOption) }),
  };
}

/** 菜单类型选项（契约 menuType 为字符串，兼容 'DIRECTORY'/'MENU'/'BUTTON' 与 '0'/'1'/'2'） */
const MENU_TYPE_OPTIONS = [
  { label: t('menuType.directory'), value: 'DIRECTORY' },
  { label: t('menuType.menu'), value: 'MENU' },
  { label: t('menuType.button'), value: 'BUTTON' },
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
  sort?: number;
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
  sort: 0,
  visible: 1,
  status: '1',
});

const rules = {
  menuName: [{ required: true, message: t('menu.menuNamePlaceholder'), trigger: 'blur' }],
  menuType: [{ required: true, message: t('menu.menuTypePlaceholder'), trigger: 'change' }],
};

const [Modal, modalApi] = useYdModal({
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
  sort: data.record.sort ?? 0,
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
  sort: 0,
        visible: 1,
        status: '1',
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
      const payload: MenuDTO = {
        parentId: formData.parentId || undefined,
        menuName: formData.menuName,
        menuCode: formData.menuCode,
        menuType: formData.menuType,
        path: formData.path,
        component: formData.component,
        icon: formData.icon,
  permissionCode: formData.permissionCode,
  sort: formData.sort,
        visible: formData.visible,
        status: formData.status,
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

const title = computed(() => (isEdit.value ? `${t('page.edit')}${t('page.menuBase')}` : `${t('page.create')}${t('page.menuBase')}`));
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
      <YdFormItem :label="t('menu.parentMenu')" prop="parentId">
        <YdTreeSelect
          v-model="formData.parentId"
          :options="treeOptions"
          :placeholder="t('menu.parentMenuPlaceholder')"
          class="w-full"
        />
      </YdFormItem>
      <YdFormItem :label="t('page.menuName')" prop="menuName">
        <YdInput v-model="formData.menuName" :placeholder="t('menu.menuNamePlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('menu.menuCode')" prop="menuCode">
        <YdInput v-model="formData.menuCode" :placeholder="t('menu.menuCodePlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('page.menuType')" prop="menuType">
        <YdSelect v-model="formData.menuType" :placeholder="t('menu.menuTypePlaceholder')" class="w-full">
          <YdSelectItem
            v-for="opt in MENU_TYPE_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </YdSelect>
      </YdFormItem>
      <YdFormItem :label="t('page.menuPath')">
        <YdInput v-model="formData.path" :placeholder="t('menu.pathPlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('page.component')">
        <YdInput v-model="formData.component" :placeholder="t('menu.componentPlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('page.icon')">
        <div class="flex w-full gap-2">
          <YdInput v-model="formData.icon" :placeholder="t('menu.iconPlaceholder')" readonly @click="openIconPicker" />
          <YdButton @click="openIconPicker">{{ t('menu.selectIcon') }}</YdButton>
        </div>
      </YdFormItem>
      <YdFormItem :label="t('page.permission')">
        <YdInput v-model="formData.permissionCode" :placeholder="t('menu.permissionPlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('page.sortOrder')">
        <YdNumberFieldInput v-model="formData.sort" :min="0" :max="999" />
      </YdFormItem>
      <YdFormItem :label="t('menu.visible')">
        <YdRadioGroup v-model="formData.visible">
          <YdRadioGroupItem :value="1">{{ t('menu.show') }}</YdRadioGroupItem>
          <YdRadioGroupItem :value="0">{{ t('menu.hide') }}</YdRadioGroupItem>
        </YdRadioGroup>
      </YdFormItem>
      <YdFormItem :label="t('page.status')">
        <YdRadioGroup v-model="formData.status">
          <YdRadioGroupItem value="1">{{ t('page.enabled') }}</YdRadioGroupItem>
          <YdRadioGroupItem value="0">{{ t('page.disabled') }}</YdRadioGroupItem>
        </YdRadioGroup>
      </YdFormItem>
    </YdForm>
    <YdIconPicker ref="iconPickerRef" @select="handleIconSelect" />
  </Modal>
</template>