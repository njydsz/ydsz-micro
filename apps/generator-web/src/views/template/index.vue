<!--
 * 模板管理（主面板）
 *
 * <p>左侧模板分组列表，右侧当前分组模板列表，支持编辑模板内容。
 *
 * @path apps/generator-web/src/views/template/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 模板管理主面板。
 *
 * <p>左栏管理模板分组（激活/创建/删除），右栏管理分组下的模板列表（编辑内容）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { onMounted, ref } from 'vue';

import {
  ElButton,
  ElEmpty,
  ElMessage,
  ElMessageBox,
  ElTag,
  ElTree,
} from 'element-plus';

import {
  activateGroup,
  createGroup,
  deleteGroup,
  listGroups,
} from '#/api/template';
import type { GenTemplate, GenTemplateGroup } from '#/api/models';
import {
  getActiveGroup,
  listTemplates,
  searchTemplates,
  updateTemplate,
} from '#/api/template';

import TemplateGroupForm from './template-group-form.vue';
import TemplateForm from './template-form.vue';

defineOptions({ name: 'TemplateManagement' });

// ══════ 分组管理 ══════

const groupList = ref<GenTemplateGroup[]>([]);
const selectedGroupId = ref<number | undefined>(undefined);
const selectedGroupName = ref('');
const groupFormVisible = ref(false);
const editingGroup = ref<GenTemplateGroup | null>(null);

// ══════ 模板管理 ══════

const templateList = ref<GenTemplate[]>([]);
const templatesLoading = ref(false);
const searchKeyword = ref('');
const templateFormVisible = ref(false);
const editingTemplate = ref<GenTemplate | null>(null);

// ══════ 分组操作 ══════

async function loadGroups() {
  groupList.value = await listGroups();
  const active = await getActiveGroup().catch(() => null);
  if (active?.id) {
    selectedGroupId.value = active.id;
    selectedGroupName.value = active.name;
    await loadTemplates();
  } else if (groupList.value.length > 0) {
    selectedGroupId.value = groupList.value[0]?.id;
    selectedGroupName.value = groupList.value[0]?.name ?? '';
    await loadTemplates();
  }
}

function handleGroupSelect(group: GenTemplateGroup) {
  if (!group.id) return;
  selectedGroupId.value = group.id;
  selectedGroupName.value = group.name;
  void loadTemplates();
}

