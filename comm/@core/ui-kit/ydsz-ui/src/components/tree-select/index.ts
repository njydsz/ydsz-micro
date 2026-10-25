/**
 * TreeSelect 出口。
 *
 * <p>只保留一个实现：YdTreeSelect（options 驱动，层级展示 / 搜索 / 多选 / 键盘导航 / 虚拟滚动）。
 * 原并行实现 tree-select.vue 走 TreeNodeData(title) 数据契约且无任何调用方，已随本次收敛下线。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tree-select\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdTreeSelect } from './YdTreeSelect.vue';
export type { TreeSelectNode } from './YdTreeSelect.vue';
