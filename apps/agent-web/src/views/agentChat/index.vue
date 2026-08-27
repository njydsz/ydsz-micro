<!--
 * Agent 对话调试台（新页面）
 *
 * @path apps/agent-web/src/views/agentChat/index.vue
 * @author ydsz-team
 * @since 4.2.0
-->
<script lang="ts" setup>
/**
 * Agent 对话调试台
 * <p>消费后端契约 AgentController 的流式对话能力：
 * <ul>
 *   <li>{@code POST /api/v1/agent/chat/stream}（sse-client.ts）逐 token 流式输出；</li>
 *   <li>{@code GET /api/v1/agent/history} 按会话加载历史；</li>
 *   <li>{@code DELETE /api/v1/agent/history} 清空会话历史。</li>
 * </ul>
 * 支持会话ID（conversationId）维度隔离、流式过程中的停止生成与组件卸载自动断开。
 *
 * @author ydsz-team
 * @since 4.2.0
 */
import { Page } from '@ydsz/common-ui';

import {
  ElButton,
  ElCollapse,
  ElCollapseItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElTooltip,
} from 'element-plus';
import { computed, onBeforeUnmount, ref } from 'vue';

import { clearHistory, history as fetchHistory } from '#/api/agent';
import { openAgentStream } from '#/utils/sse-client';

import ConversationShare from './components/ConversationShare.vue';

defineOptions({ name: 'AgentChatConsole' });

/** 会话消息（role + 增量 content） */
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

const conversationId = ref('');
const systemPrompt = ref('');
const inputText = ref('');
const messages = ref<ChatMessage[]>([]);
const sending = ref(false);
/** SSE 连接状态（idle/connecting/live） */
const streamState = ref<'idle' | 'connecting' | 'live'>('idle');
const scrollEl = ref<HTMLElement | null>(null);

/** 对话分享组件引用 */
const conversationShareRef = ref<InstanceType<typeof ConversationShare> | null>(null);

let closeStream = (() => undefined) as () => void;

const streamStateText: Record<string, string> = {
  idle: '空闲',
  connecting: '连接中…',
  live: '流式输出中',
};

/** 是否可发送（消息非空且无进行中的流） */
const canSend = computed(() => inputText.value.trim() !== '' && !sending.value);

/** 滚动到底部（流式输出时保持追随） */
function scrollToBottom(): void {
  requestAnimationFrame(() => {
    const el = scrollEl.value;
    if (el) el.scrollTop = el.scrollHeight;
  });
}

/** 关闭会话流并复位发送态（停止生成/终态处理/组件卸载共用） */
function teardownStream(): void {
  closeStream();
  closeStream = () => undefined;
  sending.value = false;
  streamState.value = 'idle';
  const last = messages.value[messages.value.length - 1];
  if (last && last.streaming) last.streaming = false;
}

/** 触发一次流式对话 */
async function sendMessage(): Promise<void> {
  const text = inputText.value.trim();
  if (!text || sending.value) return;

  messages.value.push({ role: 'user', content: text });
  const assistantMsg: ChatMessage = { role: 'assistant', content: '', streaming: true };
  messages.value.push(assistantMsg);
  inputText.value = '';
  sending.value = true;
  streamState.value = 'connecting';
  scrollToBottom();

  closeStream = openAgentStream(
    '/api/v1/agent/chat/stream',
    {
      message: text,
      conversationId: conversationId.value || undefined,
      systemPrompt: systemPrompt.value || undefined,
    },
    {
      onOpen: () => {
        streamState.value = 'live';
      },
      onChunk: (chunk) => {
        if (!chunk.content) return;
        assistantMsg.content += chunk.content;
        scrollToBottom();
      },
      onDone: () => {
        assistantMsg.streaming = false;
        teardownStream();
        scrollToBottom();
      },
      onError: (error: unknown) => {
        assistantMsg.streaming = false;
        assistantMsg.content += assistantMsg.content ? '\n' : '';
        assistantMsg.content += `[流式输出异常] ${error instanceof Error ? error.message : String(error)}`;
        teardownStream();
        scrollToBottom();
      },
      onClose: () => {
        // 正常/终态后由 onDone/onError 处理；此回调仅兜底复位
        if (sending.value || streamState.value !== 'idle') teardownStream();
      },
    },
  );
}

