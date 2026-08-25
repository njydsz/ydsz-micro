<!--
 * 文件评论（列表页）
 *
 * @path apps\nextwiki-web\src\views\comment\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 文件评论（列表页）
 * <p>消费后端契约 FileCommentController（apps/nextwiki-web/src/api/fileComment.ts）：
 * 顶部输入文件节点 ID 后调 listComments({fileNodeId}) 展示该文件的评论列表，
 * 支持新增评论 addComment（comment-form.vue）、删除 deleteComment、解决 resolveComment。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';
import { Page, useYDSZModal } from '@ydsz/common-ui';
import { ElButton, ElInput, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import { h, ref } from 'vue';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { deleteComment, listComments, resolveComment } from '#/api/fileComment';
import type { FileCommentVO } from '#/api/models';
import CommentForm from './comment-form.vue';
defineOptions({ name: 'CommentManagement' });

/** 待查询的文件节点 ID（为空时列表不发起请求） */
const fileNodeId = ref('');

const gridOptions: VxeGridProps<FileCommentVO> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'id', title: '评论ID', width: 220 },
    { field: 'fileNodeId', title: '文件节点ID', width: 220 },
    { field: 'content', title: '评论内容', minWidth: 260 },
    {
      field: 'resolved',
      title: '状态',
      width: 90,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: row.resolved ? 'success' : 'warning' }, () => (row.resolved ? '已解决' : '未解决')),
      },
    },
    { field: 'createdBy', title: '评论人', width: 110 },
    { field: 'createdAt', title: '评论时间', width: 170 },
    {
      field: 'action', title: '操作', width: 160, fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            !row.resolved
              ? h(ElButton, { size: 'small', link: true, type: 'success', onClick: () => handleResolve(row) }, () => '解决')
              : h('span', {}, ''),
            h(ElButton, { size: 'small', link: true, type: 'danger', onClick: () => handleDelete(row) }, () => '删除'),
          ]),
      },
    },
  ],
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async () => {
        const fileId = fileNodeId.value;
        if (!fileId) return { items: [], total: 0 };
        const items = await listComments({ fileNodeId: fileId });
        return { items, total: items.length };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });
const [CommentFormModal, commentFormApi] = useYDSZModal({ connectedComponent: CommentForm });

function handleQuery() {
  if (!fileNodeId.value) { ElMessage.warning('请先输入文件节点ID'); return; }
  gridApi.query();
}
function handleAdd() { commentFormApi.open(); }
async function handleResolve(row: FileCommentVO) {
  if (!row.id) return;
  try {
    await resolveComment({ commentId: row.id });
    ElMessage.success('已标记为解决');
    gridApi.query();
  } catch { /* 错误提示由请求拦截器统一处理 */ }
}
async function handleDelete(row: FileCommentVO) {
  if (!row.id) return;
  try {
    await ElMessageBox.confirm(`确定删除该评论吗？`, '删除确认', { type: 'warning' });
    await deleteComment({ commentId: row.id });
    ElMessage.success('删除成功');
    gridApi.query();
  } catch { /* 错误提示由请求拦截器统一处理 */ }
}
</script>
<template>
  <Page auto-content-height>
    <div class="mb-2 flex items-center gap-2">
      <ElInput v-model="fileNodeId" placeholder="请输入文件节点ID" class="w-72" clearable @keyup.enter="handleQuery" />
      <ElButton type="primary" @click="handleQuery">查询评论</ElButton>
      <ElButton type="primary" @click="handleAdd">新增评论</ElButton>
    </div>
    <Grid table-title="文件评论" />
    <CommentFormModal @success="gridApi.query()" />
  </Page>
</template>