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
import { $t } from '@ydsz/locales';
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
  YdButton,
  YdCard,
  YdCardContent,
  YdCardHeader,
  YdCardTitle,
  YdCheckboxBase,
  YdSelectBase,
  YdSelectContentBase,
  YdSelectItemBase,
  YdSelectTriggerBase,
  YdSelectValueBase,
  YdUpload,
  YdForm,
  YdFormItem,
} from '@ydsz-core/ydsz-ui';
import type { UploadRequestOptions } from '@ydsz-core/ydsz-ui';

import { showToast } from '@ydsz/notification';

import { exportTemplates, importTemplates } from '#/api/importExport';
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
    showToast.warning($t('importExport.exportSelectGroupWarning'));
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
    showToast.success($t('operation.export.success'));
  } catch {
    showToast.error($t('operation.export.failed'));
  } finally {
    exporting.value = false;
  }
}

/** 导入模板 */
async function handleImport(options: UploadRequestOptions) {
  if (!importGroupId.value) {
    showToast.warning($t('importExport.importSelectGroupWarning'));
    return;
  }
  const file = options.file as File;
  const formData = new FormData();
  formData.append('groupId', String(importGroupId.value));
  formData.append('overwrite', String(overwriteOnImport.value));
  formData.append('file', file);
  try {
    const count = await importTemplates(formData);
    showToast.success($t('importExport.importSuccess', { count }));
  } catch {
    showToast.error($t('operation.import.failed'));
  }
}

onMounted(() => {
  void loadGroups();
});
</script>

<template>
  <div class="import-export p-5" style="max-width: 700px">
    <!-- 导出的卡片 -->
    <YdCard class="mb-4">
      <YdCardHeader>
        <YdCardTitle>{{ $t('importExport.exportTitle') }}</YdCardTitle>
      </YdCardHeader>
      <YdCardContent>
        <YdForm label-width="100px">
          <YdFormItem :label="$t('importExport.exportGroupLabel')">
            <YdSelectBase v-model="exportGroupId">
              <YdSelectTriggerBase>
                <YdSelectValueBase :placeholder="$t('importExport.exportGroupPlaceholder')" />
              </YdSelectTriggerBase>
              <YdSelectContentBase>
                <YdSelectItemBase
                  v-for="group in groupList"
                  :key="group.id"
                  :value="String(group.id)"
                >
                  {{
                    group.name +
                    ' (' +
                    (group.description || $t('importExport.exportNoDescription')) +
                    ')'
                  }}
                </YdSelectItemBase>
              </YdSelectContentBase>
            </YdSelectBase>
          </YdFormItem>
          <YdFormItem>
            <YdButton :loading="exporting" @click="handleExport">
              {{ $t('importExport.exportZipButton') }}
            </YdButton>
          </YdFormItem>
        </YdForm>
        <div class="mt-2 text-xs text-gray-500">
          {{ $t('importExport.exportHint') }}
        </div>
      </YdCardContent>
    </YdCard>

    <!-- 导入的卡片 -->
    <YdCard>
      <YdCardHeader>
        <YdCardTitle>{{ $t('importExport.importTitle') }}</YdCardTitle>
      </YdCardHeader>
      <YdCardContent>
        <YdForm label-width="100px">
          <YdFormItem :label="$t('importExport.importGroupLabel')">
            <YdSelectBase v-model="importGroupId">
              <YdSelectTriggerBase>
                <YdSelectValueBase :placeholder="$t('importExport.importGroupPlaceholder')" />
              </YdSelectTriggerBase>
              <YdSelectContentBase>
                <YdSelectItemBase
                  v-for="group in groupList"
                  :key="group.id"
                  :value="String(group.id)"
                >
                  {{
                    group.name +
                    ' (' +
                    (group.description || $t('importExport.importNoDescription')) +
                    ')'
                  }}
                </YdSelectItemBase>
              </YdSelectContentBase>
            </YdSelectBase>
          </YdFormItem>
          <YdFormItem :label="$t('importExport.importOverwriteLabel')">
            <div class="flex items-center gap-2">
              <YdCheckboxBase
                :checked="overwriteOnImport"
                @update:checked="overwriteOnImport = $event"
              />
              <label class="cursor-pointer text-sm">
                {{ $t('importExport.importOverwriteHint') }}
              </label>
            </div>
          </YdFormItem>
          <YdFormItem :label="$t('importExport.importZipLabel')">
            <YdUpload
              :auto-upload="true"
              :show-file-list="true"
              :http-request="handleImport"
              accept=".zip"
              :limit="1"
            >
              <YdButton>{{ $t('importExport.importSelectZipButton') }}</YdButton>
            </YdUpload>
          </YdFormItem>
        </YdForm>
        <div class="mt-2 text-xs text-gray-500">
          {{ $t('importExport.importHint') }}
        </div>
      </YdCardContent>
    </YdCard>
  </div>
</template>
