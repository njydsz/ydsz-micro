<!--
 * 响应式通知流监控视图
 *
 * <p>展示 WebFlux 响应式 SSE 推送试点的健康状态、实时事件流监控与事件发布能力。
 *
 * @path apps/message-web/src/views/reactive/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 响应式通知流监控
 * <p>消费后端 ReactiveNotificationController（apps/message-web/src/api/reactive.ts）：
 * publishEvent() 发布事件，healthCheck() 检测注册表运行状态；
 * SSE 流通过 openSseStream 直接消费 /api/message/reactive/stream。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { ElButton, ElCard, ElEmpty, ElForm, ElFormItem, ElInput, ElMessage, ElOption, ElSelect, ElTag, ElTimeline, ElTimelineItem } from 'element-plus';
import { Page } from '@ydsz/common-ui';
import { createLogger } from '@ydsz/utils';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { openSseStream } from '#/utils/sse-client';
import { healthCheck, publishEvent, type ReactiveEventVO, type ReactiveHealthVO, type ReactiveEventLevel } from '#/api/reactive';

defineOptions({ name: 'ReactiveNotificationManagement' });

const logger = createLogger('message-reactive');

/** 连接状态 */
const connectionStatus = ref<'disconnected' | 'connecting' | 'connected'>('disconnected');

/** 健康信息 */
const health = ref<ReactiveHealthVO>({});

/** 最近事件列表（最多保留 50 条） */
const recentEvents = ref<ReactiveEventVO[]>([]);

/** SSE 关闭函数 */
let closeSseFn: (() => void) | null = null;

/** 发布事件表单 */
const publishForm = ref({
  eventType: 'notification',
  title: '',
  content: '',
  level: 'INFO' as ReactiveEventLevel,
  targetUserId: '',
});

/** 级别选项 */
const levelOptions: Array<{ label: string; value: ReactiveEventLevel }> = [
  { label: 'INFO', value: 'INFO' },
  { label: 'WARN', value: 'WARN' },
  { label: 'ERROR', value: 'ERROR' },
  { label: 'CRITICAL', value: 'CRITICAL' },
];

/**
 * 加载健康信息。
 */
async function fetchHealth() {
  try {
    health.value = await healthCheck();
  } catch {
    /* 错误由拦截器处理 */
  }
}

/**
 * 连接 SSE 流。
 */
function connectSse() {
  connectionStatus.value = 'connecting';

  closeSseFn = openSseStream('/api/message/reactive/stream', {
    onOpen: () => {
      connectionStatus.value = 'connected';
      logger.info('SSE 已连接');
    },
    onClose: () => {
      connectionStatus.value = 'disconnected';
      logger.info('SSE 已断开');
    },
    onError: () => {
      connectionStatus.value = 'disconnected';
      logger.error('SSE 连接异常');
    },
    onEvent: (_eventName: string, data: unknown) => {
      if (data && typeof data === 'object') {
        const event = data as ReactiveEventVO;
        recentEvents.value.unshift(event);
        if (recentEvents.value.length > 50) {
          recentEvents.value = recentEvents.value.slice(0, 50);
        }
      }
    },
  });
}

/**
 * 断开 SSE 连接。
 */
function disconnectSse() {
  closeSseFn?.();
  closeSseFn = null;
  connectionStatus.value = 'disconnected';
}

/**
 * 发布事件。
 */
async function handlePublish() {
  try {
    const result = await publishEvent({
      eventType: publishForm.value.eventType,
      title: publishForm.value.title,
      content: publishForm.value.content,
      level: publishForm.value.level,
      targetUserId: publishForm.value.targetUserId || undefined,
    });
    ElMessage.success(result ?? '发布成功');
  } catch {
    /* 错误由拦截器处理 */
  }
}

/**
 * 获取连接状态主题色。
 */
function getConnectionTheme(): 'success' | 'warning' | 'info' {
  switch (connectionStatus.value) {
    case 'connected':
      return 'success';
    case 'connecting':
      return 'warning';
    default:
      return 'info';
  }
}

