<!--
 * 消息事件发布视图
 *
 * <p>提供给运维/管理员使用的消息事件发布能力，外部系统可通过此接口唤醒等待中的流程节点。
 *
 * @path apps/workflow-web/src/views/message-event/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 消息事件发布
 * <p>消费后端 MessageEventController（apps/workflow-web/src/api/messageEvent.ts）：
 * publishMessageEvent() 发布消息事件唤醒等待节点。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { ElButton, ElCard, ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus';
import { Page } from '@ydsz/common-ui';
import { createLogger } from '@ydsz/utils';
import { reactive, ref } from 'vue';
import { publishMessageEvent } from '#/api/messageEvent';

defineOptions({ name: 'MessageEventManagement' });

const logger = createLogger('workflow-message-event');

/** 加载状态 */
const loading = ref(false);

/** 发布表单数据 */
const form = reactive({
  messageName: '',
  correlationKey: '',
  correlationValue: '',
});

/**
 * 发布消息事件。
 */
async function handlePublish() {
  if (!form.messageName.trim()) {
    ElMessage.warning('请填写消息名称');
    return;
  }

  const correlationKeys: Record<string, string> = {};
  if (form.correlationKey.trim() && form.correlationValue.trim()) {
    correlationKeys[form.correlationKey.trim()] = form.correlationValue.trim();
  }

  loading.value = true;
  try {
    const result = await publishMessageEvent({
      messageName: form.messageName.trim(),
      correlationKeys: Object.keys(correlationKeys).length > 0 ? correlationKeys : undefined,
    });
    ElMessage.success(result ?? '发布成功');
    logger.info('消息事件发布成功:', form.messageName);
  } catch {
    /* 错误由拦截器处理 */
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Page auto-content-height>
    <ElCard header="消息事件发布" class="message-event-card">
      <p class="text-sm text-gray-600 mb-4">
        此页面用于向订阅了特定消息的等待节点触发流程继续。
        通常由外部系统（如消息队列消费者）通过 API 调用，此处提供手动触发入口用于调试和运维。
      </p>
      <ElForm :model="form" label-width="120px">
        <ElFormItem label="消息名称" required>
          <ElInput v-model="form.messageName" placeholder="对应流程中消息节点的订阅名称" />
        </ElFormItem>
        <ElFormItem label="关联键名">
          <ElInput v-model="form.correlationKey" placeholder="可选，如 orderId" />
        </ElFormItem>
        <ElFormItem label="关联键值">
          <ElInput v-model="form.correlationValue" placeholder="可选，如 ORD-20260908-001" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" :loading="loading" @click="handlePublish">发布事件</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>
  </Page>
</template>

<style lang="scss" scoped>
.message-event-card {
  margin: 16px;
  max-width: 600px;
}

.text-sm {
  font-size: 14px;
}

.text-gray-600 {
  color: #4b5563;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
