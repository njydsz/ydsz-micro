<!--
 * 复杂事件处理（CEP）页面
 *
 * @path apps\literule-web\src\views\cep\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 规则 CEP（复杂事件处理页面）
 * <p>模式管理 + 事件上抛 + 命中记录 + 统计 + 模式详情，数据来自后端契约 API（apps/literule-web/src/api/cep.ts、cepExtend.ts）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { CEPPatternVO, CEPHitVO } from '#/api/models';
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';
import { Page } from '@ydsz/common-ui';
import { YdButton, YdDialog, YdForm, YdFormItem, YdInput, YdTabsContent, YdTabs } from '@ydsz-core/ydsz-ui';
import { h, onMounted, reactive, ref } from 'vue';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import {
  disablePattern,
  enablePattern,
  feedEvent,
  feedEvents,
  getPattern,
  getPatternHits,
  getPatternStatistics,
  listPatterns,
  recentHits,
  registerPattern,
  stats,
  testPattern,
  unregisterPattern,
} from './cep.service';
import { formatJsonResult, parseJsonArray, parseJsonObject } from '#/utils/format';
defineOptions({ name: 'CepManagement' });

/** 格式化后端 Duration（ISO-8601 字符串或 {seconds} 对象）为可读文案 */
function formatWindow(window?: Record<string, unknown> | string): string {
  if (!window) return '-';
  if (typeof window === 'string') {
    const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(window);
    if (m) {
      const h = Number(m[1] ?? 0);
      const min = Number(m[2] ?? 0);
      const s = Number(m[3] ?? 0);
      if (h > 0) return `${h} 小时${min > 0 ? ` ${min} 分` : ''}`;
      if (min > 0) return `${min} 分钟`;
      return `${s} 秒`;
    }
    return window;
  }
  const sec = (window as { seconds?: number }).seconds;
  if (typeof sec === 'number') return `${sec} 秒`;
  return JSON.stringify(window);
}

