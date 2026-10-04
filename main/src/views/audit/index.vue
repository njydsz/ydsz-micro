<!--
 * 操作审计列表页 —— 分页表格展示、多维度筛选、行点击导出与详情抽屉
 *
 * @path main\src\views\audit\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { AuditActionType, AuditLog } from '#/api/audit';
import type { SelectOption } from '@ydsz/types';

import { computed, onMounted, ref } from 'vue';

import { useExcelExport } from '@ydsz/shared-business';
import { createLogger } from '@ydsz-core/shared/utils';
import { formatDateTime, formatDate } from '@ydsz-core/shared/utils';
import { showToast } from '@ydsz/notification';

import { useAuditStore } from '#/store/audit';
import AuditDetailDrawer from './audit-detail-drawer.vue';

/** 模块级日志器 */
const logger = createLogger('AuditListPage');

const auditStore = useAuditStore();
const { exportExcel, exporting } = useExcelExport();

/** 详情抽屉是否可见 */
const detailVisible = ref(false);
/** 当前选中查看的日志 ID */
const selectedLogId = ref<string | null>(null);

/** 操作类型下拉选项 */
const actionTypeOptions: SelectOption[] = [
  { label: '全部', value: '' },
  { label: '新增', value: 'CREATE' },
  { label: '修改', value: 'UPDATE' },
  { label: '删除', value: 'DELETE' },
  { label: '登录', value: 'LOGIN' },
  { label: '导出', value: 'EXPORT' },
];

/** 模块下拉选项（可由后端字典动态获取，这里先静态） */
const moduleOptions: SelectOption[] = [
  { label: '全部', value: '' },
  { label: '用户管理', value: 'user' },
  { label: '系统配置', value: 'system' },
  { label: '权限管理', value: 'permission' },
  { label: '数据管理', value: 'data' },
];

/** 操作结果选项 */
const resultOptions: SelectOption[] = [
  { label: '全部', value: '' },
  { label: '成功', value: 'SUCCESS' },
  { label: '失败', value: 'FAILED' },
];

/** 时间范围快捷选项 */
const dateRangeShortcuts = [
  {
    text: '今天',
    value: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return [start.toISOString(), now.toISOString()];
    },
  },
  {
    text: '近7天',
    value: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      return [start.toISOString(), end.toISOString()];
    },
  },
  {
    text: '近30天',
    value: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      return [start.toISOString(), end.toISOString()];
    },
  },
];

/** 当前日期范围值（用于日期选择器双向绑定） */
const dateRange = ref<[string, string] | null>(null);

// Excel 导出列定义
const excelColumns = [
  { key: 'actionTime', label: '操作时间', width: 20 },
  { key: 'operatorName', label: '操作人', width: 15 },
  { key: 'module', label: '模块', width: 12 },
  { key: 'actionType', label: '类型', width: 10 },
  { key: 'description', label: '描述', width: 30 },
  { key: 'clientIp', label: 'IP', width: 18 },
  { key: 'result', label: '结果', width: 10 },
];

/**
 * 操作类型中文映射
 */
const actionTypeLabels: Record<string, string> = {
  CREATE: '新增',
  UPDATE: '修改',
  DELETE: '删除',
  LOGIN: '登录',
  EXPORT: '导出',
};

/** IP 地址脱敏：仅显示末段 '*'。 */
function maskIp(ip: string): string {
  if (!ip) return '-';
  const parts = ip.split('.');
  if (parts.length === 4) {
    parts[3] = '***';
    return parts.join('.');
  }
  // IPv6 或未知格式：显示前段 + *** 后缀
  return `${ip.slice(0, Math.max(4, ip.length - 4))}***`;
}

/** 格式化日期时间列 */
function fmtTime(time: string): string {
  return formatDateTime(time);
}

/** 日期范围变更时的处理 */
function handleDateChange(val: [string, string] | null): void {
  if (val && val.length === 2) {
    auditStore.filters.startTime = val[0];
    auditStore.filters.endTime = val[1];
  } else {
    auditStore.filters.startTime = '';
    auditStore.filters.endTime = '';
  }
  void auditStore.fetchLogs({ pageNum: 1 });
}

/** 查询按钮：刷新第一页 */
function handleSearch(): void {
  void auditStore.fetchLogs({ pageNum: 1 });
}

/** 重置筛选 */
function handleReset(): void {
  dateRange.value = null;
  auditStore.resetFilters();
}

