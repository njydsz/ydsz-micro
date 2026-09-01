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
import { useI18n } from 'vue-i18n';
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

const { t } = useI18n();

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
  () => props.nodeType === DesignerNodeType.APPROVE || props.nodeType === DesignerNodeType.AI_AGENT,
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
      <span>{{ t('wf.designerPanel.selectNodeHint') }}</span>
    </div>
    <ElTabs v-else class="property-tabs" type="border-card">
      <ElTabPane :label="t('wf.basicInfo')">
        <ElForm :model="form" label-width="80px" size="small">
          <ElFormItem :label="t('wf.designerPanel.nodeCode')">
            <ElInput
              v-model="form.nodeCode"
              :placeholder="t('wf.designerPanel.nodeCodePlaceholder')"
              @change="handleFormChange"
            />
          </ElFormItem>
          <ElFormItem :label="t('wf.designerPanel.nodeName')">
            <ElInput
              v-model="form.nodeName"
              :placeholder="t('wf.designerPanel.nodeNamePlaceholder')"
              @change="handleFormChange"
            />
          </ElFormItem>
        </ElForm>
      </ElTabPane>
      <ElTabPane :label="t('wf.designerPanel.assignee')">
        <ElForm :model="form" label-width="80px" size="small">
          <ElFormItem :label="t('wf.designerPanel.assigneeType')">
            <ElSelect
              v-model="form.assigneeType"
              :placeholder="t('wf.designerPanel.assigneeTypePlaceholder')"
              @change="handleFormChange"
            >
              <ElOption :label="t('wf.designerPanel.user')" value="USER" />
              <ElOption :label="t('wf.designerPanel.role')" value="ROLE" />
              <ElOption :label="t('wf.designerPanel.initiator')" value="INITIATOR" />
              <ElOption :label="t('wf.designerPanel.initiatorLeader')" value="INITIATOR_LEADER" />
              <ElOption :label="t('wf.designerPanel.expr')" value="EXPR" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem :label="t('wf.designerPanel.assigneeValue')">
            <ElInput
              v-model="form.assigneeValue"
              :placeholder="t('wf.designerPanel.assigneeValuePlaceholder')"
              @change="handleFormChange"
            />
          </ElFormItem>
        </ElForm>
      </ElTabPane>
      <ElTabPane :label="t('wf.formConfig')">
        <ElForm :model="form" label-width="80px" size="small">
          <ElFormItem :label="t('wf.designerPanel.formConfig')">
            <ElInput
              v-model="form.formConfig"
              type="textarea"
              :rows="6"
              :placeholder="t('wf.designerPanel.formConfigPlaceholder')"
              @change="handleFormChange"
            />
          </ElFormItem>
        </ElForm>
      </ElTabPane>
      <ElTabPane :label="t('wf.slaConfig')">
        <ElForm :model="form" label-width="80px" size="small">
          <ElFormItem :label="t('wf.designerPanel.slaConfig')">
            <ElInput
              v-model="form.slaConfig"
              type="textarea"
              :rows="6"
              :placeholder="t('wf.designerPanel.slaConfigPlaceholder')"
              @change="handleFormChange"
            />
          </ElFormItem>
        </ElForm>
      </ElTabPane>
      <ElTabPane :label="t('wf.listenerConfig')">
        <ElForm :model="form" label-width="80px" size="small">
          <ElFormItem :label="t('wf.designerPanel.listener')">
            <ElInput
              v-model="form.listenerConfig"
              type="textarea"
              :rows="6"
              :placeholder="t('wf.designerPanel.listenerPlaceholder')"
              @change="handleFormChange"
            />
          </ElFormItem>
        </ElForm>
      </ElTabPane>
      <!-- AI Agent 配置（仅 AI Agent 节点显示） -->
      <ElTabPane v-if="isAiAgentNode" :label="t('wf.designerPanel.aiAgent')">
        <ElForm :model="form" label-width="80px" size="small">
          <ElFormItem :label="t('wf.designerPanel.agentId')">
            <ElInput
              v-model="form.agentId"
              :placeholder="t('wf.designerPanel.agentIdPlaceholder')"
              @change="handleFormChange"
            />
          </ElFormItem>
          <ElFormItem :label="t('wf.designerPanel.promptTemplate')">
            <ElInput
              v-model="form.promptTemplate"
              type="textarea"
              :rows="4"
              :placeholder="t('wf.designerPanel.promptTemplatePlaceholder')"
              @change="handleFormChange"
            />
          </ElFormItem>
          <ElFormItem :label="t('wf.designerPanel.outputSchema')">
            <ElInput
              v-model="form.outputSchema"
              type="textarea"
              :rows="3"
              :placeholder="t('wf.designerPanel.outputSchemaPlaceholder')"
              @change="handleFormChange"
            />
          </ElFormItem>
          <ElFormItem :label="t('wf.designerPanel.fallback')">
            <ElSelect
              v-model="form.fallbackStrategy"
              :placeholder="t('wf.designerPanel.fallbackPlaceholder')"
              @change="handleFormChange"
            >
              <ElOption :label="t('wf.designerPanel.autoPass')" value="AUTO_PASS" />
              <ElOption :label="t('wf.designerPanel.autoReject')" value="AUTO_REJECT" />
              <ElOption :label="t('wf.designerPanel.transferAdmin')" value="TRANSFER_ADMIN" />
              <ElOption :label="t('wf.designerPanel.retry')" value="RETRY" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem :label="t('wf.designerPanel.retryMax')">
            <ElInputNumber v-model="form.retryMax" :min="0" :max="5" @change="handleFormChange" />
          </ElFormItem>
          <ElFormItem :label="t('wf.designerPanel.timeoutMs')">
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
      <ElTabPane v-if="isApproveNode" :label="t('wf.designerPanel.rejectStrategy')">
        <ElForm :model="form" label-width="80px" size="small">
          <ElFormItem :label="t('wf.designerPanel.defaultStrategy')">
            <ElSelect
              v-model="form.rejectStrategy"
              :placeholder="t('wf.designerPanel.defaultStrategyPlaceholder')"
              @change="handleFormChange"
            >
              <ElOption :label="t('wf.designerPanel.prevNode')" value="PREVIOUS" />
              <ElOption :label="t('wf.designerPanel.returnInitiator')" value="INITIATOR" />
              <ElOption :label="t('wf.designerPanel.anyNode')" value="ANY_NODE" />
              <ElOption :label="t('wf.designerPanel.customNode')" value="CUSTOM" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem v-if="form.rejectStrategy === 'CUSTOM'" :label="t('wf.designerPanel.customTarget')">
            <ElInput
              v-model="form.customTarget"
              :placeholder="t('wf.designerPanel.customTargetPlaceholder')"
              @change="handleFormChange"
            />
          </ElFormItem>
          <ElFormItem :label="t('wf.designerPanel.reExecuteMode')">
            <ElSelect
              v-model="form.reExecuteMode"
              :placeholder="t('wf.designerPanel.reExecuteModePlaceholder')"
              @change="handleFormChange"
            >
              <ElOption :label="t('wf.designerPanel.continueSkipAuto')" value="CONTINUE" />
              <ElOption :label="t('wf.designerPanel.returnRedoAll')" value="RETURN" />
            </ElSelect>
          </ElFormItem>
        </ElForm>
      </ElTabPane>
      <!-- 催办配置（审批节点和 AI Agent 节点显示） -->
      <ElTabPane v-if="isApproveNode" :label="t('wf.designerPanel.urge')">
        <ElForm :model="form" label-width="80px" size="small">
          <ElFormItem :label="t('wf.designerPanel.urgeEnabled')">
            <ElSwitch v-model="form.urgeEnabled" @change="handleFormChange" />
          </ElFormItem>
          <ElFormItem :label="t('wf.designerPanel.urgeChannel')">
            <ElSelect
              v-model="form.urgeChannels"
              multiple
              :placeholder="t('wf.designerPanel.urgeChannelPlaceholder')"
              @change="handleFormChange"
            >
              <ElOption :label="t('wf.designerPanel.inapp')" value="INAPP" />
              <ElOption :label="t('wf.designerPanel.email')" value="EMAIL" />
              <ElOption :label="t('wf.designerPanel.webhook')" value="WEBHOOK" />
              <ElOption :label="t('wf.designerPanel.sms')" value="SMS" />
              <ElOption :label="t('wf.designerPanel.wecom')" value="WECOM" />
              <ElOption :label="t('wf.designerPanel.dingtalk')" value="DINGTALK" />
              <ElOption :label="t('wf.designerPanel.feishu')" value="FEISHU" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem :label="t('wf.designerPanel.urgeInterval')">
            <ElInputNumber
              v-model="form.urgeIntervalMinutes"
              :min="5"
              :max="1440"
              :step="5"
              @change="handleFormChange"
            />
          </ElFormItem>
          <ElFormItem :label="t('wf.designerPanel.urgeMaxCount')">
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
