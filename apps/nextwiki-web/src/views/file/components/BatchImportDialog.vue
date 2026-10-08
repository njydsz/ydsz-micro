<!--
 * 批量导入弹窗组件
 *
 * <p>提供多文件上传和 ZIP 导入两种模式，支持目录树选择目标父目录、
 * 文件拖拽上传、导入进度展示和导入结果反馈。
 *
 * @path apps\nextwiki-web\src\views\file\components\BatchImportDialog.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 批量导入弹窗组件
 * <p>消费后端契约 BatchImportController（apps/nextwiki-web/src/api/batchImport.ts）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { createLogger } from '@ydsz-core/shared/utils';
import { useI18n } from 'vue-i18n';
import {
  YdButton,
  YdDialog,
  YdDialogContent,
  YdDialogFooter,
  YdDialogHeader,
  YdDialogTitle,
  YdInput,
  YdProgress,
  YdTabs,
  YdTabsContent,
  YdTabsList,
  YdTabsTrigger,
  YdUpload,
} from '@ydsz-core/ydsz-ui';
import { computed, reactive, ref, watch } from 'vue';
import { batchUpload, importZip } from '#/api/batchImport';
import { listFiles } from '#/api/file';
import type { FileNodeVO } from '#/api/models';

defineOptions({ name: 'BatchImportDialog' });

const logger = createLogger('batch-import-dialog');
const { t } = useI18n();

/** 弹窗可见性 */
const visible = defineModel<boolean>({ default: false });

/** 导入类型：多文件 / ZIP */
const importType = ref<'files' | 'zip'>('files');

/** 导入状态：idle / uploading / done */
const importStatus = ref<'idle' | 'uploading' | 'done'>('idle');

/** 上传进度（0-100） */
const uploadProgress = ref(0);

/** 多文件列表 */
const fileList = ref<File[]>([]);

/** ZIP 文件 */
const zipFile = ref<File | null>(null);

/** 导入结果 */
interface ImportResult {
  successCount: number;
  failureCount: number;
  errors: string[];
}

const importResult = ref<ImportResult | null>(null);

/** 导入加载状态 */
const loading = ref(false);

/** 目标父目录 ID */
const targetParentId = ref('');

/** 目录树数据 */
interface DirectoryNode {
  id: string;
  name: string;
  children?: DirectoryNode[];
  isLoading?: boolean;
  loaded?: boolean;
}

const directoryTree = ref<DirectoryNode[]>([]);

/** 目录选择弹窗可见性 */
const dirSelectVisible = ref(false);

/** 当前选中的目录显示名 */
const selectedDirLabel = ref('根目录');

/** 目录搜索关键字 */
const dirSearchKeyword = ref('');

/** 目录树 loading */
const dirTreeLoading = ref(false);

/** 表单数据 */
const formData = reactive({
  parentId: '',
});

/** 重置状态 */
function resetState(): void {
  importType.value = 'files';
  importStatus.value = 'idle';
  uploadProgress.value = 0;
  fileList.value = [];
  zipFile.value = null;
  importResult.value = null;
  loading.value = false;
  formData.parentId = '';
  targetParentId.value = '';
  selectedDirLabel.value = '根目录';
}

/** 监听弹窗打开 */
watch(visible, (val) => {
  if (val) {
    resetState();
    loadDirectoryTree();
  }
});

/** 加载目录树根节点 */
async function loadDirectoryTree(): Promise<void> {
  dirTreeLoading.value = true;
  try {
    const res = await listFiles({ type: 'FOLDER' });
    const folders = res.data ?? [];
    directoryTree.value = folders
      .filter((f): f is FileNodeVO => f.nodeType === 'FOLDER')
      .map((f) => ({
        id: f.id ?? '',
        name: f.name ?? '未命名',
        children: undefined,
        isLoading: false,
        loaded: false,
      }));
  } catch (error) {
    logger.warn('加载目录树失败: {}', error);
  } finally {
    dirTreeLoading.value = false;
  }
}

/** 懒加载子目录 */
async function loadChildren(node: DirectoryNode): Promise<void> {
  if (node.loaded || node.isLoading) return;
  node.isLoading = true;
  try {
    const res = await listFiles({ parentId: node.id, type: 'FOLDER' });
    const folders = res.data ?? [];
    node.children = folders
      .filter((f): f is FileNodeVO => f.nodeType === 'FOLDER')
      .map((f) => ({
        id: f.id ?? '',
        name: f.name ?? '未命名',
        children: undefined,
        isLoading: false,
        loaded: false,
      }));
    node.loaded = true;
  } catch (error) {
    logger.warn('加载子目录失败: {}', error);
  } finally {
    node.isLoading = false;
  }
}

