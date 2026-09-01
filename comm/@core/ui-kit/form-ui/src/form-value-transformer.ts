/**
 * 表单值转换器：在提交前对值做归一化，抹平表单结构与后端契约的差异。
 *
 * 负责三类转换：范围时间字段拆分为开始 / 结束两个键、数组与字符串按配置互转、
 * 以及按 fieldMappingTime 声明的格式对时间值做格式化。
 * 转换集中在门面层完成，让业务拿到的始终是与接口一致的结构，
 * 而不必在每个提交处各写一遍扁平化与格式化逻辑。
 *
 * 范围字段为空时会主动删除对应的起止键，避免把 null 一并提交覆盖服务端已有值。
 *
 * @path comm\@core\ui-kit\form-ui\src\form-value-transformer.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { formatDate, isFunction } from '@YDSZ-core/shared/utils';

import type { YDSZFormProps } from './types';

import { createLogger } from '@YDSZ-core/shared/utils';
const logger = createLogger('form-value-transformer');
/**
 * 表单值转换器
 * @description 负责表单值的格式转换，包括范围时间值处理、数组与字符串互转等
 */
export class FormValueTransformer {
  private getState: () => null | YDSZFormProps;

  constructor(getState: () => null | YDSZFormProps) {
    this.getState = getState;
  }

  /**
   * 处理范围时间值，将范围字段拆分为开始和结束时间
   * @param originValues 原始表单值
   * @returns 处理后的表单值
   */
  handleRangeTimeValue(originValues: Record<string, unknown>) {
    const values = { ...originValues };
    const fieldMappingTime = this.getState()?.fieldMappingTime;

    this.handleStringToArrayFields(values);

    if (!fieldMappingTime || !Array.isArray(fieldMappingTime)) {
      return values;
    }

    fieldMappingTime.forEach(
      ([field, [startTimeKey, endTimeKey], format = 'YYYY-MM-DD']) => {
        if (startTimeKey && endTimeKey && values[field] === null) {
          Reflect.deleteProperty(values, startTimeKey);
          Reflect.deleteProperty(values, endTimeKey);
        }

        if (!values[field]) {
          Reflect.deleteProperty(values, field);
          return;
        }

        const [startTime, endTime] = values[field] as unknown[];
        if (format === null) {
          values[startTimeKey] = startTime;
          values[endTimeKey] = endTime;
        } else if (isFunction(format)) {
          values[startTimeKey] = format(startTime, startTimeKey);
          values[endTimeKey] = format(endTime, endTimeKey);
        } else {
          const [startTimeFormat, endTimeFormat] = Array.isArray(format)
            ? format
            : [format, format];

          values[startTimeKey] = startTime
            ? formatDate(startTime as string, startTimeFormat)
            : undefined;
          values[endTimeKey] = endTime
            ? formatDate(endTime as string, endTimeFormat)
            : undefined;
        }
        Reflect.deleteProperty(values, field);
      },
    );
    return values;
  }

  /**
   * 将数组字段转换为字符串
   * @param originValues 原始表单值
   */
  handleArrayToStringFields(originValues: Record<string, unknown>) {
    const arrayToStringFields = this.getState()?.arrayToStringFields;
    if (!arrayToStringFields || !Array.isArray(arrayToStringFields)) {
      return;
    }

    const processFields = (fields: string[], separator: string = ',') => {
      this.processFields(fields, separator, originValues, (value, sep) =>
        Array.isArray(value) ? value.join(sep) : value,
      );
    };

    if (arrayToStringFields.every((item) => typeof item === 'string')) {
      const lastItem =
        arrayToStringFields[arrayToStringFields.length - 1] || '';
      const fields =
        lastItem.length === 1
          ? arrayToStringFields.slice(0, -1)
          : arrayToStringFields;
      const separator = lastItem.length === 1 ? lastItem : ',';
      processFields(fields, separator);
      return;
    }

    arrayToStringFields.forEach((fieldConfig) => {
      if (Array.isArray(fieldConfig)) {
        const [fields, separator = ','] = fieldConfig;
        if (!Array.isArray(fields)) {
          logger.warn(
            `Invalid field configuration: fields should be an array of strings, got ${typeof fields}`,
          );
          return;
        }
        processFields(fields, separator);
      }
    });
  }

  /**
   * 将字符串字段转换为数组
   * @param originValues 原始表单值
   */
  handleStringToArrayFields(originValues: Record<string, unknown>) {
    const arrayToStringFields = this.getState()?.arrayToStringFields;
    if (!arrayToStringFields || !Array.isArray(arrayToStringFields)) {
      return;
    }

    const processFields = (fields: string[], separator: string = ',') => {
      this.processFields(fields, separator, originValues, (value, sep) => {
        if (typeof value !== 'string') {
          return value;
        }
        if (value === '') {
          return [];
        }
        const escapedSeparator = sep.replaceAll(
          /[.*+?^${}()|[\]\\]/g,
          String.raw`\$&`,
        );
        return value.split(new RegExp(escapedSeparator));
      });
    };

    if (arrayToStringFields.every((item) => typeof item === 'string')) {
      const lastItem =
        arrayToStringFields[arrayToStringFields.length - 1] || '';
      const fields =
        lastItem.length === 1
          ? arrayToStringFields.slice(0, -1)
          : arrayToStringFields;
      const separator = lastItem.length === 1 ? lastItem : ',';
      processFields(fields, separator);
      return;
    }

    arrayToStringFields.forEach((fieldConfig) => {
      if (Array.isArray(fieldConfig)) {
        const [fields, separator = ','] = fieldConfig;
        if (Array.isArray(fields)) {
          processFields(fields, separator);
        } else if (typeof originValues[fields] === 'string') {
          const value = originValues[fields];
          if (value === '') {
            originValues[fields] = [];
          } else {
            const escapedSeparator = separator.replaceAll(
              /[.*+?^${}()|[\]\\]/g,
              String.raw`\$&`,
            );
            originValues[fields] = value.split(new RegExp(escapedSeparator));
          }
        }
      }
    });
  }

  /**
   * 通用字段处理方法
   * @param fields 字段名列表
   * @param separator 分隔符
   * @param originValues 原始表单值
   * @param transformFn 转换函数
   */
  private processFields(
    fields: string[],
    separator: string,
    originValues: Record<string, unknown>,
    transformFn: (value: unknown, separator: string) => unknown,
  ) {
    fields.forEach((field) => {
      const value = originValues[field];
      if (value === undefined || value === null) {
        return;
      }
      originValues[field] = transformFn(value, separator);
    });
  }
}

