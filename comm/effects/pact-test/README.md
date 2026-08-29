# @ydsz/pact-test

Pact 消费者驱动契约测试工具，确保前后端契约一致性。

## 工作流程

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  前端消费者   │     │  Pact Broker │     │  后端 Provider │
│              │     │              │     │              │
│ 1. 编写契约  │────▶│ 2. 存储契约  │────▶│ 3. 验证履行  │
│    测试      │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

## 快速开始

### 1. 前端消费者测试

```typescript
// tests/pact/config.pact.test.ts
import { describe, it, expect } from 'vitest';
import {
  createPactFile,
  createPactInteraction,
} from '@ydsz/pact-test';

describe('Config API 契约', () => {
  it('生成 Config 模块 Pact 文件', () => {
    const pact = createPactFile('system-web', 'ydsz-system')
      .addInteraction(
        createPactInteraction('获取配置分页列表')
          .withRequest('GET', '/api/v1/config/page', {
            headers: { 'Content-Type': 'application/json' },
          })
          .withResponse(200, {
            code: 'A00000',
            msg: '操作成功',
            data: {
              list: [],
              total: 0,
              pageNum: 1,
              pageSize: 10,
            },
          })
          .build(),
      )
      .addInteraction(
        createPactInteraction('根据 ID 获取配置')
          .withRequest('GET', '/api/v1/config/{id}')
          .withResponse(200, {
            code: 'A00000',
            data: {
              id: 'test-id',
              configKey: 'site_name',
              configValue: 'YDSZ',
            },
          })
          .withProviderState('配置存在')
          .build(),
      )
      .build();

    // 写入 Pact 文件
    const fs = await import('node:fs');
    fs.writeFileSync(
      './pacts/system-web-ydsz-system.json',
      JSON.stringify(pact, null, 2),
    );

    expect(pact.interactions).toHaveLength(2);
  });
});
```

### 2. 后端 Provider 验证

```typescript
// 后端 CI 脚本
import { PactVerifier, PactLoader } from '@ydsz/pact-test/provider';

const pacts = PactLoader.loadFromDirectory('./pacts');
const verifier = new PactVerifier('http://localhost:9001', { verbose: true });

const result = await verifier.verifyPacts(pacts);

if (!result.success) {
  console.error('契约验证失败！');
  process.exit(1);
}
```

### 3. CI 集成

```yaml
# .github/workflows/pact-verify.yml
name: Pact 契约验证

on:
  push:
    branches: [main]

jobs:
  consumer:
    name: 生成消费者契约
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: 运行契约测试
        run: pnpm test:pact
      - name: 上传 Pact 文件
        uses: actions/upload-artifact@v4
        with:
          name: pacts
          path: pacts/

  provider:
    name: 验证 Provider 履行
    needs: consumer
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: 下载 Pact 文件
        uses: actions/download-artifact@v4
        with:
          name: pacts
          path: pacts/
      - name: 启动后端服务
        run: docker-compose up -d
      - name: 验证契约履行
        run: node scripts/verify-pacts.mjs
```

## API

### createPactInteraction(description)

创建 Pact 交互构建器。

### createPactFile(consumerName, providerName)

创建 Pact 文件构建器。

### PactLoader.loadFromFile(filePath)

从文件加载 Pact。

### PactVerifier.verifyPacts(pacts)

验证多个 Pact 文件。

## 文件结构

```
comm/effects/pact-test/
├── package.json
├── src/
│   ├── index.ts        # 主导出
│   ├── types.ts        # 类型定义
│   ├── pact-setup.ts   # 交互创建工具
│   └── provider.ts     # Provider 验证
└── README.md
```
