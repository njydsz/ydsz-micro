# 系统引擎 API

> **端口**：9001 | **前缀**：`/system` | **OpenAPI Spec**：`/openapi/system.json`

<script setup>
import RedocEmbed from '../.vitepress/theme/components/RedocEmbed.vue';
</script>

## API 列表

<RedocEmbed spec-url="/openapi/system.json" />

## 主要端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/system/config` | GET/POST | 系统参数 CRUD |
| `/system/dict/type` | GET/POST | 字典类型管理 |
| `/system/dict/item` | GET/POST | 字典项管理 |
| `/system/tenant/accessible` | GET | 获取可访问租户列表 |
| `/system/oauth/client` | POST | OAuth2 客户端注册 |
| `/system/search` | GET | 全局搜索聚合 |
