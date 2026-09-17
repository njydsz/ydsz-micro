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
import { ElEmpty, ElTimeline, ElTimelineItem } from 'element-plus';
import { onBeforeUnmount, onMounted, ref } from 'vue';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@ydsz-core/ui-kit/shadcn-ui';
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
      <Card class="mb-4">
        <CardHeader>
          <CardTitle>连接状态</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex items-center gap-4">
            <Badge :variant="getConnectionVariant()">{{ getConnectionText() }}</Badge>
            <span class="text-sm">运行模式: {{ health.mode ?? '-' }}</span>
            <span class="text-sm">缓冲区: {{ health.bufferSize ?? '-' }}</span>
            <span class="text-sm">运行状态: {{ health.status ?? '-' }}</span>
            <div class="flex-1" />
            <Button
              v-if="connectionStatus === 'connected'"
              variant="destructive"
              @click="disconnectSse"
            >
              断开
            </Button>
            <Button
              v-else
              @click="connectSse"
            >
              连接
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- 发布事件 -->
      <Card class="mb-4">
        <CardHeader>
          <CardTitle>发布事件（试点测试）</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div>
              <Label>事件类型</Label>
              <Input v-model="publishForm.eventType" placeholder="默认 notification" class="mt-1" />
            </div>
            <div>
              <Label>级别</Label>
              <Select v-model="publishForm.level">
                <SelectTrigger class="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="item in levelOptions"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>目标用户</Label>
              <Input v-model="publishForm.targetUserId" placeholder="留空则广播给所有订阅者" class="mt-1" />
            </div>
            <div>
              <Label>标题</Label>
              <Input v-model="publishForm.title" class="mt-1" />
            </div>
            <div>
              <Label>正文</Label>
              <Textarea v-model="publishForm.content" class="mt-1" />
            </div>
            <Button @click="handlePublish">发布</Button>
          </div>
        </CardContent>
      </Card>

      <!-- 最近事件 -->
      <Card>
        <CardHeader>
          <CardTitle>最近事件（近 50 条）</CardTitle>
        </CardHeader>
        <CardContent>
          <ElEmpty v-if="recentEvents.length === 0" description="暂无事件" />
          <ElTimeline v-else>
            <ElTimelineItem
              v-for="event in recentEvents"
              :key="event.eventId"
              :timestamp="event.timestamp"
              placement="top"
            >
              <div class="flex items-center gap-2">
                <Badge :variant="getLevelVariant(event.level)">{{ event.level ?? 'INFO' }}</Badge>
                <span>{{ event.title }}</span>
                <span class="text-sm text-gray-500">{{ event.targetUserId ?? '广播' }}</span>
              </div>
              <p v-if="event.content" class="text-sm text-gray-600">{{ event.content }}</p>
            </ElTimelineItem>
          </ElTimeline>
        </CardContent>
      </Card>
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
