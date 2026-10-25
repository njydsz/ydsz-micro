/**
 * bpmn-js 相关模块类型兜底声明
 *
 * <p>为尚未安装类型包或发布版本中不含 .d.ts 的 MPM 模块提供最小化类型，
 * 避免 vue-tsc 报 TS2307「Cannot find module」。
 *
 * <p>业务代码如需精确类型，可在安装依赖后以更强的模块覆写替换本文件。
 *
 * @path apps\workflow-web\src\types\bpmn-js.d.ts
 * @author ydsz-team
 * @since 1.0.0
 */

declare module 'bpmn-js/lib/Modeler' {
  const Modeler: any;
  export default Modeler;
}

declare module 'bpmn-js/lib/model' {
  export type ModdleElement = any;
}

declare module 'bpmn-js-properties-panel' {
  const PropertiesPanelModule: any;
  export default PropertiesPanelModule;
}

declare module 'bpmn-js/dist/assets/diagram-js.css' {}
declare module 'bpmn-js/dist/assets/bpmn-js.css' {}
declare module 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css' {}
declare module '@bpmn-io/properties-panel/dist/assets/properties-panel.css' {}

declare module 'camunda-bpmn-moddle/resources/camunda.json' {
  const descriptor: Record<string, any>;
  export default descriptor;
}

declare module 'diagram-js' {
  export type EventBus = any;
}
