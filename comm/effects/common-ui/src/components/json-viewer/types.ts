/**
 * JSON 查看器组件的对外类型契约。
 *
 * 独立成文件的原因：Props 与三个自定义事件载荷会被业务方在 `defineProps`
 * / `defineEmits` 中显式引用，抽离后组件实现可替换（当前基于
 * vue-json-viewer 封装）而不破坏使用方的类型导入。
 *
 * @path comm\effects\common-ui\src\components\json-viewer\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** JSON 值类型（递归） */
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject { [key: string]: JsonValue }
type JsonArray = JsonValue[];

/**
 * JSON 查看器的入参。
 *
 * 整体是底层 vue-json-viewer 的收窄封装：只暴露展示与交互相关的开关，
 * 不暴露编辑能力，因此本组件定位为**只读**查看器。所有字段均为可选
 * （除 `value`），便于在日志、审计、调试面板等场景零配置接入。
 */
export interface JsonViewerProps {
  /** 要展示的结构数据；必须是可 JSON 序列化的值，含 undefined/函数/循环引用会导致渲染异常 */
  value: JsonValue;
  /** 初始展开深度，从 1 开始计数；默认 1（仅展开最外层）。设置过大在深层结构上会拖慢首屏 */
  expandDepth?: number;
  /** 是否在右上角显示复制按钮；默认 false。仅在 `previewMode` 为 false 时生效 */
  copyable?: boolean;
  /** 对象 key 是否按字典序重排；默认 false（保持后端返回的原始字段顺序） */
  sort?: boolean;
  /** 是否渲染外边框与浅色底；默认 false，用于与卡片背景融合 */
  boxed?: boolean;
  /** 配色主题标识，具体取值取决于底层主题类名的注册情况，如 `'light'` / `'dark'` */
  theme?: string;
  /** 是否默认全量展开所有层级；默认 false。与 `expandDepth` 同时存在时以全量展开为准 */
  expanded?: boolean;
  /** 时间格式化函数，用于把识别出的时间值渲染为可读文本；不传则原样输出 */
  timeformat?: (time: Date | number | string) => string;
  /** 预览模式：隐藏交互控件，仅做静态展示；默认 false */
  previewMode?: boolean;
  /** 数组是否显示下标前缀；默认 true，长数组场景可关闭以减少视觉噪声 */
  showArrayIndex?: boolean;
  /** 字符串值是否保留双引号；默认 true，关闭后更贴近普通文本阅读习惯 */
  showDoubleQuotes?: boolean;
}

/**
 * 复制完成（`copied`）事件的载荷，由底层 `vue-json-viewer` 透传。
 *
 * @remarks
 * 仅在 `copyable` 开启且复制成功后派发；复制失败不会触发该事件。
 */
export interface JsonViewerAction {
  /** 剪贴板动作类型，通常为 `'copy'` */
  action: string;
  /** 实际写入剪贴板的文本（序列化后的 JSON 字符串） */
  text: string;
  /** 触发复制的 DOM 元素，可用于定位提示气泡 */
  trigger: HTMLElement;
}

/**
 * 点击 JSON 值节点（`valueClick`）事件的载荷。
 *
 * @remarks
 * 组件通过事件委托从 DOM 的 `path` / `depth` 属性反解出节点信息，
 * 并对节点文本做 `JSON.parse`。因此：
 * - 只有点击到值节点（`.jv-item`）才会派发，点击 key 或空白区域不会；
 * - 若节点文本不是合法 JSON，`JSON.parse` 会抛错并中断本次事件派发。
 */
export interface JsonViewerValue {
  /** 解析后的节点值；文本无法解析时不会派发事件 */
  value: JsonValue;
  /** 该节点在 JSON 中的访问路径，如 `'data.list[0].id'`；取不到时为空字符串 */
  path: string;
  /** 节点所处的嵌套层级，根层为 0；取不到时兜底为 0 */
  depth: number;
  /** 被点击的 DOM 元素 */
  el: HTMLElement;
}

/**
 * 展开 / 收起节点（`toggle`）事件的载荷。
 */
export interface JsonViewerToggle {
  /** 触发展开或收起的鼠标事件 */
  event: MouseEvent;
  /** 切换后的展开状态：true 表示已展开 */
  open: boolean;
}
