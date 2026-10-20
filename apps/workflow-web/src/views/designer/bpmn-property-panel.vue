<!--
 * BPMN 节点属性面板
 *
 * <p>监听元素选中事件（selectionChange），根据选中元素类型（userTask / serviceTask /
 * startEvent / endEvent / exclusiveGateway）展示不同字段。
 *
 * <p>字段包括：id、name、candidateGroups、service class/implementation。
 * 修改属性后通过 modeler.updateProperties() 同步到画布（由父组件通过 ref 调用 BpmnCanvas）。
 *
 * @path apps\workflow-web\src\views\designer\bpmn-property-panel.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * BPMN 节点属性面板
 * <p>根据选中元素类型展示对应字段，修改后 emit 属性变更。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { reactive, ref, watch } from 'vue';

export interface PropertyElement {
  id: string;
  type: string;
  businessObject?: Record<string, any> | null;
}

/** 内部表单数据结构 */
interface FormData {
  id: string;
  name: string;
  documentation: string;
  candidateGroups: string;
  candidateUsers: string;
  assignee: string;
  classValue: string;
  expression: string;
  delegateExpression: string;
  conditionExpression: string;
  isForCompensation: boolean;
}

const SEPARATORS = /[,，;；\s]+/;

interface Props {
  /** 当前选中的元素对象 */
  element: PropertyElement | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  propertyChange: [elementId: string, properties: Record<string, any>];
}>();

const form = reactive<FormData>({
  id: '',
  name: '',
  documentation: '',
  candidateGroups: '',
  candidateUsers: '',
  assignee: '',
  classValue: '',
  expression: '',
  delegateExpression: '',
  conditionExpression: '',
  isForCompensation: false,
});

const disabled = ref(true);

/** 是否在编辑 userTask */
const isUserTask = ref(false);
/** 是否在编辑服务任务（serviceTask / businessRuleTask） */
const isServiceTask = ref(false);
/** 是否在编辑排他网关（exclusiveGateway） */
const isExclusiveGateway = ref(false);
/** 是否在编辑开始/结束事件 */
const isEvent = ref(false);

/** 根据 element.type 判断节点分类 */
function classifyElement(type: string | undefined): void {
  const t = (type || '').toLowerCase();
  isUserTask.value = t === 'bpmn:usertask';
  isServiceTask.value = t === 'bpmn:servicetask' || t === 'bpmn:businessruletask';
  isExclusiveGateway.value =
    t === 'bpmn:exclusivegateway' || t === 'bpmn:parallelgateway' || t === 'bpmn:inclusivegateway';
  isEvent.value = t === 'bpmn:startevent' || t === 'bpmn:endevent' || t === 'bpmn:intermediatecatchevent';
}

/** 从 businessObject 回填表单 */
function fillFormFromElement(element: PropertyElement): void {
  const bo = element.businessObject;
  if (!bo) {
    disabled.value = true;
    return;
  }
  disabled.value = false;
  form.id = bo.id ?? '';
  form.name = bo.name ?? '';
  form.documentation = bo.documentation?.[0]?.text ?? '';
  form.candidateGroups = normalizeList(bo.$attrs?.['camunda:candidateGroups']);
  form.candidateUsers = normalizeList(bo.$attrs?.['camunda:candidateUsers']);
  form.assignee = String(bo.$attrs?.['camunda:assignee'] ?? '');
  form.classValue = String(bo.$attrs?.['camunda:class'] ?? '');
  form.expression = String(bo.$attrs?.['camunda:expression'] ?? '');
  form.delegateExpression = String(bo.$attrs?.['camunda:delegateExpression'] ?? '');
  // 条件表达式存在于 sequenceFlow.conditionExpression.body
  const conditionBody =
    bo.conditionExpression?.body ??
    bo.$parent?.conditionExpression?.body ??
    '';
  form.conditionExpression = String(conditionBody);
  form.isForCompensation = Boolean(bo.isForCompensation);
  classifyElement(bo.$type || element.type);
}

/** 将字符串规范化为逗号分隔的列表 */
function normalizeList(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

/** 提交属性变更（发射到父组件，由父组件调用 modeling.updateProperties） */
function handlePropertyChange(): void {
  if (!props.element) return;
  const changed: Record<string, any> = {
    name: form.name,
    documentation: form.documentation ? [{ text: form.documentation }] : undefined,
    'camunda:candidateGroups': form.candidateGroups.split(SEPARATORS).filter(Boolean).join(','),
    'camunda:candidateUsers': form.candidateUsers.split(SEPARATORS).filter(Boolean).join(','),
    'camunda:assignee': form.assignee,
    'camunda:class': form.classValue,
    'camunda:expression': form.expression,
    'camunda:delegateExpression': form.delegateExpression,
  };
  // 移除空值
  Object.keys(changed).forEach((key) => {
    const v = changed[key];
    if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) {
      delete changed[key];
    }
  });
  if (isExclusiveGateway || form.conditionExpression) {
    if (props.element.businessObject?.conditionExpression) {
      changed.conditionExpression = {
        $type: 'bpmn:FormalExpression',
        body: form.conditionExpression,
      };
    }
  }
  emit('propertyChange', props.element.id, changed);
}

