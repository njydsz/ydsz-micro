<!--
 * 规则定义管理列表页面
 *
 * @path apps\literule-web\src\views\rule\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 规则定义（列表页）
 * <p>规则定义列表页，数据来自后端契约 API（apps/literule-web/src/api/ruleAdmin.ts）。
 * <p>支持新增/编辑、启停、删除、版本历史与回滚。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RuleDefinitionVO, RuleVersionVO } from '#/api/models';
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';
import { Page, useYDSZModal } from '@ydsz/common-ui';
import { ElButton, ElDrawer, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import { h, ref } from 'vue';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { list, listVersions, rollback, toggle } from '#/api/ruleAdmin';
import { deleteRule } from '#/api/ruleBatch';
import RuleForm from './rule-form.vue';
import RuleChainDesigner from './components/RuleChainDesigner.vue';
defineOptions({ name: 'RuleManagement' });
const gridOptions: VxeTableGridOptions<RuleDefinitionVO> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'ruleCode', title: '规则编码', width: 150 },
    { field: 'ruleName', title: '规则名称', width: 180 },
    { field: 'category', title: '分类', width: 110 },
    { field: 'priority', title: '优先级', width: 80 },
    { field: 'version', title: '版本', width: 80 },
    {
      field: 'status',
      title: '状态',
      width: 90,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: statusTagType(row.status) }, () => row.status ?? '-'),
      },
    },
    {
      field: 'enabled',
      title: '启用',
      width: 80,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: row.enabled ? 'success' : 'info' }, () =>
            row.enabled ? '启用' : '停用',
          ),
      },
    },
    { field: 'createdAt', title: '创建时间', width: 160 },
    {
      field: 'action',
      title: '操作',
      width: 280,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(
              ElButton,
              { size: 'small', link: true, type: 'primary', onClick: () => handleEdit(row) },
              () => '编辑',
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'success', onClick: () => handleDesign(row) },
              () => '编排',
            ),
            h(
              ElButton,
              {
                size: 'small',
                link: true,
                type: row.enabled ? 'warning' : 'success',
                onClick: () => handleToggle(row),
              },
              () => (row.enabled ? '停用' : '启用'),
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'primary', onClick: () => openVersions(row) },
              () => '版本',
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'danger', onClick: () => handleDelete(row) },
              () => '删除',
            ),
          ]),
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const res = await list({
          pageQuery: { pageNum: page.currentPage, pageSize: page.pageSize },
        });
        return { items: res.data ?? [], total: res.total ?? 0 };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, search: true, zoom: true },
  formConfig: {
    enabled: true,
    items: [
      {
        field: 'ruleName',
        title: '规则名称',
        itemRender: { name: 'Input', props: { placeholder: '请输入规则名称' } },
      },
      {
        field: 'ruleCode',
        title: '规则编码',
        itemRender: { name: 'Input', props: { placeholder: '请输入规则编码' } },
      },
    ],
  },
};
/** 状态 → ElTag 类型映射（DRAFT 待发布 / PUBLISHED 已发布 / 其余按生命周期着色） */
function statusTagType(status?: string): 'success' | 'warning' | 'info' | 'danger' {
  switch ((status ?? '').toUpperCase()) {
    case 'PUBLISHED':
    case 'ACTIVE':
      return 'success';
    case 'DRAFT':
    case 'PENDING':
      return 'warning';
    case 'REJECTED':
    case 'DISABLED':
    case 'OFFLINE':
      return 'danger';
    default:
      return 'info';
  }
}
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });
const [RuleFormModal, ruleFormApi] = useYDSZModal({ connectedComponent: RuleForm });
function handleAdd() {
  ruleFormApi.open();
}
function handleEdit(row: RuleDefinitionVO) {
  ruleFormApi.setData({ record: row });
  ruleFormApi.open();
}
async function handleToggle(row: RuleDefinitionVO) {
  if (!row.ruleCode) return;
  try {
    await ElMessageBox.confirm(
      `确定${row.enabled ? '停用' : '启用'}规则「${row.ruleName}」吗？`,
      '确认',
      { type: 'warning' },
    );
    await toggle({ ruleCode: row.ruleCode }, { enabled: !row.enabled });
    ElMessage.success('操作成功');
    gridApi.query();
  } catch {
    /* 错误提示由请求拦截器统一处理 */
  }
}
async function handleDelete(row: RuleDefinitionVO) {
  if (!row.ruleCode) return;
  try {
    await ElMessageBox.confirm(`确定删除规则「${row.ruleName}」吗？`, '删除确认', {
      type: 'warning',
    });
    await deleteRule({ ruleCode: row.ruleCode });
    ElMessage.success('删除成功');
    gridApi.query();
  } catch {
    /* 错误提示由请求拦截器统一处理 */
  }
}
/** 版本历史状态 */
const versionsVisible = ref(false);
const versionsLoading = ref(false);
const versionRows = ref<RuleVersionVO[]>([]);
const currentRule = ref<RuleDefinitionVO | null>(null);

/** 规则链设计器引用 */
const ruleChainDesignerRef = ref<InstanceType<typeof RuleChainDesigner> | null>(null);

/** 打开规则链设计器 */
function handleDesign(row: RuleDefinitionVO): void {
  currentRule.value = row;
  ruleChainDesignerRef.value?.open();
}
/** 打开版本历史抽屉 */
async function openVersions(row: RuleDefinitionVO) {
  currentRule.value = row;
  versionsVisible.value = true;
  await loadVersions();
}
/** 加载当前规则的版本列表 */
async function loadVersions() {
  const ruleCode = currentRule.value?.ruleCode;
  if (!ruleCode) return;
  versionsLoading.value = true;
  try {
    const res = await listVersions({ ruleCode }, {});
    versionRows.value = res.data ?? [];
  } finally {
    versionsLoading.value = false;
  }
}
/** 回滚到指定版本 */
async function handleRollback(versionItem: RuleVersionVO) {
  const rule = currentRule.value;
  if (!rule?.ruleCode || versionItem.version === undefined) return;
  try {
    await ElMessageBox.confirm(
      `确定将规则「${rule.ruleName}」回滚到版本 ${versionItem.version} 吗？`,
      '回滚确认',
      { type: 'warning' },
    );
    await rollback({ ruleCode: rule.ruleCode }, { version: versionItem.version });
    ElMessage.success('回滚成功');
    gridApi.query();
    await loadVersions();
  } catch {
    /* 错误提示由请求拦截器统一处理 */
  }
}
</script>
<template>
  <Page auto-content-height>
    <Grid table-title="规则管理">
      <template #toolbar-tools
        ><ElButton type="primary" @click="handleAdd">新增</ElButton></template
      >
    </Grid>
    <RuleFormModal @success="gridApi.query()" />
    <RuleChainDesigner ref="ruleChainDesignerRef" :rule-code="currentRule?.ruleCode" @success="gridApi.query()" />
    <ElDrawer v-model="versionsVisible" title="版本历史" :size="540">
      <div class="mb-2 flex justify-end">
        <ElButton size="small" @click="loadVersions">刷新</ElButton>
      </div>
      <ElTable :data="versionRows" border size="small">
        <ElTableColumn prop="version" label="版本" width="80" />
        <ElTableColumn prop="changeDesc" label="变更说明" min-width="120" />
        <ElTableColumn prop="operator" label="操作人" width="100" />
        <ElTableColumn prop="createdAt" label="变更时间" width="170" />
        <ElTableColumn label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" size="small" @click="handleRollback(row)">回滚</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElDrawer>
  </Page>
</template>
