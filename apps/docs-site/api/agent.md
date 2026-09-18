# 智能引擎 API

> **端口**：9008 | **前缀**：`/agent` | **OpenAPI Spec**：`/openapi/agent.json`

<script setup>
import RedocEmbed from '../.vitepress/theme/components/RedocEmbed.vue';
</script>

## API 列表

<RedocEmbed spec-url="/openapi/agent.json" />

## 主要端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/agent/definition/page` | GET | Agent 定义分页列表 |
| `/agent/run/start` | POST | 启动 Agent 运行 |
| `/agent/run/{runId}/events` | SSE | Agent 实时事件流 |
| `/agent/conversation/page` | GET | 会话历史分页 |
| `/agent/tool/register` | POST | 注册新工具 |
| `/rag/query` | POST | RAG 语义检索 |
| `/nl2sql/generate` | POST | 自然语言生成 SQL |
| `/sandbox/execute` | POST | Python 代码沙箱执行 |
