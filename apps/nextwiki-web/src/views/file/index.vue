<!--
 * 文件节点（列表页）
 *
 * @path apps\nextwiki-web\src\views\file\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 文件节点（列表页）
 * <p>文件节点的浏览页，支持目录/文件两种类型，数据来自后端契约 API（apps/nextwiki-web/src/api/file.ts）。
 * <p>支持上传、下载、预览、重命名、移动、复制、删除，新建文件夹使用 file-form.vue 提交 createFolder。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';
import { Page, useYdModal } from '@ydsz/common-ui';
import { YdTabsContent, YdTabs, YdUpload, YdButtonBase, YdInput, YdBadge, YdDialog, YdDialogContent, YdDialogFooter, YdDialogHeader, YdSheet, YdSheetContent } from '@ydsz-core/ydsz-ui';
import { h, reactive, ref } from 'vue';
import { createLogger } from '@ydsz-core/shared/utils';
import { useI18n } from 'vue-i18n';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
const logger = createLogger('nextwiki-file');
const { t } = useI18n();
import { copy, deleteApi, listFiles, move, rename } from '#/api/file';
import { batchUpload, importZip } from '#/api/batchImport';
import { download } from '#/api/download';
import type { FileNodeVO } from '#/api/models';
import FileForm from './file-form.vue';
import FileUpload from './file-upload.vue';
import FilePreview from './file-preview.vue';
import FileVersionHistory from './components/FileVersionHistory.vue';
import WopiEditor from './components/WopiEditor.vue';

defineOptions({ name: 'FileManagement' });

