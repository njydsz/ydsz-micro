# 系统引擎 (ydsz-system)

> **端口**：9001 | **模块**：`ydsz-system` | **定位**：平台基座

## 核心定位

YDSZ 系统引擎是平台的底座服务，承担系统参数管理、数据字典维护、多租户上下文分发、全局搜索聚合四大基础职责。其他引擎通过 Feign 调用系统引擎获取平台级元数据。

## 关键差异化能力

| 能力 | 说明 |
|------|------|
| **三种策略多租户** | 数据库级 / Schema 级 / 行级，通过 `tenant.isolation.strategy` 配置切换 |
| **数据字典版本快照** | 每次字典变更自动生成版本快照，支持回滚到任意历史版本 |
| **OAuth2 应用注册** | 支持客户端注册 OAuth2 应用，获取 client_id / client_secret |
| **全局搜索聚合** | 跨引擎全文搜索入口，提供统一搜索结果接口 |
| **系统参数中心** | 平台级参数集中管理，支持类型校验和运行时刷新 |

## 核心代码模块

```
ydsz-system/
├── ydzs-system-api/          # FeignClient 接口
├── ydzs-system-domain/       # Entity / DTO / Repository 接口 / DomainService
│   ├── entity/               # SysConfig, SysDict, SysTenant, OAuthClient
│   ├── repository/           # 数据库 Repository 接口
│   ├── domain-service/       # 领域服务（业务规则）
│   └── converter/            # MapStruct Entity↔VO 转换器
├── ydzs-system-infra/        # Mapper / Repository 实现
└── ydzs-system-server/       # Controller / 定时任务
```

## 核心 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/system/config` | GET/POST | 系统参数 CRUD |
| `/system/dict/type` | GET/POST | 字典类型管理 |
| `/system/dict/item` | GET/POST | 字典项管理 |
| `/system/tenant/accessible` | GET | 获取可访问租户列表 |
| `/system/oauth/client` | POST | OAuth2 客户端注册 |
| `/system/search` | GET | 全局搜索聚合 |

## 数据库表前缀

`ydsz_`（YDIZ-NAME-002）

## 依赖关系

- **被依赖**：所有引擎通过 Feign 获取平台参数、租户信息、字典数据
- **依赖**：无业务模块依赖，仅依赖 ydzs-common 基础层
