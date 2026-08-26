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
 * <p>模式管理 + 事件上抛 + 命中记录 + 统计，数据来自后端契约 API（apps/literule-web/src/api/cep.ts）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { CEPHitVO, CEPPatternVO } from '#/api/models';
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';
import { Page } from '@ydsz/common-ui';
import { ElButton, ElDialog, ElMessage, ElMessageBox } from 'element-plus';
import { h, onMounted, reactive, ref } from 'vue';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import {
  feedEvent,
  feedEvents,
  listPatterns,
  recentHits,
  registerPattern,
  stats,
  unregisterPattern,
} from '#/api/cep';
import { formatJsonResult, parseJsonArray, parseJsonObject } from '#/utils/format';
defineOptions({ name: 'CepManagement' });
/** 格式化后端 Duration（ISO-8601 字符串或 {seconds} 对象）为可读文案 */
function formatWindow(window?: Record<string, unknown> | string): string {
  if (!window) return '-';
  if (typeof window === 'string') {
    // "PT30M" → "30 分钟"
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
const gridOptions: VxeGridProps<CEPPatternVO> = {
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
      width: 90,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h(
            ElButton,
            { size: 'small', link: true, type: 'danger', onClick: () => handleUnregister(row) },
            () => '注销',
          ),
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
/** 注册模式弹窗状态 */
const registerVisible = ref(false);
const registering = ref(false);
/** 模式表单数据（映射 CEPPattern 的可编辑字段，P0-3 补齐 window/filter/eventTypes） */
interface PatternFormData {
  ruleCode: string;
  name: string;
  eventType: string;
  /** 时间窗口数值 */
  windowValue: number;
  /** 时间窗口单位：S 秒 / M 分钟 / H 小时 */
  windowUnit: 'S' | 'M' | 'H';
  /** 事件类型列表（多类型 OR 匹配，可自由输入） */
  eventTypes: string[];
  /** 过滤条件（LiteExpr 表达式） */
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
/** 打开注册模式弹窗 */
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
/** 生成 ISO-8601 时长字符串（后端 CEPPattern.window 为 java.time.Duration） */
function toIsoDuration(value: number, unit: PatternFormData['windowUnit']): string {
  const v = Math.max(1, Math.floor(value || 1));
  return unit === 'S' ? `PT${v}S` : unit === 'H' ? `PT${v}H` : `PT${v}M`;
}
/** 注册模式 */
async function handleRegister() {
  if (!patternForm.ruleCode.trim() || !patternForm.name.trim()) {
    ElMessage.warning('规则编码与模式名称必填');
    return;
  }
  registering.value = true;
  try {
    const eventTypes = patternForm.eventTypes.map((t) => t.trim()).filter((t) => t.length > 0);
    await registerPattern({
      ruleCode: patternForm.ruleCode.trim(),
      name: patternForm.name.trim(),
      eventType: patternForm.eventType.trim() || undefined,
      // window 以 ISO-8601 时长字符串提交（Jackson Duration 反序列化兼容）
      window: toIsoDuration(patternForm.windowValue, patternForm.windowUnit),
      eventTypes: eventTypes.length > 0 ? eventTypes : undefined,
      filter: patternForm.filter.trim() || undefined,
      threshold: patternForm.threshold,
      description: patternForm.description.trim() || undefined,
    });
    ElMessage.success('注册成功');
    registerVisible.value = false;
    gridApi.query();
  } finally {
    registering.value = false;
  }
}
/** 注销模式 */
async function handleUnregister(row: CEPPatternVO) {
  if (!row.id) return;
  try {
    await ElMessageBox.confirm(`确定注销模式「${row.name}」吗？`, '注销确认', { type: 'warning' });
    await unregisterPattern({ patternId: row.id });
    ElMessage.success('注销成功');
    gridApi.query();
  } catch {
    /* 错误提示由请求拦截器统一处理 */
  }
}
/** 事件上抛 */
const eventText = ref('{\n  "eventType": "example",\n  "amount": 100\n}');
const eventResult = ref('');
/** 上抛单个事件 */
async function handleFeedEvent() {
  const payload = parseJsonObject(eventText.value);
  if (!payload) {
    ElMessage.warning('事件内容需为合法 JSON 对象');
    return;
  }
  const data = await feedEvent(payload);
  eventResult.value = formatJsonResult(data);
}
/** 批量上抛事件 */
async function handleFeedEvents() {
  const payload = parseJsonArray(eventText.value);
  if (!payload) {
    ElMessage.warning('事件内容需为合法 JSON 数组（元素为对象）');
    return;
  }
  const data = await feedEvents(payload);
  eventResult.value = formatJsonResult(data);
}
/** 最近命中记录 */
const hits = ref<CEPHitVO[]>([]);
const statText = ref('');
/** 加载命中记录与统计 */
async function loadHitsAndStats() {
  hits.value = await recentHits();
  statText.value = formatJsonResult(await stats());
}
onMounted(() => {
  void loadHitsAndStats();
});
</script>
<template>
  <Page auto-content-height>
    <div class="flex flex-col gap-3 p-4">
      <Grid table-title="CEP 模式列表">
        <template #toolbar-tools
          ><ElButton type="primary" @click="openRegister">注册模式</ElButton></template
        >
      </Grid>
      <div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div class="rounded border border-gray-200 bg-white p-3">
          <div class="mb-2 text-sm font-medium">事件上抛</div>
          <ElInput v-model="eventText" type="textarea" :rows="8" class="mb-2" />
          <div class="flex gap-2">
            <ElButton type="primary" @click="handleFeedEvent">上抛单个</ElButton>
            <ElButton type="success" @click="handleFeedEvents">批量上抛</ElButton>
          </div>
          <pre
            v-if="eventResult"
            class="mt-2 overflow-auto rounded border border-gray-300 bg-gray-50 p-3 text-xs"
            >{{ eventResult }}</pre>
        </div>
        <div class="rounded border border-gray-200 bg-white p-3">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-sm font-medium">最近命中</span>
            <ElButton size="small" @click="loadHitsAndStats">刷新</ElButton>
          </div>
          <ElTable :data="hits" border size="small">
            <ElTableColumn prop="ruleCode" label="规则编码" min-width="140" />
            <ElTableColumn prop="patternId" label="模式ID" min-width="140" />
            <ElTableColumn prop="metric" label="指标" width="90" />
            <ElTableColumn prop="hitAt" label="命中时间" width="170" />
          </ElTable>
          <div class="mt-2 text-sm font-medium">统计</div>
          <pre class="mt-1 overflow-auto rounded border border-gray-300 bg-gray-50 p-3 text-xs">{{
            statText
          }}</pre>
        </div>
      </div>
    </div>
    <ElDialog v-model="registerVisible" title="注册模式" width="480px">
      <ElForm label-width="90px" label-position="right">
        <ElFormItem label="规则编码" required>
          <ElInput v-model="patternForm.ruleCode" placeholder="请输入规则编码" />
        </ElFormItem>
        <ElFormItem label="模式名称" required>
          <ElInput v-model="patternForm.name" placeholder="请输入模式名称" />
        </ElFormItem>
        <ElFormItem label="事件类型">
          <ElInput
            v-model="patternForm.eventType"
            placeholder="单个事件类型（与下方多类型二选一）"
          />
        </ElFormItem>
        <ElFormItem label="多事件类型">
          <ElSelect
            v-model="patternForm.eventTypes"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="多类型 OR 匹配，可输入后回车创建"
          />
        </ElFormItem>
        <ElFormItem label="时间窗口">
          <div class="flex gap-2">
            <ElInputNumber v-model="patternForm.windowValue" :min="1" class="!w-28" />
            <ElSelect v-model="patternForm.windowUnit" class="!w-24">
              <ElOption label="秒" value="S" />
              <ElOption label="分钟" value="M" />
              <ElOption label="小时" value="H" />
            </ElSelect>
          </div>
        </ElFormItem>
        <ElFormItem label="过滤条件">
          <ElInput
            v-model="patternForm.filter"
            type="textarea"
            :rows="2"
            placeholder="LiteExpr 表达式，如 $event.amount > 100"
          />
        </ElFormItem>
        <ElFormItem label="阈值">
          <ElInputNumber v-model="patternForm.threshold" :min="1" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput
            v-model="patternForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入描述"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="registerVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="registering" @click="handleRegister">确定</ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
