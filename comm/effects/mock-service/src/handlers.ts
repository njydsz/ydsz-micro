/**
 * @ydsz/mock-service — MSW 处理器生成
 *
 * <p>基于 OpenAPI schema 自动生成 MSW RequestHandler 列表，
 * 支持路径参数、查询参数、请求体的类型安全匹配。
 *
 * @path comm/effects/mock-service/src/handlers.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { faker } from '@faker-js/faker';
import { http, HttpResponse, delay } from 'msw';
import type { RequestHandler } from 'msw';
import { createMockDataFactory } from './factory';
import type { MockFactoryOptions } from './types';

/**
 * 处理器生成选项
 */
export interface HandlerGeneratorOptions extends MockFactoryOptions {
  /** 是否启用随机延迟（0-500ms） */
  enableDelay?: boolean;
  /** 基础路径前缀 */
  basePath?: string;
  /** 自定义路径处理器覆盖 */
  overrides?: Record<string, (params: unknown) => unknown>;
}

/**
 * 从 OpenAPI spec 生成 MSW 处理器列表
 *
 * <p>解析 OpenAPI paths 对象，为每个端点生成对应的 MSW handler。
 *
 * @param spec - OpenAPI spec 对象
 * @param options - 生成选项
 * @returns MSW RequestHandler 列表
 *
 * @example
 * ```ts
 * import spec from './sdk/openapi.json';
 * import { generateMockHandlers } from '@ydsz/mock-service';
 *
 * const handlers = generateMockHandlers(spec as any, {
 *   enableDelay: true,
 *   listSize: 5,
 * });
 * ```
 */
export function generateMockHandlers(
  spec: Record<string, unknown>,
  options: HandlerGeneratorOptions = {},
): RequestHandler[] {
  const factory = createMockDataFactory(options);
  const handlers: RequestHandler[] = [];
  const paths = (spec.paths || {}) as Record<string, Record<string, Record<string, unknown>>>;

  for (const [pathTemplate, pathItem] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
        continue;
      }

      const handler = createHandlerForOperation(
        pathTemplate,
        method,
        operation,
        factory,
        options,
      );

      if (handler) {
        handlers.push(handler);
      }
    }
  }

  return handlers;
}

/**
 * 为单个 OpenAPI 操作创建 MSW handler
 */
function createHandlerForOperation(
  pathTemplate: string,
  method: string,
  operation: Record<string, unknown>,
  factory: ReturnType<typeof createMockDataFactory>,
  options: HandlerGeneratorOptions,
): RequestHandler | null {
  // 转换 OpenAPI 路径模板为 MSW 路径格式
  // OpenAPI: /api/v1/config/{id} -> MSW: /api/v1/config/:id
  const mswPath = pathTemplate.replace(/\{([^}]+)\}/g, ':$1');

  // 解析响应 schema
  const responses = (operation.responses || {}) as Record<string, Record<string, unknown>>;
  const successResponse = responses['200'] || responses['201'];
  const responseSchema = successResponse?.content?.['application/json']?.schema as Record<string, unknown>;

  // 解析请求体 schema（用于 POST/PUT）
  const requestBody = operation.requestBody as Record<string, unknown> | undefined;
  const requestSchema = requestBody?.content?.['application/json']?.schema as Record<string, unknown> | undefined;

  // 构建 handler
  const httpMethod = http[method as keyof typeof http] as typeof http.get;

  return httpMethod(mswPath, async ({ request, params }) => {
    // 模拟延迟
    if (options.enableDelay) {
      await delay(faker.number.int({ min: 0, max: 500 }));
    }

    // 检查是否有自定义覆盖
    const operationId = operation.operationId as string;
    if (options.overrides?.[operationId]) {
      const customData = options.overrides[operationId]({ params, request });
      return HttpResponse.json(factory.generateSuccessResponse(customData));
    }

    // 根据操作类型生成响应
    const isWriteOperation = ['post', 'put', 'delete', 'patch'].includes(method);

    if (isWriteOperation) {
      // 写操作：返回成功消息
      const resultData = requestSchema
        ? factory.generateOne(requestSchema)
        : { id: faker.string.uuid(), success: true };

      return HttpResponse.json(factory.generateSuccessResponse(resultData));
    }

    // 读操作：判断是列表还是单个
    const isListOperation = operationId?.includes('list') || operationId?.includes('page');
    const isPageOperation = operationId?.includes('page');

    if (isPageOperation && responseSchema) {
      // 分页查询
      const dataSchema = unwrapDataSchema(responseSchema);
      const pageParams = new URL(request.url).searchParams;
      const pageNum = Number(pageParams.get('pageNum')) || 1;
      const pageSize = Number(pageParams.get('pageSize')) || 10;

      return HttpResponse.json(
        factory.generatePageResponse(dataSchema, pageNum, pageSize),
      );
    }

    if (isListOperation && responseSchema) {
      // 列表查询
      const dataSchema = unwrapDataSchema(responseSchema);
      return HttpResponse.json(factory.generateSuccessResponse(
        factory.generateList(dataSchema),
      ));
    }

    // 单个查询
    if (responseSchema) {
      const dataSchema = unwrapDataSchema(responseSchema);
      return HttpResponse.json(factory.generateSuccessResponse(
        factory.generateOne(dataSchema),
      ));
    }

    // 默认空响应
    return HttpResponse.json(factory.generateSuccessResponse(null));
  });
}

