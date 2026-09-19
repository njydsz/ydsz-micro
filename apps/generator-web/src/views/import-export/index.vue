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

import { YdButton, YdCard, YdCardContent, YdCardHeader, YdCardTitle, YdCheckboxBase, YdSelectBase, YdSelectContentBase, YdSelectItemBase, YdSelectTriggerBase, YdSelectValueBase, YdUpload, YdForm, YdFormItem } from '@ydsz-core/ydsz-ui';
import type { UploadRequestOptions } from '@ydsz-core/ydsz-ui';

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
    showToast.warning('请选择要导出的模板分组');
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
    showToast.success('导出成功');
  } catch {
    showToast.error('导出失败');
  } finally {
    exporting.value = false;
  }
}

/** 导入模板 */
async function handleImport(options: UploadRequestOptions) {
  if (!importGroupId.value) {
    showToast.warning('请选择目标模板分组');
    return;
  }
  const file = options.file as File;
  const formData = new FormData();
  formData.append('groupId', String(importGroupId.value));
  formData.append('overwrite', String(overwriteOnImport.value));
  formData.append('file', file);
  try {
    const count = await importTemplates(formData);
    showToast.success(`导入成功，共导入 ${count} 个模板`);
  } catch {
    showToast.error('导入失败');
  }
}

onMounted(() => {
  void loadGroups();
});
</script>

<template>
  <div class="import-export p-4" style="max-width: 700px">
    <!-- 导出的卡片 -->
    <YdCard class="mb-4">
      <YdCardHeader>
        <YdCardTitle>导出模板分组为 ZIP</YdCardTitle>
      </YdCardHeader>
      <YdCardContent>
        <YdForm label-width="100px">
          <YdFormItem label="选择分组">
            <YdSelectBase v-model="exportGroupId">
              <YdSelectTriggerBase>
                <YdSelectValueBase placeholder="选择要导出的模板分组" />
              </YdSelectTriggerBase>
              <YdSelectContentBase>
                <YdSelectItemBase
                  v-for="group in groupList"
                  :key="group.id"
                  :value="String(group.id)"
                >
                  {{ group.name }} ({{ group.description || '无描述' }})
                </YdSelectItemBase>
              </YdSelectContentBase>
            </YdSelectBase>
          </YdFormItem>
          <YdFormItem>
            <YdButton
              :loading="exporting"
              @click="handleExport"
            >
              导出 ZIP
            </YdButton>
          </YdFormItem>
        </YdForm>
        <div class="text-xs text-gray-500 mt-2">
          导出当前分组的所有 Velocity 模板文件为 ZIP 压缩包，可作为备份或跨环境迁移。
        </div>
      </YdCardContent>
    </YdCard>

    <!-- 导入的卡片 -->
    <YdCard>
      <YdCardHeader>
        <YdCardTitle>从 ZIP 导入模板</YdCardTitle>
      </YdCardHeader>
      <YdCardContent>
        <YdForm label-width="100px">
          <YdFormItem label="目标分组">
            <YdSelectBase v-model="importGroupId">
              <YdSelectTriggerBase>
                <YdSelectValueBase placeholder="选择导入到的模板分组" />
              </YdSelectTriggerBase>
              <YdSelectContentBase>
                <YdSelectItemBase
                  v-for="group in groupList"
                  :key="group.id"
                  :value="String(group.id)"
                >
                  {{ group.name }} ({{ group.description || '无描述' }})
                </YdSelectItemBase>
              </YdSelectContentBase>
            </YdSelectBase>
          </YdFormItem>
          <YdFormItem label="覆盖模式">
            <div class="flex items-center gap-2">
              <YdCheckboxBase
                :checked="overwriteOnImport"
                @update:checked="overwriteOnImport = $event"
              />
              <label class="cursor-pointer text-sm">覆盖已有模板（不勾选则跳过同名模板）</label>
            </div>
          </YdFormItem>
          <YdFormItem label="ZIP 文件">
            <YdUpload
              :auto-upload="true"
              :show-file-list="true"
              :http-request="handleImport"
              accept=".zip"
              :limit="1"
            >
              <YdButton>选择 ZIP 文件</YdButton>
            </YdUpload>
          </YdFormItem>
        </YdForm>
        <div class="text-xs text-gray-500 mt-2">
          从 ZIP 压缩包导入模板到指定分组。ZIP 文件应包含 Velocity 模板文件。
        </div>
      </YdCardContent>
    </YdCard>
  </div>
</template>
