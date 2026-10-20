/**
 * bpmn-js 扩展描述符与自定义属性 provider
 *
 * <p>提供：
 * <ul>
 *   <li>Camunda Moddle Extensions（来自 camunda-bpmn-moddle）：
 *       camunda:executionListener、camunda:taskListener、camunda:field、
 *       camunda:in/out、camunda:properties 等</li>
 *   <li>自定义属性 provider（扩展字段对齐云顶端点配置：办理人、表单、SLA、监听器）。</li>
 * </ul>
 *
 * <p>必须在 bpmn-canvas.vue 初始化 Modeler 前调用，否则属性面板无法识别除通用属性外的业务字段。
 *
 * @path apps\workflow-web\src\views\designer\bpmn-customizations.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import CamundaBpmnModdle from 'camunda-bpmn-moddle/resources/camunda.json';

/** 业务扩展字段 ID（由节点 property 承载，保存在 extensionElements 中） */
export const CUSTOM_EXTENSION_PREFIX = 'ydsz';

/** 业务扩展字段清单 */
export const BUSINESS_TABS = {
  /** 基础属性 */
  GENERAL: 'general',
  /** 办理人配置 */
  ASSIGNEE: 'assignee',
  /** 表单配置 */
  FORM: 'form',
  /** SLA 配置 */
  SLA: 'sla',
  /** 监听器配置 */
  LISTENER: 'listener',
} as const;

/** 获取 moddle 扩展描述符集合（传入 BpmnModeler 构造） */
export function getModdleExtensions(): Record<string, any> {
  return {
    camunda: CamundaBpmnModdle,
  };
}

/** 自定义属性 provider 数组（传递到 Modeler 的 additionalModules） */
export function getPropertiesProvider(): any[] {
  // bpmn-js-properties-panel 已涵盖 camunda 官方字段
  // 若后续需要自定义 provider，可在此追加并实现 PropertiesProvider 接口
  // 例：CustomPropertiesProvider 模块（关注 group/general、assignee、form、sla、listener）
  return [];
}

/**
 * 生成空的业务扩展元素引用。
 *
 * <p>用于节点新建时注入业务字段骨架，避免 bpmn-js-properties-panel 空值告警。
 */
export function createEmptyExtensionElement(): {
  $type: string;
  values: Array<{ $type: string; name: string; value: string }>;
} {
  return {
    $type: `${CUSTOM_EXTENSION_PREFIX}:CustomProperties`,
    values: [],
  };
}
