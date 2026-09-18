# OpenAPI Spec 目录

本目录存放各引擎的 OpenAPI 3.0 JSON 规范文件。

## 自动生成

规范文件由后端构建流程自动生成（SpringDoc + Maven Plugin），在 CI 中通过以下脚本同步：

```bash
pnpm docs-site generate-openapi
```

## 文件清单

| 文件 | 引擎 | 端口 |
|------|------|------|
| `system.json` | 系统引擎 | 9001 |
| `userinfo.json` | 身份引擎 | 9002 |
| `message.json` | 消息引擎 | 9004 |
| `nextwiki.json` | 文件引擎 | 9003 |
| `workflow.json` | 流程引擎 | 9005 |
| `cronjob.json` | 任务引擎 | 9006 |
| `literule.json` | 规则引擎 | 9007 |
| `agent.json` | 智能引擎 | 9008 |

## 手动更新

在本地开发环境中，可从运行中的引擎直接获取：

```bash
# 获取系统引擎 OpenAPI spec
curl http://localhost:9001/v3/api-docs > apps/docs-site/public/openapi/system.json
```
