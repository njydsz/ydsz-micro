/**
 * 「关于」页/对话框的展示模型类型。
 *
 * 与 Vue 实现分离的目的：各应用只需按这些类型组装数据即可渲染关于信息，
 * 不必依赖具体组件，因此可以套用各自的皮肤与布局。
 *
 * @path comm\effects\common-ui\src\ui\about\about.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Component } from 'vue';

/**
 * 「关于」页的整体入参。
 *
 * 三个字段全部可选，未传时由组件自行回退到产品名/版本号等内置文案，
 * 使最小用法 `<About />` 即可工作。
 */
interface AboutProps {
  /** 产品描述，展示在产品名称下方的补充说明 */
  description?: string;
  /** 产品名称（如「云顶调度平台」） */
  name?: string;
  /** 弹窗或页面标题 */
  title?: string;
}

/** 关于页中的一行描述信息（如版本号、构建时间、开源许可） */
interface DescriptionItem {
  /** 该行的值；传 Component 可渲染复杂内容（如链接、徽章） */
  content: Component | string;
  /** 该行的标签文案 */
  title: string;
}

export type { AboutProps, DescriptionItem };
