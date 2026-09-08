<!--
 * 流程分类（表单组件）
 *
 * @path apps\workflow-web\src\views\category\category-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 流程分类（表单组件）
 * <p>流程分类的创建/编辑表单，字段对应契约 FlowCategoryDTO（src/api/flowCategory.ts，auto-generated）：
 * categoryCode/categoryName/parentId/sortNum/icon/remark，父分类级联选项来自 tree()。
 * 提交走 create/update，成功后 emit('success') 并关闭弹窗。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import { ElCascader, ElForm, ElFormItem, ElInput, ElInputNumber, ElMessage } from 'element-plus';
import { computed, reactive, ref } from 'vue';
import { create, tree, update } from '#/api/flowCategory';
import type { FlowCategoryDTO, FlowCategoryTreeVO, FlowCategoryVO } from '#/api/models';
import { createLogger } from '@ydsz-core/shared/utils';
import { useI18n } from 'vue-i18n';

const logger = createLogger('workflow-category');
const { t } = useI18n();

const emit = defineEmits<{ success: [] }>();
const formRef = ref();
const isEdit = ref(false);

/** 父分类级联选项（由 FlowCategoryTreeVO 递归构造） */
interface CategoryOption {
  value: string;
  label: string;
  children?: CategoryOption[];
}

/** 表单状态（字段对应 FlowCategoryDTO） */
interface CategoryFormState {
  id: string;
  categoryCode: string;
  categoryName: string;
  parentId: string;
  sortNum: number;
  icon: string;
  remark: string;
}

const formData = reactive<CategoryFormState>({
  id: '',
  categoryCode: '',
  categoryName: '',
  parentId: '',
  sortNum: 0,
  icon: '',
  remark: '',
});

const rules = {
  categoryCode: [{ required: true, message: t('category.code.required'), trigger: 'blur' }],
  categoryName: [{ required: true, message: t('category.name.required'), trigger: 'blur' }],
};

const parentOptions = ref<CategoryOption[]>([]);

/** 递归将分类树转换为级联选择器数据结构 */
function toCascaderOptions(nodes: FlowCategoryTreeVO[] | undefined): CategoryOption[] {
  return (nodes ?? []).map((node) => ({
    value: node.id ?? '',
    label: node.categoryName ?? node.categoryCode ?? '',
    children: toCascaderOptions(node.children),
  }));
}

/** 加载父分类树（每次打开时刷新，保证新增分类后可选） */
async function loadParentTree() {
  try {
    const nodes = (await tree()) ?? [];
    parentOptions.value = toCascaderOptions(nodes);
  } catch (error) {
    logger.warn('加载父分类树失败', error);
    parentOptions.value = [];
  }
}

function resetForm() {
  Object.assign(formData, {
    id: '',
    categoryCode: '',
    categoryName: '',
    parentId: '',
    sortNum: 0,
    icon: '',
    remark: '',
  });
}

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    loadParentTree();
    const data = modalApi.getData<{ record?: FlowCategoryVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        id: data.record.id ?? '',
        categoryCode: data.record.categoryCode ?? '',
        categoryName: data.record.categoryName ?? '',
        parentId: data.record.parentId ?? '',
        sortNum: data.record.sortNum ?? 0,
        icon: data.record.icon ?? '',
        remark: data.record.remark ?? '',
      });
    } else {
      isEdit.value = false;
      resetForm();
    }
  },
  onConfirm: async () => {
    try {
      await formRef.value?.validate();
    } catch (error) {
      logger.warn('流程分类表单验证失败', error);
      return;
    }
    modalApi.lock();
    try {
      const payload: FlowCategoryDTO = {
        id: formData.id || undefined,
        categoryCode: formData.categoryCode,
        categoryName: formData.categoryName,
        parentId: formData.parentId || undefined,
        sortNum: formData.sortNum,
        icon: formData.icon || undefined,
        remark: formData.remark || undefined,
      };
      if (isEdit.value) {
        await update(payload);
        ElMessage.success(t('category.update.success'));
      } else {
        await create(payload);
        ElMessage.success(t('category.create.success'));
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => (isEdit.value ? t('category.edit.title') : t('category.add.title')));
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
      <ElFormItem :label="t('category.code.label')" prop="categoryCode">
        <ElInput v-model="formData.categoryCode" :placeholder="t('category.code.placeholder')" :disabled="isEdit" />
      </ElFormItem>
      <ElFormItem :label="t('category.name.label')" prop="categoryName">
        <ElInput v-model="formData.categoryName" :placeholder="t('category.name.placeholder')" />
      </ElFormItem>
      <ElFormItem :label="t('category.parent.label')">
        <ElCascader
          v-model="formData.parentId"
          :options="parentOptions"
          :props="{ emitPath: false, checkStrictly: true }"
          :placeholder="t('category.parent.placeholder')"
          clearable
        />
      </ElFormItem>
      <ElFormItem :label="t('common.sort.label')">
        <ElInputNumber v-model="formData.sortNum" :min="0" :max="999" />
      </ElFormItem>
      <ElFormItem :label="t('category.icon.label')">
        <ElInput v-model="formData.icon" :placeholder="t('category.icon.placeholder')" />
      </ElFormItem>
      <ElFormItem :label="t('common.remark.label')">
        <ElInput v-model="formData.remark" type="textarea" :rows="2" :placeholder="t('common.remark.placeholder')" />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
