<!--
 * 规则追踪页面
 *
 * @path apps\literule-web\src\views\rule-trace\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 规则执行追踪与回放
 * <p>消费后端契约 RuleTraceController（apps/literule-web/src/api/ruleTrace.ts）：
 * listRecentTraces() / getTrace() / getTracesByRule() / replayTrace() /
 * batchReplayTraces() / impactPreview() 全量端点。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';

import { Page } from '@ydsz/common-ui';

import {
  ElButton,
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElInput,
  ElMessageBox,
  ElTag,
  ElTimeline,
  ElTimelineItem,
} from 'element-plus';
import { h, onMounted, ref } from 'vue';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { createLogger } from '@ydsz-core/shared/utils';

import type { RuleExecutionTraceVO } from '#/api/models';
import {
  batchReplayTraces,
  getTrace,
  getTracesByRule,
  impactPreview,
  listRecentTraces,
  replayTrace,
} from '#/api/ruleTrace';

const logger = createLogger('literule-rule-trace');

defineOptions({ name: 'RuleTraceManagement' });

/** ========== 状态 ========== */
const loading = ref(false);
const traceList = ref<RuleExecutionTraceVO[]>([]);
const searchRuleCode = ref('');
const searchTraceId = ref('');
const detailDialogVisible = ref(false);
const replayDialogVisible = ref(false);
const impactDialogVisible = ref(false);
const currentTraceId = ref('');
const currentRuleCode = ref('');
const detailList = ref<RuleExecutionTraceVO[]>([]);
const replayResult = ref<Record<string, Record<string, unknown>>>({});
const impactResult = ref<Record<string, Record<string, unknown>>>({});
const selectedTraceIds = ref<Set<string>>(new Set());

const LIMIT = 50;

/** ========== 追踪列表 ========== */
const traceGridOptions: VxeTableGridOptions<RuleExecutionTraceVO> = {
  columns: [
    {
      type: 'checkbox',
      width: 48,
    },
    { type: 'seq', width: 50, title: '#' },
    { field: 'traceId', title: 'Trace ID', width: 180 },
    { field: 'ruleCode', title: '规则编码', width: '160' },
    { field: 'ruleName', title: '规则名称', minWidth: 140 },
    {
      field: 'triggered',
      title: '命中',
      width: 70,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: row.triggered ? 'success' : 'info' }, () =>
            row.triggered ? '命中' : '未命中',
          ),
      },
    },
    {
      field: 'severity',
      title: '严重度',
      width: 80,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: severityTagType(row.severity) }, () => row.severity ?? '-'),
      },
    },
    {
      field: 'elapsedMs',
      title: '耗时(ms)',
      width: 90,
      slots: {
        default: ({ row }) => h('span', {}, row.elapsedMs != null ? `${row.elapsedMs}` : '-'),
      },
    },
    { field: 'scenario', title: '场景', width: 120 },
    { field: 'createdAt', title: '执行时间', width: 160 },
    {
      field: 'action',
      title: '操作',
      width: 240,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(
              ElButton,
              { size: 'small', link: true, type: 'primary', onClick: () => handleDetail(row) },
              () => '详情',
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'success', onClick: () => handleReplay(row) },
              () => '回放',
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'warning', onClick: () => handleImpact(row) },
              () => '影响分析',
            ),
          ]),
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async () => ({ items: traceList.value, total: traceList.value.length }),
    },
  },
  checkboxConfig: {
    reserve: true,
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};

const [TraceGrid, traceGridApi] = useYDSZVxeGrid({ gridOptions: traceGridOptions });

/** ========== 工具函数 ========== */
function severityTagType(severity?: string): 'danger' | 'warning' | 'info' | 'success' {
  if (!severity) return 'info';
  if (severity === 'HIGH') return 'danger';
  if (severity === 'MEDIUM') return 'warning';
  if (severity === 'LOW') return 'info';
  return 'success';
}

