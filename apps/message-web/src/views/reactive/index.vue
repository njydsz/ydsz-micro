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
import { Page } from '@ydsz/common-ui';
import { createLogger } from '@ydsz/utils';
import { YdEmptyState, YdTimeline, YdTimelineItem, YdBadge, YdButtonBase, YdCard, YdCardContent, YdCardHeader, YdCardTitle, YdInput, YdLabel, YdSelectBase, YdSelectContentBase, YdSelectItemBase, YdSelectTriggerBase, YdSelectValueBase, YdTextarea } from '@ydsz-core/ydsz-ui';
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
    showToast.success(result ?? '发布成功');
  } catch {
    /* 错误由拦截器处理 */
  }
}

/**
 * 获取连接状态主题色。
 */
function getConnectionVariant(): 'default' | 'outline' | 'secondary' {
  switch (connectionStatus.value) {
    case 'connected':
      return 'default';
    case 'connecting':
      return 'outline';
    default:
      return 'secondary';
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
function getLevelVariant(level: string | undefined): 'destructive' | 'outline' | 'secondary' {
  switch (level) {
    case 'ERROR':
    case 'CRITICAL':
      return 'destructive';
    case 'WARN':
      return 'outline';
    default:
      return 'secondary';
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
    <div class="reactive-monitor-container p-4">
      <!-- 连接状态 -->
      <YdCard class="mb-4">
        <YdCardHeader>
          <YdCardTitle>连接状态</YdCardTitle>
        </YdCardHeader>
        <YdCardContent>
          <div class="flex items-center gap-4">
            <YdBadge :variant="getConnectionVariant()">{{ getConnectionText() }}</YdBadge>
            <span class="text-sm">运行模式: {{ health.mode ?? '-' }}</span>
            <span class="text-sm">缓冲区: {{ health.bufferSize ?? '-' }}</span>
            <span class="text-sm">运行状态: {{ health.status ?? '-' }}</span>
            <div class="flex-1" />
            <YdButtonBase
              v-if="connectionStatus === 'connected'"
              variant="destructive"
              @click="disconnectSse"
            >
              断开
            </YdButtonBase>
            <YdButtonBase
              v-else
              @click="connectSse"
            >
              连接
            </YdButtonBase>
          </div>
        </YdCardContent>
      </YdCard>

      <!-- 发布事件 -->
      <YdCard class="mb-4">
        <YdCardHeader>
          <YdCardTitle>发布事件（试点测试）</YdCardTitle>
        </YdCardHeader>
        <YdCardContent>
          <div class="space-y-4">
            <div>
              <YdLabel>事件类型</YdLabel>
              <YdInput v-model="publishForm.eventType" placeholder="默认 notification" class="mt-1" />
            </div>
            <div>
              <YdLabel>级别</YdLabel>
              <YdSelectBase v-model="publishForm.level">
                <YdSelectTriggerBase class="mt-1">
                  <YdSelectValueBase />
                </YdSelectTriggerBase>
                <YdSelectContentBase>
                  <YdSelectItemBase
                    v-for="item in levelOptions"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </YdSelectItemBase>
                </YdSelectContentBase>
              </YdSelectBase>
            </div>
            <div>
              <YdLabel>目标用户</YdLabel>
              <YdInput v-model="publishForm.targetUserId" placeholder="留空则广播给所有订阅者" class="mt-1" />
            </div>
            <div>
              <YdLabel>标题</YdLabel>
              <YdInput v-model="publishForm.title" class="mt-1" />
            </div>
            <div>
              <YdLabel>正文</YdLabel>
              <YdTextarea v-model="publishForm.content" class="mt-1" />
            </div>
            <YdButtonBase @click="handlePublish">发布</YdButtonBase>
          </div>
        </YdCardContent>
      </YdCard>

      <!-- 最近事件 -->
      <YdCard>
        <YdCardHeader>
          <YdCardTitle>最近事件（近 50 条）</YdCardTitle>
        </YdCardHeader>
        <YdCardContent>
          <YdEmptyState v-if="recentEvents.length === 0" description="暂无事件" />
          <YdTimeline v-else>
            <YdTimelineItem
              v-for="event in recentEvents"
              :key="event.eventId"
              :timestamp="event.timestamp"
              placement="top"
            >
              <div class="flex items-center gap-2">
                <YdBadge :variant="getLevelVariant(event.level)">{{ event.level ?? 'INFO' }}</YdBadge>
                <span>{{ event.title }}</span>
                <span class="text-sm text-gray-500">{{ event.targetUserId ?? '广播' }}</span>
              </div>
              <p v-if="event.content" class="text-sm text-gray-600">{{ event.content }}</p>
            </YdTimelineItem>
          </YdTimeline>
        </YdCardContent>
      </YdCard>
    </div>
  </Page>
</template>

<style lang="scss" scoped>
.reactive-monitor-container {
  .mb-4 {
    margin-bottom: 16px;
  }

  .flex-1 {
    flex: 1;
  }
}
</style>
