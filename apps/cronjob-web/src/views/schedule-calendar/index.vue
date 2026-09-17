<!--
 * 调度日历（可视化调度任务时间分布）
 *
 * @path apps\cronjob-web\src\views\schedule-calendar\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 调度日历（P1-可视化闭环）
 * <p>消费后端契约 scheduleCalendar.ts（auto-generated）：getScheduleCalendar 获取未来 N 小时调度任务。
 * 布局：顶部控制栏（日期选择 + 视图切换 + 刷新）+ 日历网格（任务点标记）+ 详情抽屉（选中日期任务列表）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { Page } from '@ydsz/common-ui';

import { YdBadge, YdButtonBase, YdCard, YdCardContent, YdDatePicker, YdRadioGroup, YdRadioGroupItem, YdSheet, YdSheetContent, YdSheetHeader, YdSheetTitle, YdTooltipBase, YdTooltipContentBase, YdTooltipTriggerBase } from '@ydsz-core/ui-kit/shadcn-ui';
// TODO: ElCalendar/ElTimeline/ElTimelineItem/ElEmpty 暂无 shadcn 对应;保留 element-plus SKIP
import { ElEmpty, ElTimeline, ElTimelineItem } from 'element-plus';
import { ref, computed, onMounted } from 'vue';

import { getScheduleCalendar } from '#/api/scheduleCalendar';

import { createLogger } from '@ydsz-core/shared/utils';

const logger = createLogger('cronjob-job');

defineOptions({ name: 'ScheduleCalendar' });

// ==================== 类型 ====================

interface ScheduleItem {
  jobKey?: string;
  jobName?: string;
  cron?: string;
  group?: string;
  fireTime?: string;
}

// ==================== 响应式状态 ====================

/** 当前选中日期 */
const selectedDate = ref<Date>(new Date());

/** 视图模式：day / week */
const viewMode = ref<'day' | 'week'>('day');

/** 调度任务数据 */
const scheduleItems = ref<ScheduleItem[]>([]);

/** 详情抽屉可见性 */
const drawerVisible = ref(false);

/** 选中日期详情 */
const selectedDateDetail = ref('');

// ==================== 计算属性 ====================

/** 选中日期的任务列表 */
const selectedDateTasks = computed(() => {
  return getTasksForDate(selectedDateDetail.value);
});

// ==================== 方法 ====================

/**
 * 获取指定日期的任务列表。
 */
function getTasksForDate(date: string): ScheduleItem[] {
  if (!date || scheduleItems.value.length === 0) return [];
  return scheduleItems.value.filter((item) => {
    return item.fireTime && item.fireTime.startsWith(date);
  });
}

/**
 * 格式化时间显示（HH:mm:ss）。
 */
function formatTime(fireTime?: string): string {
  if (!fireTime) return '';
  // fireTime 可能是 "YYYY-MM-DD HH:mm:ss" 或 "YYYY-MM-DDTHH:mm:ss"
  const timePart = fireTime.includes('T') ? fireTime.split('T')[1] : fireTime.split(' ')[1];
  return timePart ?? '';
}

/**
 * 获取任务状态样式类。
 * 基于任务 group 分配不同颜色，便于视觉区分。
 */
function getTaskStatusClass(task: ScheduleItem): string {
  const group = task.group || 'default';
  const hash = group.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const classes = ['dot-primary', 'dot-success', 'dot-warning', 'dot-danger'];
  return classes[hash % classes.length];
}

/**
 * 获取任务时间线类型。
 */
function getTaskType(task: ScheduleItem): 'primary' | 'success' | 'warning' | 'info' {
  const hour = parseInt(task.fireTime?.substring(12, 14) || '0', 10);
  if (hour < 6) return 'info';
  if (hour < 12) return 'primary';
  if (hour < 18) return 'success';
  return 'warning';
}

/**
 * 处理日期变化事件。
 */
function handleDateChange(val: Date | string | null | undefined) {
  if (val) {
    const dateStr = typeof val === 'string' ? val : val.toISOString().split('T')[0];
    selectedDateDetail.value = dateStr;
    drawerVisible.value = true;
  }
}

/**
 * 从后端获取调度日历数据。
 */
async function fetchScheduleData() {
  try {
    const hours = viewMode.value === 'week' ? 168 : 24;
    const data = await getScheduleCalendar({ hours, maxPerJob: 50 });
    if (data && Array.isArray(data)) {
      scheduleItems.value = data.map((item: Record<string, unknown>) => ({
        jobKey: item.jobKey as string | undefined,
        jobName: item.jobName as string | undefined,
        cron: item.cron as string | undefined,
        group: item.group as string | undefined,
        fireTime: item.fireTime ? String(item.fireTime).replace('T', ' ').substring(0, 19) : '',
      }));
      showToast.success(`已加载 ${scheduleItems.value.length} 条调度记录`);
    }
  } catch {
    logger.warn('加载调度日历数据失败');
    // 错误提示由请求拦截器统一处理
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  fetchScheduleData();
});
</script>