/** ========== 数据加载 ========== */
async function loadRecent(): Promise<void> {
  loading.value = true;
  try {
    traceList.value = await listRecentTraces({ limit: LIMIT });
  } catch (error) {
    logger.warn('加载执行追踪列表失败: {}', error);
  } finally {
    loading.value = false;
  }
}

async function handleSearch(): Promise<void> {
  if (searchTraceId.value.trim()) {
    loading.value = true;
    try {
      const result = await getTrace({ traceId: searchTraceId.value.trim() });
      traceList.value = result;
    } catch (error) {
      logger.warn('按Trace ID搜索失败: {}', error);
    } finally {
      loading.value = false;
    }
  } else if (searchRuleCode.value.trim()) {
    loading.value = true;
    try {
      traceList.value = await getTracesByRule(
        { ruleCode: searchRuleCode.value.trim() },
        { limit: LIMIT },
      );
    } catch (error) {
      logger.warn('按规则编码搜索失败: {}', error);
    } finally {
      loading.value = false;
    }
  } else {
    await loadRecent();
  }
}

/** ========== 操作回调 ========== */

async function handleDetail(row: RuleExecutionTraceVO): Promise<void> {
  if (!row.traceId) return;
  currentTraceId.value = row.traceId;
  currentRuleCode.value = row.ruleCode ?? '';
  try {
    detailList.value = await getTrace({ traceId: row.traceId });
    detailDialogVisible.value = true;
  } catch (error) {
    logger.warn('加载追踪详情失败: {}', error);
  }
}

async function handleReplay(row: RuleExecutionTraceVO): Promise<void> {
  if (!row.traceId) return;
  currentTraceId.value = row.traceId;
  currentRuleCode.value = row.ruleCode ?? '';
  try {
    replayResult.value = await replayTrace({ traceId: row.traceId });
    replayDialogVisible.value = true;
  } catch (error) {
    logger.warn('回放执行失败: {}', error);
  }
}

async function handleImpact(row: RuleExecutionTraceVO): Promise<void> {
  if (!row.ruleCode) return;
  currentRuleCode.value = row.ruleCode;
  try {
    impactResult.value = await impactPreview(
      { ruleCode: row.ruleCode },
      { facts: row.factsSnapshot ?? {} },
    );
    impactDialogVisible.value = true;
  } catch (error) {
    logger.warn('影响分析失败: {}', error);
  }
}

