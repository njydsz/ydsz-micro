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
import { $t } from '@ydsz/locales';
import { createLogger } from '@ydsz/utils';
import {
  YdEmptyState,
  YdTimeline,
  YdTimelineItem,
  YdBadge,
  YdButton,
  YdCard,
  YdCardContent,
  YdCardHeader,
  YdCardTitle,
  YdInput,
  YdLabel,
  YdSelectBase,
  YdSelectContentBase,
  YdSelectItemBase,
  YdSelectTriggerBase,
  YdSelectValueBase,
  YdTextarea,
} from '@ydsz-core/ydsz-ui';
import { onBeforeUnmount, onMounted, ref } from 'vue';

import { showToast } from '@ydsz/notification';

import { openSseStream } from '#/utils/sse-client';
import {
  healthCheck,
  publishEvent,
  type ReactiveEventVO,
  type ReactiveHealthVO,
  type ReactiveEventLevel,
} from '#/api/reactive';

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

/** 级别显示文本 */
function getLevelLabel(level: ReactiveEventLevel): string {
  return $t(`reactive.level.${level}`);
}

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
    showToast.success(result ?? $t('reactive.publish.success'));
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
      return $t('reactive.connection.connected');
    case 'connecting':
      return $t('reactive.connection.connecting');
    default:
      return $t('reactive.connection.disconnected');
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
    <div class="reactive-monitor-container p-5">
      <!-- 连接状态 -->
      <YdCard class="mb-4">
        <YdCardHeader>
          <YdCardTitle>{{ $t('reactive.connection.title') }}</YdCardTitle>
        </YdCardHeader>
        <YdCardContent>
          <div class="flex items-center gap-5">
            <YdBadge :variant="getConnectionVariant()">{{ getConnectionText() }}</YdBadge>
            <span class="text-sm">{{ $t('reactive.health.mode') }}: {{ health.mode ?? '-' }}</span>
            <span class="text-sm">
              {{ $t('reactive.health.bufferSize') }}: {{ health.bufferSize ?? '-' }}
            </span>
            <span class="text-sm">
              {{ $t('reactive.health.status') }}: {{ health.status ?? '-' }}
            </span>
            <div class="flex-1" />
            <YdButton
              v-if="connectionStatus === 'connected'"
              variant="destructive"
              @click="disconnectSse"
            >
              {{ $t('reactive.connection.disconnect') }}
            </YdButton>
            <YdButton v-else @click="connectSse">
              {{ $t('reactive.connection.connect') }}
            </YdButton>
          </div>
        </YdCardContent>
      </YdCard>

      <!-- 发布事件 -->
      <YdCard class="mb-4">
        <YdCardHeader>
          <YdCardTitle>{{ $t('reactive.publish.title') }}</YdCardTitle>
        </YdCardHeader>
        <YdCardContent>
          <div class="space-y-4">
            <div>
              <YdLabel>{{ $t('reactive.publish.eventType') }}</YdLabel>
              <YdInput
                v-model="publishForm.eventType"
                :placeholder="$t('reactive.publish.eventTypePlaceholder')"
                class="mt-1"
              />
            </div>
            <div>
              <YdLabel>{{ $t('reactive.publish.level') }}</YdLabel>
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
                    {{ getLevelLabel(item.value) }}
                  </YdSelectItemBase>
                </YdSelectContentBase>
              </YdSelectBase>
            </div>
            <div>
              <YdLabel>{{ $t('reactive.publish.targetUserId') }}</YdLabel>
              <YdInput
                v-model="publishForm.targetUserId"
                :placeholder="$t('reactive.publish.targetUserIdPlaceholder')"
                class="mt-1"
              />
            </div>
            <div>
              <YdLabel>{{ $t('reactive.publish.titleLabel') }}</YdLabel>
              <YdInput v-model="publishForm.title" class="mt-1" />
            </div>
            <div>
              <YdLabel>{{ $t('reactive.publish.content') }}</YdLabel>
              <YdTextarea v-model="publishForm.content" class="mt-1" />
            </div>
            <YdButton @click="handlePublish">{{ $t('reactive.publish.submit') }}</YdButton>
          </div>
        </YdCardContent>
      </YdCard>

      <!-- 最近事件 -->
      <YdCard>
        <YdCardHeader>
          <YdCardTitle>{{ $t('reactive.recent.title') }}</YdCardTitle>
        </YdCardHeader>
        <YdCardContent>
          <YdEmptyState
            v-if="recentEvents.length === 0"
            :description="$t('reactive.recent.empty')"
          />
          <YdTimeline v-else>
            <YdTimelineItem
              v-for="event in recentEvents"
              :key="event.eventId"
              :timestamp="event.timestamp"
              placement="top"
            >
              <div class="flex items-center gap-2">
                <YdBadge :variant="getLevelVariant(event.level)">{{
                  getLevelLabel(event.level ?? 'INFO')
                }}</YdBadge>
                <span>{{ event.title }}</span>
                <span class="text-sm text-gray-500">
                  {{ event.targetUserId ?? $t('reactive.recent.broadcast') }}
                </span>
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
