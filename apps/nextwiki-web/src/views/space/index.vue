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
import { Page, useYdModal } from '@ydsz/common-ui';
import { YdButtonBase, YdInput, YdBadge, YdDialog, YdDialogContent, YdDialogFooter, YdDialogHeader, YdDialogTitle, YdSheet, YdSheetContent } from '@ydsz-core/ui-kit/shadcn-ui';
import { h, reactive, ref } from 'vue';
import { createLogger } from '@ydsz-core/shared/utils';
import { useI18n } from 'vue-i18n';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
const logger = createLogger('nextwiki-space');
const { t } = useI18n();
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
          h(YdBadge, { variant: row.visibility === 'PUBLIC' ? 'success' : 'secondary' }, () => (row.visibility === 'PUBLIC' ? '公开' : '私有')),
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 90,
      slots: {
        default: ({ row }) =>
          h(YdBadge, { variant: row.status === 'ACTIVE' ? 'success' : 'warning' }, () => (row.status === 'ACTIVE' ? '正常' : '已归档')),
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
            h(YdButtonBase, { size: 'sm', variant: 'link', onClick: () => handleEdit(row) }, () => '编辑'),
            h(YdButtonBase, { size: 'sm', variant: 'link', onClick: () => handleMembers(row) }, () => '成员'),
            h(YdButtonBase, {
              size: 'sm', variant: 'link',
              onClick: () => handleArchive(row),
              disabled: row.status === 'ARCHIVED',
            }, () => '归档'),
            h(YdButtonBase, { size: 'sm', variant: 'link', onClick: () => handleDelete(row) }, () => '删除'),
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
const [SpaceFormModal, spaceFormApi] = useYdModal({ connectedComponent: SpaceForm });

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
  if (!editForm.name) { showToast.warning(t('spaceNamePlaceholder')); return; }
  try {
    if (editForm.id) {
      await updateSpace({ spaceId: editForm.id }, { name: editForm.name, description: editForm.description, visibility: editForm.visibility });
      showToast.success(t('updateSuccess'));
    } else {
      spaceFormApi.open();
      editVisible.value = false;
      return;
    }
    editVisible.value = false;
    gridApi.query();
  } catch (error) { logger.warn('编辑/新建空间失败: {}', error); /* 用户提示由请求拦截器统一处理 */ }
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
  if (!addMemberForm.userId) { showToast.warning(t('userIdRequired')); return; }
  try {
    await addMember({ spaceId: currentSpaceId.value }, { userId: addMemberForm.userId, role: addMemberForm.role });
    showToast.success(t('addMemberSuccess'));
    addMemberForm.userId = '';
    await loadMembers();
  } catch (error) { logger.warn('添加成员失败: {}', error); /* 用户提示由请求拦截器统一处理 */ }
}
async function handleRemoveMember(row: SpaceMemberDTO): Promise<void> {
  if (!row.userId) return;
  try {
    await ydszConfirm(t('removeMemberConfirm'), { title: t('removeMember'), type: 'warning' });
    await removeMember({ spaceId: currentSpaceId.value, targetUserId: row.userId });
    showToast.success(t('removeSuccess'));
    await loadMembers();
  } catch (error) { logger.warn('移除成员失败: {}', error); /* 用户提示由请求拦截器统一处理 */ }
}

/** 归档空间 */
async function handleArchive(row: SpaceVO) {
  if (!row.id) return;
  try {
    await ydszConfirm(t('archiveConfirm', [row.name]), t('archiveConf'), { type: 'warning' });
    await archiveSpace({ spaceId: row.id });
    showToast.success(t('archiveSuccess'));
    gridApi.query();
  } catch (error) { logger.warn('归档空间失败: {}', error); /* 用户提示由请求拦截器统一处理 */ }
}

/** 删除空间 */
async function handleDelete(row: SpaceVO) {
  if (!row.id) return;
  try {
    await ydszConfirm(t('deleteSpaceConfirm', [row.name]), t('deleteConf'), { type: 'warning' });
    await deleteSpace({ spaceId: row.id });
    showToast.success(t('deleteSuccess'));
    gridApi.query();
  } catch (error) { logger.warn('删除空间失败: {}', error); /* 用户提示由请求拦截器统一处理 */ }
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="空间管理">
      <template #toolbar-tools>
        <YdButtonBase @click="handleAdd">新建空间</YdButtonBase>
      </template>
    </Grid>
    <SpaceFormModal @success="gridApi.query()" />
    <YdDialog v-model:open="editVisible">
      <YdDialogContent class="sm:max-w-[480px]">
        <YdDialogHeader>
          <YdDialogTitle>{{ editForm.id ? '编辑空间' : '新建空间' }}</YdDialogTitle>
        </YdDialogHeader>
        <div class="space-y-3 py-4">
          <YdInput v-model="editForm.name" placeholder="请输入空间名称" />
          <YdInput v-model="editForm.description" placeholder="请输入空间描述" />
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">可见性：</span>
            <YdBadge :variant="editForm.visibility === 'PUBLIC' ? 'success' : 'secondary'">
              {{ editForm.visibility === 'PUBLIC' ? '公开' : '私有' }}
            </YdBadge>
          </div>
        </div>
        <YdDialogFooter>
          <YdButtonBase variant="outline" @click="editVisible = false">取消</YdButtonBase>
          <YdButtonBase @click="confirmEdit">确定</YdButtonBase>
        </YdDialogFooter>
      </YdDialogContent>
    </YdDialog>
    <YdSheet v-model:open="membersVisible">
      <YdSheetContent side="right" class="w-[640px]">
        <div class="mb-4 flex items-center gap-2">
          <YdInput v-model="addMemberForm.userId" placeholder="请输入用户ID" class="flex-1" />
          <YdInput v-model="addMemberForm.role" placeholder="角色" class="w-24" />
          <YdButtonBase @click="handleAddMember">添加</YdButtonBase>
        </div>
        <div v-loading="membersLoading">
          <div v-if="members.length === 0" class="py-8 text-center text-gray-400">暂无成员</div>
          <div v-for="member in members" :key="member.id" class="mb-2 flex items-center justify-between rounded border p-3">
            <div>
              <p class="text-sm font-medium">{{ member.userId }}</p>
              <p class="text-xs text-gray-500">角色：{{ member.role }} | 加入时间：{{ member.joinedAt }}</p>
            </div>
            <YdButtonBase size="sm" variant="link" @click="handleRemoveMember(member)">移除</YdButtonBase>
          </div>
        </div>
      </YdSheetContent>
    </YdSheet>
  </Page>
</template>