async function handleActivateGroup(group: GenTemplateGroup) {
  if (!group.id) return;
  try {
    await activateGroup({ id: group.id });
    ElMessage.success(`已激活分组「${group.name}」`);
    await loadGroups();
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

/**
 * 新建模板分组。
 *
 * <p>清空编辑对象并打开分组表单弹窗。
 */
function handleAddGroup() {
  editingGroup.value = null;
  groupFormVisible.value = true;
}

/**
 * 编辑模板分组。
 *
 * <p>将当前分组数据绑定到表单并打开弹窗。
 *
 * @param group - 待编辑的分组数据
 */
function handleEditGroup(group: GenTemplateGroup) {
  editingGroup.value = group;
  groupFormVisible.value = true;
}

/**
 * 删除模板分组。
 *
 * <p>弹出二次确认对话框（系统分组不可删除），确认后调用后端删除接口，成功后刷新列表。
 *
 * @param group - 待删除的分组数据
 */
async function handleDeleteGroup(group: GenTemplateGroup) {
  if (!group.id) return;
  if (group.isSystem) {
    ElMessage.warning('系统分组不可删除');
    return;
  }
  try {
    await ElMessageBox.confirm(`确定删除分组「${group.name}」吗？`, '删除确认', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await deleteGroup({ id: group.id });
    ElMessage.success('删除成功');
    if (selectedGroupId.value === group.id) {
      selectedGroupId.value = undefined;
      templateList.value = [];
    }
    await loadGroups();
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

async function handleGroupFormSubmit(data: { name: string; description: string; sortOrder?: number }) {
  await createGroup({
    name: data.name,
    description: data.description,
    sortOrder: data.sortOrder ?? 0,
    isSystem: false,
  });
  ElMessage.success('创建分组成功');
  await loadGroups();
  groupFormVisible.value = false;
}

// ══════ 模板操作 ══════

async function loadTemplates() {
  if (!selectedGroupId.value) return;
  templatesLoading.value = true;
  try {
    if (searchKeyword.value.trim()) {
      templateList.value = await searchTemplates({
        groupId: selectedGroupId.value,
        keyword: searchKeyword.value.trim(),
      });
    } else {
      templateList.value = await listTemplates({ groupId: selectedGroupId.value });
    }
  } finally {
    templatesLoading.value = false;
  }
}

/**
 * 编辑模板内容。
 *
 * <p>将模板数据复制到编辑对象并打开模板编辑弹窗。
 *
 * @param template - 待编辑的模板数据
 */
function handleEditTemplate(template: GenTemplate) {
  editingTemplate.value = { ...template };
  templateFormVisible.value = true;
}

async function handleSaveTemplate(data: { id: number; content: string }) {
  try {
    await updateTemplate({ id: data.id, content: data.content });
    ElMessage.success('模板更新成功');
    await loadTemplates();
    templateFormVisible.value = false;
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

function handleSearch() {
  void loadTemplates();
}

onMounted(() => {
  void loadGroups();
});
</script>

<template>
  <div class="template-management flex gap-4 p-4" style="height: calc(100vh - 120px)">
    <!-- 左侧：分组列表 -->
    <div class="w-64 flex-shrink-0">
      <div class="mb-3 flex items-center justify-between">
        <span class="font-medium">模板分组</span>
        <ElButton type="primary" size="small" @click="handleAddGroup">新建</ElButton>
      </div>
      <div class="space-y-2">
        <div
          v-for="group in groupList"
          :key="group.id"
          class="p-3 rounded cursor-pointer border transition-colors"
          :class="{
            'border-blue-500 bg-blue-50': selectedGroupId === group.id,
            'border-gray-200 hover:border-gray-300': selectedGroupId !== group.id,
          }"
          @click="handleGroupSelect(group)"
        >
          <div class="flex items-center justify-between">
            <div>
              <span class="font-medium">{{ group.name }}</span>
              <ElTag v-if="group.isActive" type="success" size="small" class="ml-2">
                使用中
              </ElTag>
              <ElTag v-if="group.isSystem" type="info" size="small" class="ml-2">
                系统
              </ElTag>
            </div>
          </div>
          <div v-if="group.description" class="text-xs text-gray-500 mt-1">
            {{ group.description }}
          </div>
          <div class="mt-2 flex gap-1">
            <ElButton
              v-if="!group.isActive"
              size="small"
              link
              type="success"
              @click.stop="handleActivateGroup(group)"
            >
              激活
            </ElButton>
            <ElButton
              v-if="!group.isSystem"
              size="small"
              link
              type="danger"
              @click.stop="handleDeleteGroup(group)"
            >
              删除
            </ElButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧：模板列表 -->
    <div class="flex-1 flex flex-col">
      <div class="mb-3 flex items-center gap-3">
        <span class="font-medium">「{{ selectedGroupName }}」分组模板</span>
        <ElInput
          v-model="searchKeyword"
          placeholder="搜索文件名..."
          style="width: 200px"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <ElButton @click="handleSearch">搜索</ElButton>
      </div>

      <div v-loading="templatesLoading" class="flex-1 overflow-auto">
        <div
          v-if="templateList.length > 0"
          class="grid grid-cols-3 gap-3"
        >
          <div
            v-for="tpl in templateList"
            :key="tpl.id"
            class="p-3 border rounded cursor-pointer hover:shadow-md transition-shadow"
            @click="handleEditTemplate(tpl)"
          >
            <div class="flex items-center justify-between">
              <span class="font-medium text-sm break-all">{{ tpl.fileName }}</span>
              <ElTag v-if="!tpl.isActive" type="info" size="small">禁用</ElTag>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              {{ tpl.description || '无描述' }}
            </div>
            <div class="text-xs text-gray-400 mt-1">
              v{{ tpl.version ?? 1 }} | {{ tpl.parentPath || '/' }}
            </div>
          </div>
        </div>
        <ElEmpty v-else description="该分组暂无模板" />
      </div>
    </div>
  </div>

  <!-- 对话框 -->
  <TemplateGroupForm
    v-if="groupFormVisible"
    v-model:visible="groupFormVisible"
    @submit="handleGroupFormSubmit"
  />
  <TemplateForm
    v-if="templateFormVisible"
    v-model:visible="templateFormVisible"
    :template="editingTemplate"
    @save="handleSaveTemplate"
  />
</template>
