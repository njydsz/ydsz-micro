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
import { ElForm, ElFormItem, ElInput, ElOption, ElSelect, ElTabs, ElTabPane } from 'element-plus';
import type { DesignerNodeConfig } from '../types';
import { $t } from '#/locales';

interface Props {
  /** 当前选中的节点 ID */
  nodeId: string;
  /** 节点配置 */
  nodeConfig: DesignerNodeConfig | null;
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
});

/** 是否有选中的节点 */
const hasSelection = computed(() => !!props.nodeId);

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
