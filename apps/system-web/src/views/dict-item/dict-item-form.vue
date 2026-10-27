<!--
 * 字典项表单组件 — 支持新增/编辑字典项枚举值
 *
 * @path apps\system-web\src\views\dictItem\dictItem-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 字典项（表单组件）
 * <p>消费后端契约 DictItemController（src/api/dictItem.ts，auto-generated）的字典项创建/编辑表单，
 * 字段对应契约 DictItemDTO（typeCode 下拉数据源来自 DictController#listAll），提交走 save/update。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYdModal } from '@ydsz/common-ui';
import { YdForm, YdFormItem, YdInput, YdNumberFieldInput, YdSelectItem, YdRadioGroupItem, YdRadioGroup, YdSelect } from '@ydsz-core/ydsz-ui';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { emitDictChange } from '@ydsz/shared-business';

import { showToast } from '@ydsz/notification';

import { listAll } from '#/api/dict';
import { save, update } from '#/api/dictItem';
import type { DictItemVO, DictTypeVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();

const { t } = useI18n();

const formRef = ref();
const isEdit = ref(false);

/** 字典类型选项（listAll 数据源，供 typeCode 下拉） */
const dictTypes = ref<DictTypeVO[]>([]);

/** 表单状态（字段对齐契约 DictItemDTO，status 为字符串 '1'/'0'） */
interface DictItemFormState {
  id?: string;
  typeCode: string;
  itemCode: string;
  itemValue: string;
  sort?: number;
  description: string;
  status: string;
}

const formData = reactive<DictItemFormState>({
  id: '',
  typeCode: '',
  itemCode: '',
  itemValue: '',
  sort: 0,
  description: '',
  status: '1',
});

const rules = {
  typeCode: [{ required: true, message: t('dictTypePlaceholder'), trigger: 'change' }],
  itemCode: [{ required: true, message: t('common.placeholder', [t('itemCode')]), trigger: 'blur' }],
};

/** 加载字典类型下拉数据（DictController#listAll） */
async function loadDictTypes() {
  try {
    dictTypes.value = await listAll();
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

const [Modal, modalApi] = useYdModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    loadDictTypes();
    const data = modalApi.getData<{ record?: DictItemVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        id: data.record.id ?? '',
        typeCode: data.record.typeCode ?? '',
        itemCode: data.record.itemCode ?? '',
  itemValue: data.record.itemValue ?? '',
  sort: data.record.sort ?? 0,
        description: data.record.description ?? '',
        status: data.record.status ?? '1',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        id: '',
        typeCode: '',
        itemCode: '',
  itemValue: '',
  sort: 0,
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
        showToast.success(t('updateSuccess'));
      } else {
        await save(formData);
        showToast.success(t('createSuccess'));
      }
      // 广播字典项变更事件，通知 YdDictSelect/YdDictTag 等组件自动刷新
      if (formData.typeCode) {
        emitDictChange(formData.typeCode);
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => (isEdit.value ? t('editDictItem') : t('createDictItem')));
</script>

<template>
  <Modal :title="title">
    <YdForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <YdFormItem :label="t('dictType')" prop="typeCode">
        <YdSelect v-model="formData.typeCode" :placeholder="t('dictTypePlaceholder')" :disabled="isEdit">
          <YdSelectItem
            v-for="item in dictTypes"
            :key="item.typeCode ?? item.id ?? ''"
            :label="item.typeName ?? item.typeCode ?? ''"
            :value="item.typeCode ?? ''"
          />
        </YdSelect>
      </YdFormItem>
      <YdFormItem :label="t('itemCode')" prop="itemCode">
        <YdInput v-model="formData.itemCode" :placeholder="t('common.placeholder', [t('itemCode')])" :disabled="isEdit" />
      </YdFormItem>
      <YdFormItem :label="t('itemValue')" prop="itemValue">
        <YdInput v-model="formData.itemValue" :placeholder="t('common.placeholder', [t('itemValue')])" />
      </YdFormItem>
      <YdFormItem :label="t('sort')" prop="sort">
        <YdNumberFieldInput v-model="formData.sort" :min="0" :max="999" />
      </YdFormItem>
      <YdFormItem :label="t('description')">
        <YdInput v-model="formData.description" type="textarea" :rows="2" :placeholder="t('descriptionPlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('status')" prop="status">
        <YdRadioGroup v-model="formData.status">
          <YdRadioGroupItem value="1">{{ t('enabled') }}</YdRadioGroupItem>
          <YdRadioGroupItem value="0">{{ t('disabled') }}</YdRadioGroupItem>
        </YdRadioGroup>
      </YdFormItem>
    </YdForm>
  </Modal>
</template>
