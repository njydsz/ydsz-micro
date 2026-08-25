/**
 * validators 属性验证工具函数
 *
 * @path comm\effects\common-ui\src\components\resize\utils\validators.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { watch } from 'vue';

import { createLogger } from '@YDSZ-core/shared/utils';
const logger = createLogger('validators');
/**
 * 创建属性验证监听器
 * 设置所有属性的验证和自动修正逻辑
 *
 * @param props - 组件属性对象
 */
export function useValidation(props: {
  gridX: number;
  gridY: number;
  parentW: number;
  parentH: number;
  w: string | number;
  h: string | number;
  minw: number;
  minh: number;
  x: number;
  y: number;
  z: string | number;
  axis: string;
}) {
  watch(
    () => props.gridX,
    (val: number) => {
      if (val < 0) {
        logger.warn(
          `[resize] gridX prop 必须大于等于 0，当前值为 ${val}，已自动修正为 0。`,
        );
        props.gridX = 0;
      }
    },
    { immediate: true },
  );

  watch(
    () => props.gridY,
    (val: number) => {
      if (val < 0) {
        logger.warn(
          `[resize] gridY prop 必须大于等于 0，当前值为 ${val}，已自动修正为 0。`,
        );
        props.gridY = 0;
      }
    },
    { immediate: true },
  );

  watch(
    () => props.parentW,
    (val: number) => {
      if (val < 0) {
        logger.warn(
          `[resize] parentW prop 必须大于等于 0，当前值为 ${val}，已自动修正为 0。`,
        );
        props.parentW = 0;
      }
    },
    { immediate: true },
  );

  watch(
    () => props.parentH,
    (val: number) => {
      if (val < 0) {
        logger.warn(
          `[resize] parentH prop 必须大于等于 0，当前值为 ${val}，已自动修正为 0。`,
        );
        props.parentH = 0;
      }
    },
    { immediate: true },
  );

  watch(
    () => props.w,
    (val: string | number) => {
      if (typeof val === 'string' && val !== 'auto') {
        logger.warn(
          `[resize] w prop 为字符串时必须为 "auto"，当前值为 "${val}"，已自动修正为 "auto"。`,
        );
        props.w = 'auto';
      } else if (typeof val === 'number' && val < 0) {
        logger.warn(
          `[resize] w prop 为数字时必须大于等于 0，当前值为 ${val}，已自动修正为 0。`,
        );
        props.w = 0;
      }
    },
    { immediate: true },
  );

  watch(
    () => props.h,
    (val: string | number) => {
      if (typeof val === 'string' && val !== 'auto') {
        logger.warn(
          `[resize] h prop 为字符串时必须为 "auto"，当前值为 "${val}"，已自动修正为 "auto"。`,
        );
        props.h = 'auto';
      } else if (typeof val === 'number' && val < 0) {
        logger.warn(
          `[resize] h prop 为数字时必须大于等于 0，当前值为 ${val}，已自动修正为 0。`,
        );
        props.h = 0;
      }
    },
    { immediate: true },
  );

  watch(
    () => props.minw,
    (val: number) => {
      if (val < 0) {
        logger.warn(
          `[resize] minw prop 必须大于等于 0，当前值为 ${val}，已自动修正为 0。`,
        );
        props.minw = 0;
      }
    },
    { immediate: true },
  );

  watch(
    () => props.minh,
    (val: number) => {
      if (val < 0) {
        logger.warn(
          `[resize] minh prop 必须大于等于 0，当前值为 ${val}，已自动修正为 0。`,
        );
        props.minh = 0;
      }
    },
    { immediate: true },
  );

  watch(
    () => props.x,
    (val: number) => {
      if (typeof val !== 'number') {
        logger.warn(
          `[resize] x prop 必须为数字类型，当前值已自动修正为 0。`,
        );
        props.x = 0;
      }
    },
    { immediate: true },
  );

  watch(
    () => props.y,
    (val: number) => {
      if (typeof val !== 'number') {
        logger.warn(
          `[resize] y prop 必须为数字类型，当前值已自动修正为 0。`,
        );
        props.y = 0;
      }
    },
    { immediate: true },
  );

  watch(
    () => props.z,
    (val: string | number) => {
      if (typeof val === 'string' && val !== 'auto') {
        logger.warn(
          `[resize] z prop 为字符串时必须为 "auto"，当前值为 "${val}"，已自动修正为 "auto"。`,
        );
        props.z = 'auto';
      } else if (typeof val === 'number' && val < 0) {
        logger.warn(
          `[resize] z prop 为数字时必须大于等于 0，当前值为 ${val}，已自动修正为 0。`,
        );
        props.z = 0;
      }
    },
    { immediate: true },
  );

  watch(
    () => props.axis,
    (val: string) => {
      if (!['both', 'none', 'x', 'y'].includes(val)) {
        logger.warn(
          `[resize] axis prop 必须为 "both"、"none"、"x"、"y" 之一，当前值为 "${val}"，已自动修正为 "both"。`,
        );
        props.axis = 'both';
      }
    },
    { immediate: true },
  );
}
