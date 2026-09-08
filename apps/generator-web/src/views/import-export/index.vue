<!--
 * 导入导出（模板分组 zip）
 *
 * <p>导出模板分组为 zip 压缩包 / 从 zip 导入模板到指定分组。
 *
 * @path apps/generator-web/src/views/import-export/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 导入导出页面。
 *
 * <p>导出模板分组为 zip 压缩包 / 从 zip 导入模板到指定分组。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { onMounted, ref } from 'vue';

import {
  ElCard,
  ElCheckbox,
  ElForm,
  ElFormItem,
  ElMessage,
  ElOption,
  ElSelect,
  ElUpload,
} from 'element-plus';
import type { UploadRequestOptions } from 'element-plus';

import { exportTemplates, importTemplates } from '#/api/import-export';
import { listGroups } from '#/api/template';
import type { GenTemplateGroup } from '#/api/models';

defineOptions({ name: 'ImportExportManagement' });

const groupList = ref<GenTemplateGroup[]>([]);
const exportGroupId = ref<number | undefined>(undefined);
const importGroupId = ref<number | undefined>(undefined);
const overwriteOnImport = ref(false);
const exporting = ref(false);

/** 加载分组列表 */
async function loadGroups() {
  groupList.value = await listGroups();
  if (groupList.value.length > 0) {
    exportGroupId.value = groupList.value[0]?.id;
    importGroupId.value = groupList.value[0]?.id;
  }
}

/** 导出模板 */
async function handleExport() {
  if (!exportGroupId.value) {
    ElMessage.warning('请选择要导出的模板分组');
    return;
  }
  exporting.value = true;
  try {
    const blob = await exportTemplates({ groupId: exportGroupId.value });
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const group = groupList.value.find((g) => g.id === exportGroupId.value);
    link.download = `generator-templates-${group?.name ?? 'export'}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    ElMessage.success('导出成功');
  } catch {
    ElMessage.error('导出失败');
  } finally {
    exporting.value = false;
  }
}

/** 导入模板 */
async function handleImport(options: UploadRequestOptions) {
  if (!importGroupId.value) {
    ElMessage.warning('请选择目标模板分组');
    return;
  }
  const file = options.file as File;
  const formData = new FormData();
  formData.append('groupId', String(importGroupId.value));
  formData.append('overwrite', String(overwriteOnImport.value));
  formData.append('file', file);
  try {
    const count = await importTemplates(formData);
    ElMessage.success(`导入成功，共导入 ${count} 个模板`);
  } catch {
    ElMessage.error('导入失败');
  }
}

onMounted(() => {
  void loadGroups();
});
</script>

<template>
  <div class="import-export p-4" style="max-width: 700px">
    <!-- 导出的卡片 -->
    <ElCard class="mb-4" shadow="hover">
      <template #header>
        <div class="flex items-center gap-2">
          <span class="font-medium">导出模板分组为 ZIP</span>
        </div>
      </template>
      <ElForm label-width="100px">
        <ElFormItem label="选择分组">
          <ElSelect
            v-model="exportGroupId"
            placeholder="选择要导出的模板分组"
            style="width: 100%"
          >
            <ElOption
              v-for="group in groupList"
              :key="group.id"
              :label="`${group.name} (${group.description || '无描述'})`"
              :value="group.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElButton
            type="primary"
            :loading="exporting"
            @click="handleExport"
          >
            导出 ZIP
          </ElButton>
        </ElFormItem>
      </ElForm>
      <div class="text-xs text-gray-500 mt-2">
        导出当前分组的所有 Velocity 模板文件为 ZIP 压缩包，可作为备份或跨环境迁移。
      </div>
    </ElCard>

    <!-- 导入的卡片 -->
    <ElCard shadow="hover">
      <template #header>
        <div class="flex items-center gap-2">
          <span class="font-medium">从 ZIP 导入模板</span>
        </div>
      </template>
      <ElForm label-width="100px">
        <ElFormItem label="目标分组">
          <ElSelect
            v-model="importGroupId"
            placeholder="选择导入到的模板分组"
            style="width: 100%"
          >
            <ElOption
              v-for="group in groupList"
              :key="group.id"
              :label="`${group.name} (${group.description || '无描述'})`"
              :value="group.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="覆盖模式">
          <ElCheckbox v-model="overwriteOnImport">
            覆盖已有模板（不勾选则跳过同名模板）
          </ElCheckbox>
        </ElFormItem>
        <ElFormItem label="ZIP 文件">
          <ElUpload
            :auto-upload="true"
            :show-file-list="true"
            :http-request="handleImport"
            accept=".zip"
            :limit="1"
          >
            <ElButton type="primary">选择 ZIP 文件</ElButton>
          </ElUpload>
        </ElFormItem>
      </ElForm>
      <div class="text-xs text-gray-500 mt-2">
        从 ZIP 压缩包导入模板到指定分组。ZIP 文件应包含 Velocity 模板文件。
      </div>
    </ElCard>
  </div>
</template>
