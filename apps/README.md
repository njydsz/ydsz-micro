# apps/ —— 前端子应用（微前端架构）

云顶微前端体系的子应用集合。每个子应用对应一个后端微服务，可独立开发、构建、部署。

## 应用清单

| 应用 | 说明 | 后端对应 |
|------|------|----------|
| `agent-web` | AI 智能体管理（Agent/RAG/Prompt/DAG） | ydsz-agent |
| `cronjob-web` | 分布式定时任务与 DAG 调度 | ydsz-cronjob |
| `literule-web` | 规则引擎（规则/决策表/DSL/CEP） | ydsz-literule |
| `message-web` | 消息中台（模板/批量/死信/追踪） | ydsz-message |
| `nextwiki-web` | 企业知识库/文档管理 | ydsz-nextwiki |
| `system-web` | 系统管理（租户/字典/配置/审计） | ydsz-system |
| `userinfo-web` | 用户中心（认证/部门/角色/SSO/OAuth2） | ydsz-userinfo |
| `workflow-web` | 工作流/审批引擎 | ydsz-workflow |

## 应用骨架

每个子应用共享以下标准化骨架：

```
<app-name>-web/
├── src/
│   ├── main.ts              # 应用入口
│   ├── app.vue              # 根组件
│   ├── preferences.ts       # 子应用偏好覆盖
│   ├── api/                 # 业务 API
│   │   ├── core/            # 公共认证/用户/菜单接口
│   │   ├── .generated-archived/  # 归档的自动生成 SDK
│   │   └── request.ts       # HTTP 客户端实例
│   ├── adapter/             # 表单/表格/组件适配器
│   ├── layouts/             # 布局组件
│   ├── locales/             # 国际化（zh-CN / en-US）
│   ├── router/              # 路由配置 + 守卫
│   ├── store/               # Pinia 状态管理
│   └── views/               # 业务页面
├── index.html
├── vite.config.mts
└── package.json
```

## 共享能力

- 公共组件、hooks、请求客户端从 `comm/` 包导入
- 用户认证从 `@ydsz/shared-auth` 统一接入
- 表单/表格适配器每个子应用独立配置（`adapter/`）
- 国际化 key 需维护中英文两套（`locales/langs/`）
