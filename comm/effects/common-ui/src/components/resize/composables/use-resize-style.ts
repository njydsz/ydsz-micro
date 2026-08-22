/**
 * use-resize 样式映射常量
 *
 * 从 use-resize.ts 剥离的纯常量定义（云顶规范 §15.1：常量/配置数据单独组织）。
 * 无函数体与控制流，适用声明类文件豁免。
 *
 * @path comm/effects/common-ui/src/components/resize/composables/use-resize-style.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 拖拽手柄方位 → CSS 属性映射 */
export const styleMapping = {
  y: {
    t: 'top',
    m: 'marginTop',
    b: 'bottom',
  },
  x: {
    l: 'left',
    m: 'marginLeft',
    r: 'right',
  },
};