/** 文件大小格式化（字节 → 可读单位） */
function formatSize(size?: number): string {
  if (size === undefined || size < 0) return '-';
  if (size < 1024) return `${size} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = size;
  let unit = 'KB';
  for (const u of units) {
    value /= 1024;
    unit = u;
    if (value < 1024) break;
  }
  return `${value.toFixed(1)} ${unit}`;
}

const gridOptions: VxeGridProps<FileNodeVO> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'name', title: '名称', minWidth: 240 },
    {
      field: 'nodeType',
      title: '类型',
      width: 90,
      slots: {
        default: ({ row }) =>
          h(YdBadge, { variant: row.nodeType === 'FOLDER' ? 'warning' : 'default' }, () => (row.nodeType === 'FOLDER' ? '目录' : '文件')),
      },
    },
    {
      field: 'size',
      title: '大小',
      width: 110,
      slots: { default: ({ row }) => h('span', {}, formatSize(row.size)) },
    },
    { field: 'path', title: '路径', minWidth: 200 },
    { field: 'createdBy', title: '创建人', width: 110 },
    { field: 'createdAt', title: '创建时间', width: 170 },
    {
      field: 'action', title: '操作', width: 320, fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(YdButtonBase, {
              size: 'sm', variant: 'link',
              onClick: () => handlePreview(row),
              disabled: row.nodeType === 'FOLDER',
            }, () => '预览'),
            h(YdButtonBase, {
              size: 'sm', variant: 'link',
              onClick: () => handleDownload(row),
              disabled: row.nodeType === 'FOLDER',
            }, () => '下载'),
            h(YdButtonBase, {
              size: 'sm', variant: 'link',
              onClick: () => handleOnlineEdit(row),
              disabled: row.nodeType === 'FOLDER',
            }, () => '编辑'),
            h(YdButtonBase, {
              size: 'sm', variant: 'link',
              onClick: () => handleVersionHistory(row),
              disabled: row.nodeType === 'FOLDER',
            }, () => '版本'),
            h(YdButtonBase, { size: 'sm', variant: 'link', onClick: () => handleRename(row) }, () => '重命名'),
            h(YdButtonBase, { size: 'sm', variant: 'link', onClick: () => handleMove(row) }, () => '移动'),
            h(YdButtonBase, { size: 'sm', variant: 'link', onClick: () => handleCopy(row) }, () => '复制'),
            h(YdButtonBase, { size: 'sm', variant: 'link', onClick: () => handleDelete(row) }, () => '删除'),
          ]),
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const res = await listFiles({ page: page.currentPage, pageSize: page.pageSize, ...formValues });
        return { items: res.data ?? [], total: res.total ?? 0 };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
  formConfig: {
    enabled: true,
    items: [
      { field: 'name', title: '名称', itemRender: { name: 'YdInput', props: { placeholder: '请输入名称' } } },
    ],
  },
};
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });
const [FileFormModal, fileFormApi] = useYdModal({ connectedComponent: FileForm });
const [FileUploadModal, fileUploadApi] = useYdModal({ connectedComponent: FileUpload });

/** 版本历史弹窗引用 */
const fileVersionHistoryRef = ref<InstanceType<typeof FileVersionHistory> | null>(null);
const wopiEditorRef = ref<InstanceType<typeof WopiEditor> | null>(null);

/** 当前操作的文件节点 */
const currentNode = ref<FileNodeVO | null>(null);

/** 打开版本历史 */
function handleVersionHistory(row: FileNodeVO): void {
  currentNode.value = row;
  fileVersionHistoryRef.value?.open();
}

/** 打开在线编辑器 */
function handleOnlineEdit(row: FileNodeVO): void {
  currentNode.value = row;
  wopiEditorRef.value?.open();
}

/** 预览抽屉状态 */
const previewVisible = ref(false);
const previewFileNode = ref<FileNodeVO | null>(null);

function handleAdd() { fileFormApi.open(); }

function handleUpload() { fileUploadApi.open(); }

/** 预览文件 */
function handlePreview(row: FileNodeVO) {
  if (row.nodeType === 'FOLDER') return;
  previewFileNode.value = row;
  previewVisible.value = true;
}

/** 下载文件 */
async function handleDownload(row: FileNodeVO) {
  if (row.nodeType === 'FOLDER' || !row.id) return;
  try {
    await download({ nodeId: row.id }, {});
    showToast.success(t('downloadStarted'));
  } catch (error) { logger.warn('下载文件失败: {}', error); /* 用户提示由请求拦截器统一处理 */ }
}

/** 重命名弹窗状态 */
const renameVisible = ref(false);
const renameForm = reactive({ nodeId: '', name: '' });
function handleRename(row: FileNodeVO) {
  renameForm.nodeId = row.id ?? '';
  renameForm.name = row.name ?? '';
  renameVisible.value = true;
}
async function confirmRename() {
  if (!renameForm.name) { showToast.warning(t('renameNameRequired')); return; }
  try {
    await rename({ nodeId: renameForm.nodeId }, { name: renameForm.name });
    showToast.success(t('renameSuccess'));
    renameVisible.value = false;
    gridApi.query();
  } catch (error) { logger.warn('重命名文件失败: {}', error); /* 用户提示由请求拦截器统一处理 */ }
}

/** 移动弹窗状态（简化：输入目标父目录 ID） */
const moveVisible = ref(false);
const moveForm = reactive({ nodeId: '', parentId: '' });
function handleMove(row: FileNodeVO) {
  moveForm.nodeId = row.id ?? '';
  moveForm.parentId = row.parentId ?? '';
  moveVisible.value = true;
}
async function confirmMove() {
  try {
    await move({ nodeId: moveForm.nodeId }, { parentId: moveForm.parentId });
    showToast.success(t('moveSuccess'));
    moveVisible.value = false;
    gridApi.query();
  } catch (error) { logger.warn('移动文件失败: {}', error); /* 用户提示由请求拦截器统一处理 */ }
}

async function handleCopy(row: FileNodeVO) {
  if (!row.id) return;
  try {
    await YdConfirm(t('confirmCopy', [row.name]), t('copy'), { type: 'warning' });
    await copy({ nodeId: row.id }, {});
    showToast.success(t('copySuccess'));
    gridApi.query();
  } catch (error) { logger.warn('复制文件失败: {}', error); /* 用户提示由请求拦截器统一处理 */ }
}

async function handleDelete(row: FileNodeVO) {
  if (!row.id) return;
  try {
    await YdConfirm(t('confirmDeleteFile', [row.name]), t('deleteConf'), { type: 'warning' });
    await deleteApi({ nodeId: row.id });
    showToast.success(t('deleteSuccess'));
    gridApi.query();
  } catch (error) { logger.warn('删除文件失败: {}', error); /* 用户提示由请求拦截器统一处理 */ }
}

/** 批量导入弹窗状态 */
const batchImportVisible = ref(false);
const batchImportType = ref<'files' | 'zip'>('files');
const batchImportLoading = ref(false);
const batchFileList = ref<File[]>([]);
const zipFile = ref<File | null>(null);

/** 打开批量导入弹窗 */
function handleBatchImport(): void {
  batchImportType.value = 'files';
  batchFileList.value = [];
  zipFile.value = null;
  batchImportVisible.value = true;
}

/** 执行批量上传 */
async function executeBatchUpload(): Promise<void> {
  if (batchFileList.value.length === 0) {
    showToast.warning('请选择要上传的文件');
    return;
  }
  batchImportLoading.value = true;
  try {
    const files = batchFileList.value.map((f) => f as unknown as Record<string, unknown>);
    await batchUpload({ files });
    showToast.success(`批量导入成功，共 ${batchFileList.value.length} 个文件`);
    batchImportVisible.value = false;
    gridApi.query();
  } catch (error) {
    logger.warn('批量上传失败: {}', error);
  } finally {
    batchImportLoading.value = false;
  }
}

/** 执行 ZIP 导入 */
async function executeZipImport(): Promise<void> {
  if (!zipFile.value) {
    showToast.warning('请选择 ZIP 文件');
    return;
  }
  batchImportLoading.value = true;
  try {
    await importZip({ file: zipFile.value as unknown as Record<string, unknown> });
    showToast.success('ZIP 导入成功');
    batchImportVisible.value = false;
    gridApi.query();
  } catch (error) {
    logger.warn('ZIP 导入失败: {}', error);
  } finally {
    batchImportLoading.value = false;
  }
}
</script>
<template>
  <Page auto-content-height>
    <Grid table-title="文件管理">
      <template #toolbar-tools>
        <YdButtonBase @click="handleUpload">上传文件</YdButtonBase>
        <YdButtonBase variant="secondary" @click="handleBatchImport">批量导入</YdButtonBase>
        <YdButtonBase @click="handleAdd">新建文件夹</YdButtonBase>
      </template>
    </Grid>
    <FileFormModal @success="gridApi.query()" />
    <FileUploadModal @success="gridApi.query()" />
    <YdDialog v-model:open="renameVisible">
      <YdDialogContent class="sm:max-w-[420px]">
        <YdDialogHeader>
          <YdDialogTitle>重命名</YdDialogTitle>
        </YdDialogHeader>
        <div class="py-4">
          <YdInput v-model="renameForm.name" placeholder="请输入新名称" />
        </div>
        <YdDialogFooter>
          <YdButtonBase variant="outline" @click="renameVisible = false">取消</YdButtonBase>
          <YdButtonBase @click="confirmRename">确定</YdButtonBase>
        </YdDialogFooter>
      </YdDialogContent>
    </YdDialog>
    <YdDialog v-model:open="moveVisible">
      <YdDialogContent class="sm:max-w-[420px]">
        <YdDialogHeader>
          <YdDialogTitle>移动文件</YdDialogTitle>
        </YdDialogHeader>
        <div class="py-4">
          <YdInput v-model="moveForm.parentId" placeholder="请输入目标父目录ID（留空表示根目录）" />
        </div>
        <YdDialogFooter>
          <YdButtonBase variant="outline" @click="moveVisible = false">取消</YdButtonBase>
          <YdButtonBase @click="confirmMove">确定</YdButtonBase>
        </YdDialogFooter>
      </YdDialogContent>
    </YdDialog>
    <YdSheet v-model:open="previewVisible">
      <YdSheetContent side="right" class="w-[800px]">
        <FilePreview :file-node="previewFileNode" @close="previewVisible = false" />
      </YdSheetContent>
    </YdSheet>
    <FileVersionHistory ref="fileVersionHistoryRef" :file-node="currentNode" />
    <WopiEditor ref="wopiEditorRef" :file-node="currentNode" />

    <!-- 批量导入弹窗 -->
    <YdDialog v-model:open="batchImportVisible">
      <YdDialogContent class="sm:max-w-[560px]">
        <YdDialogHeader>
          <YdDialogTitle>批量导入</YdDialogTitle>
        </YdDialogHeader>
        <div class="py-4">
          <YdTabs v-model="batchImportType">
            <YdTabsContent label="多文件上传" name="files">
              <YdUpload
                :auto-upload="false"
                :file-list="batchFileList as any"
                :on-change="(file: any, fileList: any) => { batchFileList.value = fileList.map((f: any) => f.raw || f); }"
                :on-remove="(file: any, fileList: any) => { batchFileList.value = fileList.map((f: any) => f.raw || f); }"
                multiple
                drag
              >
                <div class="py-8 text-center text-sm text-gray-500">
                  点击或拖拽多个文件到此处
                </div>
              </YdUpload>
            </YdTabsContent>
            <YdTabsContent label="ZIP 导入" name="zip">
              <YdUpload
                :auto-upload="false"
                :limit="1"
                :on-change="(file: any) => { zipFile.value = file.raw || null; }"
                :on-remove="() => { zipFile.value = null; }"
                accept=".zip"
                drag
              >
                <div class="py-8 text-center text-sm text-gray-500">
                  点击或拖拽 ZIP 压缩包到此处
                </div>
              </YdUpload>
            </YdTabsContent>
          </YdTabs>
        </div>
        <YdDialogFooter>
          <YdButtonBase variant="outline" @click="batchImportVisible = false">取消</YdButtonBase>
          <YdButtonBase
            :loading="batchImportLoading"
            @click="batchImportType === 'files' ? executeBatchUpload() : executeZipImport()"
          >
            确定导入
          </YdButtonBase>
        </YdDialogFooter>
      </YdDialogContent>
    </YdDialog>
  </Page>
</template>