/** ==================== 模式列表 ==================== */
const gridOptions: VxeTableGridOptions<CEPPatternVO> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'ruleCode', title: '规则编码', width: 150 },
    { field: 'name', title: '模式名称', width: 160 },
    { field: 'eventType', title: '事件类型', width: 120 },
    {
      field: 'window',
      title: '时间窗口',
      width: 110,
      slots: {
        default: ({ row }: { row: CEPPatternVO }) => formatWindow(row.window),
      },
    },
    { field: 'threshold', title: '阈值', width: 90 },
    { field: 'filter', title: '过滤条件', minWidth: 140 },
    { field: 'description', title: '描述', minWidth: 150 },
    {
      field: 'action',
      title: '操作',
      width: 220,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(
              YdButton,
              { size: 'small', variant: 'link', onClick: () => openDetail(row) },
              () => '详情',
            ),
            h(
              YdButton,
              {
                size: 'small',
                variant: 'link',
                onClick: () => handleToggle(row, true),
              },
              () => '启用',
            ),
            h(
              YdButton,
              {
                size: 'small',
                variant: 'link',
                onClick: () => handleToggle(row, false),
              },
              () => '禁用',
            ),
            h(
              YdButton,
              { size: 'small', variant: 'link', onClick: () => handleUnregister(row) },
              () => '注销',
            ),
          ]),
      },
    },
  ],
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async () => {
        const items = await listPatterns();
        return { items, total: items.length };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

/** ==================== 注册模式弹窗 ==================== */
const registerVisible = ref(false);
const registering = ref(false);

interface PatternFormData {
  ruleCode: string;
  name: string;
  eventType: string;
  windowValue: number;
  windowUnit: 'S' | 'M' | 'H';
  eventTypes: string[];
  filter: string;
  threshold: number;
  description: string;
}

const patternForm = reactive<PatternFormData>({
  ruleCode: '',
  name: '',
  eventType: '',
  windowValue: 30,
  windowUnit: 'M',
  eventTypes: [],
  filter: '',
  threshold: 1,
  description: '',
});

function openRegister() {
  Object.assign(patternForm, {
    ruleCode: '',
    name: '',
    eventType: '',
    windowValue: 30,
    windowUnit: 'M' as const,
    eventTypes: [],
    filter: '',
    threshold: 1,
    description: '',
  });
  registerVisible.value = true;
}

function toIsoDuration(value: number, unit: PatternFormData['windowUnit']): string {
  const v = Math.max(1, Math.floor(value || 1));
  return unit === 'S' ? `PT${v}S` : unit === 'H' ? `PT${v}H` : `PT${v}M`;
}

async function handleRegister() {
  if (!patternForm.ruleCode.trim() || !patternForm.name.trim()) {
    showToast.warning('规则编码与模式名称必填');
    return;
  }
  registering.value = true;
  try {
    const eventTypes = patternForm.eventTypes.map((t) => t.trim()).filter((t) => t.length > 0);
    await registerPattern({
      ruleCode: patternForm.ruleCode.trim(),
      name: patternForm.name.trim(),
      eventType: patternForm.eventType.trim() || undefined,
      window: toIsoDuration(patternForm.windowValue, patternForm.windowUnit),
      eventTypes: eventTypes.length > 0 ? eventTypes : undefined,
      filter: patternForm.filter.trim() || undefined,
      threshold: patternForm.threshold,
      description: patternForm.description.trim() || undefined,
    });
    showToast.success('注册成功');
    registerVisible.value = false;
    gridApi.query();
  } finally {
    registering.value = false;
  }
}

async function handleUnregister(row: CEPPatternVO) {
  if (!row.id) return;
  try {
    await YdConfirm(`确定注销模式「${row.name}」吗？`, { title: '注销确认', type: 'warning' });
    await unregisterPattern({ patternId: row.id });
    showToast.success('注销成功');
    gridApi.query();
  } catch {
    /* 错误提示由请求拦截器统一处理 */
  }
}

/** 启用 / 禁用模式 */
async function handleToggle(row: CEPPatternVO, enable: boolean) {
  if (!row.id) return;
  try {
    if (enable) {
      await enablePattern({ id: row.id });
      showToast.success('启用成功');
    } else {
      await disablePattern({ id: row.id });
      showToast.success('禁用成功');
    }
    gridApi.query();
  } catch {
    /* 错误提示由请求拦截器统一处理 */
  }
}

/** ==================== 事件上抛 ==================== */
const eventText = ref('{\n  "eventType": "example",\n  "amount": 100\n}');
const eventResult = ref('');

async function handleFeedEvent() {
  const payload = parseJsonObject(eventText.value);
  if (!payload) {
    showToast.warning('事件内容需为合法 JSON 对象');
    return;
  }
  const data = await feedEvent(payload);
  eventResult.value = formatJsonResult(data);
}

async function handleFeedEvents() {
  const payload = parseJsonArray(eventText.value);
  if (!payload) {
    showToast.warning('事件内容需为合法 JSON 数组（元素为对象）');
    return;
  }
  const data = await feedEvents(payload);
  eventResult.value = formatJsonResult(data);
}

/** ==================== 命中记录与全局统计 ==================== */
const hits = ref<CEPHitVO[]>([]);
const statText = ref('');

async function loadHitsAndStats() {
  const hitsResult = await recentHits();
  hits.value = hitsResult ?? [];
  statText.value = formatJsonResult(await stats());
}

/** ==================== 模式详情弹窗 ==================== */
const detailVisible = ref(false);
const detailLoading = ref(false);
const currentPatternId = ref('');
const currentPattern = ref<CEPPatternVO | null>(null);

/** 命中统计数据（率、次数等） */
const statisticsData = ref<Record<string, unknown> | null>(null);
const statisticsLoading = ref(false);

/** 命中记录分页 */
const hitsPageNum = ref(1);
const hitsPageSize = ref(10);
const hitsTotal = ref(0);
const hitsLoading = ref(false);
const patternHits = ref<Record<string, unknown>[]>([]);

/** 测试事件推送 */
const testEventText = ref('{\n  "eventType": "example",\n  "amount": 100\n}');
const testEventLoading = ref(false);
const testEventResult = ref('');

/** Tab  */
const detailActiveTab = ref('info');

async function openDetail(row: CEPPatternVO) {
  if (!row.id) return;
  currentPatternId.value = row.id;
  detailActiveTab.value = 'info';
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    currentPattern.value = await getPattern({ id: row.id });
  } catch {
    currentPattern.value = row;
  } finally {
    detailLoading.value = false;
  }
  await Promise.all([loadPatternStatistics(), loadPatternHits()]);
}

/** 加载命中统计 */
async function loadPatternStatistics() {
  if (!currentPatternId.value) return;
  statisticsLoading.value = true;
  try {
    statisticsData.value = await getPatternStatistics({ id: currentPatternId.value });
  } catch {
    statisticsData.value = null;
  } finally {
    statisticsLoading.value = false;
  }
}

/** 加载命中记录（分页） */
async function loadPatternHits() {
  if (!currentPatternId.value) return;
  hitsLoading.value = true;
  try {
    const result = await getPatternHits(
      { id: currentPatternId.value },
      { pageNum: hitsPageNum.value, pageSize: hitsPageSize.value },
    );
    patternHits.value = (result as unknown as { items?: Record<string, unknown>[] }).items ?? [];
    hitsTotal.value = ((result as unknown as { total?: number }).total ?? 0) as number;
  } catch {
    patternHits.value = [];
    hitsTotal.value = 0;
  } finally {
    hitsLoading.value = false;
  }
}

