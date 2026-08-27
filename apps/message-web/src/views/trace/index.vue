<!--
 * 消息轨迹查询
 *
 * <p>查询消息的完整生命周期轨迹，展示消息从创建到送达的每个环节。
 *
 * @path apps\message-web\src\views\trace\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 消息轨迹查询
 * <p>消费后端契约 MessageTraceController（apps/message-web/src/api/trace/messageTrace.ts）。
 * <p>支持：按消息ID查询、按链路追踪ID查询、按业务ID查询。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { Page } from '@ydsz/common-ui';
import { ElButton, ElInput, ElOption, ElSelect, ElStep, ElSteps, ElTag } from 'element-plus';
import { computed, ref } from 'vue';
import { getByBiz, getByMsgId, getByTraceId } from '#/api/messageTrace';

defineOptions({ name: 'MessageTrace' });

/** 查询类型 */
const queryType = ref<'msgId' | 'traceId' | 'biz'>('msgId');

/** 查询关键字 */
const queryKey = ref('');

/** 业务类型 */
const bizType = ref('');

/** 业务ID */
const bizId = ref('');

/** 轨迹数据 */
const traceSteps = ref<string[]>([]);

/** 加载状态 */
const loading = ref(false);

/** 查询类型选项 */
const queryTypeOptions = [
  { label: '消息ID', value: 'msgId' },
  { label: '追踪ID', value: 'traceId' },
  { label: '业务ID', value: 'biz' },
];

/** 轨迹节点状态映射 */
const STEP_STATUS_MAP: Record<string, { label: string; type: string; description: string }> = {
  RECEIVED: { label: '已接收', type: 'primary', description: '消息已接收' },
  CHANNEL_CHECK: { label: '渠道检查', type: 'primary', description: '检查渠道可用性' },
  ROUTE_MATCHED: { label: '路由匹配', type: 'primary', description: '匹配路由规则' },
  CANARY_HIT: { label: '灰度命中', type: 'warning', description: '命中灰度策略' },
  SUBSCRIPTION_CHECK: { label: '订阅检查', type: 'primary', description: '检查用户订阅状态' },
  PREFERENCE_CHECK: { label: '偏好检查', type: 'primary', description: '检查用户偏好设置' },
  DEDUP_CHECK: { label: '去重检查', type: 'primary', description: '检查消息是否重复' },
  RATE_LIMIT_CHECK: { label: '限流检查', type: 'primary', description: '检查是否触发限流' },
  TEMPLATE_LOADED: { label: '模板加载', type: 'primary', description: '加载消息模板' },
  TEMPLATE_RENDERED: { label: '模板渲染', type: 'primary', description: '渲染消息内容' },
  SENSITIVE_FILTERED: { label: '敏感词过滤', type: 'warning', description: '过滤敏感词' },
  PERSISTED: { label: '已持久化', type: 'success', description: '消息已持久化到数据库' },
  SCHEDULED: { label: '已调度', type: 'primary', description: '消息已加入发送队列' },
  AGGREGATED: { label: '已聚合', type: 'primary', description: '消息已聚合' },
  DISPATCH_START: { label: '开始投递', type: 'primary', description: '开始投递到渠道' },
  DISPATCH_SUCCESS: { label: '投递成功', type: 'success', description: '消息已成功投递' },
  FALLBACK: { label: '降级处理', type: 'warning', description: '触发降级策略' },
  RETRY: { label: '重试', type: 'warning', description: '消息发送失败，正在重试' },
  SEND_FAILED: { label: '发送失败', type: 'danger', description: '消息发送失败' },
  RECEIPT_RECEIVED: { label: '回执已收', type: 'success', description: '收到渠道回执' },
  RECALLED: { label: '已撤回', type: 'warning', description: '消息已撤回' },
  CASCADE_SENT: { label: '级联发送', type: 'primary', description: '级联发送完成' },
};

