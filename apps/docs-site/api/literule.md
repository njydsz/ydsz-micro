# 规则引擎 API

> **端口**：9007 | **前缀**：`/literule` | **OpenAPI Spec**：`/openapi/literule.json`

<script setup>
import RedocEmbed from '../.vitepress/theme/components/RedocEmbed.vue';
</script>

## API 列表

<RedocEmbed spec-url="/openapi/literule.json" />

## 主要端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/literule/rule/page` | GET | 规则分页列表 |
| `/literule/rule/deploy` | POST | 部署规则（支持热加载） |
| `/literule/rule/evaluate` | POST | 在线评估规则（调试模式） |
| `/literule/rule/rollback` | POST | 回滚规则到历史版本 |
| `/literule/version/page` | GET | 规则版本历史 |
| `/literule/hit/stats` | GET | 规则命中统计 |
| `/literule/cep/pattern` | POST | CEP 模式注册 |
