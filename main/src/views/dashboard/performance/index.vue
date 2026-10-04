<!--
 * 性能监控仪表盘 —— 展示最近 7 天 LCP / CLS / FCP 均值柱状图
 *
 * <p>支持筛选维度：
 * <ul>
 *   <li>设备类型（mobile / desktop）</li>
 *   <li>浏览器（Chrome / Firefox / Safari / Edge）</li>
 *   <li>日期范围（默认最近 7 天）</li>
 * </ul>
 *
 * <p>暂无后端时展示 mock 数据。
 *
 * @path main\src\views\dashboard\performance\index.vue
 * @author ydsz-team
 * @since 5.2.0
-->
<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { dayjs } from '@ydsz-core/shared/utils';

import { $t } from '#/locales';


// ===== Mock 数据（后端就绪前兜底） =====

interface PerformanceMetric {
  date: string;
  lcp: number;
  cls: number;
  fcp: number;
  ttfb: number;
}

const DEVICE_OPTIONS = [
  { label: '全部设备', value: 'all' },
  { label: '桌面端', value: 'desktop' },
  { label: '移动端', value: 'mobile' },
];

const BROWSER_OPTIONS = [
  { label: '全部浏览器', value: 'all' },
  { label: 'Chrome', value: 'Chrome' },
  { label: 'Firefox', value: 'Firefox' },
  { label: 'Safari', value: 'Safari' },
  { label: 'Edge', value: 'Edge' },
];

// 响应式筛选条件
const selectedDevice = ref('all');
const selectedBrowser = ref('all');
const dateRange = ref<[string, string]>([
  dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD'),
]);

const loading = ref(false);
const metrics = ref<PerformanceMetric[]>([]);

/**
 * 生成 mock 数据（7 天）
 */
function generateMockMetrics(): PerformanceMetric[] {
  const result: PerformanceMetric[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    result.push({
      date,
      cls: Math.round((Math.random() * 0.08 + 0.02) * 1000) / 1000,
      fcp: Math.round(Math.random() * 800 + 1200),
      lcp: Math.round(Math.random() * 1500 + 1800),
      ttfb: Math.round(Math.random() * 400 + 400),
    });
  }
  return result;
}

/**
 * 加载性能数据
 *
 * <p>TODO: 替换为真实 API 调用（/api/v1/metrics/web-vitals/summary）
 */
async function loadMetrics(): Promise<void> {
  loading.value = true;
  try {
    // 模拟 API 延迟
    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });
    metrics.value = generateMockMetrics();
  } finally {
    loading.value = false;
  }
}

// ===== 图表数据 =====

const chartLabels = computed(() =>
  metrics.value.map((m) => dayjs(m.date).format('MM-DD')),
);

const lcpSeries = computed(() => metrics.value.map((m) => m.lcp));
const clsSeries = computed(() => metrics.value.map((m) => m.cls));
const fcpSeries = computed(() => metrics.value.map((m) => m.fcp));

const hasMetrics = computed(() => metrics.value.length > 0);

onMounted(() => {
  void loadMetrics();
});
</script>

<template>
  <div class="p-5">
    <h2 class="mb-4 text-lg font-semibold">
      {{ $t('page.dashboard.performance') }}
    </h2>

    <!-- 筛选条件 -->
    <div class="mb-4 flex flex-wrap gap-4">
      <label class="flex items-center gap-2">
        <span class="text-sm text-gray-600">设备类型：</span>
        <select
          v-model="selectedDevice"
          class="rounded border border-gray-300 px-2 py-1 text-sm"
        >
          <option
            v-for="opt in DEVICE_OPTIONS"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </label>

      <label class="flex items-center gap-2">
        <span class="text-sm text-gray-600">浏览器：</span>
        <select
          v-model="selectedBrowser"
          class="rounded border border-gray-300 px-2 py-1 text-sm"
        >
          <option
            v-for="opt in BROWSER_OPTIONS"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </label>

      <label class="flex items-center gap-2">
        <span class="text-sm text-gray-600">日期范围：</span>
        <input
          v-model="dateRange[0]"
          type="date"
          class="rounded border border-gray-300 px-2 py-1 text-sm"
        />
        <span class="text-gray-400">→</span>
        <input
          v-model="dateRange[1]"
          type="date"
          class="rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </label>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <span class="text-sm text-gray-500">加载中...</span>
    </div>

    <!-- 数据展示 -->
    <div v-else-if="hasMetrics" class="space-y-6">
      <!-- LCP / FCP 均值柱状图 -->
      <div class="rounded-lg border border-gray-200 p-4">
        <h3 class="mb-3 text-sm font-medium text-gray-700">
          渲染性能（LCP / FCP / TTFB）ms
        </h3>
        <div class="space-y-2">
          <!-- LCP 行 -->
          <div
            v-for="(label, idx) in chartLabels"
            :key="`lcp-${idx}`"
            class="flex items-center gap-3"
          >
            <span class="w-12 text-right text-xs text-gray-500">
              {{ label }}
            </span>
            <div class="flex flex-1 items-center gap-1">
              <div
                class="bg-blue-500 text-right text-xs text-white"
                :style="{
                  width: `${(lcpSeries[idx]! / 4000) * 100}%`,
                  minWidth: '30px',
                  padding: '2px 6px',
                  borderRadius: '3px',
                }"
              >
                {{ lcpSeries[idx] }}ms
              </div>
            </div>
          </div>
        </div>
        <!-- FCP 行 -->
        <div class="mt-4 space-y-2">
          <div
            v-for="(label, idx) in chartLabels"
            :key="`fcp-${idx}`"
            class="flex items-center gap-3"
          >
            <span class="w-12 text-right text-xs text-gray-500">
              {{ label }}
            </span>
            <div class="flex flex-1 items-center gap-1">
              <div
                class="bg-green-500 text-right text-xs text-white"
                :style="{
                  width: `${(fcpSeries[idx]! / 3000) * 100}%`,
                  minWidth: '30px',
                  padding: '2px 6px',
                  borderRadius: '3px',
                }"
              >
                {{ fcpSeries[idx] }}ms
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CLS 均值柱状图 -->
      <div class="rounded-lg border border-gray-200 p-4">
        <h3 class="mb-3 text-sm font-medium text-gray-700">
          布局稳定性（CLS）
        </h3>
        <div class="space-y-2">
          <div
            v-for="(label, idx) in chartLabels"
            :key="`cls-${idx}`"
            class="flex items-center gap-3"
          >
            <span class="w-12 text-right text-xs text-gray-500">
              {{ label }}
            </span>
            <div class="flex flex-1 items-center gap-1">
              <div
                class="text-right text-xs text-white"
                :class="clsSeries[idx]! <= 0.1 ? 'bg-emerald-500' : clsSeries[idx]! <= 0.25 ? 'bg-yellow-500' : 'bg-red-500'"
                :style="{
                  width: `${(clsSeries[idx]! / 0.25) * 100}%`,
                  minWidth: '30px',
                  padding: '2px 6px',
                  borderRadius: '3px',
                }"
              >
                {{ clsSeries[idx] }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-else
      class="flex items-center justify-center py-12 text-sm text-gray-400"
    >
      暂无数据
    </div>
  </div>
</template>