/** 确认选择目录 */
function confirmDirSelection(): void {
  targetParentId.value = formData.parentId;
  if (!targetParentId.value) {
    selectedDirLabel.value = t('batchImport.rootDirectory');
  } else {
    const name = findDirName(directoryTree.value, targetParentId.value);
    selectedDirLabel.value = name ?? targetParentId.value;
  }
  dirSelectVisible.value = false;
}

/** 处理文件变更（多文件） */
function handleFileChange(_file: unknown, fileListRaw: unknown): void {
  const list = (fileListRaw as Array<{ raw?: File }>).map((f) => f.raw).filter(Boolean) as File[];
  fileList.value = list;
}

/** 移除单个文件 */
function handleFileRemove(file: File): void {
  fileList.value = fileList.value.filter((f) => f !== file && f.name !== file.name);
}

/** 处理 ZIP 文件变更 */
function handleZipChange(_file: unknown, fileListRaw: unknown): void {
  const list = fileListRaw as Array<{ raw?: File }>;
  zipFile.value = list.length > 0 ? (list[0]?.raw ?? null) : null;
}

/** 格式化文件大小 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** 执行多文件批量导入 */
async function executeBatchUpload(): Promise<void> {
  if (fileList.value.length === 0) {
    showToast.warning(t('batchImport.selectFilesPrompt'));
    return;
  }
  loading.value = true;
  importStatus.value = 'uploading';
  uploadProgress.value = 0;

  try {
    // 模拟进度增长
    const progressTimer = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value = Math.min(uploadProgress.value + Math.random() * 15, 90);
      }
    }, 500);

    const files = fileList.value.map((f) => f as unknown as Record<string, unknown>);
    const result = await batchUpload({
      files,
      parentId: targetParentId.value || undefined,
    });

    clearInterval(progressTimer);
    uploadProgress.value = 100;
    importStatus.value = 'done';

    // 解析返回结果
    const resultMap = result as Record<string, unknown>;
    importResult.value = {
      successCount: (resultMap?.successCount as number) ?? fileList.value.length,
      failureCount: (resultMap?.failureCount as number) ?? 0,
      errors: [],
    };

    if (importResult.value.failureCount === 0) {
      showToast.success(t('batchImport.importSuccess', { count: fileList.value.length }));
    } else {
      showToast.warning(`部分文件导入成功（${importResult.value.successCount}/${fileList.value.length}）`);
    }
  } catch (error) {
    logger.warn('批量上传失败: {}', error);
    importStatus.value = 'done';
    importResult.value = {
      successCount: 0,
      failureCount: fileList.value.length,
      errors: [String(error)],
    };
  } finally {
    loading.value = false;
  }
}

/** 执行 ZIP 导入 */
async function executeZipImport(): Promise<void> {
  if (!zipFile.value) {
    showToast.warning(t('batchImport.selectZipPrompt'));
    return;
  }
  loading.value = true;
  importStatus.value = 'uploading';
  uploadProgress.value = 0;

  try {
    const progressTimer = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value = Math.min(uploadProgress.value + Math.random() * 10, 90);
      }
    }, 600);

    const result = await importZip({
      file: zipFile.value as unknown as Record<string, unknown>,
      parentId: targetParentId.value || undefined,
    });

    clearInterval(progressTimer);
    uploadProgress.value = 100;
    importStatus.value = 'done';

    const resultMap = result as Record<string, unknown>;
    importResult.value = {
      successCount: (resultMap?.successCount as number) ?? 1,
      failureCount: (resultMap?.failureCount as number) ?? 0,
      errors: [],
    };

    if (importResult.value.failureCount === 0) {
      showToast.success(t('batchImport.zipImportSuccess'));
    }
  } catch (error) {
    logger.warn('ZIP 导入失败: {}', error);
    importStatus.value = 'done';
    importResult.value = {
      successCount: 0,
      failureCount: 1,
      errors: [String(error)],
    };
  } finally {
    loading.value = false;
  }
}

