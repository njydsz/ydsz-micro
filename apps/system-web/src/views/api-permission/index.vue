<!--
 * 接口权限管理页面 — 接口权限的分页列表、搜索、启用/禁用、删除、触发扫描
 *
 * @path apps\system-web\src\views\api-permission\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 接口权限管理（列表页）
 * <p>消费后端契约 ApiPermissionController（src/api/api-permission.ts）的接口权限列表页：
 * 分页查询 page、启用 enable、禁用 disable、删除 remove、触发扫描 scan。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';

import { Page } from '@ydsz/common-ui';

import { createLogger } from '@ydsz-core/shared/utils';
import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import { h, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAccess } from '@ydsz/access';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { disable, enable, page, remove, scan } from '#/api/api-permission';
import type { ApiPermissionPageQuery, ApiPermissionVO } from '#/api/api-permission';
import type { PageQuery } from '#/api/models';

defineOptions({ name: 'ApiPermissionManagement' });

/** 按钮级权限判断 */
const { hasAccessByCodesAll } = useAccess();

const logger = createLogger('api-permission');

const { t } = useI18n();

/** 行类型 */
type ApiPermissionRow = ApiPermissionVO;

/** 分页查询参数 */
type ApiPermissionQueryParams = ApiPermissionPageQuery & PageQuery;

/** 状态是否启用（后端 status 为字符串，兼容 '1' / 'ENABLED' 两种取值） */
function isEnabled(status?: string): boolean {
  return status === '1' || status === 'ENABLED';
}

/** HTTP 方法对应的标签类型 */
function httpMethodType(method?: string) {
  switch (method) {
    case 'GET': return 'success';
    case 'POST': return 'primary';
    case 'PUT': return 'warning';
    case 'DELETE': return 'danger';
    default: return 'info';
  }
}

const gridOptions = {
  columns: [
    { type: 'seq', width: 50, title: t('common.seq') },
    {
      field: 'apiCode',
      title: t('apiPermission.apiCode'),
      width: 180,
      slots: {
        default: ({ row }: { row: ApiPermissionRow }) => h('span', { class: 'font-bold' }, row.apiCode ?? ''),
      },
    },
    { field: 'apiName', title: t('apiPermission.apiName'), width: 150 },
    {
      field: 'httpMethod',
      title: t('apiPermission.httpMethod'),
      width: 90,
      slots: {
        default: ({ row }: { row: ApiPermissionRow }) => {
          if (!row.httpMethod) return h('span', {}, '-');
          return h(ElTag, { type: httpMethodType(row.httpMethod), size: 'small' }, () => row.httpMethod ?? '');
        },
      },
    },
    {
      field: 'urlPattern',
      title: t('apiPermission.urlPattern'),
      width: 200,
      showOverflow: 'tooltip',
    },
    {
      field: 'controllerClass',
      title: t('apiPermission.controllerClass'),
      width: 200,
      showOverflow: 'tooltip',
    },
    {
      field: 'methodName',
      title: t('apiPermission.methodName'),
      width: 140,
    },
    {
      field: 'status',
      title: t('common.status'),
      width: 90,
      slots: {
        default: ({ row }: { row: ApiPermissionRow }) => h(
          ElTag,
          { type: isEnabled(row.status) ? 'success' : 'info', size: 'small' },
          () => (isEnabled(row.status) ? t('common.enabled') : t('common.disabled')),
        ),
      },
    },
    {
      field: 'createdAt',
      title: t('common.createTime'),
      width: 160,
      formatter: ({ cellValue }: { cellValue: any }) => cellValue || '-',
    },
    {
      field: 'action',
      title: t('common.actions'),
      width: 180,
      fixed: 'right',
      slots: {
        default: ({ row }: { row: ApiPermissionRow }) => {
          const buttons = [];
          // 启用/禁用按钮 — 需要 sys:permission:api-edit 权限
          if (hasAccessByCodesAll(['sys:permission:api-edit'])) {
            buttons.push(
              h(
                ElButton,
                {
                  size: 'small',
                  link: true,
                  type: isEnabled(row.status) ? 'warning' : 'success',
                  onClick: () => handleToggleStatus(row),
                },
                () => (isEnabled(row.status) ? t('common.disabled') : t('common.enabled')),
              ),
            );
          }
          // 删除按钮 — 需要 sys:permission:api-delete 权限
          if (hasAccessByCodesAll(['sys:permission:api-delete'])) {
            buttons.push(
              h(
                ElButton,
                { size: 'small', link: true, type: 'danger', onClick: () => handleDelete(row) },
                () => t('common.delete'),
              ),
            );
          }
          return h('div', { class: 'flex gap-1' }, buttons);
        },
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async ({ page: pageInfo }: any, formValues: any) => {
        const query: ApiPermissionQueryParams = {
          pageNum: pageInfo.currentPage,
          pageSize: pageInfo.pageSize,
          ...formValues,
        };
        const res = await page({ query });
        return { items: res.data ?? [], total: res.total ?? 0 };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, search: true, zoom: true },
  formConfig: {
    enabled: true,
    items: [
      { field: 'apiCode', title: t('apiPermission.apiCode'), itemRender: { name: 'Input', props: { placeholder: t('apiPermission.apiCodePlaceholder') } } },
      { field: 'apiName', title: t('apiPermission.apiName'), itemRender: { name: 'Input', props: { placeholder: t('apiPermission.apiNamePlaceholder') } } },
      { field: 'controllerClass', title: t('apiPermission.controllerClass'), itemRender: { name: 'Input', props: { placeholder: t('apiPermission.controllerClassPlaceholder') } } },
    ],
  },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions } as any);

/** 是否正在扫描 */
const scanning = ref(false);

/**
 * 触发扫描注册
 */
async function handleScan() {
  scanning.value = true;
  try {
    const count = await scan();
    ElMessage.success(t('apiPermission.scanSuccess', { count: count ?? 0 }));
    gridApi.query();
  } catch (error) {
    logger.warn('触发扫描失败', error);
  } finally {
    scanning.value = false;
  }
}

/**
 * 切换启用/禁用状态
 */
async function handleToggleStatus(row: ApiPermissionRow) {
  const willEnable = !isEnabled(row.status);
  const confirmMessage = willEnable
    ? t('apiPermission.enableConfirm', [row.apiCode ?? ''])
    : t('apiPermission.disableConfirm', [row.apiCode ?? '']);

  try {
    await ElMessageBox.confirm(confirmMessage, t('common.confirm'), { type: 'warning' });
  } catch {
    return;
  }

  try {
    if (row.id) {
      if (willEnable) {
        await enable({ id: row.id });
      } else {
        await disable({ id: row.id });
      }
    }
    ElMessage.success(t('operationSuccess'));
    gridApi.query();
  } catch (error) {
    logger.warn('切换接口权限状态失败', error);
  }
}

/**
 * 删除接口权限
 */
async function handleDelete(row: ApiPermissionRow) {
  try {
    await ElMessageBox.confirm(t('apiPermission.deleteConfirm', [row.apiCode ?? '']), t('common.deleteConfirm'), { type: 'warning' });
  } catch {
    return;
  }

  try {
    if (row.id) await remove({ id: row.id });
    ElMessage.success(t('operationSuccess'));
    gridApi.query();
  } catch (error) {
    logger.warn('删除接口权限失败', error);
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="t('apiPermission.title')">
      <template #toolbar-tools>
        <ElButton v-permission="'sys:permission:api-scan'" :loading="scanning" type="success" @click="handleScan">
          {{ t('apiPermission.triggerScan') }}
        </ElButton>
      </template>
    </Grid>
  </Page>
</template>
