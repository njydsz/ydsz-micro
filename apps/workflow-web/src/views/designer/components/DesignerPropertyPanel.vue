<!--
 * 流程设计器属性面板
 *
 * <p>右侧属性配置面板，用于编辑选中节点的配置（办理人、表单、SLA、监听器）。
 *
 * @path apps\workflow-web\src\views\designer\components\DesignerPropertyPanel.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 流程设计器属性面板
 * <p>根据选中节点类型展示对应的配置表单。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { computed, reactive, watch } from 'vue';
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElSwitch,
  ElTabs,
  ElTabPane,
} from 'element-plus';
import type { DesignerNodeConfig } from '../types';
import { DesignerNodeType } from '../types';
import { $t } from '#/locales';

interface Props {
  /** 当前选中的节点 ID */
  nodeId: string;
  /** 节点配置 */
  nodeConfig: DesignerNodeConfig | null;
  /** 节点类型 */
  nodeType?: DesignerNodeType;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  configChange: [config: DesignerNodeConfig];
}>();

/** 本地表单数据 */
const form = reactive<DesignerNodeConfig>({
  nodeCode: '',
  nodeName: '',
  assigneeType: '',
  assigneeValue: '',
  formConfig: '',
  slaConfig: '',
  listenerConfig: '',
  serviceUrl: '',
  conditionExpr: '',
  agentId: '',
  promptTemplate: '',
  outputSchema: '',
  fallbackStrategy: 'AUTO_PASS',
  retryMax: 1,
  timeoutMs: 30000,
  rejectStrategy: 'PREVIOUS',
  allowedStrategies: 'PREVIOUS,INITIATOR',
  reExecuteMode: 'RETURN',
  customTarget: '',
  urgeChannels: 'INAPP',
  urgeIntervalMinutes: 30,
  urgeMaxCount: 3,
  urgeEnabled: true,
});

/** 是否有选中的节点 */
const hasSelection = computed(() => !!props.nodeId);

/** 是否为 AI Agent 节点 */
const isAiAgentNode = computed(() => props.nodeType === DesignerNodeType.AI_AGENT);

/** 是否为审批节点（含 AI Agent） */
const isApproveNode = computed(
  () =>
    props.nodeType === DesignerNodeType.APPROVE ||
    props.nodeType === DesignerNodeType.AI_AGENT,
);

/** 监听节点配置变化，同步到本地表单 */
watch(
  () => props.nodeConfig,
  (config) => {
    if (config) {
      Object.assign(form, config);
    }
  },
  { immediate: true, deep: true },
);

/**
 * 处理表单变更
 */
function handleFormChange() {
  emit('configChange', { ...form });
}
</script>

