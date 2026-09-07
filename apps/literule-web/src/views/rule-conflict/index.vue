<!--
 * 规则冲突检测页面
 *
 * <p>展示规则间的冲突检测结果，帮助识别规则集中存在冗余、矛盾、重叠或遮蔽的规则对。
 *
 * @path apps\literule-web\src\views\rule-conflict\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 规则冲突检测
 * <p>消费后端契约 RuleConflictController（apps/literule-web/src/api/ruleConflict.ts）：
 * detectConflicts() 端点。
 *
 * @author ydsz-team
 * @since 1.0.0
 */

import { Page } from '@ydsz/common-ui';

import {
  ElButton,
  ElCard,
  ElEmpty,
  ElProgress,
  ElStatistic,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';
import { computed, onMounted, ref } from 'vue';

import { createLogger } from '@YDSZ-core/shared/utils';

import { detectConflicts } from '#/api/ruleConflict';
import type { RuleConflictInfoVO } from '#/api/models';

const logger = createLogger('literule-rule-conflict');

defineOptions({ name: 'RuleConflictManagement' });

/** ========== 状态 ========== */
const loading = ref(false);
const conflictList = ref<RuleConflictInfoVO[]>([]);
const lastDetectTime = ref<string>('');

/** ========== 计算属性 ========== */
const totalPairs = computed(() => conflictList.value.length);

const highSeverityCount = computed(
  () => conflictList.value.filter((c) => c.severity === 'HIGH').length,
);

const affectedRulesCount = computed(() => {
  const ruleSet = new Set<string>();
  conflictList.value.forEach((c) => {
    if (c.ruleA) ruleSet.add(c.ruleA);
    if (c.ruleB) ruleSet.add(c.ruleB);
  });
  return ruleSet.size;
});

const severityPercent = computed(() => {
  if (totalPairs.value === 0) return 0;
  return Math.round((highSeverityCount.value / totalPairs.value) * 100);
});

/** ========== 工具函数 ========== */
function severityTagType(severity?: string): 'danger' | 'warning' | 'info' | 'success' {
  if (!severity) return 'info';
  if (severity === 'HIGH') return 'danger';
  if (severity === 'MEDIUM') return 'warning';
  if (severity === 'LOW') return 'info';
  return 'success';
}

function severityLabel(severity?: string): string {
  const map: Record<string, string> = {
    HIGH: '高',
    MEDIUM: '中',
    LOW: '低',
  };
  return map[severity ?? ''] ?? severity ?? '-';
}

function formatOverlapFields(fields?: string[]): string {
  if (!fields || fields.length === 0) return '-';
  return fields.join(', ');
}

function formatTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

/** ========== 操作回调 ========== */
async function handleDetect(): Promise<void> {
  loading.value = true;
  try {
    conflictList.value = await detectConflicts();
    lastDetectTime.value = formatTimestamp();
    logger.info('规则冲突检测完成，共发现 {} 对冲突', conflictList.value.length);
  } catch (error) {
    logger.warn('规则冲突检测失败: {}', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void handleDetect();
});
</script>

<template>
  <Page auto-content-height>
    <div v-loading="loading" class="p-4">
      <!-- 顶部统计区 -->
      <ElCard shadow="never" class="mb-4">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <span class="text-base font-semibold text-gray-700">规则冲突检测</span>
            <ElTag v-if="lastDetectTime" type="info" size="small">
              最近检测: {{ lastDetectTime }}
            </ElTag>
          </div>
          <ElButton type="primary" @click="handleDetect">
            立即检测
          </ElButton>
        </div>

        <div class="grid grid-cols-3 gap-6 mb-4">
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <ElStatistic title="冲突对数" :value="totalPairs" />
          </div>
          <div class="text-center p-4 bg-red-50 rounded-lg">
            <ElStatistic title="高严重度数" :value="highSeverityCount" value-style="color: #f56c6c" />
          </div>
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <ElStatistic title="影响规则数" :value="affectedRulesCount" value-style="color: #409eff" />
          </div>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-500 w-20">高严重度占比</span>
          <ElProgress
            :percentage="severityPercent"
            :stroke-width="12"
            :status="severityPercent > 50 ? 'exception' : ''"
            style="flex: 1"
          />
        </div>
      </ElCard>

      <!-- 冲突列表 -->
      <ElCard shadow="never">
        <ElTable v-if="conflictList.length > 0" :data="conflictList" stripe border>
          <ElTableColumn type="index" label="#" width="50" />
          <ElTableColumn label="规则 A" min-width="160">
            <template #default="{ row }">
              <div>{{ row.ruleA ?? '-' }}</div>
              <div class="text-xs text-gray-400">{{ row.ruleAName ?? '' }}</div>
            </template>
          </ElTableColumn>
          <ElTableColumn label="规则 B" min-width="160">
            <template #default="{ row }">
              <div>{{ row.ruleB ?? '-' }}</div>
              <div class="text-xs text-gray-400">{{ row.ruleBName ?? '' }}</div>
            </template>
          </ElTableColumn>
          <ElTableColumn label="重叠字段" min-width="180">
            <template #default="{ row }">
              <span :class="row.overlapFields?.length ? 'text-orange-500' : 'text-gray-400'">
                {{ formatOverlapFields(row.overlapFields) }}
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="严重度" width="100" align="center">
            <template #default="{ row }">
              <ElTag :type="severityTagType(row.severity)">
                {{ severityLabel(row.severity) }}
              </ElTag>
            </template>
          </ElTableColumn>
        </ElTable>

        <ElEmpty
          v-else
          description="未检测到规则冲突，规则集运行良好"
          image-size="120"
        />
      </ElCard>
    </div>
  </Page>
</template>