/**
 * 解包响应 schema（YdszResponse<T> -> T）
 */
function unwrapDataSchema(schema: Record<string, unknown>): Record<string, unknown> {
  // 处理 allOf
  if (schema.allOf) {
    const merged: Record<string, unknown> = {};
    for (const sub of schema.allOf as Record<string, unknown>[]) {
      Object.assign(merged, sub);
    }
    return merged;
  }

  // 处理 properties.data
  if (schema.properties?.data) {
    const dataSchema = schema.properties.data as Record<string, unknown>;

    // 处理 PageResponse<T> 的 data.list
    if (dataSchema.properties?.list) {
      const listSchema = dataSchema.properties.list as Record<string, unknown>;
      if (listSchema.items) {
        return listSchema.items as Record<string, unknown>;
      }
    }

    return dataSchema;
  }

  // 处理 items（数组）
  if (schema.items) {
    return schema.items as Record<string, unknown>;
  }

  return schema;
}

/**
 * 创建简单的 Mock 处理器（手动定义）
 *
 * <p>用于快速创建自定义 Mock，不需要完整的 OpenAPI spec。
 *
 * @example
 * ```ts
 * import { createMockHandler } from '@ydsz/mock-service';
 *
 * const handler = createMockHandler('get', '/api/v1/config', () => ({
 *   code: 'A00000',
 *   data: [{ id: '1', name: 'test' }],
 * }));
 * ```
 */
export function createMockHandler(
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  path: string,
  handler: (params: { params: Record<string, string>; request: Request }) => unknown,
  options: { delay?: number; status?: number } = {},
): RequestHandler {
  const mswPath = path.replace(/\{([^}]+)\}/g, ':$1');
  const httpMethod = http[method as keyof typeof http] as typeof http.get;

  return httpMethod(mswPath, async ({ request, params }) => {
    if (options.delay) {
      await delay(options.delay);
    }

    const data = handler({ params: params as Record<string, string>, request });
    return HttpResponse.json(data, { status: options.status ?? 200 });
  });
}

/**
 * 创建 CRUD Mock 处理器集
 *
 * <p>为资源快速生成标准的 CRUD Mock 处理器。
 *
 * @example
 * ```ts
 * import { createCrudHandlers } from '@ydsz/mock-service';
 *
 * const handlers = createCrudHandlers('/api/v1/config', {
 *   generateItem: () => ({ id: faker.string.uuid(), name: faker.commerce.productName() }),
 *   listSize: 10,
 * });
 * ```
 */
export function createCrudHandlers(
  basePath: string,
  options: {
    generateItem: () => Record<string, unknown>;
    listSize?: number;
    enableDelay?: boolean;
  },
): RequestHandler[] {
  const factory = createMockDataFactory({ listSize: options.listSize });
  const items: Record<string, unknown>[] = [];

  // 初始化数据
  for (let i = 0; i < (options.listSize ?? 10); i++) {
    items.push(options.generateItem());
  }

  return [
    // 列表查询
    http.get(basePath, async () => {
      if (options.enableDelay) await delay(faker.number.int({ min: 0, max: 300 }));
      return HttpResponse.json(factory.generateSuccessResponse(items));
    }),

    // 分页查询
    http.get(`${basePath}/page`, async ({ request }) => {
      if (options.enableDelay) await delay(faker.number.int({ min: 0, max: 300 }));
      const url = new URL(request.url);
      const pageNum = Number(url.searchParams.get('pageNum')) || 1;
      const pageSize = Number(url.searchParams.get('pageSize')) || 10;

      return HttpResponse.json(
        factory.generatePageResponse({ type: 'object', properties: {} }, pageNum, pageSize),
      );
    }),

    // 单个查询
    http.get(`${basePath}/:id`, async ({ params }) => {
      if (options.enableDelay) await delay(faker.number.int({ min: 0, max: 200 }));
      const { id } = params;
      const item = items.find(i => i.id === id) ?? options.generateItem();
      return HttpResponse.json(factory.generateSuccessResponse(item));
    }),

    // 创建
    http.post(basePath, async ({ request }) => {
      if (options.enableDelay) await delay(faker.number.int({ min: 0, max: 500 }));
      const body = await request.json() as Record<string, unknown>;
      const newItem = { ...body, id: faker.string.uuid() };
      items.push(newItem);
      return HttpResponse.json(factory.generateSuccessResponse(newItem));
    }),

    // 更新
    http.put(`${basePath}/:id`, async ({ params, request }) => {
      if (options.enableDelay) await delay(faker.number.int({ min: 0, max: 500 }));
      const { id } = params;
      const body = await request.json() as Record<string, unknown>;
      const index = items.findIndex(i => i.id === id);
      if (index >= 0) {
        items[index] = { ...items[index], ...body };
      }
      return HttpResponse.json(factory.generateSuccessResponse(items[index] ?? body));
    }),

    // 删除
    http.delete(`${basePath}/:id`, async ({ params }) => {
      if (options.enableDelay) await delay(faker.number.int({ min: 0, max: 300 }));
      const { id } = params;
      const index = items.findIndex(i => i.id === id);
      if (index >= 0) {
        items.splice(index, 1);
      }
      return HttpResponse.json(factory.generateSuccessResponse(true));
    }),
  ];
}
