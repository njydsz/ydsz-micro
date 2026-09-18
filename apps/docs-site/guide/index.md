# 平台介绍

YDSZ（云顶智算）是一个面向企业级业务场景设计的微服务化管理平台，采用 Vue 3 + Spring Boot 3 全栈分离架构，以网关 + 八大引擎为核心拓扑，为多租户 SaaS 场景提供一体化底座能力。

## 核心定位

YDSZ 以「引擎化」为设计哲学 — 将平台能力拆分为 8 个可独立部署、独立扩展的业务微服务，每个引擎承担一个核心领域职责：

| 引擎 | 模块 | 端口 | 核心定位 | 关键差异化能力 |
|------|------|------|----------|---------------|
| **系统引擎** | `ydsz-system` | 9001 | 平台基座（参数/字典/多租户/全局搜索） | 三种策略多租户 · 数据字典版本快照 · OAuth2 应用注册 |
| **身份引擎** | `ydsz-userinfo` | 9002 | 统一身份认证与权限 | RBAC 六要素 · LDAP/ADFS · OAuth2 授权码 · 国际化 |
| **消息引擎** | `ydsz-message` | 9004 | 全渠道通知中心 | 12 种渠道 · DAG 编排 · 跨渠道抑制 · 灰度标记 |
| **流程引擎** | `ydsz-workflow` | 9005 | 工作流与审批 | YDSZ-Flow · BPMN 2.0 · 11 节点 · DMN · 可视化设计器 |
| **任务引擎** | `ydsz-cronjob` | 9006 | 分布式调度 | Leader 选举 · 分片广播 · DAG · 异常自愈 |
| **文件引擎** | `ydsz-nextwiki` | 9003 | 网盘知识库 | 秒传 · 20 版本 · WOPI · ClamAV · OCR · AI 摘要 |
| **规则引擎** | `ydsz-literule` | 9007 | 业务规则决策 | LiteExpr · AST+沙箱 · 热加载 · CEP · A/B 测试 |
| **智能引擎** | `ydsz-agent` | 9008 | AI Agent 框架 | ReAct · RAG · MCP · NL2SQL · Python 沙箱 · 洞察报告 |

## 技术栈一览

| 分层 | 技术选型 |
|------|----------|
| 前端 | Vue 3 · Vite · TypeScript · Pinia · Tailwind CSS · micro-kernel |
| 后端 | Spring Boot 3 · Spring Cloud · MyBatis Plus · Redis · RabbitMQ |
| 网关 | Spring Cloud Gateway · OAuth2 · Rate Limiter |
| 部署 | Docker · Docker Compose · Kubernetes · GitHub Actions |
| 文档 | VitePress · Redoc · Mermaid · G6 |

## 快速导航

- 🚀 立即体验：[快速开始](./quick-start)
- 🏗️ 深入架构：[架构总览](../architecture/overview)
- 📡 接口调用：[API 参考](../api/)
- 📏 规范遵守：[编码规范](../standards/)

## 拓扑公式

```
YDSZ 完整拓扑 = API 网关 + 八大引擎 (9001-9008) + ydsz-common (28 子模块 L1-L6)
```
