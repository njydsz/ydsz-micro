/**
 * @ydsz/mock-service — Mock 数据工厂
 *
 * <p>基于 OpenAPI Schema 生成符合 YdszResponse<T> 包装结构的 Mock 数据，
 * 支持 object/数组/分页三种响应形态。
 *
 * @path comm/effects/mock-service/src/factory.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { faker } from '@faker-js/faker';
import type { MockFactoryOptions, MockSchema } from './types';

/** YdszResponse 成功码（与后端 YdszResultCode.SUCCESS 对齐） */
const SUCCESS_CODE = 'A00000';

/**
 * 根据 schema 的 format/type 生成单值
 */
function generateValueBySchema(schema: MockSchema): unknown {
  const type = String(schema.type ?? 'string');
  const format = schema.format ? String(schema.format) : '';
  const example = schema.example;

  if (example !== undefined && example !== null) {
    return example;
  }

  // 枚举优先
  const enumValues = schema.enum as unknown[] | undefined;
  if (Array.isArray(enumValues) && enumValues.length > 0) {
    return faker.helpers.arrayElement(enumValues);
  }

  switch (type) {
    case 'integer':
    case 'number': {
      if (format === 'int64') return faker.number.int({ min: 1, max: 9_999_999 });
      return faker.number.int({ min: 0, max: 1000 });
    }
    case 'boolean': {
      return faker.datatype.boolean();
    }
    case 'array': {
      const itemSchema = (schema.items ?? {}) as MockSchema;
      return Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () =>
        generateValueBySchema(itemSchema),
      );
    }
    case 'object': {
      return generateObject(schema);
    }
    default: {
      // string 及未知类型按 format 细分
      if (format === 'uuid') return faker.string.uuid();
      if (format === 'date-time') return faker.date.recent().toISOString();
      if (format === 'date') return faker.date.recent().toISOString().slice(0, 10);
      if (format === 'email') return faker.internet.email();
      return faker.lorem.word();
    }
  }
}

/**
 * 根据 schema 的 properties 生成对象
 */
function generateObject(schema: MockSchema): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const properties = (schema.properties ?? {}) as Record<string, MockSchema>;

  for (const [key, propSchema] of Object.entries(properties)) {
    // $ref 无法在静态解析下展开，跳过由上层兜底
    if (propSchema.$ref) {
      result[key] = faker.string.uuid();
      continue;
    }
    result[key] = generateValueBySchema(propSchema);
  }

  return result;
}

/**
 * 创建 Mock 数据工厂。
 *
 * 工厂按 OpenAPI Schema 的 `type` / `format` / `enum` / `example` 递归生成数据，
 * 使前端在后端接口未就绪时拿到的字段结构与真实契约一致，避免联调阶段返工。
 *
 * @param options 工厂配置；`listSize` 默认 10，决定 `generateList` 长度与
 *                分页响应的 total 基数；`seed` 非空时调用 `faker.seed()`
 *                固定随机序列，使同一份 schema 每次生成完全相同的数据
 * @returns 工厂实例，含 generateSuccessResponse / generateOne /
 *          generateList / generatePageResponse 四个方法
 *
 * @example
 * ```ts
 * const factory = createMockDataFactory({ listSize: 20, seed: 42 });
 * factory.generatePageResponse(userSchema, 1, 10);
 * ```
 *
 * @remarks
 * **已知边界**：`$ref` 引用不做展开，命中时退化为一个随机 uuid 字符串
 * （见 `generateObject`），因此含嵌套引用模型的 Mock 数据只保证结构存在、
 * 不保证嵌套字段真实。
 */
export function createMockDataFactory(options: MockFactoryOptions = {}) {
  const listSize = options.listSize ?? 10;

  // 固定种子保证可重复
  if (options.seed !== undefined) {
    faker.seed(options.seed);
  }

  return {
    /**
     * 生成 YdszResponse 成功响应体
     */
    generateSuccessResponse(data: unknown) {
      return {
        code: SUCCESS_CODE,
        msg: '操作成功',
        data,
        traceId: faker.string.uuid(),
        timestamp: Date.now(),
      };
    },

    /**
     * 按 schema 生成单个对象
     */
    generateOne(schema: MockSchema): Record<string, unknown> {
      if (schema.type === 'object' || schema.properties) {
        return generateObject(schema);
      }
      return { id: faker.string.uuid(), value: generateValueBySchema(schema) };
    },

    /**
     * 按 schema 生成对象列表
     */
    generateList(schema: MockSchema): Record<string, unknown>[] {
      return Array.from({ length: listSize }, () => this.generateOne(schema));
    },

    /**
     * 生成分页响应体（total/list/pageNum/pageSize）
     */
    generatePageResponse(schema: MockSchema, pageNum: number, pageSize: number) {
      const total = listSize * 3;
      const start = (pageNum - 1) * pageSize;
      const count = Math.max(0, Math.min(pageSize, total - start));
      const list = Array.from({ length: count }, () => this.generateOne(schema));

      return {
        code: SUCCESS_CODE,
        msg: '操作成功',
        data: {
          total,
          list,
          pageNum,
          pageSize,
        },
        traceId: faker.string.uuid(),
        timestamp: Date.now(),
      };
    },
  };
}

/**
 * Mock 数据工厂实例的类型。
 *
 * 由 `createMockDataFactory` 的返回值反推，而非手写接口：工厂内部方法
 * 之间用 `this.generateOne` 互相调用，手写接口既容易与实际实现漂移，
 * 也会丢失方法间的 this 绑定关系。
 *
 * 包含四个方法：
 * - `generateSuccessResponse(data)` —— 把任意数据包装成 `YdszResponse<T>`
 * - `generateOne(schema)` —— 按 schema 生成单个对象
 * - `generateList(schema)` —— 按 `listSize` 生成对象数组
 * - `generatePageResponse(schema, pageNum, pageSize)` —— 生成分页体
 *
 * @remarks
 * 工厂是无状态句柄（除 faker 全局种子），可安全复用；但固定种子的
 * `faker.seed()` 作用于全局，多个工厂实例并存时种子会互相干扰。
 */
export type MockDataFactory = ReturnType<typeof createMockDataFactory>;

export type { MockFactoryOptions, MockSchema };