/** 执行导入 */
async function handleImport(): Promise<void> {
  if (importType.value === 'files') {
    await executeBatchUpload();
  } else {
    await executeZipImport();
  }
}

/** 关闭弹窗并发出成功通知 */
function handleClose(): void {
  visible.value = false;
  if (importResult.value && importResult.value.successCount > 0) {
    emit('success', importResult.value);
  }
}

const emit = defineEmits<{ success: [result: ImportResult] }>();

/** 从目录树中查找目录名称 */
function findDirName(tree: DirectoryNode[], id: string): string | undefined {
  for (const node of tree) {
    if (node.id === id) return node.name;
    if (node.children) {
      const found = findDirName(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

/** 是否可以导入 */
const canImport = computed(() => {
  if (importStatus.value === 'uploading') return false;
  if (importType.value === 'files') return fileList.value.length > 0;
  return zipFile.value !== null;
});
</script>

<template>
  <YdDialog v-model:open="visible">
    <YdDialogContent class="sm:max-w-[640px]">
      <YdDialogHeader>
        <YdDialogTitle>{{ t('batchImport.title') }}</YdDialogTitle>
      </YdDialogHeader>

      <div class="space-y-4 py-4">
        <!-- 目标目录选择 -->
        <div class="rounded border border-gray-200 p-3">
          <label class="mb-2 block text-sm font-medium text-gray-700">
            {{ t('batchImport.targetDirectory') }}
          </label>
          <div class="flex items-center gap-2">
            <YdInput
              :model-value="selectedDirLabel"
              readonly
              :placeholder="t('batchImport.targetDirectoryPlaceholder')"
              class="flex-1"
            />
            <YdButton variant="outline" size="sm" @click="dirSelectVisible = true">
              {{ t('batchImport.selectDirectory') }}
            </YdButton>
          </div>
        </div>

        <!-- 导入类型切换 -->
        <YdTabs v-model="importType">
          <YdTabsList>
            <YdTabsTrigger value="files">
              {{ t('batchImport.multiFileUpload') }}
            </YdTabsTrigger>
            <YdTabsTrigger value="zip">
              {{ t('batchImport.zipImport') }}
            </YdTabsTrigger>
          </YdTabsList>

          <!-- 多文件上传 -->
          <YdTabsContent value="files" class="mt-4">
            <YdUpload
              :auto-upload="false"
              :file-list="fileList as any"
              :on-change="handleFileChange"
              multiple
              drag
            >
              <div class="py-10 text-center">
                <div class="mb-2 text-3xl text-gray-400">📁</div>
                <p class="text-sm text-gray-500">{{ t('batchImport.dragFilesHint') }}</p>
                <p class="mt-1 text-xs text-gray-400">{{ t('batchImport.multiFileNote') }}</p>
              </div>
            </YdUpload>

            <!-- 已选文件列表 -->
            <div v-if="fileList.length > 0" class="mt-3">
              <p class="mb-2 text-sm text-gray-600">
                {{ t('batchImport.selectedFiles') }}：{{ fileList.length }} {{ t('batchImport.filesUnit') }}
              </p>
              <div class="max-h-[160px] space-y-1 overflow-y-auto rounded border border-gray-100 bg-gray-50 p-2">
                <div
                  v-for="file in fileList"
                  :key="file.name"
                  class="flex items-center justify-between rounded px-2 py-1 text-xs hover:bg-gray-100"
                >
                  <span class="truncate flex-1">{{ file.name }}</span>
                  <span class="ml-2 text-gray-400">{{ formatFileSize(file.size) }}</span>
                  <button
                    class="ml-2 text-gray-400 hover:text-red-500"
                    :disabled="importStatus === 'uploading'"
                    @click="handleFileRemove(file)"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </YdTabsContent>

          <!-- ZIP 导入 -->
          <YdTabsContent value="zip" class="mt-4">
            <YdUpload
              :auto-upload="false"
              :limit="1"
              :on-change="(file: any, fileList: any) => handleZipChange(file, fileList)"
              :on-remove="() => { zipFile = null; }"
              accept=".zip"
              drag
            >
              <div class="py-10 text-center">
                <div class="mb-2 text-3xl text-gray-400">🗜️</div>
                <p class="text-sm text-gray-500">{{ t('batchImport.dragZipHint') }}</p>
                <p class="mt-1 text-xs text-gray-400">{{ t('batchImport.zipNote') }}</p>
              </div>
            </YdUpload>

            <!-- 已选 ZIP 信息 -->
            <div v-if="zipFile" class="mt-3 rounded border border-gray-100 bg-gray-50 p-3 text-sm">
              <p class="font-medium">{{ zipFile.name }}</p>
              <p class="text-xs text-gray-500">{{ formatFileSize(zipFile.size) }}</p>
            </div>
          </YdTabsContent>
        </YdTabs>

        <!-- 上传进度 -->
        <div v-if="importStatus === 'uploading'" class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">{{ t('batchImport.uploading') }}</span>
            <span class="text-gray-500">{{ Math.round(uploadProgress) }}%</span>
          </div>
          <YdProgress :percentage="Math.round(uploadProgress)" />
        </div>

        <!-- 导入结果 -->
        <div v-if="importStatus === 'done' && importResult" class="space-y-2">
          <div
            v-if="importResult.failureCount === 0"
            class="rounded bg-green-50 p-3 text-sm text-green-700"
          >
            <p class="font-medium">{{ t('batchImport.importComplete') }}</p>
            <p>{{ t('batchImport.successCount', { count: importResult.successCount }) }}</p>
          </div>
          <div v-else class="space-y-2">
            <div class="rounded bg-yellow-50 p-3 text-sm text-yellow-700">
              <p class="font-medium">{{ t('batchImport.partialSuccess') }}</p>
              <p>
                {{ t('batchImport.resultSummary', { success: importResult.successCount, failure: importResult.failureCount }) }}
              </p>
            </div>
            <div v-if="importResult.errors.length > 0" class="rounded bg-red-50 p-3">
              <p class="mb-1 text-sm font-medium text-red-700">{{ t('batchImport.errorDetails') }}</p>
              <ul class="list-disc pl-4 text-xs text-red-600">
                <li v-for="(err, idx) in importResult.errors" :key="idx">{{ err }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <YdDialogFooter>
        <YdButton variant="outline" :disabled="importStatus === 'uploading'" @click="handleClose">
          {{ t('batchImport.close') }}
        </YdButton>
        <YdButton
          v-if="importStatus !== 'done'"
          :loading="loading"
          :disabled="!canImport"
          @click="handleImport"
        >
          {{ t('batchImport.startImport') }}
        </YdButton>
      </YdDialogFooter>
    </YdDialogContent>

    <!-- 目录选择弹窗 -->
    <YdDialog v-model:open="dirSelectVisible">
      <YdDialogContent class="sm:max-w-[440px]">
        <YdDialogHeader>
          <YdDialogTitle>{{ t('batchImport.selectTargetDirectory') }}</YdDialogTitle>
        </YdDialogHeader>
        <div class="py-2">
          <!-- 根目录选项 -->
          <div
            class="cursor-pointer rounded px-3 py-2 text-sm hover:bg-gray-100"
            :class="{ 'bg-blue-50 text-blue-600': !formData.parentId }"
            @click="formData.parentId = ''"
          >
            📁 {{ t('batchImport.rootDirectory') }}
          </div>
          <!-- 目录树 -->
          <div v-if="dirTreeLoading" class="py-4 text-center text-sm text-gray-400">
            {{ t('batchImport.loading') }}
          </div>
          <div v-else class="max-h-[300px] overflow-y-auto">
            <template v-for="node in directoryTree" :key="node.id">
              <div
                class="flex cursor-pointer items-center gap-1 rounded px-3 py-2 text-sm hover:bg-gray-100"
                :class="{ 'bg-blue-50 text-blue-600': formData.parentId === node.id }"
                @click="formData.parentId = node.id"
              >
                <span>📁</span>
                <span class="truncate">{{ node.name }}</span>
              </div>
            </template>
            <div
              v-if="directoryTree.length === 0 && !dirTreeLoading"
              class="py-4 text-center text-sm text-gray-400"
            >
              {{ t('batchImport.noDirectories') }}
            </div>
          </div>
        </div>
        <YdDialogFooter>
          <YdButton variant="outline" @click="dirSelectVisible = false">
            {{ t('batchImport.cancel') }}
          </YdButton>
          <YdButton @click="confirmDirSelection">
            {{ t('batchImport.confirm') }}
          </YdButton>
        </YdDialogFooter>
      </YdDialogContent>
    </YdDialog>
  </YdDialog>
</template>