/**
 * 获取连接状态文本。
 */
function getConnectionText(): string {
  switch (connectionStatus.value) {
    case 'connected':
      return '已连接';
    case 'connecting':
      return '连接中';
    default:
      return '未连接';
  }
}

/**
 * 根据事件级别获取标签类型。
 *
 * @param level - 事件级别
 */
function getLevelType(level: string | undefined): 'success' | 'warning' | 'danger' | 'info' {
  switch (level) {
    case 'ERROR':
    case 'CRITICAL':
      return 'danger';
    case 'WARN':
      return 'warning';
    default:
      return 'info';
  }
}

onMounted(() => {
  fetchHealth();
  connectSse();
});

onBeforeUnmount(() => {
  disconnectSse();
});
</script>

<template>
  <Page auto-content-height>
    <div class="reactive-monitor-container">
      <el-card header="连接状态" class="mb-4">
        <div class="flex items-center gap-4">
          <ElTag :type="getConnectionTheme()">{{ getConnectionText() }}</ElTag>
          <span class="text-sm">运行模式: {{ health.mode ?? '-' }}</span>
          <span class="text-sm">缓冲区: {{ health.bufferSize ?? '-' }}</span>
          <span class="text-sm">运行状态: {{ health.status ?? '-' }}</span>
          <div class="flex-1" />
          <ElButton
            v-if="connectionStatus === 'connected'"
            @click="disconnectSse"
          >
            断开
          </ElButton>
          <ElButton
            v-else
            type="primary"
            @click="connectSse"
          >
            连接
          </ElButton>
        </div>
      </el-card>

      <el-card header="发布事件（试点测试）" class="mb-4">
        <ElForm :model="publishForm" label-width="100px">
          <ElFormItem label="事件类型">
            <ElInput v-model="publishForm.eventType" placeholder="默认 notification" />
          </ElFormItem>
          <ElFormItem label="级别">
            <ElSelect v-model="publishForm.level">
              <ElOption
                v-for="item in levelOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="目标用户">
            <ElInput v-model="publishForm.targetUserId" placeholder="留空则广播给所有订阅者" />
          </ElFormItem>
          <ElFormItem label="标题">
            <ElInput v-model="publishForm.title" />
          </ElFormItem>
          <ElFormItem label="正文">
            <ElInput v-model="publishForm.content" type="textarea" :rows="3" />
          </ElFormItem>
          <ElFormItem>
            <ElButton type="primary" @click="handlePublish">发布</ElButton>
          </ElFormItem>
        </ElForm>
      </el-card>

      <el-card header="最近事件（近 50 条）">
        <ElEmpty v-if="recentEvents.length === 0" description="暂无事件" />
        <ElTimeline v-else>
          <ElTimelineItem
            v-for="event in recentEvents"
            :key="event.eventId"
            :timestamp="event.timestamp"
            placement="top"
          >
            <div class="flex items-center gap-2">
              <ElTag :type="getLevelType(event.level)">{{ event.level ?? 'INFO' }}</ElTag>
              <span>{{ event.title }}</span>
              <span class="text-sm text-gray-500">{{ event.targetUserId ?? '广播' }}</span>
            </div>
            <p v-if="event.content" class="text-sm text-gray-600">{{ event.content }}</p>
          </ElTimelineItem>
        </ElTimeline>
      </el-card>
    </div>
  </Page>
</template>

<style lang="scss" scoped>
.reactive-monitor-container {
  padding: 16px;

  .mb-4 {
    margin-bottom: 16px;
  }

  .flex {
    display: flex;
  }

  .items-center {
    align-items: center;
  }

  .gap-2 {
    gap: 8px;
  }

  .gap-4 {
    gap: 16px;
  }

  .flex-1 {
    flex: 1;
  }

  .text-sm {
    font-size: 14px;
  }

  .text-gray-500 {
    color: #6b7280;
  }

  .text-gray-600 {
    color: #4b5563;
  }
}
</style>
