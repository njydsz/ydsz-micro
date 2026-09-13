<!--
 * 认证策略管理列表视图
 *
 * <p>提供认证策略的完整生命周期管理：分页查询、新增、编辑、删除。
 *
 * @path apps/userinfo-web/src/views/system/auth-policy/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 认证策略管理列表
 * <p>消费后端 AuthPolicyController（apps/userinfo-web/src/api/authPolicy.ts）：
 * page() 分页查询，getByTenantId() 按租户ID查询，create() 创建，
 * update() 更新，deleteApi() 删除。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';
import { Page, useYDSZModal } from '@ydsz/common-ui';
import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import { h } from 'vue';
import { createLogger } from '@ydsz/utils';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { deleteApi, page } from '#/api/authPolicy';
import type { AuthPolicyVO } from '#/api/models';
import AuthPolicyForm from './auth-policy-form.vue';

defineOptions({ name: 'AuthPolicyManagement' });

const logger = createLogger('userinfo-auth-policy');

const gridOptions: VxeTableGridOptions = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'tenantId', title: '租户ID', width: 140 },
    { field: 'name', title: '策略名称', width: 180 },
    { field: 'passwordMinLength', title: '密码最小长度', width: 110, align: 'center' },
    {
      field: 'isMfaEnabled',
      title: 'MFA认证',
      width: 90,
      align: 'center',
      slots: {
        default: ({ row }) => h(
          ElTag,
          { type: (row as Record<string, unknown>)?.isMfaEnabled ? 'success' : 'info', size: 'small' },
          () => ((row as Record<string, unknown>)?.isMfaEnabled ? '已启用' : '未启用'),
        ),
      },
    },
    {
      field: 'isCaptchaEnabled',
      title: '图形验证码',
      width: 100,
      align: 'center',
      slots: {
        default: ({ row }) => h(
          ElTag,
          { type: (row as Record<string, unknown>)?.isCaptchaEnabled ? 'success' : 'info', size: 'small' },
          () => ((row as Record<string, unknown>)?.isCaptchaEnabled ? '已启用' : '未启用'),
        ),
      },
    },
    { field: 'allowedIdentityProviders', title: '身份提供者', width: 160, showOverflow: true },
    { field: 'maxSessionsPerUser', title: '最大会话数', width: 100, align: 'center' },
    { field: 'sessionTimeoutSeconds', title: '会话超时(秒)', width: 120, align: 'center' },
    { field: 'remark', title: '备注', minWidth: 150, showOverflow: true },
    {
      field: 'createdAt',
      title: '创建时间',
      width: 160,
      formatter: ({ row }: { row: Record<string, unknown> }) => {
        const val = row?.createdAt;
        return val != null ? String(val) : '-';
      },
    },
    {
      field: 'updatedAt',
      title: '更新时间',
      width: 160,
      formatter: ({ row }: { row: Record<string, unknown> }) => {
        const val = row?.updatedAt;
        return val != null ? String(val) : '-';
      },
    },
    {
      field: 'action',
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: {
        default: ({ row }) => {
          const record = row as unknown as AuthPolicyVO;
          return h('div', { class: 'flex gap-1' }, [
            h(
              ElButton,
              { size: 'small', link: true, type: 'primary', onClick: () => handleEdit(record) },
              () => '编辑',
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'danger', onClick: () => handleDelete(record) },
              () => '删除',
            ),
          ]);
        },
      },
    },
  ],
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async (params: Record<string, unknown>): Promise<{ items: Record<string, unknown>[]; total: number }> => {
        const formData = (params?.formData ?? {}) as Record<string, unknown>;
        try {
          const result = await page({
            query: {
              tenantId: formData?.tenantId as string | undefined,
              name: formData?.name as string | undefined,
            },
          });
          const data = result?.data;
          const items = Array.isArray(data) ? data : [];
          return {
            items: items as unknown as Record<string, unknown>[],
            total: result?.total ?? 0,
          };
        } catch (error) {
          logger.error('加载认证策略列表失败:', error);
          return { items: [], total: 0 };
        }
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, search: true, zoom: true },
  formConfig: {
    enabled: true,
    items: [
      { field: 'tenantId', title: '租户ID', itemRender: { name: 'Input', props: { placeholder: '租户ID' } } },
      { field: 'name', title: '策略名称', itemRender: { name: 'Input', props: { placeholder: '策略名称' } } },
    ],
  },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });
const [AuthPolicyFormModal, authPolicyFormApi] = useYDSZModal({ connectedComponent: AuthPolicyForm });

/**
 * 打开新增弹窗。
 */
function handleAdd() {
  authPolicyFormApi.open();
}

/**
 * 打开编辑弹窗。
 *
 * @param row - 行数据
 */
function handleEdit(row: AuthPolicyVO) {
  authPolicyFormApi.setData({ record: row });
  authPolicyFormApi.open();
}

/**
 * 删除认证策略。
 *
 * @param row - 行数据
 */
async function handleDelete(row: AuthPolicyVO) {
  if (!row.tenantId) {
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定删除认证策略「${row.name ?? row.tenantId ?? ''}」吗？此操作不可撤销。`,
      '删除确认',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    await deleteApi({ tenantId: row.tenantId });
    ElMessage.success('删除成功');
    gridApi.query();
  } catch {
    /* 错误由拦截器处理 */
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="认证策略管理">
      <template #toolbar-tools><ElButton type="primary" @click="handleAdd">新增</ElButton></template>
    </Grid>
    <AuthPolicyFormModal @success="gridApi.query()" />
  </Page>
</template>
