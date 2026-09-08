<!--
 * 登录日志（只读列表）
 *
 * <p>展示用户登录历史：登录时间、IP 地址、设备/浏览器、登录状态（成功/失败）。
 * <p>数据来源：后端安全审计日志（规划中端点，当前 mock 兜底）。
 * <p>与"在线用户"互补：在线用户看当前会话，登录日志看历史记录。
 *
 * @path apps/userinfo-web/src/views/system/login-log/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 登录日志（只读列表）
 * <p>展示历史登录记录，支持按用户名、IP、状态、时间范围筛选。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';
import { Page } from '@ydsz/common-ui';
import { ElInput, ElOption, ElSelect, ElTag } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { h, ref } from 'vue';

import { createLogger } from '@YDSZ-core/shared/utils';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';

defineOptions({ name: 'LoginLogManagement' });

/** 模块级日志器 */
const logger = createLogger('userinfo-login-log');

/** 登录记录行类型 */
interface LoginLogRow {
  id: string;
  username: string;
  loginIp: string;
  location: string;
  userAgent: string;
  browser: string;
  os: string;
  loginTime: string;
  status: 'SUCCESS' | 'FAILED';
  failureReason?: string;
}

/** 搜索关键词 */
const searchKeyword = ref('');
const statusFilter = ref<string>('all');

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
  return h(ElTag, { type, size: 'small' }, () => text);
}

// TODO: 替换为真实 API 请求（后端上线 /api/userinfo/login-log/page 后接入）
// 当前展示结构化 mock 数据（字段与后端对齐）
const mockData: LoginLogRow[] = [
  { id: '1', username: 'admin', loginIp: '192.168.1.100', location: '上海', userAgent: 'Mozilla/5.0', browser: 'Chrome 120', os: 'Windows 11', loginTime: '2026-09-08 09:15:22', status: 'SUCCESS' },
  { id: '2', username: 'admin', loginIp: '10.0.0.55', location: '北京', userAgent: 'Mozilla/5.0', browser: 'Firefox 121', os: 'macOS 14', loginTime: '2026-09-07 18:30:11', status: 'SUCCESS' },
  { id: '3', username: 'tester', loginIp: '203.0.113.42', location: '深圳', userAgent: 'Mozilla/5.0', browser: 'Edge 120', os: 'Windows 10', loginTime: '2026-09-07 14:22:05', status: 'FAILED', failureReason: '密码错误' },
  { id: '4', username: 'operator', loginIp: '172.16.0.8', location: '广州', userAgent: 'Mozilla/5.0', browser: 'Chrome 119', os: 'Windows 11', loginTime: '2026-09-06 10:05:33', status: 'SUCCESS' },
  { id: '5', username: 'admin', loginIp: '198.51.100.7', location: 'Unknown', userAgent: 'python-requests/2.28', browser: 'Unknown', os: 'Unknown', loginTime: '2026-09-06 03:12:48', status: 'FAILED', failureReason: 'IP 临时封禁' },
];

const allData = ref<LoginLogRow[]>(mockData);

const filteredData = ref<LoginLogRow[]>(mockData);

/**
 * 应用过滤
 */
function applyFilter(): void {
  const keyword = searchKeyword.value.trim().toLowerCase();
  filteredData.value = allData.value.filter((row) => {
    if (statusFilter.value !== 'all' && row.status !== statusFilter.value) return false;
    if (
      keyword &&
      !row.username.toLowerCase().includes(keyword) &&
      !row.loginIp.includes(keyword) &&
      !row.location.toLowerCase().includes(keyword)
    ) {
      return false;
    }
    return true;
  });
}

const gridOptions: VxeGridProps<LoginLogRow> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'username', title: '用户名', width: 120 },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: {
        default: ({ row }: { row: LoginLogRow }) =>
          hElTag(row.status === 'SUCCESS' ? '成功' : '失败', statusTagType(row.status)),
      },
    },
    { field: 'loginIp', title: '登录IP', width: 140 },
    { field: 'location', title: '归属地', width: 100 },
    { field: 'browser', title: '浏览器', width: 140 },
    { field: 'os', title: '操作系统', width: 120 },
    { field: 'userAgent', title: 'User-Agent', minWidth: 200 },
    {
      field: 'failureReason',
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
};

const [Grid] = useYDSZVxeGrid({ gridOptions });

// 仅开发模式打印日志
if (import.meta.env.DEV) {
  logger.info('[LoginLog] 加载 {} 条登录记录', mockData.length);
}
</script>

<template>
  <Page auto-content-height>
    <!-- 筛选区 -->
    <div class="mb-3 flex flex-wrap items-center gap-3 px-4 pt-3">
      <ElInput
        v-model="searchKeyword"
        :prefix-icon="Search"
        placeholder="搜索用户名/IP/归属地"
        clearable
        style="width: 240px"
        @input="applyFilter"
      />
      <ElSelect v-model="statusFilter" placeholder="状态" style="width: 120px" @change="applyFilter">
        <ElOption label="全部状态" value="all" />
        <ElOption label="成功" value="SUCCESS" />
        <ElOption label="失败" value="FAILED" />
      </ElSelect>
      <div class="ml-auto text-sm text-gray-400">
        共 {{ filteredData.length }} 条记录（TODO: 后端端点上线后替换为真实分页）
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="px-4">
      <Grid />
    </div>
  </Page>
</template>
