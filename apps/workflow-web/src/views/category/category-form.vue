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
  categoryCode: [{ required: true, message: '请输入分类编码', trigger: 'blur' }],
  categoryName: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
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
  } catch {
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
    } catch {
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

const title = computed(() => (isEdit.value ? '编辑流程分类' : '新增流程分类'));
</script>

<template>
  <Modal :title="title">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="分类编码" prop="categoryCode">
        <ElInput v-model="formData.categoryCode" placeholder="请输入分类编码" :disabled="isEdit" />
      </ElFormItem>
      <ElFormItem label="分类名称" prop="categoryName">
        <ElInput v-model="formData.categoryName" placeholder="请输入分类名称" />
      </ElFormItem>
      <ElFormItem label="父分类">
        <ElCascader
          v-model="formData.parentId"
          :options="parentOptions"
          :props="{ emitPath: false, checkStrictly: true }"
          placeholder="请选择父分类（可选）"
          clearable
        />
      </ElFormItem>
      <ElFormItem label="排序">
        <ElInputNumber v-model="formData.sortNum" :min="0" :max="999" />
      </ElFormItem>
      <ElFormItem label="图标">
        <ElInput v-model="formData.icon" placeholder="请输入图标标识（可选）" />
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>