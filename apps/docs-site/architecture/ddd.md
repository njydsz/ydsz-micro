# DDD 分层设计

YDSZ 每个业务模块遵循领域驱动设计（DDD）的模块化分层规范，以确保依赖方向正确、职责边界清晰。

## 模块命名规则

每个业务模块遵循 `{module}-{layer}` 的四层命名：

| 层 | 命名 | 职责 | 关键技术 |
|----|------|------|----------|
| **API 层** | `{module}-api` | 纯契约层：FeignClient 接口 + Assembler + fallback | Spring Cloud OpenFeign |
| **领域层** | `{module}-domain` | DTO/Query/VO/Entity/枚举/Repository 接口/DomainService/Converter | MapStruct (compile-only) |
| **基础设施层** | `{module}-infra` | Repository 实现、Mapper、Entity PO、Converter 实现 | MyBatis Plus |
| **业务编排层** | `{module}-server` / `{module}-web` | 业务编排、Controller、定时任务、事件监听 | Spring Boot Web |

## 依赖方向（必须遵守）

```
        ┌──────────────────────────────────┐
        │         web / server             │  ← 业务编排层
        │  (Controller / Application)      │
        └──────────────┬───────────────────┘
                       │ 引入
        ┌──────────────▼───────────────────┐
        │            domain                │  ← 领域层
        │  Entity / VO / DTO / Converter  │
        │  Repository 接口 / DomainService │
        └──────────────┬───────────────────┘
                       │ 实现
        ┌──────────────▼───────────────────┐
        │             infra                │  ← 基础设施层
        │  Repository 实现 / Mapper / PO   │
        └──────────────────────────────────┘
```

## 禁令清单

### 1. api 模块禁止自建 dto/vo/query 子包（YDIZ-DDD-005，P0）

api 模块是纯契约层，仅定义 FeignClient 接口签名和 Assembler。通过依赖 domain 模块复用 VO/DTO/Query。

```java
// ❌ 违规：api 模块自建 dto 包
package com.njydsz.system.api.dto;
public class ConfigQuery { }

// ✅ 正确：DTO 定义在 domain 模块
package com.njydsz.system.domain.dto;
public class ConfigQuery { }
```

### 2. 代码体禁止全限定类名（YDIZ-IMPORT-001，P0）

所有类型必须通过 import 引入，严禁在代码体中使用 FQN。

```java
// ❌ 违规：字段声明中使用 FQN
private java.time.LocalDateTime createdAt;

// ✅ 正确：顶部 import + 简单名
import java.time.LocalDateTime;
private LocalDateTime createdAt;
```

### 3. Entity 和 Converter 必须放在 domain 层（YDIZ-DDD-004，P0）

Entity 是领域模型核心，Converter 做形态转换，均属于 domain 层逻辑。

| 层级 | 放置内容 |
|------|----------|
| `domain/entity/` | 数据库实体类 |
| `domain/converter/` | MapStruct 转换器接口 |
| `infra/` | 仅保留 Mapper 和 Repository 实现 |

### 4. web/server/app 层禁止引入同模块 api 依赖

同模块 web → api 依赖属于僵尸依赖（无实际调用关系），必须在 pom 中移除。

## Converter 归属理由

- **为什么 Entity 放 domain**：Entity 是领域模型的核心组成部分，server 层可直接引用
- **为什么 Converter 放 domain**：Converter 做 Entity↔VO/DTO 的形态转换，属于领域层内部逻辑
- **MapStruct 依赖**：domain 声明 `provided` scope 不传递到 infra；infra 编译期解析时允许以 `provided` scope 被动声明

## Repository 规范（YDIZ-DDD-002）

Repository 接口禁止返回 Entity 类型，必须通过 Converter 转换为 VO/DTO 后返回。
