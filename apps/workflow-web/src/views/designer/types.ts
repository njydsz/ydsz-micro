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
