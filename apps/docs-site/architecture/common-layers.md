# ydsz-common 六层分级体系

ydsz-common 包含 28 个子模块，按能力划分为 L1~L6 六个层级。依赖方向必须严格从上往下（高层→低层），严禁反向依赖（YDIZ-ARCH-001）。

## 层级总览

| 层级 | 定位 | 数量 | 子模块清单 | 依赖约束 |
|------|------|------|-----------|----------|
| **L1 工具层** | 零外部依赖工具库 | 4 | `json` `util` `cache` `excel` | 禁止依赖业务模块/Spring/L3+ |
| **L2 核心响应** | 统一响应/分页/TraceId | 1 | `core` | 仅依赖 L1 |
| **L3 领域基类** | DDD 基类/异常体系 | 2 | `domain` `exception` | 仅依赖 L1-L2 |
| **L4 数据基础** | 持久化增强 | 5 | `jdbc` `redis` `lock` `thread` `tenant` | 仅依赖 L1-L3 |
| **L5 业务服务** | 安全/认证/消息/事务/可观测 | 15 | `auth` `safe` `feign` `audit` `notify` `queue` `event` `config` `socket` `netty` `file` `docs` `search` `sentry` `seata` | 可依赖 L1-L4 |
| **L6 应用基座** | Web/App 启动基类 | 3 | `base` `app` `web` | 可依赖全部 |

## 反向依赖判断方法

```
模块 A（La）引用模块 B（Lb）时，必须满足 La 层号 ≤ Lb 层号。
La > Lb 即为反向依赖，属于违规。
```

## 核心约束

### 1. L1 工具纯度

L1 模块必须零内部依赖。例如 ydzs-common-cache（L1）禁止依赖 ydzs-common-thread（L4）。

```java
// ❌ 违规：L1 → L4 反向依赖
package com.njydsz.common.cache.support;
import com.njydsz.common.thread.util.ExecutorUtils;

// ✅ 正确：L1 自行用 JDK API
import java.util.concurrent.ThreadPoolExecutor;
```

### 2. 禁止跨级反向依赖

即使跨多层（如 L1 → L4）同样违规。依赖关系必须在 pom.xml 中显式声明（import 某模块的类则该模块必须出现在本模块 pom.xml 中）。

### 3. 层级守护机制

- L1 纯度由 `enforce-l1-purity` Maven Enforce 规则守护
- L2-L6 依赖方向由 ArchUnit 测试落地（YDIZ-ARCH-001）

## 完整子模块清单

```mermaid
graph TB
    L6[ydsz-common: L6 应用基座] --> L5
    L5[ydsz-common: L5 业务服务] --> L4
    L4[ydsz-common: L4 数据基础] --> L3
    L3[ydsz-common: L3 领域基类] --> L2
    L2[ydsz-common: L2 核心响应] --> L1[ydsz-common: L1 工具层]

    L1 --> L1 Modules:<br/>json / util / cache / excel
    L2 --> L2 Modules:<br/>core
    L3 --> L3 Modules:<br/>domain / exception
    L4 --> L4 Modules:<br/>jdbc / redis / lock / thread / tenant
    L5 --> L5 Modules:<br/>auth / safe / feign / audit / notify /<br/>queue / event / config / socket / netty /<br/>file / docs / search / sentry / seata
    L6 --> L6 Modules:<br/>base / app / web
```
