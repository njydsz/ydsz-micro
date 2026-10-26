/**
 * 流程设计器类型定义
 *
 * <p>定义设计器组件间共享的 TypeScript 类型。
 *
 * @path apps\workflow-web\src\views\designer\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 节点类型枚举 */
export enum DesignerNodeType {
  /** 开始节点 */
  START = 'start',
  /** 结束节点 */
  END = 'end',
  /** 审批节点 */
  APPROVE = 'approve',
  /** 服务节点 */
  SERVICE = 'service',
  /** 条件节点 */
  CONDITION = 'condition',
  /** 子流程节点 */
  SUB_PROCESS = 'sub_process',
  /** AI 审批节点 */
  AI_AGENT = 'ai_agent',
}

/** 节点配置 */
export interface DesignerNodeConfig {
  /** 节点编码 */
  nodeCode?: string;
  /** 节点名称 */
  nodeName?: string;
  /** 办理人类型 */
  assigneeType?: string;
  /** 办理人值 */
  assigneeValue?: string;
  /** 表单配置 JSON */
  formConfig?: string;
  /** SLA 配置 JSON */
  slaConfig?: string;
  /** 监听器配置 */
  listenerConfig?: string;
  /** 服务节点 URL */
  serviceUrl?: string;
  /** 条件表达式 */
  conditionExpr?: string;
  /** AI Agent ID */
  agentId?: string;
  /** AI Agent 提示词模板 */
  promptTemplate?: string;
  /** AI Agent 输出 JSON Schema */
  outputSchema?: string;
  /** AI Agent 兜底策略 */
  fallbackStrategy?: string;
  /** AI Agent 最大重试次数 */
  retryMax?: number;
  /** AI Agent 超时毫秒 */
  timeoutMs?: number;
  /** 驳回策略 */
  rejectStrategy?: string;
  /** 允许的驳回策略列表 */
  allowedStrategies?: string[];
  /** 驳回后重执行模式 */
  reExecuteMode?: string;
  /** 自定义驳回目标节点 */
  customTarget?: string;
  /** 催办通道列表 */
  urgeChannels?: string[];
  /** 催办间隔分钟数 */
  urgeIntervalMinutes?: number;
  /** 最大催办次数 */
  urgeMaxCount?: number;
  /** 是否启用催办 */
  urgeEnabled?: boolean;
}

/** 设计器状态 */
export interface DesignerState {
  /** 当前选中的节点 ID */
  selectedNodeId: string;
  /** 当前选中节点的配置 */
  nodeConfig: DesignerNodeConfig | null;
}

/** 节点面板项 */
export interface PaletteItem {
  /** 节点类型 */
  type: DesignerNodeType;
  /** 显示标签 */
  label: string;
  /** 图标 */
  icon: string;
  /** 节点默认宽度 */
  width: number;
  /** 节点默认高度 */
  height: number;
  /** 节点默认配置 */
  defaultConfig?: Partial<DesignerNodeConfig>;
}

/**
 * LogicFlow 图节点结构（裁剪业务所需的最小字段集）。
 *
 * 用于画布对齐/分布操作中对节点坐标和尺寸的只读访问。
 *
 * @since 4.4.1
 */
export interface LfGraphNode {
  id: string;
  isSelected: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  type?: string;
  text?: string;
}

// =====================================================================
// bpmn-js 类型面
// --------------------------------------------------------------------
// bpmn-js 17 自带的 `ModdleElement` / `businessObject` 实际声明为 `any`
// （见 bpmn-js/lib/model/Types.d.ts），对业务代码没有约束力；
// 这里按设计器真实读写的字段显式收窄，避免各处散落 `as any`。
// 官方 didi 的 ModuleDeclaration 未随包导出，故注入模块用本地形状描述。
// =====================================================================

/** bpmn-js moddle 业务对象（属性面板读写用到的字段子集） */
export interface BpmnBusinessObject {
  /** 元素 ID（bpmn:id） */
  id?: string;
  /** 元素名称 */
  name?: string;
  /** moddle 类型名，形如 `bpmn:UserTask` */
  $type?: string;
  /** 非结构化扩展属性（camunda:* 等命名空间属性落在此处） */
  $attrs?: Record<string, unknown>;
  /** 父元素业务对象（sequenceFlow 的条件表达式挂载点之一） */
  $parent?: BpmnBusinessObject;
  /** 文档注释元素集合 */
  documentation?: Array<{ text?: string }>;
  /** 条件表达式（bpmn:FormalExpression） */
  conditionExpression?: { body?: string };
  /** 是否为补偿事件 */
  isForCompensation?: boolean;
  [key: string]: unknown;
}

/** 画布元素描述符：selectionChange 事件负载与属性面板入参共用 */
export interface BpmnElementDescriptor {
  id: string;
  type: string;
  businessObject?: BpmnBusinessObject | null;
}

/** 属性变更负载（modeling.updateProperties 第二参） */
export type BpmnPropertyChanges = Record<string, unknown>;

/** bpmn-js 注入模块描述符（additionalModules 数组元素） */
export type BpmnModule = Record<string, unknown>;

/** moddle 扩展描述符集合（moddleExtensions 选项） */
export type BpmnModdleExtensions = Record<string, unknown>;

/** `selection.changed` 事件负载 */
export interface BpmnSelectionChangedEvent {
  newSelection: BpmnElementDescriptor[];
  added: BpmnElementDescriptor[];
  removed: BpmnElementDescriptor[];
}

/** diagram-js EventBus（仅声明设计器用到的订阅签名） */
export interface BpmnEventBus {
  on(
    event: 'selection.changed',
    callback: (payload: BpmnSelectionChangedEvent) => void,
  ): void;
}

/** diagram-js Selection 服务 */
export interface BpmnSelectionService {
  get(): BpmnElementDescriptor[];
}

/** diagram-js Canvas 服务 */
export interface BpmnCanvasService {
  zoom(scale: 'fit-viewport' | number): void;
}

/** diagram-js ElementRegistry 服务 */
export interface BpmnElementRegistryService {
  get(id: string): BpmnElementDescriptor | undefined;
}

/** diagram-js CommandStack 服务 */
export interface BpmnCommandStackService {
  undo(): void;
  redo(): void;
}

/** bpmn-js Modeling 服务 */
export interface BpmnModelingService {
  updateProperties(
    element: BpmnElementDescriptor,
    properties: BpmnPropertyChanges,
  ): void;
}
