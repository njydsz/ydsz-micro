# BFF 层（Backend For Frontend）设计方案

> **版本**：v1.0.0  
> **适用范围**：ydsz-micro 前端项目  
> **日期**：2026-08-30  
> **状态**：试点阶段（Dashboard）

---

## 1. 背景与目标

### 1.1 当前问题

前端直接调用后端微服务接口，存在以下问题：

1. **接口聚合**：Dashboard 等复杂页面需要调用多个接口组装数据
2. **数据冗余**：后端返回全量字段，前端只需部分字段
3. **请求次数**：单个页面发起多个请求，增加网络开销
4. **缓存分散**：各接口独立缓存，无法统一优化

### 1.2 BFF 层价值

1. **接口聚合**：将多个后端接口聚合为一个，减少前端请求数
2. **数据裁剪**：只返回前端需要的字段，减少传输体积
3. **统一缓存**：BFF 层统一缓存策略，提高命中率
4. **协议转换**：gRPC/内部协议 → HTTP/JSON，降低前端复杂度

---

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端应用                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ system  │  │ userinfo│  │workflow │  │  agent  │  ...   │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
│       └────────────┴────────────┴────────────┘              │
│                          │                                   │
│                    API Gateway                              │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      BFF 层（Node.js）                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  接口聚合  │  数据裁剪  │  缓存策略  │  错误处理      │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     后端微服务集群                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ system  │  │ userinfo│  │workflow │  │  agent  │  ...   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术选型

| 层级            | 技术选型              | 说明                       |
| --------------- | --------------------- | -------------------------- |
| **运行时**      | Node.js 22            | 与前端技术栈一致，便于复用 |
| **框架**        | Hono / Fastify        | 轻量级高性能框架           |
| **缓存**        | Redis（通过 ioredis） | 复用现有 Redis 基础设施    |
| **HTTP 客户端** | undici                | Node.js 原生高性能客户端   |
| **监控**        | @ydsz/monitor         | 复用现有监控模块           |

---

## 3. Dashboard BFF 接口设计

### 3.1 Dashboard 聚合接口

#### 3.1.1 GET /api/v1/bff/dashboard/overview

**功能**：获取 Dashboard 概览数据（聚合多个后端接口）

**请求参数**：无

**响应结构**：

```typescript
interface DashboardOverviewResponse {
  /** 租户统计 */
  tenantStats: {
    total: number;
    active: number;
    expired: number;
  };
  /** 用户统计 */
  userStats: {
    total: number;
    newToday: number;
    activeToday: number;
  };
  /** 工作流统计 */
  workflowStats: {
    total: number;
    running: number;
    completed: number;
    failed: number;
  };
  /** 系统健康状态 */
  systemHealth: {
    cpu: number;
    memory: number;
    disk: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  /** 最近活动 */
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    userId: string;
    userName: string;
  }>;
}
```

#### 3.1.2 GET /api/v1/bff/dashboard/charts/:chartType

**功能**：获取图表数据（按类型）

**请求参数**：

| 参数      | 类型   | 必填 | 说明                                                    |
| --------- | ------ | ---- | ------------------------------------------------------- |
| chartType | string | 是   | 图表类型（user-growth / workflow-trend / system-usage） |
| dateRange | string | 否   | 日期范围（7d / 30d / 90d）                              |

**响应结构**：

```typescript
interface ChartDataResponse {
  chartType: string;
  dateRange: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}
```

---

## 4. 缓存策略

### 4.1 多级缓存

```
请求 → L1 内存缓存（LRU，5min TTL）
         ↓ miss
       L2 Redis 缓存（15min TTL）
         ↓ miss
       L3 后端微服务（回源 + 回写缓存）
```

### 4.2 缓存 Key 规范

```
bff:{service}:{endpoint}:{hash(params)}
```

示例：

```
bff:dashboard:overview:anonymous
bff:dashboard:charts:user-growth:7d
```

