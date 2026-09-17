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

import { emitDictChange } from '@ydsz/shared-business';

import { listAll } from '#/api/dict';
import { save, update } from '#/api/dictItem';
import type { DictItemVO, DictTypeVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();

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
  sortOrder: number;
  description: string;
  status: string;
}

const formData = reactive<DictItemFormState>({
  id: '',
  typeCode: '',
  itemCode: '',
  itemValue: '',
  sortOrder: 0,
  description: '',
  status: '1',
});

const rules = {
  typeCode: [{ required: true, message: '请选择字典类型', trigger: 'change' }],
  itemCode: [{ required: true, message: '请输入字典项编码', trigger: 'blur' }],
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
        sortOrder: data.record.sortOrder ?? 0,
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
        sortOrder: 0,
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
        showToast.success('更新成功');
      } else {
        await save(formData);
        showToast.success('创建成功');
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

const title = computed(() => (isEdit.value ? '编辑字典项' : '新增字典项'));
</script>

<template>
  <Modal :title="title">
    <YdForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <YdFormItem label="字典类型" prop="typeCode">
        <YdSelect v-model="formData.typeCode" placeholder="请选择字典类型" :disabled="isEdit">
          <YdSelectItem
            v-for="item in dictTypes"
            :key="item.typeCode ?? item.id ?? ''"
            :label="item.typeName ?? item.typeCode ?? ''"
            :value="item.typeCode ?? ''"
          />
        </YdSelect>
      </YdFormItem>
      <YdFormItem label="字典项编码" prop="itemCode">
        <YdInput v-model="formData.itemCode" placeholder="请输入字典项编码" :disabled="isEdit" />
      </YdFormItem>
      <YdFormItem label="字典值" prop="itemValue">
        <YdInput v-model="formData.itemValue" placeholder="请输入字典值" />
      </YdFormItem>
      <YdFormItem label="排序" prop="sortOrder">
        <YdNumberFieldInput v-model="formData.sortOrder" :min="0" :max="999" />
      </YdFormItem>
      <YdFormItem label="描述">
        <YdInput v-model="formData.description" type="textarea" :rows="2" placeholder="请输入描述" />
      </YdFormItem>
      <YdFormItem label="状态" prop="status">
        <YdRadioGroup v-model="formData.status">
          <YdRadioGroupItem value="1">启用</YdRadioGroupItem>
          <YdRadioGroupItem value="0">禁用</YdRadioGroupItem>
        </YdRadioGroup>
      </YdFormItem>
    </YdForm>
  </Modal>
</template>
