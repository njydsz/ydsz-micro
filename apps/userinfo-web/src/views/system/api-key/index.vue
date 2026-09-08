<!--
 * API Key 管理列表视图
 *
 * <p>提供 API Key 的完整生命周期管理：创建、列表、启用/禁用、撤销。
 *
 * @path apps/userinfo-web/src/views/system/api-key/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * API Key 管理列表
 * <p>消费后端 ApiKeyController（apps/userinfo-web/src/api/apiKey.ts）：
 * pageKeys() 分页查询，revokeKeys() 批量撤销，updateEnabled() 启用/禁用。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';
import { Page, useYDSZModal } from '@ydsz/common-ui';
import { ElButton, ElMessage, ElMessageBox, ElSwitch } from 'element-plus';
import { createLogger } from '@ydsz/utils';
import { h } from 'vue';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { pageKeys, revokeKeys, updateEnabled, type ApiKeyVO } from '#/api/apiKey';
import ApiKeyForm from './api-key-form.vue';

defineOptions({ name: 'ApiKeyManagement' });

const logger = createLogger('userinfo-apikey');

const gridOptions: VxeTableGridOptions<ApiKeyVO> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'keyName', title: 'Key 名称', width: 160 },
    { field: 'apiKeyPrefix', title: 'Key 前缀', width: 120 },
    { field: 'scopes', title: '授权范围', width: 150, showOverflow: true },
    { field: 'rateLimit', title: '限流(次/分)', width: 110 },
    {
      field: 'expireAt',
      title: '过期时间',
      width: 160,
      formatter: ({ row }) => row.expireAt ?? '永不过期',
    },
    { field: 'lastUsedAt', title: '最后使用', width: 160 },
    { field: 'createdAt', title: '创建时间', width: 160 },
    {
      field: 'isEnabled',
      title: '状态',
      width: 100,
      slots: {
        default: ({ row }) => h(ElSwitch, {
          modelValue: row.isEnabled ?? false,
          'onUpdate:modelValue': async (val: boolean) => {
            try {
              await updateEnabled(row.id ?? 0, val);
              ElMessage.success(val ? '已启用' : '已禁用');
              gridApi.query();
            } catch {
              /* 错误由拦截器处理 */
            }
          },
        }),
      },
    },
    {
      field: 'action',
      title: '操作',
      width: 120,
      fixed: 'right',
      slots: {
        default: ({ row }) => h('div', { class: 'flex gap-1' }, [
          h(ElButton, { size: 'small', link: true, type: 'danger', onClick: () => handleRevoke(row) }, () => '撤销'),
        ]),
      },
    },
  ],
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async ({ formData, page }: { formData?: Record<string, unknown>; page?: { currentPage: number; pageSize: number } }) => {
        try {
          const result = await pageKeys({
            pageNum: page?.currentPage ?? 1,
            pageSize: page?.pageSize ?? 20,
            keyName: formData?.keyName as string | undefined,
          });
          return { items: result?.data ?? [], total: result?.total ?? 0 };
        } catch (error) {
          logger.error('加载 API Key 列表失败:', error);
          return { items: [], total: 0 };
        }
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, search: true, zoom: true },
  formConfig: {
    enabled: true,
    items: [
      { field: 'keyName', title: 'Key 名称', itemRender: { name: 'Input', props: { placeholder: 'Key 名称' } } },
    ],
  },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });
const [ApiKeyFormModal, apiKeyFormApi] = useYDSZModal({ connectedComponent: ApiKeyForm });

/**
 * 打开新增弹窗。
 */
function handleAdd() {
  apiKeyFormApi.open();
}

/**
 * 撤销 API Key。
 *
 * @param row - 行数据
 */
async function handleRevoke(row: ApiKeyVO) {
  if (!row.id) {
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定撤销 API Key「${row.keyName ?? row.apiKeyPrefix ?? ''}」吗？此操作不可撤销。`,
      '撤销确认',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    const count = await revokeKeys([row.id]);
    if (count > 0) {
      ElMessage.success('撤销成功');
      gridApi.query();
    }
  } catch {
    /* 错误由拦截器处理 */
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="API Key 管理">
      <template #toolbar-tools><ElButton type="primary" @click="handleAdd">新增</ElButton></template>
    </Grid>
    <ApiKeyFormModal @success="gridApi.query()" />
  </Page>
</template>
