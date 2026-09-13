<!--
 * 空间模板管理
 *
 * <p>提供空间模板的增删改查能力，支持系统公开模板查看与租户自定义模板维护。
 * <p>对应后端契约 SpaceTemplateController（apps/nextwiki-web/src/api/spaceTemplate.ts）。
 *
 * @path apps\nextwiki-web\src\views\space\template-manage.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 空间模板管理
 * <p>消费后端契约 SpaceTemplateController：
 * listTemplates() 查询模板、createTemplate() 创建模板、updateTemplate() 更新模板、
 * deleteTemplate() 删除模板、useTemplate() 使用模板创建空间。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox, ElTable, ElTableColumn, ElTag } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';

import type { SpaceTemplateDTO } from '#/api/models';
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
  updateTemplate,
} from '#/api/spaceTemplate';
import { Page } from '@ydsz/common-ui';
import { createLogger } from '@ydsz-core/shared/utils';
import { useI18n } from 'vue-i18n';

const logger = createLogger('nextwiki-template');
const { t } = useI18n();

defineOptions({ name: 'SpaceTemplateManage' });

/** 模板列表 */
const templateList = ref<SpaceTemplateDTO[]>([]);
const listLoading = ref(false);

/** 编辑弹窗状态 */
const dialogVisible = ref(false);
const editingId = ref<string | undefined>(undefined);
const formRef = ref();
const formLoading = ref(false);

interface TemplateFormData {
  name: string;
  description: string;
  category: string;
  isSystem: boolean;
}

const formData = reactive<TemplateFormData>({
  name: '',
  description: '',
  category: '',
  isSystem: false,
});

const formRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
};

/** 加载模板列表 */
async function loadTemplates(): Promise<void> {
  listLoading.value = true;
  try {
    templateList.value = await listTemplates({});
  } catch (error) {
    logger.warn('加载模板列表失败: {}', error);
    templateList.value = [];
  } finally {
    listLoading.value = false;
  }
}

/** 打开新建弹窗 */
function handleCreate(): void {
  editingId.value = undefined;
  formData.name = '';
  formData.description = '';
  formData.category = '';
  formData.isSystem = false;
  dialogVisible.value = true;
}

/** 打开编辑弹窗 */
function handleEdit(row: SpaceTemplateDTO): void {
  editingId.value = row.id;
  formData.name = row.name ?? '';
  formData.description = row.description ?? '';
  formData.category = row.category ?? '';
  formData.isSystem = row.isSystem ?? false;
  dialogVisible.value = true;
}

/** 提交表单 */
async function handleSubmit(): Promise<void> {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  formLoading.value = true;
  try {
    const payload = {
      name: formData.name,
      description: formData.description,
      category: formData.category || undefined,
    };
    if (editingId.value) {
      await updateTemplate({ templateId: editingId.value }, payload);
      ElMessage.success('更新模板成功');
    } else {
      await createTemplate(payload);
      ElMessage.success('创建模板成功');
    }
    dialogVisible.value = false;
    loadTemplates();
  } catch (error) {
    logger.warn('保存模板失败: {}', error);
  } finally {
    formLoading.value = false;
  }
}

/** 删除模板 */
async function handleDelete(row: SpaceTemplateDTO): Promise<void> {
  if (!row.id) return;
  if (row.isSystem) {
    ElMessage.warning('系统模板不可删除');
    return;
  }
  try {
    await ElMessageBox.confirm(`确定删除模板「${row.name}」？`, '删除确认', { type: 'warning' });
    await deleteTemplate({ templateId: row.id });
    ElMessage.success('删除模板成功');
    loadTemplates();
  } catch (error) {
    if (error !== 'cancel') {
      logger.warn('删除模板失败: {}', error);
    }
  }
}

onMounted(() => {
  loadTemplates();
});
</script>

<template>
  <Page auto-content-height>
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-medium">空间模板管理</h2>
      <ElButton type="primary" @click="handleCreate">新建模板</ElButton>
    </div>

    <ElTable :data="templateList" :loading="listLoading" border stripe>
      <ElTableColumn prop="name" label="模板名称" min-width="160" />
      <ElTableColumn prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <ElTableColumn prop="category" label="分类" width="120">
        <template #default="{ row }">
          <ElTag v-if="row.category" size="small">{{ row.category }}</ElTag>
          <span v-else class="text-gray-400">-</span>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="isSystem" label="类型" width="100">
        <template #default="{ row }">
          <ElTag :type="row.isSystem ? 'warning' : 'info'" size="small">
            {{ row.isSystem ? '系统' : '自定义' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <ElButton link size="small" type="primary" @click="handleEdit(row)">编辑</ElButton>
          <ElButton
            link
            size="small"
            type="danger"
            :disabled="row.isSystem}"
            @click="handleDelete(row)"
          >
            删除
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <!-- 编辑弹窗 -->
    <ElDialog
      v-model="dialogVisible"
      :title="editingId ? '编辑模板' : '新建模板'"
      width="500px"
    >
      <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <ElFormItem label="名称" prop="name">
          <ElInput v-model="formData.name" placeholder="请输入模板名称" />
        </ElFormItem>
        <ElFormItem label="描述" prop="description">
          <ElInput v-model="formData.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </ElFormItem>
        <ElFormItem label="分类" prop="category">
          <ElInput v-model="formData.category" placeholder="如：项目管理、技术文档" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="formLoading" @click="handleSubmit">确定</ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