<template>
  <div class="designer-property-panel">
    <div v-if="!hasSelection" class="empty-tip">
      <span>请选择一个节点进行配置</span>
    </div>
    <ElTabs v-else class="property-tabs" type="border-card">
      <ElTabPane label="基础">
        <ElForm :model="form" label-width="80px" size="small">
          <ElFormItem label="节点编码">
            <ElInput
              v-model="form.nodeCode"
              placeholder="节点唯一编码"
              @change="handleFormChange"
            />
          </ElFormItem>
          <ElFormItem label="节点名称">
            <ElInput
              v-model="form.nodeName"
              placeholder="节点显示名称"
              @change="handleFormChange"
            />
          </ElFormItem>
        </ElForm>
      </ElTabPane>
      <ElTabPane label="办理人">
        <ElForm :model="form" label-width="80px" size="small">
          <ElFormItem label="办理人类型">
            <ElSelect
              v-model="form.assigneeType"
              placeholder="选择办理人类型"
              @change="handleFormChange"
            >
              <ElOption label="指定人员" value="USER" />
              <ElOption label="指定角色" value="ROLE" />
              <ElOption label="发起人" value="INITIATOR" />
              <ElOption label="发起人上级" value="INITIATOR_LEADER" />
              <ElOption label="表达式" value="EXPR" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="办理人值">
            <ElInput
              v-model="form.assigneeValue"
              placeholder="人员 ID / 角色编码 / 表达式"
              @change="handleFormChange"
            />
          </ElFormItem>
        </ElForm>
      </ElTabPane>
      <ElTabPane label="表单">
        <ElForm :model="form" label-width="80px" size="small">
          <ElFormItem label="表单配置">
            <ElInput
              v-model="form.formConfig"
              type="textarea"
              :rows="6"
              placeholder="表单 JSON 配置"
              @change="handleFormChange"
            />
          </ElFormItem>
        </ElForm>
      </ElTabPane>
      <ElTabPane label="SLA">
        <ElForm :model="form" label-width="80px" size="small">
          <ElFormItem label="SLA 配置">
            <ElInput
              v-model="form.slaConfig"
              type="textarea"
              :rows="6"
              placeholder="SLA JSON 配置"
              @change="handleFormChange"
            />
          </ElFormItem>
        </ElForm>
      </ElTabPane>
      <ElTabPane label="监听器">
        <ElForm :model="form" label-width="80px" size="small">
          <ElFormItem label="监听器">
            <ElInput
              v-model="form.listenerConfig"
              type="textarea"
              :rows="6"
              placeholder="监听器 JSON 配置"
              @change="handleFormChange"
            />
          </ElFormItem>
        </ElForm>
      </ElTabPane>
      <!-- AI Agent 配置（仅 AI Agent 节点显示） -->
      <ElTabPane v-if="isAiAgentNode" label="AI Agent">
        <ElForm :model="form" label-width="80px" size="small">
          <ElFormItem label="Agent ID">
            <ElInput
              v-model="form.agentId"
              placeholder="由 ydsz-agent 模块创建的 Agent ID"
              @change="handleFormChange"
            />
          </ElFormItem>
          <ElFormItem label="提示词模板">
            <ElInput
              v-model="form.promptTemplate"
              type="textarea"
              :rows="4"
              placeholder="支持 ${variable} 占位符，如：请判断是否通过审批，申请人=${applicant}"
              @change="handleFormChange"
            />
          </ElFormItem>
          <ElFormItem label="输出 Schema">
            <ElInput
              v-model="form.outputSchema"
              type="textarea"
              :rows="3"
              placeholder='{"type":"object","properties":{"approve":{"type":"boolean"},"reason":{"type":"string"}}}'
              @change="handleFormChange"
            />
          </ElFormItem>
          <ElFormItem label="兜底策略">
            <ElSelect
              v-model="form.fallbackStrategy"
              placeholder="Agent 超时/异常时的处理方式"
              @change="handleFormChange"
            >
              <ElOption label="自动通过" value="AUTO_PASS" />
              <ElOption label="自动驳回" value="AUTO_REJECT" />
              <ElOption label="转交管理员" value="TRANSFER_ADMIN" />
              <ElOption label="重试" value="RETRY" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="最大重试">
            <ElInputNumber
              v-model="form.retryMax"
              :min="0"
              :max="5"
              @change="handleFormChange"
            />
          </ElFormItem>
          <ElFormItem label="超时(ms)">
            <ElInputNumber
              v-model="form.timeoutMs"
              :min="5000"
              :max="120000"
              :step="5000"
              @change="handleFormChange"
            />
          </ElFormItem>
        </ElForm>
      </ElTabPane>
      <!-- 驳回策略配置（审批节点和 AI Agent 节点显示） -->
      <ElTabPane v-if="isApproveNode" label="驳回策略">
        <ElForm :model="form" label-width="80px" size="small">
          <ElFormItem label="默认策略">
            <ElSelect
              v-model="form.rejectStrategy"
              placeholder="选择默认驳回策略"
              @change="handleFormChange"
            >
              <ElOption label="回上一节点" value="PREVIOUS" />
              <ElOption label="回发起人" value="INITIATOR" />
              <ElOption label="回任意节点" value="ANY_NODE" />
              <ElOption label="回指定节点" value="CUSTOM" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem v-if="form.rejectStrategy === 'CUSTOM'" label="目标节点">
            <ElInput
              v-model="form.customTarget"
              placeholder="目标节点编码"
              @change="handleFormChange"
            />
          </ElFormItem>
          <ElFormItem label="重执行模式">
            <ElSelect
              v-model="form.reExecuteMode"
              placeholder="驳回后重执行方式"
              @change="handleFormChange"
            >
              <ElOption label="继续（跳过已执行自动节点）" value="CONTINUE" />
              <ElOption label="返回（重新执行全部节点）" value="RETURN" />
            </ElSelect>
          </ElFormItem>
        </ElForm>
      </ElTabPane>
      <!-- 催办配置（审批节点和 AI Agent 节点显示） -->
      <ElTabPane v-if="isApproveNode" label="催办">
        <ElForm :model="form" label-width="80px" size="small">
          <ElFormItem label="启用催办">
            <ElSwitch
              v-model="form.urgeEnabled"
              @change="handleFormChange"
            />
          </ElFormItem>
          <ElFormItem label="催办通道">
            <ElSelect
              v-model="form.urgeChannels"
              multiple
              placeholder="选择催办通知通道"
              @change="handleFormChange"
            >
              <ElOption label="站内信" value="INAPP" />
              <ElOption label="邮件" value="EMAIL" />
              <ElOption label="Webhook" value="WEBHOOK" />
              <ElOption label="短信" value="SMS" />
              <ElOption label="企业微信" value="WECOM" />
              <ElOption label="钉钉" value="DINGTALK" />
              <ElOption label="飞书" value="FEISHU" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="间隔(分钟)">
            <ElInputNumber
              v-model="form.urgeIntervalMinutes"
              :min="5"
              :max="1440"
              :step="5"
              @change="handleFormChange"
            />
          </ElFormItem>
          <ElFormItem label="最大次数">
            <ElInputNumber
              v-model="form.urgeMaxCount"
              :min="1"
              :max="10"
              @change="handleFormChange"
            />
          </ElFormItem>
        </ElForm>
      </ElTabPane>
    </ElTabs>
  </div>
</template>

<style scoped>
.designer-property-panel {
  width: 300px;
  background: #fff;
  border-left: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.empty-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  font-size: 14px;
}

.property-tabs {
  border: none;
  box-shadow: none;
  flex: 1;
}
</style>
