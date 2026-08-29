# @ydsz/mock-service

MSW (Mock Service Worker) 统一 Mock 服务，提供类型安全的 API Mock 能力。

## 特性

- 基于 OpenAPI schema 自动生成 Mock 处理器
- 支持浏览器端（Service Worker）和 Node.js 端（测试）
- 内置 @faker-js/faker 数据工厂，支持种子模式
- 支持延迟模拟、错误场景模拟
- 零侵入，生产构建自动 tree-shaking 移除

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 在子应用中启用 Mock

```typescript
// apps/system-web/src/main.ts
import { setupMockServer, generateMockHandlers } from '@ydsz/mock-service';
import spec from './api/sdk/openapi.json';

// 开发环境且启用 Mock 时启动
if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true') {
  const handlers = generateMockHandlers(spec as any, {
    enableDelay: true,  // 模拟网络延迟
    listSize: 10,       // 列表默认长度
  });

  await setupMockServer(handlers);
}

// 正常启动应用
app.mount('#app');
```

### 3. 配置环境变量

```bash
# apps/system-web/.env.development
VITE_USE_MOCK=true
```

## API

### setupMockServer(handlers, options?)

初始化浏览器端 MSW Service Worker。

### setupMockWorker(handlers)

初始化 Node.js 端 MSW Server（用于测试）。

### generateMockHandlers(spec, options?)

从 OpenAPI spec 自动生成 MSW 处理器列表。

### createMockHandler(method, path, handler, options?)

手动创建单个 Mock 处理器。

### createCrudHandlers(basePath, options)

快速创建标准 CRUD Mock 处理器。

## 使用示例

### 自动生成（推荐）

```typescript
import spec from './api/sdk/openapi.json';
import { generateMockHandlers, setupMockServer } from '@ydsz/mock-service';

const handlers = generateMockHandlers(spec as any, {
  enableDelay: true,
  seed: 12345,        // 固定种子，可重复
  listSize: 5,
  overrides: {
    // 自定义特定接口的响应
    getConfigByKey: () => ({
      configKey: 'site_name',
      configValue: 'YDSZ Cloud',
    }),
  },
});

await setupMockServer(handlers);
```

### 手动定义

```typescript
import { createMockHandler, setupMockServer } from '@ydsz/mock-service';

const handlers = [
  createMockHandler('get', '/api/v1/config', () => ({
    code: 'A00000',
    data: [
      { id: '1', configKey: 'site_name', configValue: 'YDSZ' },
    ],
  })),
];

await setupMockServer(handlers);
```

### CRUD 快速生成

```typescript
import { faker } from '@faker-js/faker';
import { createCrudHandlers, setupMockServer } from '@ydsz/mock-service';

const handlers = createCrudHandlers('/api/v1/config', {
  generateItem: () => ({
    id: faker.string.uuid(),
    configKey: faker.commerce.productName(),
    configValue: faker.lorem.word(),
    status: 'ENABLED',
  }),
  listSize: 20,
  enableDelay: true,
});

await setupMockServer(handlers);
```

### 在测试中使用

```typescript
// tests/api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupMockWorker, closeMockWorker } from '@ydsz/mock-service';
import { createCrudHandlers } from '@ydsz/mock-service';

const handlers = createCrudHandlers('/api/v1/config', {
  generateItem: () => ({ id: '1', name: 'Test Config' }),
});

beforeAll(() => setupMockWorker(handlers));
afterAll(() => closeMockWorker());

it('should fetch config list', async () => {
  const res = await fetch('/api/v1/config');
  const data = await res.json();
  expect(data.code).toBe('A00000');
});
```

## 文件结构

```
comm/effects/mock-service/
├── package.json
├── src/
│   ├── index.ts      # 主导出
│   ├── types.ts      # 类型定义
│   ├── setup.ts      # MSW 初始化
│   ├── handlers.ts   # 处理器生成
│   └── factory.ts    # Mock 数据工厂
└── README.md
```

## 注意事项

1. MSW Service Worker 文件（`mockServiceWorker.js`）会在首次访问时自动注册
2. 生产环境请确保 `VITE_USE_MOCK` 不为 `true`，避免 Mock 代码进入生产构建
3. 使用固定种子（`seed`）可确保测试结果可重复