async function handleBatchReplay(): Promise<void> {
  if (selectedTraceIds.value.size === 0) {
    ElMessageBox.alert('请先选择要回放的Trace记录', '提示', { type: 'warning' });
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确认批量回放 ${selectedTraceIds.value.size} 条Trace记录？`,
      '批量回放确认',
      { type: 'warning' },
    );
  } catch {
    logger.debug('用户取消批量回放');
    return;
  }
  try {
    const payload: Record<string, Record<string, unknown>> = {};
    selectedTraceIds.value.forEach((id) => {
      payload[id] = { traceId: id };
    });
    await batchReplayTraces(payload);
    ElMessageBox.alert(`已成功提交 ${selectedTraceIds.value.size} 条回放请求`, '批量回放成功', {
      type: 'success',
    });
    selectedTraceIds.value.clear();
  } catch (error) {
    logger.warn('批量回放失败: {}', error);
  }
}

/** 复选框选择变化 */
function handleSelectionChange(
  selectedRows: RuleExecutionTraceVO[],
): void {
  selectedTraceIds.value = new Set(
    selectedRows.map((r) => r.traceId ?? '').filter(Boolean),
  );
}

onMounted(() => {
  void loadRecent();
});
</script>

<template>
  <Page auto-content-height>
    <div v-loading="loading" class="p-4">
      <ElCard shadow="never">
        <!-- 搜索区 -->
        <div class="flex items-center gap-3 mb-4">
          <ElInput
            v-model="searchTraceId"
            placeholder="按 Trace ID 搜索"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
          <ElInput
            v-model="searchRuleCode"
            placeholder="按规则编码搜索"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
          <ElButton type="primary" @click="handleSearch">搜索</ElButton>
          <ElButton @click="loadRecent">查看全部</ElButton>
          <ElButton type="success" @click="handleBatchReplay">批量回放 ({{ selectedTraceIds.size }})</ElButton>
        </div>

        <!-- 追踪列表 -->
        <TraceGrid @checkbox-change="handleSelectionChange" @checkbox-all="handleSelectionChange" />
      </ElCard>

      <!-- 详情弹窗 -->
      <ElDialog
        v-model="detailDialogVisible"
        :title="`执行链路详情 - ${currentTraceId}`"
        width="780px"
      >
        <ElDescriptions :column="2" border size="small" class="mb-4">
          <ElDescriptionsItem label="Trace ID">{{ currentTraceId }}</ElDescriptionsItem>
          <ElDescriptionsItem label="规则编码">{{ currentRuleCode }}</ElDescriptionsItem>
        </ElDescriptions>
        <ElTimeline>
          <ElTimelineItem
            v-for="(item, idx) in detailList"
            :key="idx"
            :timestamp="item.createdAt"
            :type="item.triggered ? 'success' : 'info'"
            placement="top"
          >
            <ElDescriptions :column="2" size="small" border>
              <ElDescriptionsItem label="规则编码">{{ item.ruleCode }}</ElDescriptionsItem>
              <ElDescriptionsItem label="规则名称">{{ item.ruleName }}</ElDescriptionsItem>
              <ElDescriptionsItem label="命中">
                <ElTag :type="item.triggered ? 'success' : 'info'">
                  {{ item.triggered ? '命中' : '未命中' }}
                </ElTag>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="严重度">
                <ElTag :type="severityTagType(item.severity)">{{ item.severity ?? '-' }}</ElTag>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="耗时">{{ item.elapsedMs }} ms</ElDescriptionsItem>
              <ElDescriptionsItem label="场景">{{ item.scenario ?? '-' }}</ElDescriptionsItem>
              <ElDescriptionsItem label="条件结果" :span="2">
                {{ item.conditionResult ?? '-' }}
              </ElDescriptionsItem>
              <ElDescriptionsItem v-if="item.errorMessage" label="错误" :span="2">
                <span class="text-red-500">{{ item.errorMessage }}</span>
              </ElDescriptionsItem>
            </ElDescriptions>
          </ElTimelineItem>
        </ElTimeline>
      </ElDialog>

      <!-- 回放结果弹窗 -->
      <ElDialog
        v-model="replayDialogVisible"
        :title="`回放结果 - ${currentTraceId}`"
        width="560px"
      >
        <ElDescriptions v-if="replayResult" :column="1" border size="small">
          <ElDescriptionsItem
            v-for="(value, key) in replayResult"
            :key="key"
            :label="key"
          >
            {{ typeof value === 'object' ? JSON.stringify(value) : String(value) }}
          </ElDescriptionsItem>
        </ElDescriptions>
        <div v-else class="text-center text-gray-400">暂无回放数据</div>
      </ElDialog>

      <!-- 影响分析弹窗 -->
      <ElDialog
        v-model="impactDialogVisible"
        :title="`影响分析预览 - ${currentRuleCode}`"
        width="560px"
      >
        <ElDescriptions v-if="impactResult" :column="1" border size="small">
          <ElDescriptionsItem
            v-for="(value, key) in impactResult"
            :key="key"
            :label="key"
          >
            {{ typeof value === 'object' ? JSON.stringify(value) : String(value) }}
          </ElDescriptionsItem>
        </ElDescriptions>
        <div v-else class="text-center text-gray-400">暂无影响分析数据</div>
      </ElDialog>
    </div>
  </Page>
</template>
