<!--
 * 文件标签（列表页）
 *
 * @path apps\nextwiki-web\src\views\tag\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 文件标签（列表页）
 * <p>消费后端契约 TagController（apps/nextwiki-web/src/api/tag.ts）：
 * listTags() 展示全部标签，支持新建标签 createTag（tag-form.vue）、
 * 绑定 bindTag（弹窗输入 fileNodeId+tagId）、按文件查询标签 getFileTags / 推荐 recommendTags。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';
import { Page, useYDSZModal } from '@ydsz/common-ui';
import { ElButton, ElDialog, ElInput, ElMessage, ElTable, ElTableColumn, ElTag } from 'element-plus';
import { h, reactive, ref } from 'vue';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { bindTag, getFileTags, listTags, recommendTags } from '#/api/tag';
import type { TagVO } from '#/api/models';
import TagForm from './tag-form.vue';
defineOptions({ name: 'TagManagement' });

const gridOptions: VxeGridProps<TagVO> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'id', title: '标签ID', width: 200 },
    { field: 'name', title: '标签名称', minWidth: 160 },
    {
      field: 'color',
      title: '颜色',
      width: 90,
      slots: {
        default: ({ row }) =>
          h('span', { class: 'inline-block h-4 w-4 rounded', style: { backgroundColor: row.color ?? '#409eff' } }, ''),
      },
    },
    { field: 'type', title: '类型', width: 100 },
    { field: 'usageCount', title: '使用次数', width: 100 },
    { field: 'createdBy', title: '创建人', width: 120 },
    { field: 'createdAt', title: '创建时间', width: 170 },
    {
      field: 'action', title: '操作', width: 200, fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(ElButton, { size: 'small', link: true, type: 'primary', onClick: () => handleBind(row) }, () => '绑定'),
            h(ElButton, { size: 'small', link: true, type: 'primary', onClick: () => handleFileTags() }, () => '文件标签'),
          ]),
      },
    },
  ],
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async () => {
        const items = await listTags();
        return { items, total: items.length };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });
const [TagFormModal, tagFormApi] = useYDSZModal({ connectedComponent: TagForm });

function handleAdd() { tagFormApi.open(); }

/** 标签绑定弹窗（输入 fileNodeId + tagId） */
const bindVisible = ref(false);
const bindForm = reactive({ fileNodeId: '', tagId: '' });
function handleBind(row: TagVO) {
  bindForm.tagId = row.id ?? '';
  bindForm.fileNodeId = '';
  bindVisible.value = true;
}
async function confirmBind() {
  if (!bindForm.fileNodeId || !bindForm.tagId) { ElMessage.warning('请填写文件节点ID与标签ID'); return; }
  try {
    await bindTag({ ...bindForm });
    ElMessage.success('绑定成功');
    bindVisible.value = false;
  } catch { /* 错误提示由请求拦截器统一处理 */ }
}

/** 按文件查询 / 推荐标签弹窗 */
const fileTagsVisible = ref(false);
const fileTagsNodeId = ref('');
const fileTags = ref<TagVO[]>([]);
const recommendTagList = ref<TagVO[]>([]);
function handleFileTags() {
  fileTagsNodeId.value = '';
  fileTags.value = [];
  recommendTagList.value = [];
  fileTagsVisible.value = true;
}
async function loadFileTags() {
  if (!fileTagsNodeId.value) { fileTags.value = []; return; }
  try {
    fileTags.value = await getFileTags({ fileNodeId: fileTagsNodeId.value });
  } catch { /* 错误提示由请求拦截器统一处理 */ }
}
async function loadRecommendedTags() {
  if (!fileTagsNodeId.value) { ElMessage.warning('请先输入文件节点ID'); return; }
  try {
    recommendTagList.value = await recommendTags({ fileNodeId: fileTagsNodeId.value });
  } catch { /* 错误提示由请求拦截器统一处理 */ }
}
</script>
<template>
  <Page auto-content-height>
    <Grid table-title="标签管理">
      <template #toolbar-tools>
        <ElButton type="primary" @click="handleAdd">新增标签</ElButton>
      </template>
    </Grid>
    <TagFormModal @success="gridApi.query()" />
    <ElDialog v-model="bindVisible" title="绑定标签到文件" width="440px">
      <ElInput v-model="bindForm.fileNodeId" placeholder="请输入文件节点ID" class="mb-2" />
      <ElInput v-model="bindForm.tagId" placeholder="请输入标签ID" />
      <template #footer>
        <ElButton @click="bindVisible = false">取消</ElButton>
        <ElButton type="primary" @click="confirmBind">确定</ElButton>
      </template>
    </ElDialog>
    <ElDialog v-model="fileTagsVisible" title="文件标签查询 / 推荐" width="600px">
      <div class="mb-2 flex items-center gap-2">
        <ElInput v-model="fileTagsNodeId" placeholder="请输入文件节点ID" clearable @keyup.enter="loadFileTags" />
        <ElButton type="primary" @click="loadFileTags">查询</ElButton>
        <ElButton @click="loadRecommendedTags">推荐标签</ElButton>
      </div>
      <ElTable :data="fileTags" border size="small" empty-text="该文件暂无标签">
        <ElTableColumn prop="id" label="标签ID" min-width="160" />
        <ElTableColumn prop="name" label="标签名称" min-width="140" />
        <ElTableColumn prop="color" label="颜色" width="90" />
        <ElTableColumn prop="usageCount" label="使用次数" width="100" />
      </ElTable>
      <template v-if="recommendTagList.length > 0">
        <div class="mt-3 mb-1 text-sm font-medium text-gray-600">推荐标签</div>
        <div class="flex flex-wrap gap-1">
          <ElTag v-for="tag in recommendTagList" :key="tag.id" type="primary">{{ tag.name }}</ElTag>
        </div>
      </template>
    </ElDialog>
  </Page>
</template>