<template>
  <Page auto-content-height>
    <div class="schedule-calendar-container p-4">
      <!-- 顶部控制栏 -->
      <div class="mb-4 flex items-center gap-3 rounded-lg bg-gray-50 p-3">
        <YdDatePicker
          v-model="selectedDate"
          placeholder="选择日期"
          @update:model-value="handleDateChange"
        />
        <YdButtonBase @click="fetchScheduleData">
          <svg class="me-1.5 inline h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M5.635 19.364A9 9 0 1 0 4.05 10M19.364 4.636A9 9 0 0 1 20.95 14" />
          </svg>
          刷新
        </YdButtonBase>
        <YdRadioGroup v-model="viewMode" @update:model-value="fetchScheduleData">
          <div class="flex items-center gap-1">
            <div class="flex items-center gap-2">
              <YdRadioGroupItem id="view-day" value="day" />
              <label for="view-day" class="cursor-pointer text-sm">日视图</label>
            </div>
            <div class="flex items-center gap-2">
              <YdRadioGroupItem id="view-week" value="week" />
              <label for="view-week" class="cursor-pointer text-sm">周视图</label>
            </div>
          </div>
        </YdRadioGroup>
      </div>

      <!-- 日历网格 -->
      <ElCalendar v-model="selectedDate" class="schedule-calendar">
        <template #date-cell="{ data }">
          <div class="flex h-full w-full flex-col items-center">
            <span class="font-semibold">{{ data.day.split('-')[2] }}</span>
            <div
              v-if="getTasksForDate(data.day).length > 0"
              class="mt-1 flex flex-wrap items-center justify-center gap-1"
            >
              <YdTooltipBase
                v-for="task in getTasksForDate(data.day).slice(0, 3)"
                :key="(task.jobKey ?? '') + (task.fireTime ?? '')"
              >
                <YdTooltipTriggerBase as-child>
                  <span class="task-dot" :class="getTaskStatusClass(task)"></span>
                </YdTooltipTriggerBase>
                <YdTooltipContentBase side="top">
                  {{ `${task.jobName ?? ''} - ${formatTime(task.fireTime)}` }}
                </YdTooltipContentBase>
              </YdTooltipBase>
              <span
                v-if="getTasksForDate(data.day).length > 3"
                class="cursor-pointer text-[10px] text-gray-400"
              >
                +{{ getTasksForDate(data.day).length - 3 }}
              </span>
            </div>
          </div>
        </template>
      </ElCalendar>

      <!-- 选中日期的任务详情抽屉 -->
      <YdSheet v-model:open="drawerVisible">
        <YdSheetContent side="right" class="w-[400px]">
          <YdSheetHeader>
            <YdSheetTitle>{{ `${selectedDateDetail} 调度任务` }}</YdSheetTitle>
          </YdSheetHeader>
          <ElTimeline v-if="selectedDateTasks.length > 0">
            <ElTimelineItem
              v-for="task in selectedDateTasks"
              :key="(task.jobKey ?? '') + (task.fireTime ?? '')"
              :timestamp="formatTime(task.fireTime)"
              :type="getTaskType(task)"
              placement="top"
            >
              <YdCard>
                <YdCardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                  <span class="mr-2 font-semibold">{{ task.jobName }}</span>
                  <YdBadge variant="outline">{{ task.jobKey }}</YdBadge>
                </YdCardHeader>
                <YdCardContent class="pt-0">
                  <p><b>Cron 表达式：</b>{{ task.cron }}</p>
                  <p><b>分组：</b>{{ task.group || '默认' }}</p>
                </YdCardContent>
              </YdCard>
            </ElTimelineItem>
          </ElTimeline>
          <ElEmpty v-else description="当日无调度任务" />
        </YdSheetContent>
      </YdSheet>
    </div>
  </Page>
</template>

<style scoped>
.schedule-calendar :deep(.el-calendar-table .el-calendar-day) {
  height: 80px;
  vertical-align: top;
}

.task-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  cursor: pointer;
}

.dot-primary {
  background-color: hsl(var(--primary));
}

.dot-success {
  background-color: hsl(var(--success, 142 76% 36%));
}

.dot-warning {
  background-color: hsl(var(--warning, 38 92% 50%));
}

.dot-danger {
  background-color: hsl(var(--destructive));
}
</style>