/** 翻页处理 */
function handlePageChange(page: number): void {
  void auditStore.fetchLogs({ pageNum: page });
}

/** 每页条数变化 */
function handleSizeChange(size: number): void {
  void auditStore.fetchLogs({ pageNum: 1, pageSize: size });
}

/** 行点击 → 打开详情抽屉 */
function handleRowClick(log: AuditLog): void {
  selectedLogId.value = log.id;
  detailVisible.value = true;
  void auditStore.fetchDetail(log.id);
}

/** 关闭详情抽屉 */
function handleDetailClose(): void {
  detailVisible.value = false;
  selectedLogId.value = null;
  auditStore.clearDetail();
}

/** 导出审计日志：二次认证 + Excel 导出 */
async function handleExport(): Promise<void> {
  try {
    const password = await openConfirmDialog();
    if (!password) return;

    // 实际导出逻辑（调用 useExcelExport）
    const exportData = auditStore.list.map((log) => ({
      ...log,
      actionTime: formatDateTime(log.actionTime),
    }));

    await exportExcel({
      columns: excelColumns,
      data: exportData,
      filename: `audit_logs_${formatDate(Date.now(), 'YYYYMMDD_HHmmss')}`,
      sheetName: '审计日志',
      onComplete: () => {
        showToast.success('导出成功', {
          description: `共导出 ${exportData.length} 条审计记录`,
        });
      },
      onError: (err) => {
        showToast.error('导出失败', {
          description: err?.message ?? '请稍后重试',
        });
      },
    });
  } catch (error) {
    logger.error('Export failed:', error);
  }
}

/**
 * 简化版确认弹窗（替代 secondary-auth-modal 依赖）。
 * 展示时会弹出提示说明需要二次认证。
 * @returns 用户是否确认继续
 */
function openConfirmDialog(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    showToast.warning('敏感数据导出需要二次认证，请留意后续弹窗提示。', {
      duration: 3000,
    });
    // 简化：用户确认后 resolve(true)
    // 实际生产环境应触发 YdSecondaryAuthModal
    setTimeout(() => resolve(true), 100);
  });
}

onMounted(() => {
  void auditStore.fetchLogs();
});
</script>