/** 监听选中元素变化后同步本地表单 */
watch(
  () => props.element,
  (next) => {
    if (next) {
      fillFormFromElement(next);
    } else {
      form.id = '';
      form.name = '';
      form.documentation = '';
      form.candidateGroups = '';
      form.candidateUsers = '';
      form.assignee = '';
      form.classValue = '';
      form.expression = '';
      form.delegateExpression = '';
      form.conditionExpression = '';
      form.isForCompensation = false;
      disabled.value = true;
      isUserTask.value = false;
      isServiceTask.value = false;
      isExclusiveGateway.value = false;
      isEvent.value = false;
    }
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <div class="bpmn-property-panel">
    <div v-if="!element || disabled" class="empty-hint">
      <span>选中节点以编辑属性</span>
    </div>
    <div v-else class="property-form">
      <section class="property-group">
        <h4 class="group-title">基础</h4>
        <label class="field">
          <span class="field-label">ID</span>
          <input v-model="form.id" class="field-input" disabled />
        </label>
        <label class="field">
          <span class="field-label">名称</span>
          <input
            v-model="form.name"
            class="field-input"
            placeholder="填写节点名称"
            @change="handlePropertyChange"
          />
        </label>
        <label class="field">
          <span class="field-label">描述</span>
          <textarea
            v-model="form.documentation"
            class="field-input"
            rows="3"
            @change="handlePropertyChange"
          />
        </label>
      </section>

      <section v-if="isUserTask" class="property-group">
        <h4 class="group-title">办理人</h4>
        <label class="field">
          <span class="field-label">办理人 (assignee)</span>
          <input
            v-model="form.assignee"
            class="field-input"
            placeholder="变量或用户 ID"
            @change="handlePropertyChange"
          />
        </label>
        <label class="field">
          <span class="field-label">候选组</span>
          <input
            v-model="form.candidateGroups"
            class="field-input"
            placeholder="部门 A, 部门 B"
            @change="handlePropertyChange"
          />
        </label>
        <label class="field">
          <span class="field-label">候选人</span>
          <input
            v-model="form.candidateUsers"
            class="field-input"
            placeholder="user1, user2"
            @change="handlePropertyChange"
          />
        </label>
        <label class="field">
          <span class="field-label">表达式</span>
          <input
            v-model="form.expression"
            class="field-input"
            placeholder="${initiator}"
            @change="handlePropertyChange"
          />
        </label>
      </section>

      <section v-if="isServiceTask" class="property-group">
        <h4 class="group-title">服务实现</h4>
        <label class="field">
          <span class="field-label">Java 类</span>
          <input
            v-model="form.classValue"
            class="field-input"
            placeholder="com.example.MyDelegate"
            @change="handlePropertyChange"
          />
        </label>
        <label class="field">
          <span class="field-label">表达式</span>
          <input
            v-model="form.expression"
            class="field-input"
            placeholder="${myService.execute(execution)}"
            @change="handlePropertyChange"
          />
        </label>
        <label class="field">
          <span class="field-label">委托表达式</span>
          <input
            v-model="form.delegateExpression"
            class="field-input"
            placeholder="${myDelegate}"
            @change="handlePropertyChange"
          />
        </label>
      </section>

      <section v-if="isExclusiveGateway" class="property-group">
        <h4 class="group-title">排他网关</h4>
        <label class="field">
          <span class="field-label">默认条件表达式</span>
          <textarea
            v-model="form.conditionExpression"
            class="field-input"
            rows="2"
            placeholder="${amount > 1000}"
            @change="handlePropertyChange"
          />
        </label>
      </section>
    </div>
  </div>
</template>

<style scoped>
.bpmn-property-panel {
  padding: 16px;
  font-size: 13px;
  color: #303133;
}

.empty-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
}

.property-group {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.group-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.field-label {
  font-size: 12px;
  color: #606266;
}

.field-input {
  padding: 6px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
}

.field-input:focus {
  border-color: #409eff;
}

.field-input:disabled {
  background: #f5f7fa;
  color: #909399;
  cursor: default;
}
</style>
