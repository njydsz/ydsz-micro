# API 参考总览

<script setup>
import ApiStatsPanel from '../.vitepress/theme/components/ApiStatsPanel.vue';
</script>

<ApiStatsPanel />

## 认证方式

所有 YDSZ REST API 使用 Bearer Token 认证（JWT 或 OAuth2 Access Token）。

```http
Authorization: Bearer <your-token>
X-Api-Version: v1
Content-Type: application/json
```

## 通用请求规范

| Header | 必须 | 说明 |
|--------|------|------|
| `Authorization` | 是 | Bearer Token |
| `Content-Type` | 是 | `application/json` |
| `X-Api-Version` | 否 | API 版本，默认 `v1` |
| `X-Tenant-Id` | 多租户场景 | 目标租户 ID |
| `Accept-Language` | 否 | 国际化语言，默认 `zh-CN` |

## 分页请求参数

统一分页参数（GET 列表接口通用）：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | `number` | `1` | 页码（从 1 开始） |
| `size` | `number` | `20` | 每页条数（最大 200） |
| `sort` | `string` | `createdAt,desc` | 排序字段（YDIZ-DB-001，统一命名 `sort`） |
| `keyword` | `string` | — | 全文搜索关键词 |

## 引擎 API 入口

各引擎 API 参考文档（基于 OpenAPI 3.0 自动生成）：

- [系统引擎 API](./system) — 参数/字典/多租户/搜索
- [身份引擎 API](./userinfo) — 用户/角色/菜单/认证
- [消息引擎 API](./message) — 通知模板/渠道/日志
- [文件引擎 API](./nextwiki) — 文件/版本/分享
- [流程引擎 API](./workflow) — 流程定义/实例/任务
- [任务引擎 API](./cronjob) — 调度任务/执行记录/分片
- [规则引擎 API](./literule) — 规则/CEP/A-B 测试
- [智能引擎 API](./agent) — Agent/Run/RAG/MCP

## SDK 与工具

| 工具 | 用途 |
|------|------|
| `openapi-fetch` | 自动生成 TypeScript 客户端 |
| `openapi-typescript` | 从 OpenAPI JSON 生成 TS 类型定义 |

```bash
# 生成 TypeScript 客户端
pnpm gen:api
```
