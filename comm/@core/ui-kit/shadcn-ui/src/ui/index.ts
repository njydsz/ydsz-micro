/**
 * ui 目录下全部组件目录的聚合出口，是 shadcn-ui 组件层的唯一登记处。
 *
 * 新增组件目录后必须在此登记，否则组件不会对外暴露 ——
 * 这是本目录最容易漏掉的一步，也是「组件写完了却引不到」的常见原因。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './accordion';
export * from './alert-dialog';
export * from './avatar';
export * from './badge';
export * from './breadcrumb';
export * from './button';
export * from './card';
export * from './checkbox';
export * from './dialog';
export * from './dropdown-menu';
export * from './form';
export * from './hover-card';
export * from './input';
export * from './label';
export * from './number-field';
export * from './pagination';
export * from './pin-input';
export * from './popover';
export * from './radio-group';
export * from './resizable';
export * from './scroll-area';
export * from './select';
export * from './separator';
export * from './sheet';
export * from './switch';
export * from './tabs';
export * from './textarea';
export * from './toggle';
export * from './toggle-group';
export * from './tooltip';
export * from './tree';
