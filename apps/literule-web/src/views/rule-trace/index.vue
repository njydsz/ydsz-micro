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
  YdBadge,
  YdButton,
  YdCard,
  YdDescriptions,
  YdDescriptionsItem,
  YdDialog,
  YdInput,
  YdTimeline,
  YdTimelineItem,
} from '@ydsz-core/ydsz-ui';
import { YdAlert, YdConfirm } from '@ydsz-core/popup-ui';
import { h, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

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
const { t } = useI18n();

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
    { field: 'ruleCode', title: t('page.ruleTrace.ruleCode'), width: '160' },
    { field: 'ruleName', title: t('page.ruleTrace.ruleName'), minWidth: 140 },
    {
      field: 'triggered',
      title: t('page.ruleTrace.triggered'),
      width: 70,
      slots: {
        default: ({ row }) =>
          h(YdBadge, { variant: row.triggered ? 'success' : 'info' }, () =>
            row.triggered
              ? t('page.ruleTrace.triggered')
              : t('page.ruleTrace.notTriggered'),
          ),
      },
    },
    {
      field: 'severity',
      title: t('page.ruleTrace.severity'),
      width: 80,
      slots: {
        default: ({ row }) =>
          h(YdBadge, { variant: severityTagType(row.severity) }, () => row.severity ?? '-'),
      },
    },
    {
      field: 'elapsedMs',
      title: t('page.ruleTrace.elapsedMs'),
      width: 90,
      slots: {
        default: ({ row }) => h('span', {}, row.elapsedMs != null ? `${row.elapsedMs}` : '-'),
      },
    },
    { field: 'scenario', title: t('page.ruleTrace.scenario'), width: 120 },
    { field: 'createdAt', title: t('page.ruleTrace.executedAt'), width: 160 },
    {
      field: 'action',
      title: t('page.ruleTrace.action'),
      width: 240,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(
              YdButton,
              { size: 'small', variant: 'link', onClick: () => handleDetail(row) },
              () => t('page.ruleTrace.detail'),
            ),
            h(
              YdButton,
              { size: 'small', variant: 'link', onClick: () => handleReplay(row) },
              () => t('page.ruleTrace.replay'),
            ),
            h(
              YdButton,
              { size: 'small', variant: 'link', onClick: () => handleImpact(row) },
              () => t('page.ruleTrace.impactAnalysis'),
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

const [TraceGrid] = useYDSZVxeGrid({ gridOptions: traceGridOptions });

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
    await YdAlert({
      content: '请先选择要回放的Trace记录',
      title: '提示',
      icon: 'warning',
      confirmText: '确定',
    });
    return;
  }
  try {
    await YdConfirm(`确认批量回放 ${selectedTraceIds.value.size} 条Trace记录？`, '批量回放确认', {
      icon: 'warning',
    });
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
    await YdAlert({
      content: `已成功提交 ${selectedTraceIds.value.size} 条回放请求`,
      title: '批量回放成功',
      icon: 'success',
      confirmText: '确定',
    });
    selectedTraceIds.value.clear();
  } catch (error) {
    logger.warn('批量回放失败: {}', error);
  }
}

/** 复选框选择变化 */
function handleSelectionChange(selectedRows: RuleExecutionTraceVO[]): void {
  selectedTraceIds.value = new Set(selectedRows.map((r) => r.traceId ?? '').filter(Boolean));
}

onMounted(() => {
  void loadRecent();
});
</script>

<template>
  <Page auto-content-height>
    <div v-loading="loading" class="p-5">
      <YdCard shadow="never">
        <!-- 搜索区 -->
        <div class="mb-4 flex items-center gap-3">
          <YdInput
            v-model="searchTraceId"
            :placeholder="$t('page.ruleTrace.searchByTraceId')"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
          <YdInput
            v-model="searchRuleCode"
            :placeholder="$t('page.ruleTrace.searchByRuleCode')"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
          <YdButton type="primary" @click="handleSearch">
            {{ $t('page.common.search') }}
          </YdButton>
          <YdButton @click="loadRecent">{{ $t('page.ruleTrace.viewAll') }}</YdButton>
          <YdButton type="success" @click="handleBatchReplay">
            {{ $t('page.ruleTrace.batchReplay', { count: selectedTraceIds.size }) }}
          </YdButton>
          >
        </div>

        <!-- 追踪列表 -->
        <TraceGrid @checkbox-change="handleSelectionChange" @checkbox-all="handleSelectionChange" />
      </YdCard>

      <!-- 详情弹窗 -->
      <YdDialog
        v-model="detailDialogVisible"
        :title="$t('page.ruleTrace.executionDetailTitle', { traceId: currentTraceId })"
        width="780px"
      >
        <YdDescriptions :column="2" border size="small" class="mb-4">
          <YdDescriptionsItem label="Trace ID">{{ currentTraceId }}</YdDescriptionsItem>
          <YdDescriptionsItem :label="$t('page.ruleTrace.ruleCode')">
            {{ currentRuleCode }}
          </YdDescriptionsItem>
        </YdDescriptions>
        <YdTimeline>
          <YdTimelineItem
            v-for="(item, idx) in detailList"
            :key="item.createdAt ?? idx"
            :timestamp="item.createdAt"
            :type="item.triggered ? 'success' : 'info'"
            placement="top"
          >
            <YdDescriptions :column="2" size="small" border>
              <YdDescriptionsItem :label="$t('page.ruleTrace.ruleCode')">
                {{ item.ruleCode }}
              </YdDescriptionsItem>
              <YdDescriptionsItem :label="$t('page.ruleTrace.ruleName')">
                {{ item.ruleName }}
              </YdDescriptionsItem>
              <YdDescriptionsItem :label="$t('page.ruleTrace.triggered')">
                <YdBadge :type="item.triggered ? 'success' : 'info'">
                  {{
                    item.triggered
                      ? $t('page.ruleTrace.triggered')
                      : $t('page.ruleTrace.notTriggered')
                  }}
                </YdBadge>
              </YdDescriptionsItem>
              <YdDescriptionsItem :label="$t('page.ruleTrace.severity')">
                <YdBadge :type="severityTagType(item.severity)">{{ item.severity ?? '-' }}</YdBadge>
              </YdDescriptionsItem>
              <YdDescriptionsItem :label="$t('page.ruleTrace.elapsed')">
                {{ item.elapsedMs }} ms
              </YdDescriptionsItem>
              <YdDescriptionsItem :label="$t('page.ruleTrace.scenario')">
                {{ item.scenario ?? '-' }}
              </YdDescriptionsItem>
              <YdDescriptionsItem :label="$t('page.ruleTrace.conditionResult')" :span="2">
                {{ item.conditionResult ?? '-' }}
              </YdDescriptionsItem>
              <YdDescriptionsItem
                v-if="item.errorMessage"
                :label="$t('page.ruleTrace.error')"
                :span="2"
              >
                <span class="text-red-500">{{ item.errorMessage }}</span>
              </YdDescriptionsItem>
            </YdDescriptions>
          </YdTimelineItem>
        </YdTimeline>
      </YdDialog>

      <!-- 回放结果弹窗 -->
      <YdDialog
        v-model="replayDialogVisible"
        :title="$t('page.ruleTrace.replayResultTitle', { traceId: currentTraceId })"
        width="560px"
      >
        <YdDescriptions v-if="replayResult" :column="1" border size="small">
          <YdDescriptionsItem v-for="(value, key) in replayResult" :key="key" :label="key">
            {{ typeof value === 'object' ? JSON.stringify(value) : String(value) }}
          </YdDescriptionsItem>
        </YdDescriptions>
        <div v-else class="text-center text-gray-400">
          {{ $t('page.ruleTrace.noReplayData') }}
        </div>
      </YdDialog>

      <!-- 影响分析弹窗 -->
      <YdDialog
        v-model="impactDialogVisible"
        :title="$t('page.ruleTrace.impactPreviewTitle', { ruleCode: currentRuleCode })"
        width="560px"
      >
        <YdDescriptions v-if="impactResult" :column="1" border size="small">
          <YdDescriptionsItem v-for="(value, key) in impactResult" :key="key" :label="key">
            {{ typeof value === 'object' ? JSON.stringify(value) : String(value) }}
          </YdDescriptionsItem>
        </YdDescriptions>
        <div v-else class="text-center text-gray-400">
          {{ $t('page.ruleTrace.noImpactData') }}
        </div>
      </YdDialog>
    </div>
  </Page>
</template>
