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
import { Page, useYDSZModal } from '@ydsz/common-ui';
import { ElButton, ElDialog, ElDrawer, ElInput, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import { h, reactive, ref } from 'vue';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { copy, deleteApi, listFiles, move, rename } from '#/api/file';
import { download } from '#/api/download';
import type { FileNodeVO } from '#/api/models';
import FileForm from './file-form.vue';
import FileUpload from './file-upload.vue';
import FilePreview from './file-preview.vue';

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
          h(ElTag, { type: row.nodeType === 'FOLDER' ? 'warning' : 'primary' }, () => (row.nodeType === 'FOLDER' ? '目录' : '文件')),
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
            h(ElButton, {
              size: 'small', link: true, type: 'success',
              onClick: () => handlePreview(row),
              disabled: row.nodeType === 'FOLDER',
            }, () => '预览'),
            h(ElButton, {
              size: 'small', link: true, type: 'primary',
              onClick: () => handleDownload(row),
              disabled: row.nodeType === 'FOLDER',
            }, () => '下载'),
            h(ElButton, { size: 'small', link: true, type: 'primary', onClick: () => handleRename(row) }, () => '重命名'),
            h(ElButton, { size: 'small', link: true, type: 'primary', onClick: () => handleMove(row) }, () => '移动'),
            h(ElButton, { size: 'small', link: true, type: 'primary', onClick: () => handleCopy(row) }, () => '复制'),
            h(ElButton, { size: 'small', link: true, type: 'danger', onClick: () => handleDelete(row) }, () => '删除'),
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
      { field: 'name', title: '名称', itemRender: { name: 'Input', props: { placeholder: '请输入名称' } } },
    ],
  },
};
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });
const [FileFormModal, fileFormApi] = useYDSZModal({ connectedComponent: FileForm });
const [FileUploadModal, fileUploadApi] = useYDSZModal({ connectedComponent: FileUpload });

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
    ElMessage.success('下载已开始');
  } catch { /* 错误提示由请求拦截器统一处理 */ }
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
  if (!renameForm.name) { ElMessage.warning('请输入新名称'); return; }
  try {
    await rename({ nodeId: renameForm.nodeId }, { name: renameForm.name });
    ElMessage.success('重命名成功');
    renameVisible.value = false;
    gridApi.query();
  } catch { /* 错误提示由请求拦截器统一处理 */ }
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
    ElMessage.success('移动成功');
    moveVisible.value = false;
    gridApi.query();
  } catch { /* 错误提示由请求拦截器统一处理 */ }
}

async function handleCopy(row: FileNodeVO) {
  if (!row.id) return;
  try {
    await ElMessageBox.confirm(`确定复制「${row.name}」吗？`, '复制确认', { type: 'warning' });
    await copy({ nodeId: row.id }, {});
    ElMessage.success('复制成功');
    gridApi.query();
  } catch { /* 错误提示由请求拦截器统一处理 */ }
}

async function handleDelete(row: FileNodeVO) {
  if (!row.id) return;
  try {
    await ElMessageBox.confirm(`确定删除「${row.name}」吗？删除后不可恢复。`, '删除确认', { type: 'warning' });
    await deleteApi({ nodeId: row.id });
    ElMessage.success('删除成功');
    gridApi.query();
  } catch { /* 错误提示由请求拦截器统一处理 */ }
}
</script>
<template>
  <Page auto-content-height>
    <Grid table-title="文件管理">
      <template #toolbar-tools>
        <ElButton type="primary" @click="handleUpload">上传文件</ElButton>
        <ElButton type="primary" @click="handleAdd">新建文件夹</ElButton>
      </template>
    </Grid>
    <FileFormModal @success="gridApi.query()" />
    <FileUploadModal @success="gridApi.query()" />
    <ElDialog v-model="renameVisible" title="重命名" width="420px">
      <ElInput v-model="renameForm.name" placeholder="请输入新名称" />
      <template #footer>
        <ElButton @click="renameVisible = false">取消</ElButton>
        <ElButton type="primary" @click="confirmRename">确定</ElButton>
      </template>
    </ElDialog>
    <ElDialog v-model="moveVisible" title="移动文件" width="420px">
      <ElInput v-model="moveForm.parentId" placeholder="请输入目标父目录ID（留空表示根目录）" />
      <template #footer>
        <ElButton @click="moveVisible = false">取消</ElButton>
        <ElButton type="primary" @click="confirmMove">确定</ElButton>
      </template>
    </ElDialog>
    <ElDrawer v-model="previewVisible" title="文件预览" :size="800" direction="rtl">
      <FilePreview :file-node="previewFileNode" @close="previewVisible = false" />
    </ElDrawer>
  </Page>
</template>