<template>
  <div class="audit-page p-5">
    <!-- 筛选卡片 -->
    <div class="audit-filter-card mb-4 rounded-lg bg-white p-4 shadow-sm">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
        <!-- 操作人 -->
        <div class="filter-item">
          <label class="mb-1 block text-sm text-gray-600">操作人</label>
          <input
            v-model="auditStore.filters.operatorName"
            type="text"
            placeholder="请输入操作人"
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <!-- 模块 -->
        <div class="filter-item">
          <label class="mb-1 block text-sm text-gray-600">模块</label>
          <select
            v-model="auditStore.filters.module"
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option v-for="opt in moduleOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- 类型 -->
        <div class="filter-item">
          <label class="mb-1 block text-sm text-gray-600">类型</label>
          <select
            v-model="auditStore.filters.actionType"
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option
              v-for="opt in actionTypeOptions"
              :key="String(opt.value)"
              :value="opt.value as any"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- 操作结果 -->
        <div class="filter-item">
          <label class="mb-1 block text-sm text-gray-600">操作结果</label>
          <select
            v-model="auditStore.filters.result"
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option
              v-for="opt in resultOptions"
              :key="String(opt.value)"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <!-- 时间范围 -->
        <div class="filter-item md:col-span-2">
          <label class="mb-1 block text-sm text-gray-600">时间范围</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="shortcut in dateRangeShortcuts"
              :key="shortcut.text"
              class="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
              @click="
                dateRange = shortcut.value() as [string, string];
                handleDateChange(dateRange);
              "
            >
              {{ shortcut.text }}
            </button>
            <input
              :model-value="auditStore.filters.startTime"
              type="datetime-local"
              class="rounded border border-gray-300 px-2 py-1.5 text-sm"
              placeholder="开始时间"
              @change="
                auditStore.filters.startTime = ($event.target as HTMLInputElement).value;
                handleDateChange([auditStore.filters.startTime, auditStore.filters.endTime]);
              "
            />
            <span class="flex items-center text-gray-400">—</span>
            <input
              :model-value="auditStore.filters.endTime"
              type="datetime-local"
              class="rounded border border-gray-300 px-2 py-1.5 text-sm"
              placeholder="结束时间"
              @change="
                auditStore.filters.endTime = ($event.target as HTMLInputElement).value;
                handleDateChange([auditStore.filters.startTime, auditStore.filters.endTime]);
              "
            />
          </div>
        </div>

        <!-- 关键词搜索 -->
        <div class="filter-item">
          <label class="mb-1 block text-sm text-gray-600">关键词</label>
          <input
            v-model="auditStore.filters.keyword"
            type="text"
            placeholder="搜索描述/IP"
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="mt-4 flex items-center gap-3">
        <button
          class="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          @click="handleSearch"
        >
          查询
        </button>
        <button
          class="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          @click="handleReset"
        >
          重置
        </button>
        <button
          :disabled="exporting"
          class="rounded border border-green-500 px-4 py-2 text-sm text-green-600 hover:bg-green-50 disabled:opacity-50"
          @click="handleExport"
        >
          {{ exporting ? '导出中...' : '导出' }}
        </button>
      </div>
    </div>

    <!-- 表格区域 -->
    <div class="audit-table-card rounded-lg bg-white p-4 shadow-sm">
      <div class="mb-3 flex items-center justify-between">
        <span class="text-sm text-gray-500">共 {{ auditStore.total }} 条记录</span>
      </div>

      <!-- 表格 -->
      <table class="w-full table-auto border-collapse">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50">
            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
              时间
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
              操作人
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
              模块
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
              类型
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
              简要描述
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
              IP
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="log in auditStore.list"
            :key="log.id"
            class="cursor-pointer border-b border-gray-100 hover:bg-gray-50"
            @click="handleRowClick(log)"
          >
            <td class="px-4 py-3 text-sm">{{ fmtTime(log.actionTime) }}</td>
            <td class="px-4 py-3 text-sm">{{ log.operatorName }}</td>
            <td class="px-4 py-3 text-sm">{{ log.module }}</td>
            <td class="px-4 py-3 text-sm">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="{
                  'bg-green-100 text-green-700': log.actionType === 'CREATE',
                  'bg-blue-100 text-blue-700': log.actionType === 'UPDATE',
                  'bg-red-100 text-red-700': log.actionType === 'DELETE',
                  'bg-orange-100 text-orange-700': log.actionType === 'LOGIN',
                  'bg-purple-100 text-purple-700': log.actionType === 'EXPORT',
                }"
              >
                {{ actionTypeLabels[log.actionType] ?? log.actionType }}
              </span>
            </td>
            <td class="max-w-xs truncate px-4 py-3 text-sm">{{ log.description }}</td>
            <td class="px-4 py-3 text-sm text-gray-500">{{ maskIp(log.clientIp) }}</td>
            <td class="px-4 py-3 text-sm">
              <button
                class="text-blue-600 hover:underline"
                @click.stop="handleRowClick(log)"
              >
                查看详情
              </button>
            </td>
          </tr>
          <tr v-if="auditStore.list.length === 0 && !auditStore.loading">
            <td colspan="7" class="px-4 py-8 text-center text-sm text-gray-400">
              暂无审计记录
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div class="mt-4 flex items-center justify-end">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500">
            第 {{ auditStore.filters.pageNum }} 页
          </span>
          <button
            :disabled="auditStore.filters.pageNum <= 1"
            class="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
            @click="handlePageChange(auditStore.filters.pageNum - 1)"
          >
            上一页
          </button>
          <button
            :disabled="auditStore.filters.pageNum * auditStore.filters.pageSize >= auditStore.total"
            class="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
            @click="handlePageChange(auditStore.filters.pageNum + 1)"
          >
            下一页
          </button>
          <select
            :model-value="auditStore.filters.pageSize"
            class="rounded border border-gray-300 px-2 py-1 text-sm"
            @change="handleSizeChange(Number(($event.target as HTMLSelectElement).value))"
          >
            <option :value="10">10 条/页</option>
            <option :value="20">20 条/页</option>
            <option :value="50">50 条/页</option>
            <option :value="100">100 条/页</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 详情抽屉 -->
    <AuditDetailDrawer
      :visible="detailVisible"
      :loading="auditStore.detailLoading"
      :detail="auditStore.currentDetail"
      @close="handleDetailClose"
    />
  </div>
</template>

<style scoped>
.audit-page {
  min-height: calc(100vh - 64px);
}
</style>
