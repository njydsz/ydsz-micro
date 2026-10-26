/**
 * BPMN 可视化设计器 API 适配器
 *
 * <p>封装 BPMN XML 获取（回显设计器画布）与部署（保存 + 发布）两个核心调用。
 * 对应后端 {@code FlowDefinitionController} + {@code FlowDesignerController} 的
 * 流程定义 BPMN 读写接口。
 *
 * <p>路径规范: /api/workflow/**（kebab-case），成功码统一为 code === 'A00000'。
 *
 * @path apps\workflow-web\src\api\bpmnDesigner.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';

/** BPMN XML 响应 DTO */
export interface BpmnXmlResponse {
  /** BPMN 2.0 XML 文本 */
  bpmnXml?: string;
  /** 流程定义 ID */
  id?: string;
  /** 流程编码 */
  flowCode?: string;
}

/**
 * 获取流程定义 BPMN XML（用于回显设计器画布）。
 *
 * <p>访问路径: GET /workflow/engine/definition/{id}/bpmnXml
 *
 * @param id - 流程定义 ID
 * @returns BPMN XML 响应
 */
export async function fetchBpmnXml(id: string): Promise<BpmnXmlResponse> {
  return requestClient.get<BpmnXmlResponse>(`/workflow/engine/definition/${id}/bpmnXml`);
}

/**
 * 部署 BPMN XML（验证 + 持久化 + 可选发布）。
 *
 * <p>访问路径: POST /workflow/engine/definition/deployBpmn
 *
 * @param xml - BPMN 2.0 XML 文本
 * @returns 部署结果（含流程定义 ID）
 */
export async function deployBpmnXml(xml: string): Promise<{ id: string }> {
  return requestClient.post<{ id: string }>(`/workflow/engine/definition/deployBpmn`, { bpmnXml: xml });
}

/**
 * 仅保存 BPMN XML（不发布）。
 *
 * <p>访问路径: POST /workflow/engine/definition/{id}/bpmnXml
 *
 * @param id - 流程定义 ID
 * @param xml - BPMN 2.0 XML 文本
 * @returns 保存后的流程定义 ID
 */
export async function saveBpmnXml(id: string, xml: string): Promise<{ id: string }> {
  return requestClient.post<{ id: string }>(`/workflow/engine/definition/${id}/bpmnXml`, { bpmnXml: xml });
}

/** bpmn-js Moddle 扩展元素描述（用于属性面板可选字段填充） */
export interface BpmnModdleElement {
  /** 元素类型名称（如 'camunda:ExecutionListener'） */
  name: string;
  /** 元素属性定义 */
  properties?: Array<{
    name: string;
    type: string;
    isAttr?: boolean;
    isBody?: boolean;
    isMany?: boolean;
    isId?: boolean;
    default?: string;
    redefines?: string;
    isReference?: boolean;
  }>;
  /** 子元素定义 */
  children?: BpmnModdleElement[];
  /** 超类类型 */
  superClass?: string[];
  /** 元数据 */
  meta?: Array<{ name: string; content?: string }>;
  redefines?: string;
}
