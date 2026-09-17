/**
 * 共享工具函数统一导出入口，按功能分类聚合 utils 目录下的所有函数。
 *
 * @path comm\@core\base\shared\src\utils\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './cn';
export * from './date';
export * from './diff';
export * from './dom';
export * from './download';
export * from './inference';
export * from './letter';
export * from './logger';
export * from './merge';
export * from './nprogress';
export * from './resources';
export * from './state-handler';
export * from './to';
export * from './tree';
export * from './unique';
export * from './update-css-variables';
export * from './util';
export * from './window';
export { default as cloneDeep } from 'lodash.clonedeep';
export { default as get } from 'lodash.get';
export { default as isEqual } from 'lodash.isequal';
export { default as set } from 'lodash.set';
