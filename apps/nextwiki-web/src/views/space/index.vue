<!--
 * 空间管理（列表页）
 *
 * @path apps\nextwiki-web\src\views\space\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 空间管理（列表页）
 * <p>消费后端契约 SpaceController（apps/nextwiki-web/src/api/space.ts）：
 * listSpaces() 展示全部空间，支持新建空间 createSpace（space-form.vue）、
 * 编辑 updateSpace、归档 archiveSpace、删除 deleteSpace、
 * 成员管理 addMember/removeMember/listMembers。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';
import { Page, useYDSZModal } from '@ydsz/common-ui';
import { ElButton, ElDialog, ElDrawer, ElInput, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import { h, reactive, ref } from 'vue';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import {
  addMember,
  archiveSpace,
  deleteSpace,
  listMembers,
  listSpaces,
  removeMember,
  updateSpace,
} from '#/api/space';
import type { SpaceMemberDTO, SpaceVO } from '#/api/models';
import SpaceForm from './space-form.vue';

defineOptions({ name: 'SpaceManagement' });

/** 格式化存储空间大小 */
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

const gridOptions: VxeGridProps<SpaceVO> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'name', title: '空间名称', minWidth: 160 },
    { field: 'description', title: '描述', minWidth: 200 },
    {
      field: 'visibility',
      title: '可见性',
      width: 90,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: row.visibility === 'PUBLIC' ? 'success' : 'info' }, () => (row.visibility === 'PUBLIC' ? '公开' : '私有')),
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 90,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: row.status === 'ACTIVE' ? 'success' : 'warning' }, () => (row.status === 'ACTIVE' ? '正常' : '已归档')),
      },
    },
    { field: 'memberCount', title: '成员数', width: 80 },
    { field: 'nodeCount', title: '文件数', width: 80 },
    {
      field: 'quotaUsed',
      title: '已用存储',
      width: 110,
      slots: { default: ({ row }) => h('span', {}, formatSize(row.quotaUsed)) },
    },
    { field: 'createdAt', title: '创建时间', width: 170 },
    {
      field: 'action', title: '操作', width: 280, fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(ElButton, { size: 'small', link: true, type: 'primary', onClick: () => handleEdit(row) }, () => '编辑'),
            h(ElButton, { size: 'small', link: true, type: 'primary', onClick: () => handleMembers(row) }, () => '成员'),
            h(ElButton, {
              size: 'small', link: true, type: 'warning',
              onClick: () => handleArchive(row),
              disabled: row.status === 'ARCHIVED',
            }, () => '归档'),
            h(ElButton, { size: 'small', link: true, type: 'danger', onClick: () => handleDelete(row) }, () => '删除'),
          ]),
      },
    },
  ],
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async () => {
        const items = await listSpaces();
        return { items, total: items.length };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });
const [SpaceFormModal, spaceFormApi] = useYDSZModal({ connectedComponent: SpaceForm });

/** 编辑弹窗状态 */
const editVisible = ref(false);
const editForm = reactive({ id: '', name: '', description: '', visibility: 'PRIVATE' });
function handleAdd() {
  editForm.id = '';
  editForm.name = '';
  editForm.description = '';
  editForm.visibility = 'PRIVATE';
  editVisible.value = true;
}
function handleEdit(row: SpaceVO) {
  editForm.id = row.id ?? '';
  editForm.name = row.name ?? '';
  editForm.description = row.description ?? '';
  editForm.visibility = row.visibility ?? 'PRIVATE';
  editVisible.value = true;
}
async function confirmEdit() {
  if (!editForm.name) { ElMessage.warning('请输入空间名称'); return; }
  try {
    if (editForm.id) {
      await updateSpace({ spaceId: editForm.id }, { name: editForm.name, description: editForm.description, visibility: editForm.visibility });
      ElMessage.success('更新成功');
    } else {
      spaceFormApi.open();
      editVisible.value = false;
      return;
    }
    editVisible.value = false;
    gridApi.query();
  } catch { /* 错误提示由请求拦截器统一处理 */ }
}