/** 测试模式 */
async function handleTestPattern() {
  if (!currentPatternId.value) return;
  const payload = parseJsonObject(testEventText.value);
  if (!payload) {
    showToast.warning('事件内容需为合法 JSON 对象');
    return;
  }
  testEventLoading.value = true;
  try {
    const result = await testPattern({ id: currentPatternId.value }, payload as unknown as Record<string, Record<string, unknown>>);
    testEventResult.value = formatJsonResult(result);
  } finally {
    testEventLoading.value = false;
  }
}

onMounted(() => {
  void loadHitsAndStats();
});
</script>

<template>
  <Page auto-content-height>
    <div class="flex flex-col gap-3 p-4">
      <!-- 模式列表 -->
      <Grid table-title="CEP 模式列表">
        <template #toolbar-tools>
          <YdButton type="primary" @click="openRegister">注册模式</YdButton>
        </template>
      </Grid>

      <!-- 事件上抛 + 全局命中 -->
      <div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div class="rounded border border-gray-200 bg-white p-3">
          <div class="mb-2 text-sm font-medium">事件上抛</div>
          <YdInput v-model="eventText" type="textarea" :rows="8" class="mb-2" />
          <div class="flex gap-2">
            <YdButton type="primary" @click="handleFeedEvent">上抛单个</YdButton>
            <YdButton type="success" @click="handleFeedEvents">批量上抛</YdButton>
          </div>
          <pre
            v-if="eventResult"
            class="mt-2 max-h-40 overflow-auto rounded border border-gray-300 bg-gray-50 p-3 text-xs"
            >{{ eventResult }}</pre
          >
        </div>
        <div class="rounded border border-gray-200 bg-white p-3">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-sm font-medium">最近命中</span>
            <YdButton size="small" @click="loadHitsAndStats">刷新</YdButton>
          </div>
          <YdTable :data="hits" border size="small" :empty-text="'暂无命中记录'">
            <YdTableColumn prop="ruleCode" label="规则编码" min-width="140" />
            <YdTableColumn prop="patternId" label="模式ID" min-width="140" />
            <YdTableColumn prop="metric" label="指标" width="90" />
            <YdTableColumn prop="hitAt" label="命中时间" width="170" />
          </YdTable>
          <div class="mt-3 text-sm font-medium">全局统计</div>
          <pre class="mt-1 max-h-40 overflow-auto rounded border border-gray-300 bg-gray-50 p-3 text-xs">{{
            statText
          }}</pre>
        </div>
      </div>
    </div>

    <!-- 注册模式弹窗 -->
    <YdDialog v-model="registerVisible" title="注册模式" width="480px">
      <YdForm label-width="90px" label-position="right">
        <YdFormItem label="规则编码" required>
          <YdInput v-model="patternForm.ruleCode" placeholder="请输入规则编码" />
        </YdFormItem>
        <YdFormItem label="模式名称" required>
          <YdInput v-model="patternForm.name" placeholder="请输入模式名称" />
        </YdFormItem>
        <YdFormItem label="事件类型">
          <YdInput
            v-model="patternForm.eventType"
            placeholder="单个事件类型（与下方多类型二选一）"
          />
        </YdFormItem>
        <YdFormItem label="多事件类型">
          <YdSelect
            v-model="patternForm.eventTypes"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="多类型 OR 匹配，可输入后回车创建"
          />
        </YdFormItem>
        <YdFormItem label="时间窗口">
          <div class="flex gap-2">
            <YdNumberFieldInput v-model="patternForm.windowValue" :min="1" class="!w-28" />
            <YdSelect v-model="patternForm.windowUnit" class="!w-24">
              <YdSelectItem label="秒" value="S" />
              <YdSelectItem label="分钟" value="M" />
              <YdSelectItem label="小时" value="H" />
            </YdSelect>
          </div>
        </YdFormItem>
        <YdFormItem label="过滤条件">
          <YdInput
            v-model="patternForm.filter"
            type="textarea"
            :rows="2"
            placeholder="LiteExpr 表达式，如 $event.amount > 100"
          />
        </YdFormItem>
        <YdFormItem label="阈值">
          <YdNumberFieldInput v-model="patternForm.threshold" :min="1" />
        </YdFormItem>
        <YdFormItem label="描述">
          <YdInput
            v-model="patternForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入描述"
          />
        </YdFormItem>
      </YdForm>
      <template #footer>
        <YdButton @click="registerVisible = false">取消</YdButton>
        <YdButton type="primary" :loading="registering" @click="handleRegister">确定</YdButton>
      </template>
    </YdDialog>

    <!-- 模式详情弹窗 -->
    <YdDialog
      v-model="detailVisible"
      :title="`模式详情 - ${currentPattern?.name ?? ''}`"
      width="780px"
      top="5vh"
    >
      <div loading="detailLoading">
        <YdTabs v-model="detailActiveTab">
          <!-- 基本信息：输入序列 / 输出条件 / 动作配置 -->
          <YdTabsContent label="模式配置" name="info">
            <div class="space-y-4 p-2">
              <div class="rounded border border-gray-200 bg-gray-50 p-3">
                <div class="mb-2 text-xs font-semibold text-gray-600">输入序列</div>
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div><span class="text-gray-500">事件类型：</span>{{ currentPattern?.eventType ?? '-' }}</div>
                  <div><span class="text-gray-500">过滤条件：</span>{{ currentPattern?.filter ?? '-' }}</div>
                </div>
              </div>
              <div class="rounded border border-gray-200 bg-gray-50 p-3">
                <div class="mb-2 text-xs font-semibold text-gray-600">输出条件</div>
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div><span class="text-gray-500">时间窗口：</span>{{ formatWindow(currentPattern?.window) }}</div>
                  <div><span class="text-gray-500">触发阈值：</span>{{ currentPattern?.threshold ?? '-' }}</div>
                </div>
              </div>
              <div class="rounded border border-gray-200 bg-gray-50 p-3">
                <div class="mb-2 text-xs font-semibold text-gray-600">动作配置</div>
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div><span class="text-gray-500">关联规则编码：</span>{{ currentPattern?.ruleCode ?? '-' }}</div>
                  <div><span class="text-gray-500">模式描述：</span>{{ currentPattern?.description ?? '-' }}</div>
                </div>
              </div>
            </div>
          </YdTabsContent>

          <!-- 命中统计面板 -->
          <YdTabsContent label="命中统计" name="statistics">
            <div loading="statisticsLoading" class="p-2">
              <div v-if="statisticsData" class="grid grid-cols-3 gap-3">
                <div
                  v-for="(value, key) in statisticsData"
                  :key="String(key)"
                  class="rounded border border-gray-200 bg-blue-50 p-3 text-center"
                >
                  <div class="text-xs text-gray-500">{{ key }}</div>
                  <div class="mt-1 text-lg font-semibold text-blue-700">{{ formatJsonResult(value) }}</div>
                </div>
              </div>
              <div v-else class="py-8 text-center text-sm text-gray-400">暂无统计数据</div>
            </div>
          </YdTabsContent>

          <!-- 命中记录（分页） -->
          <YdTabsContent label="命中记录" name="hits">
            <div class="p-2">
              <div class="mb-2 flex items-center justify-between">
                <YdButton size="small" @click="loadPatternHits">刷新</YdButton>
                <YdPagination
                  v-model:current-page="hitsPageNum"
                  v-model:page-size="hitsPageSize"
                  :total="hitsTotal"
                  :page-sizes="[10, 20, 50]"
                  layout="total, sizes, prev, pager, next"
                  small
                  @size-change="loadPatternHits"
                  @current-change="loadPatternHits"
                />
              </div>
              <YdTable
                :data="patternHits"
                border
                size="small"
                :loading="hitsLoading"
                empty-text="暂无命中记录"
              >
                <YdTableColumn type="seq" label="序号" width="60" />
                <YdTableColumn prop="hitAt" label="命中时间" width="170" />
                <YdTableColumn prop="metric" label="指标值" width="100" />
                <YdTableColumn prop="ruleCode" label="规则编码" min-width="140" />
                <YdTableColumn label="上下文" min-width="200">
                  <template #default="{ row }">
                    <span class="text-xs text-gray-500">{{ formatJsonResult(row.context ?? row) }}</span>
                  </template>
                </YdTableColumn>
              </YdTable>
            </div>
          </YdTabsContent>

          <!-- 测试事件推送 -->
          <YdTabsContent label="测试事件" name="test">
            <div class="space-y-3 p-2">
              <YdInput
                v-model="testEventText"
                type="textarea"
                :rows="6"
                placeholder="填写测试事件 JSON，如 {&quot;eventType&quot;:&quot;LOGIN_FAILED&quot;,&quot;userId&quot;:&quot;U001&quot;}"
              />
              <div class="flex gap-2">
                <YdButton type="primary" :loading="testEventLoading" @click="handleTestPattern">
                  推送测试
                </YdButton>
                <YdButton @click="detailActiveTab = 'statistics'">查看统计</YdButton>
              </div>
              <pre
                v-if="testEventResult"
                class="max-h-48 overflow-auto rounded border border-gray-300 bg-gray-50 p-3 text-xs"
                >{{ testEventResult }}</pre
              >
            </div>
          </YdTabsContent>
        </YdTabs>
      </div>
    </YdDialog>
  </Page>
</template>