### 4.3 缓存失效策略

| 数据类型 | TTL     | 失效策略            |
| -------- | ------- | ------------------- |
| 统计数据 | 5 分钟  | 时间过期 + 主动失效 |
| 图表数据 | 15 分钟 | 时间过期            |
| 活动列表 | 1 分钟  | 时间过期            |
| 配置数据 | 30 分钟 | 时间过期 + 主动失效 |

---

## 5. 错误处理

### 5.1 降级策略

当部分后端接口不可用时，BFF 层返回降级数据而不是直接报错：

```typescript
// 降级数据示例
const FALLBACK_DATA = {
  tenantStats: { total: 0, active: 0, expired: 0 },
  userStats: { total: 0, newToday: 0, activeToday: 0 },
  // ...
};
```

### 5.2 错误响应格式

```typescript
interface BffError {
  code: string;
  message: string;
  partial?: boolean; // 是否部分成功
  data?: unknown; // 部分成功时的可用数据
}
```

---

## 6. 实施计划

### 6.1 试点阶段（2 周）

1. 搭建 BFF 层基础框架
2. 实现 Dashboard 概览接口
3. 实现图表数据接口
4. 前端对接 BFF 接口
5. 性能测试与优化

### 6.2 推广阶段（1 个月）

1. 梳理各子应用聚合需求
2. 逐步迁移至 BFF 接口
3. 建立 BFF 接口规范
4. 监控与告警

---

## 7. 监控与告警

### 7.1 关键指标

| 指标           | 阈值        | 告警级别 |
| -------------- | ----------- | -------- |
| 接口响应时间   | P99 > 500ms | Warning  |
| 接口错误率     | > 1%        | Critical |
| 缓存命中率     | < 80%       | Warning  |
| 后端依赖可用性 | < 99%       | Critical |

### 7.2 日志格式

```json
{
  "timestamp": "2026-08-30T10:00:00.000Z",
  "level": "info",
  "message": "Dashboard overview fetched",
  "traceId": "abc-123",
  "duration": 156,
  "cache": "L1_HIT",
  "services": ["system", "userinfo", "workflow"]
}
```

---

## 8. 安全规范

### 8.1 认证与授权

1. BFF 层复用现有 JWT 认证机制
2. 请求携带 Authorization 头，BFF 层透传至后端
3. 敏感数据在 BFF 层脱敏处理

### 8.2 限流策略

```typescript
// 基于用户 ID 的限流
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 分钟
  max: 100, // 每分钟最多 100 次
};
```

---

## 9. 目录结构

```
bff/
├── src/
│   ├── index.ts              # 入口文件
│   ├── config.ts             # 配置文件
│   ├── middleware/
│   │   ├── auth.ts           # 认证中间件
│   │   ├── cache.ts          # 缓存中间件
│   │   ├── rate-limit.ts     # 限流中间件
│   │   └── error-handler.ts  # 错误处理中间件
│   ├── routes/
│   │   ├── dashboard.ts      # Dashboard 路由
│   │   └── index.ts          # 路由聚合
│   ├── services/
│   │   ├── dashboard.service.ts  # Dashboard 业务逻辑
│   │   └── backend.service.ts    # 后端接口调用
│   ├── cache/
│   │   ├── l1-cache.ts       # L1 内存缓存
│   │   └── l2-cache.ts       # L2 Redis 缓存
│   └── types/
│       └── dashboard.ts      # Dashboard 类型定义
├── package.json
├── tsconfig.json
└── README.md
```

---

## 10. 总结

BFF 层是前后端协作的重要桥梁，通过接口聚合、数据裁剪、统一缓存等能力，显著提升前端性能和用户体验。本方案以 Dashboard 为试点，验证 BFF 层的价值后逐步推广至全量页面。

---

> **文档维护**：本方案由 ydsz-team 负责，如有疑问请提交 Issue。
