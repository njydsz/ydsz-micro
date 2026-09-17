<!--
 * 登录日志（只读列表）
 *
 * <p>展示用户登录历史：登录时间、IP 地址、设备/浏览器、登录状态（成功/失败）。
 * <p>数据来源：后端登录日志接口（/api/userinfo/login-log/page）。
 * <p>与"在线用户"互补：在线用户看当前会话，登录日志看历史记录。
 *
 * @path apps/userinfo-web/src/views/system/login-log/index.vue
 * @author ydsz-team
 * @since 26.09.13
-->
<script lang="ts" setup>
/**
 * 登录日志（只读列表）
 * <p>展示历史登录记录，支持按用户名、IP、状态、时间范围筛选和分页。
 *
 * @author ydsz-team
 * @since 26.09.13
 */
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';
import { Page } from '@ydsz/common-ui';
import { Badge, Button, DatePicker, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ydsz-core/shadcn-ui';
import { h, onMounted, ref } from 'vue';
import { Search } from 'lucide-vue-next';

import { createLogger } from '@ydsz-core/shared/utils';
import { pageLoginLog } from '#/api/loginLog';
import type { LoginLogPageQuery, LoginLogVO } from '#/api/models';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';

defineOptions({ name: 'LoginLogManagement' });

/** 模块级日志器 */
const logger = createLogger('userinfo-login-log');

const searchKeyword = ref('');
const statusFilter = ref<string>('all');
const startTime = ref<string>('');
const endTime = ref<string>('');
const totalCount = ref<number>(0);
const pageNum = ref<number>(1);
const pageSize = ref<number>(20);
const isLoading = ref<boolean>(false);

/** 登录记录列表 */
const logList = ref<LoginLogVO[]>([]);

/** 状态标签类型映射 */
function statusTagType(status: string): 'success' | 'danger' {
  return status === 'SUCCESS' ? 'success' : 'danger';
}

/**
 * 创建 ElTag VNode（用于列插槽）
 *
 * @param text - 标签文本
 * @param type - 标签类型
 * @returns VNode
 */
function hElTag(text: string, type: 'success' | 'danger' | 'warning' | 'info') {
  return h(Badge, { variant: type === 'success' ? 'default' : type === 'danger' ? 'destructive' : type === 'warning' ? 'outline' : 'secondary', class: type === 'success' ? 'bg-green-500 text-white hover:bg-green-600' : type === 'warning' ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400' : 'text-xs' }, () => text);
}

/**
 * 加载登录日志数据。
 */
async function loadLogList(): Promise<void> {
  isLoading.value = true;
  try {
    const query: LoginLogPageQuery = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      username: searchKeyword.value || undefined,
      status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
      startTime: startTime.value || undefined,
      endTime: endTime.value || undefined,
    };
    const response = await pageLoginLog(query);
    logList.value = response.data ?? [];
    totalCount.value = response.total ?? 0;
    logger.debug('加载登录日志: total={}', totalCount.value);
  } catch (error) {
    logger.error('加载登录日志失败: {}', error);
    showToast.error('加载登录日志失败，请稍后重试');
  } finally {
    isLoading.value = false;
  }
}

/**
 * 应用筛选条件并重新查询。
 */
function applyFilter(): void {
  pageNum.value = 1;
  void loadLogList();
}

/**
 * 重置筛选条件。
 */
function resetFilter(): void {
  searchKeyword.value = '';
  statusFilter.value = 'all';
  startTime.value = '';
  endTime.value = '';
  pageNum.value = 1;
  void loadLogList();
}

/**
 * 分页变更处理。
 *
 * @param newPageNum 新页码
 */
function handlePageChange(newPageNum: number): void {
  pageNum.value = newPageNum;
  void loadLogList();
}

const gridOptions: VxeGridProps<LoginLogVO> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'username', title: '用户名', width: 120 },
    {
      field: 'loginResult',
      title: '状态',
      width: 100,
      slots: {
        default: ({ row }: { row: LoginLogVO }) =>
          hElTag(row.loginResult === 'SUCCESS' ? '成功' : '失败', statusTagType(row.loginResult)),
      },
    },
    { field: 'loginIp', title: '登录IP', width: 140 },
    { field: 'location', title: '归属地', width: 100 },
    { field: 'browser', title: '浏览器', width: 140 },
    { field: 'os', title: '操作系统', width: 120 },
    { field: 'userAgent', title: 'User-Agent', minWidth: 200 },
    {
      field: 'failReason',
      title: '失败原因',
      width: 160,
      formatter: ({ cellValue }: { cellValue?: string }) => cellValue || '-',
    },
    { field: 'loginTime', title: '登录时间', width: 170 },
  ],
  height: 'auto',
  toolbarConfig: {
    custom: true,
    refresh: { code: 'reload' },
    zoom: true,
  },
  pagerConfig: {
    total: totalCount.value,
    currentPage: pageNum.value,
    pageSize: pageSize.value,
    pageSizes: [10, 20, 50, 100],
  },
  proxyConfig: {
    ajax: {
      query: () => Promise.resolve({ total: totalCount.value, data: logList.value }),
    },
  },
};

const [Grid] = useYDSZVxeGrid({ gridOptions });

/** 初始化加载数据 */
onMounted(() => {
  void loadLogList();
});
</script>

<template>
  <Page auto-content-height>
    <!-- 筛选区 -->
    <div class="mb-3 flex flex-wrap items-center gap-3 px-4 pt-3">
      <Input
        v-model="searchKeyword"
        placeholder="搜索用户名/IP"
        class="w-[200px]"
        @change="applyFilter"
      />
      <Select v-model="statusFilter" @update:model-value="applyFilter">
        <SelectTrigger class="w-[120px]">
          <SelectValue placeholder="状态" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部状态</SelectItem>
          <SelectItem value="SUCCESS">成功</SelectItem>
          <SelectItem value="FAILED">失败</SelectItem>
        </SelectContent>
      </Select>
      <ElDatePicker
        v-model="startTime"
        type="datetime"
        placeholder="起始时间"
        style="width: 180px"
        @change="applyFilter"
      />
      <ElDatePicker
        v-model="endTime"
        type="datetime"
        placeholder="结束时间"
        style="width: 180px"
        @change="applyFilter"
      />
      <ElButton @click="resetFilter">重置</ElButton>
      <div class="ml-auto text-sm text-gray-400">
        共 {{ totalCount }} 条记录
        <span v-if="isLoading" class="ml-2 text-blue-500">加载中...</span>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="px-4">
      <Grid />
    </div>
  </Page>
</template>
