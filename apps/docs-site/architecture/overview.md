# 八大引擎拓扑

<script setup>
import G6Topology from '../.vitepress/theme/components/G6Topology.vue';
</script>

## 交互式拓扑

<G6Topology />

## 架构总览

YDSZ 采用网关集中入口 + 八大引擎独立微服务的拓扑模式：

```mermaid
graph TD
    Client[浏览器客户端]
    CDN[CDN / 静态资源]
    Gateway[API 网关 :9000]
    System[系统引擎 :9001]
    Userinfo[身份引擎 :9002]
    NextWiki[文件引擎 :9003]
    Message[消息引擎 :9004]
    Workflow[流程引擎 :9005]
    Cronjob[任务引擎 :9006]
    LiteRule[规则引擎 :9007]
    Agent[智能引擎 :9008]

    Client -->|HTTP| CDN
    Client -->|REST| Gateway
    Gateway --> System
    Gateway --> Userinfo
    Gateway --> NextWiki
    Gateway --> Message
    Gateway --> Workflow
    Gateway --> Cronjob
    Gateway --> LiteRule
    Gateway --> Agent
    System -->|Feign| Userinfo
    Workflow -->|Feign| Message
    Agent -->|MCP| LiteRule
```

## 网关路由规则

| 路由前缀 | 目标引擎 | 端口 | 协议 |
|----------|----------|------|------|
| `/api/system/**` | ydsz-system | 9001 | REST |
| `/api/userinfo/**` | ydsz-userinfo | 9002 | REST |
| `/api/message/**` | ydsz-message | 9004 | REST |
| `/api/nextwiki/**` | ydsz-nextwiki | 9003 | REST |
| `/api/workflow/**` | ydsz-workflow | 9005 | REST |
| `/api/cronjob/**` | ydsz-cronjob | 9006 | REST |
| `/api/literule/**` | ydsz-literule | 9007 | REST |
| `/api/agent/**` | ydsz-agent | 9008 | REST |

> `/api` 为网关层统一命名空间，业务 Controller 的 `@RequestMapping` **禁止**包含 `/api` 段（YDIZ-API-001）。网关通过 `StripPrefix=1` 剥离后再转发。

## 前端微前端拓扑

```mermaid
graph LR
    Main[main 主应用<br/>micro-kernel] -->|加载子应用| SystemWeb[system-web]
    Main -->|加载子应用| UserinfoWeb[userinfo-web]
    Main -->|加载子应用| MessageWeb[message-web]
    Main -->|加载子应用| NextWikiWeb[nextwiki-web]
    Main -->|加载子应用| WorkflowWeb[workflow-web]
    Main -->|加载子应用| CronjobWeb[cronjob-web]
    Main -->|加载子应用| LiteRuleWeb[literule-web]
    Main -->|加载子应用| AgentWeb[agent-web]
    Main -->|加载子应用| GeneratorWeb[generator-web]
```
