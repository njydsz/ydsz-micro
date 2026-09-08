<!--
 * 实时日志流（SSE）
 *
 * @path apps\cronjob-web\src\views\job-log-stream\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 实时日志流（SSE）
 * <p>通过 EventSource 连接后端 JobLogStreamController（GET /api/cronjob/log/stream/{logId}），
 * 以终端风格展示任务的实时日志输出。
 * <p>支持连接/断开/清空操作，连接状态通过顶部彩色圆点指示，日志区自动滚动到底部。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { Page } from '@ydsz/common-ui';
import {
  ElButton,
  ElCard,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElSpace,
  ElTag,
  ElText,
} from 'element-plus';
import { nextTick, onBeforeUnmount, ref } from 'vue';
import { createLogger } from '@YDSZ-core/shared/utils';

const logger = createLogger('cronjob-log-stream');
defineOptions({ name: 'JobLogStreamManagement' });

// ==================== SSE 连接状态 ====================

/** 连接状态枚举 */
type ConnectStatus = 'disconnected' | 'connecting' | 'connected';

/** logId 输入 */
const logId = ref('');
/** 当前连接状态 */
const connectStatus = ref<ConnectStatus>('disconnected');
/** SSE 累积日志文本 */
const logs = ref('');
/** SSE 实例引用（null 表示未连接） */
let eventSource: EventSource | null = null;
/** 日志内容容器 ref（自动滚底） */
const logContainerRef = ref<HTMLElement | null>(null);

// ==================== 连接控制 ====================

/** 建立 SSE 连接 */
function handleConnect() {
  // 校验输入
  if (!logId.value.trim()) {
    return;
  }
  // 已有连接时先断开
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  logs.value = '';
  connectStatus.value = 'connecting';

  const baseUrl = import.meta.env.VITE_GLOB_API_URL ?? '/api';
  const streamUrl = `${baseUrl}/api/cronjob/log/stream/${logId.value.trim()}`;
  logger.info('正在建立 SSE 连接:', streamUrl);

  eventSource = new EventSource(streamUrl);

  eventSource.onopen = () => {
    connectStatus.value = 'connected';
    logger.info('SSE 连接已建立, logId:', logId.value);
  };

  eventSource.onmessage = (event: MessageEvent) => {
    logs.value += `${event.data}\n`;
    scrollToBottom();
  };

  eventSource.onerror = () => {
    connectStatus.value = 'disconnected';
    logger.warn('SSE 连接已断开, logId:', logId.value);
    eventSource?.close();
    eventSource = null;
  };
}

/** 断开 SSE 连接 */
function handleDisconnect() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  connectStatus.value = 'disconnected';
  logger.info('手动断开 SSE 连接');
}

/** 清空日志内容 */
function handleClear() {
  logs.value = '';
}

/** 日志容器自动滚到底部 */
function scrollToBottom() {
  nextTick(() => {
    if (logContainerRef.value) {
      logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight;
    }
  });
}

// ==================== 组件卸载时清理 ====================

onBeforeUnmount(() => {
  eventSource?.close();
  eventSource = null;
});

// ==================== 状态辅助 ====================

/** 状态圆点颜色 */
function statusColor(status: ConnectStatus): string {
  switch (status) {
    case 'connected':
      return '#67c23a';
    case 'connecting':
      return '#e6a23c';
    default:
      return '#909399';
  }
}

/** 状态文本 */
function statusText(status: ConnectStatus): string {
  switch (status) {
    case 'connected':
      return '已连接';
    case 'connecting':
      return '连接中';
    default:
      return '已断开';
  }
}
</script>
<template>
  <Page auto-content-height>
    <div class="p-4 space-y-4">
      <!-- 连接控制面板 -->
      <ElCard shadow="never" class="rounded-lg border border-gray-200">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <!-- 连接状态圆点 -->
              <span
                class="inline-block w-2.5 h-2.5 rounded-full"
                :style="{ backgroundColor: statusColor(connectStatus) }"
              />
              <ElTag
                :type="connectStatus === 'connected' ? 'success' : connectStatus === 'connecting' ? 'warning' : 'info'"
                size="small"
              >
                {{ statusText(connectStatus) }}
              </ElTag>
              <ElText v-if="logId && connectStatus === 'connected'" size="small" type="info">
                Log #{{ logId }}
              </ElText>
            </div>
            <ElSpace>
              <ElButton
                :disabled="!logId.trim()"
                type="primary"
                size="small"
                @click="handleConnect"
              >
                连接
              </ElButton>
              <ElButton
                :disabled="connectStatus === 'disconnected'"
                type="danger"
                size="small"
                @click="handleDisconnect"
              >
                断开
              </ElButton>
              <ElButton size="small" @click="handleClear">清空</ElButton>
            </ElSpace>
          </div>
        </template>

        <!-- LogId 输入 -->
        <ElForm inline @submit.prevent="handleConnect">
          <ElFormItem label="Log ID">
            <ElInput
              v-model="logId"
              placeholder="请输入任务执行日志 ID"
              style="width: 320px"
              clearable
              @keyup.enter="handleConnect"
            />
          </ElFormItem>
          <ElFormItem>
            <ElButton type="primary" plain :disabled="!logId.trim()" @click="handleConnect">
              连接
            </ElButton>
          </ElFormItem>
        </ElForm>
      </ElCard>

      <!-- 日志输出区 -->
      <ElCard shadow="never" class="rounded-lg border border-gray-200">
        <template #header>
          <span class="text-sm font-medium text-gray-700">日志输出</span>
        </template>
        <div
          ref="logContainerRef"
          class="h-96 overflow-auto rounded border border-gray-800 bg-gray-900 p-3 font-mono text-xs leading-5 text-green-300"
        >
          <pre
            v-if="logs"
            class="whitespace-pre-wrap break-all m-0"
          >{{ logs }}</pre>
          <ElEmpty
            v-else
            description="暂无日志内容"
            :image-size="60"
            class="mt-20"
          />
        </div>
      </ElCard>
    </div>
  </Page>
</template>
