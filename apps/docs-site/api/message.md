# 消息引擎 API

> **端口**：9004 | **前缀**：`/message` | **OpenAPI Spec**：`/openapi/message.json`

<script setup>
import RedocEmbed from '../.vitepress/theme/components/RedocEmbed.vue';
</script>

## API 列表

<RedocEmbed spec-url="/openapi/message.json" />

## 主要端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/message/template/page` | GET | 消息模板分页列表 |
| `/message/send` | POST | 发送消息（统一入口，DAG 内部路由） |
| `/message/batch` | POST | 批量发送 |
| `/message/log/page` | GET | 发送日志分页查询 |
| `/message/channel/config` | GET/POST | 渠道配置管理 |
| `/message/suppression` | GET | 查询当前抑制状态 |