/** 当前步骤索引 */
const currentStepIndex = computed(() => {
  if (traceSteps.value.length === 0) return 0;
  // 找到最后一个成功/失败的步骤
  for (let i = traceSteps.value.length - 1; i >= 0; i--) {
    const step = traceSteps.value[i];
    if (step === 'DISPATCH_SUCCESS' || step === 'SEND_FAILED' || step === 'RECEIPT_RECEIVED') {
      return i;
    }
  }
  return traceSteps.value.length - 1;
});

/** 执行查询 */
async function handleQuery(): Promise<void> {
  if (queryType.value !== 'biz' && !queryKey.value.trim()) {
    return;
  }
  if (queryType.value === 'biz' && !bizId.value.trim()) {
    return;
  }
  loading.value = true;
  try {
    let result: string[] = [];
    if (queryType.value === 'msgId') {
      result = await getByMsgId({ msgId: queryKey.value.trim() });
    } else if (queryType.value === 'traceId') {
      result = await getByTraceId({ traceId: queryKey.value.trim() });
    } else {
      result = await getByBiz({ bizType: bizType.value, bizId: bizId.value.trim() });
    }
    traceSteps.value = result;
  } catch {
    traceSteps.value = [];
  } finally {
    loading.value = false;
  }
}

/** 获取步骤配置 */
function getStepConfig(step: string): { label: string; type: string; description: string } {
  return STEP_STATUS_MAP[step] ?? { label: step, type: 'info', description: '未知状态' };
}
</script>

<template>
  <Page auto-content-height>
    <div class="trace-container mx-auto max-w-5xl p-6">
      <!-- 查询头部 -->
      <div class="mb-6">
        <h1 class="mb-4 text-2xl font-bold text-gray-800">消息轨迹查询</h1>
        <div class="flex items-center gap-3">
          <ElSelect v-model="queryType" placeholder="查询类型" class="w-32">
            <ElOption v-for="opt in queryTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
          <template v-if="queryType === 'biz'">
            <ElInput v-model="bizType" placeholder="业务类型" class="w-40" />
            <ElInput v-model="bizId" placeholder="业务ID" class="w-64" />
          </template>
          <ElInput
            v-else
            v-model="queryKey"
            :placeholder="`请输入${queryType === 'msgId' ? '消息ID' : '追踪ID'}`"
            class="w-80"
            clearable
            @keyup.enter="handleQuery"
          />
          <ElButton type="primary" :loading="loading" @click="handleQuery">查询</ElButton>
        </div>
      </div>

      <!-- 轨迹展示 -->
      <div v-if="traceSteps.length > 0" class="rounded border bg-white p-6">
        <h3 class="mb-4 text-base font-medium">消息轨迹（共 {{ traceSteps.length }} 个节点）</h3>
        <ElSteps
          :active="currentStepIndex + 1"
          direction="vertical"
          :space="80"
          finish-status="success"
        >
          <ElStep
            v-for="(step, index) in traceSteps"
            :key="index"
            :title="getStepConfig(step).label"
            :description="getStepConfig(step).description"
            :status="index === currentStepIndex ? 'process' : index < currentStepIndex ? 'finish' : 'wait'"
          >
            <template #icon>
              <ElTag v-if="getStepConfig(step).type === 'success'" type="success" size="small">✓</ElTag>
              <ElTag v-else-if="getStepConfig(step).type === 'danger'" type="danger" size="small">✗</ElTag>
              <ElTag v-else-if="getStepConfig(step).type === 'warning'" type="warning" size="small">!</ElTag>
              <ElTag v-else type="primary" size="small">{{ index + 1 }}</ElTag>
            </template>
          </ElStep>
        </ElSteps>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!loading" class="flex h-64 items-center justify-center rounded border bg-white text-gray-400">
        <p>请输入查询条件后点击查询按钮</p>
      </div>

      <!-- 加载中 -->
      <div v-else class="flex h-64 items-center justify-center rounded border bg-white text-gray-400">
        <p>正在查询轨迹数据...</p>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.trace-container {
  min-height: calc(100vh - 120px);
}
</style>