/** 成员管理抽屉 */
const membersVisible = ref(false);
const membersLoading = ref(false);
const currentSpaceId = ref('');
const members = ref<SpaceMemberDTO[]>([]);
const addMemberForm = reactive({ userId: '', role: 'MEMBER' });
async function handleMembers(row: SpaceVO) {
  if (!row.id) return;
  currentSpaceId.value = row.id;
  membersVisible.value = true;
  await loadMembers();
}
async function loadMembers(): Promise<void> {
  if (!currentSpaceId.value) return;
  membersLoading.value = true;
  try {
    members.value = await listMembers({ spaceId: currentSpaceId.value });
  } finally {
    membersLoading.value = false;
  }
}
async function handleAddMember(): Promise<void> {
  if (!addMemberForm.userId) { ElMessage.warning('请输入用户ID'); return; }
  try {
    await addMember({ spaceId: currentSpaceId.value }, { userId: addMemberForm.userId, role: addMemberForm.role });
    ElMessage.success('添加成员成功');
    addMemberForm.userId = '';
    await loadMembers();
  } catch { /* 错误提示由请求拦截器统一处理 */ }
}
async function handleRemoveMember(row: SpaceMemberDTO): Promise<void> {
  if (!row.userId) return;
  try {
    await ElMessageBox.confirm('确定移除该成员吗？', '移除确认', { type: 'warning' });
    await removeMember({ spaceId: currentSpaceId.value, targetUserId: row.userId });
    ElMessage.success('移除成功');
    await loadMembers();
  } catch { /* 错误提示由请求拦截器统一处理 */ }
}

/** 归档空间 */
async function handleArchive(row: SpaceVO) {
  if (!row.id) return;
  try {
    await ElMessageBox.confirm(`确定归档空间「${row.name}」吗？归档后空间将变为只读。`, '归档确认', { type: 'warning' });
    await archiveSpace({ spaceId: row.id });
    ElMessage.success('归档成功');
    gridApi.query();
  } catch { /* 错误提示由请求拦截器统一处理 */ }
}

/** 删除空间 */
async function handleDelete(row: SpaceVO) {
  if (!row.id) return;
  try {
    await ElMessageBox.confirm(`确定删除空间「${row.name}」吗？删除后不可恢复。`, '删除确认', { type: 'warning' });
    await deleteSpace({ spaceId: row.id });
    ElMessage.success('删除成功');
    gridApi.query();
  } catch { /* 错误提示由请求拦截器统一处理 */ }
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="空间管理">
      <template #toolbar-tools>
        <ElButton type="primary" @click="handleAdd">新建空间</ElButton>
      </template>
    </Grid>
    <SpaceFormModal @success="gridApi.query()" />
    <ElDialog v-model="editVisible" :title="editForm.id ? '编辑空间' : '新建空间'" width="480px">
      <ElInput v-model="editForm.name" placeholder="请输入空间名称" class="mb-3" />
      <ElInput v-model="editForm.description" placeholder="请输入空间描述" type="textarea" :rows="3" class="mb-3" />
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600">可见性：</span>
        <ElTag :type="editForm.visibility === 'PUBLIC' ? 'success' : 'info'">
          {{ editForm.visibility === 'PUBLIC' ? '公开' : '私有' }}
        </ElTag>
      </div>
      <template #footer>
        <ElButton @click="editVisible = false">取消</ElButton>
        <ElButton type="primary" @click="confirmEdit">确定</ElButton>
      </template>
    </ElDialog>
    <ElDrawer v-model="membersVisible" title="空间成员" :size="640">
      <div class="mb-4 flex items-center gap-2">
        <ElInput v-model="addMemberForm.userId" placeholder="请输入用户ID" class="flex-1" />
        <ElInput v-model="addMemberForm.role" placeholder="角色" class="w-24" />
        <ElButton type="primary" @click="handleAddMember">添加</ElButton>
      </div>
      <div v-loading="membersLoading">
        <div v-if="members.length === 0" class="py-8 text-center text-gray-400">暂无成员</div>
        <div v-for="member in members" :key="member.id" class="mb-2 flex items-center justify-between rounded border p-3">
          <div>
            <p class="text-sm font-medium">{{ member.userId }}</p>
            <p class="text-xs text-gray-500">角色：{{ member.role }} | 加入时间：{{ member.joinedAt }}</p>
          </div>
          <ElButton size="small" link type="danger" @click="handleRemoveMember(member)">移除</ElButton>
        </div>
      </div>
    </ElDrawer>
  </Page>
</template>