/** 加载指定会话的历史消息 */
async function loadHistory(): Promise<void> {
  try {
    const list = await fetchHistory({ conversationId: conversationId.value });
    messages.value = (list ?? [])
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const role = String(item?.role ?? '').toLowerCase();
        const isAi = role === 'assistant' || role === 'ai' || role === 'bot';
        return {
          role: (isAi ? 'assistant' : 'user') as ChatMessage['role'],
          content: String(item?.content ?? item?.message ?? ''),
        };
      });
    scrollToBottom();
    ElMessage.success(`已加载 ${messages.value.length} 条历史消息`);
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

/** 清空当前会话历史 */
async function handleClearHistory(): Promise<void> {
  if (!conversationId.value) {
    messages.value = [];
    return;
  }
  try {
    await ElMessageBox.confirm('确定清空该会话的全部历史记录吗？', '清空会话', { type: 'warning' });
    await clearHistory({ conversationId: conversationId.value });
    messages.value = [];
    ElMessage.success('会话历史已清空');
  } catch {
    // 取消或失败均保留现状
  }
}

onBeforeUnmount(() => {
  teardownStream();
});
</script>
<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col p-4">
      <!-- 会话工具栏 -->
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <ElInput
          v-model="conversationId"
          placeholder="会话ID（为空自动新建）"
          class="w-64"
          clearable
          @keyup.enter="loadHistory"
        />
        <ElButton @click="loadHistory">加载历史</ElButton>
        <ElButton type="primary" plain :disabled="!conversationId" @click="conversationShareRef?.open(conversationId)">发布/分享</ElButton>
        <ElButton type="danger" plain @click="handleClearHistory">清空会话</ElButton>
        <ElTooltip :content="`流式状态：${streamStateText[streamState]}`" placement="top">
          <span
            class="text-xs"
            :class="streamState === 'live' ? 'text-green-600' : streamState === 'connecting' ? 'text-amber-600' : 'text-gray-400'"
          >
            {{ streamStateText[streamState] }}
          </span>
        </ElTooltip>
      </div>
      <!-- 消息区 -->
      <div ref="scrollEl" class="flex-1 overflow-y-auto rounded border border-gray-200 p-3">
        <div v-if="messages.length === 0" class="pt-10 text-center text-sm text-gray-400">
          输入消息开始对话，流式输出将逐 token 展示
        </div>
        <div v-for="(msg, index) in messages" :key="`${index}-${msg.role}`" class="mb-3">
          <div
            class="mb-1 text-xs font-medium"
            :class="msg.role === 'user' ? 'text-blue-600' : 'text-green-600'"
          >
            {{ msg.role === 'user' ? '用户' : 'Agent' }}
            <span v-if="msg.streaming" class="ml-1 animate-pulse text-gray-400">●</span>
          </div>
          <div
            class="whitespace-pre-wrap rounded px-3 py-2 text-sm leading-relaxed"
            :class="msg.role === 'user' ? 'bg-blue-50' : 'bg-gray-50'"
          >
            {{ msg.content || (msg.streaming ? '…' : '（空回复）') }}
          </div>
        </div>
      </div>
      <ConversationShare ref="conversationShareRef" />
      <!-- 输入区 -->
      <div class="mt-3">
        <ElCollapse class="mb-2">
          <ElCollapseItem title="高级参数（System Prompt）" name="advanced">
            <ElInput v-model="systemPrompt" type="textarea" :rows="2" placeholder="可选：自定义系统提示词" />
          </ElCollapseItem>
        </ElCollapse>
        <div class="flex items-start gap-2">
          <ElInput
            v-model="inputText"
            type="textarea"
            :rows="2"
            :disabled="sending"
            placeholder="输入消息，Enter 发送（Shift+Enter 换行）"
            @keydown.enter.exact.prevent="sendMessage"
          />
          <div class="flex flex-col gap-2">
            <ElButton type="primary" :disabled="!canSend" @click="sendMessage">发送</ElButton>
            <ElButton :disabled="!sending" @click="teardownStream">停止</ElButton>
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>