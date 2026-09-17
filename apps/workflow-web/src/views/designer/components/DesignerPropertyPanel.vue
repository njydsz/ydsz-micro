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
import { YdForm, YdFormItem, YdInput, YdNumberFieldInput, YdSelectItem, YdSelect, YdSwitch, YdTabs, YdTabsContent } from '@ydsz-core/ydsz-ui';
// TODO: EP → ydsz-ui 迁移待后续批次（属性面板包含 ElTabs/ElTabPane/ElForm/ElFormItem/ElSelect/ElInputNumber/ElSwitch 等复杂表单组合）
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
    <YdTabs v-else class="property-tabs" type="border-card">
      <YdTabsContent :label="t('wf.basicInfo')">
        <YdForm :model="form" label-width="80px" size="small">
          <YdFormItem :label="t('wf.designerPanel.nodeCode')">
            <YdInput
              v-model="form.nodeCode"
              :placeholder="t('wf.designerPanel.nodeCodePlaceholder')"
              @change="handleFormChange"
            />
          </YdFormItem>
          <YdFormItem :label="t('wf.designerPanel.nodeName')">
            <YdInput
              v-model="form.nodeName"
              :placeholder="t('wf.designerPanel.nodeNamePlaceholder')"
              @change="handleFormChange"
            />
          </YdFormItem>
        </YdForm>
      </YdTabsContent>
      <YdTabsContent :label="t('wf.designerPanel.assignee')">
        <YdForm :model="form" label-width="80px" size="small">
          <YdFormItem :label="t('wf.designerPanel.assigneeType')">
            <YdSelect
              v-model="form.assigneeType"
              :placeholder="t('wf.designerPanel.assigneeTypePlaceholder')"
              @change="handleFormChange"
            >
              <YdSelectItem :label="t('wf.designerPanel.user')" value="USER" />
              <YdSelectItem :label="t('wf.designerPanel.role')" value="ROLE" />
              <YdSelectItem :label="t('wf.designerPanel.initiator')" value="INITIATOR" />
              <YdSelectItem :label="t('wf.designerPanel.initiatorLeader')" value="INITIATOR_LEADER" />
              <YdSelectItem :label="t('wf.designerPanel.expr')" value="EXPR" />
            </YdSelect>
          </YdFormItem>
          <YdFormItem :label="t('wf.designerPanel.assigneeValue')">
            <YdInput
              v-model="form.assigneeValue"
              :placeholder="t('wf.designerPanel.assigneeValuePlaceholder')"
              @change="handleFormChange"
            />
          </YdFormItem>
        </YdForm>
      </YdTabsContent>
      <YdTabsContent :label="t('wf.formConfig')">
        <YdForm :model="form" label-width="80px" size="small">
          <YdFormItem :label="t('wf.designerPanel.formConfig')">
            <YdInput
              v-model="form.formConfig"
              type="textarea"
              :rows="6"
              :placeholder="t('wf.designerPanel.formConfigPlaceholder')"
              @change="handleFormChange"
            />
          </YdFormItem>
        </YdForm>
      </YdTabsContent>
      <YdTabsContent :label="t('wf.slaConfig')">
        <YdForm :model="form" label-width="80px" size="small">
          <YdFormItem :label="t('wf.designerPanel.slaConfig')">
            <YdInput
              v-model="form.slaConfig"
              type="textarea"
              :rows="6"
              :placeholder="t('wf.designerPanel.slaConfigPlaceholder')"
              @change="handleFormChange"
            />
          </YdFormItem>
        </YdForm>
      </YdTabsContent>
      <YdTabsContent :label="t('wf.listenerConfig')">
        <YdForm :model="form" label-width="80px" size="small">
          <YdFormItem :label="t('wf.designerPanel.listener')">
            <YdInput
              v-model="form.listenerConfig"
              type="textarea"
              :rows="6"
              :placeholder="t('wf.designerPanel.listenerPlaceholder')"
              @change="handleFormChange"
            />
          </YdFormItem>
        </YdForm>
      </YdTabsContent>
      <!-- AI Agent 配置（仅 AI Agent 节点显示） -->
      <YdTabsContent v-if="isAiAgentNode" :label="t('wf.designerPanel.aiAgent')">
        <YdForm :model="form" label-width="80px" size="small">
          <YdFormItem :label="t('wf.designerPanel.agentId')">
            <YdInput
              v-model="form.agentId"
              :placeholder="t('wf.designerPanel.agentIdPlaceholder')"
              @change="handleFormChange"
            />
          </YdFormItem>
          <YdFormItem :label="t('wf.designerPanel.promptTemplate')">
            <YdInput
              v-model="form.promptTemplate"
              type="textarea"
              :rows="4"
              :placeholder="t('wf.designerPanel.promptTemplatePlaceholder')"
              @change="handleFormChange"
            />
          </YdFormItem>
          <YdFormItem :label="t('wf.designerPanel.outputSchema')">
            <YdInput
              v-model="form.outputSchema"
              type="textarea"
              :rows="3"
              :placeholder="t('wf.designerPanel.outputSchemaPlaceholder')"
              @change="handleFormChange"
            />
          </YdFormItem>
          <YdFormItem :label="t('wf.designerPanel.fallback')">
            <YdSelect
              v-model="form.fallbackStrategy"
              :placeholder="t('wf.designerPanel.fallbackPlaceholder')"
              @change="handleFormChange"
            >
              <YdSelectItem :label="t('wf.designerPanel.autoPass')" value="AUTO_PASS" />
              <YdSelectItem :label="t('wf.designerPanel.autoReject')" value="AUTO_REJECT" />
              <YdSelectItem :label="t('wf.designerPanel.transferAdmin')" value="TRANSFER_ADMIN" />
              <YdSelectItem :label="t('wf.designerPanel.retry')" value="RETRY" />
            </YdSelect>
          </YdFormItem>
          <YdFormItem :label="t('wf.designerPanel.retryMax')">
            <YdNumberFieldInput v-model="form.retryMax" :min="0" :max="5" @change="handleFormChange" />
          </YdFormItem>
          <YdFormItem :label="t('wf.designerPanel.timeoutMs')">
            <YdNumberFieldInput
              v-model="form.timeoutMs"
              :min="5000"
              :max="120000"
              :step="5000"
              @change="handleFormChange"
            />
          </YdFormItem>
        </YdForm>
      </YdTabsContent>
      <!-- 驳回策略配置（审批节点和 AI Agent 节点显示） -->
      <YdTabsContent v-if="isApproveNode" :label="t('wf.designerPanel.rejectStrategy')">
        <YdForm :model="form" label-width="80px" size="small">
          <YdFormItem :label="t('wf.designerPanel.defaultStrategy')">
            <YdSelect
              v-model="form.rejectStrategy"
              :placeholder="t('wf.designerPanel.defaultStrategyPlaceholder')"
              @change="handleFormChange"
            >
              <YdSelectItem :label="t('wf.designerPanel.prevNode')" value="PREVIOUS" />
              <YdSelectItem :label="t('wf.designerPanel.returnInitiator')" value="INITIATOR" />
              <YdSelectItem :label="t('wf.designerPanel.anyNode')" value="ANY_NODE" />
              <YdSelectItem :label="t('wf.designerPanel.customNode')" value="CUSTOM" />
            </YdSelect>
          </YdFormItem>
          <YdFormItem v-if="form.rejectStrategy === 'CUSTOM'" :label="t('wf.designerPanel.customTarget')">
            <YdInput
              v-model="form.customTarget"
              :placeholder="t('wf.designerPanel.customTargetPlaceholder')"
              @change="handleFormChange"
            />
          </YdFormItem>
          <YdFormItem :label="t('wf.designerPanel.reExecuteMode')">
            <YdSelect
              v-model="form.reExecuteMode"
              :placeholder="t('wf.designerPanel.reExecuteModePlaceholder')"
              @change="handleFormChange"
            >
              <YdSelectItem :label="t('wf.designerPanel.continueSkipAuto')" value="CONTINUE" />
              <YdSelectItem :label="t('wf.designerPanel.returnRedoAll')" value="RETURN" />
            </YdSelect>
          </YdFormItem>
        </YdForm>
      </YdTabsContent>
      <!-- 催办配置（审批节点和 AI Agent 节点显示） -->
      <YdTabsContent v-if="isApproveNode" :label="t('wf.designerPanel.urge')">
        <YdForm :model="form" label-width="80px" size="small">
          <YdFormItem :label="t('wf.designerPanel.urgeEnabled')">
            <YdSwitch v-model="form.urgeEnabled" @change="handleFormChange" />
          </YdFormItem>
          <YdFormItem :label="t('wf.designerPanel.urgeChannel')">
            <YdSelect
              v-model="form.urgeChannels"
              multiple
              :placeholder="t('wf.designerPanel.urgeChannelPlaceholder')"
              @change="handleFormChange"
            >
              <YdSelectItem :label="t('wf.designerPanel.inapp')" value="INAPP" />
              <YdSelectItem :label="t('wf.designerPanel.email')" value="EMAIL" />
              <YdSelectItem :label="t('wf.designerPanel.webhook')" value="WEBHOOK" />
              <YdSelectItem :label="t('wf.designerPanel.sms')" value="SMS" />
              <YdSelectItem :label="t('wf.designerPanel.wecom')" value="WECOM" />
              <YdSelectItem :label="t('wf.designerPanel.dingtalk')" value="DINGTALK" />
              <YdSelectItem :label="t('wf.designerPanel.feishu')" value="FEISHU" />
            </YdSelect>
          </YdFormItem>
          <YdFormItem :label="t('wf.designerPanel.urgeInterval')">
            <YdNumberFieldInput
              v-model="form.urgeIntervalMinutes"
              :min="5"
              :max="1440"
              :step="5"
              @change="handleFormChange"
            />
          </YdFormItem>
          <YdFormItem :label="t('wf.designerPanel.urgeMaxCount')">
            <YdNumberFieldInput
              v-model="form.urgeMaxCount"
              :min="1"
              :max="10"
              @change="handleFormChange"
            />
          </YdFormItem>
        </YdForm>
      </YdTabsContent>
    </YdTabs>
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
