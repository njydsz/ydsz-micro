# 任务引擎 API

> **端口**：9006 | **前缀**：`/cronjob` | **OpenAPI Spec**：`/openapi/cronjob.json`

<script setup>
import RedocEmbed from '../.vitepress/theme/components/RedocEmbed.vue';
</script>

## API 列表

<RedocEmbed spec-url="/openapi/cronjob.json" />

## 主要端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/cronjob/job/page` | GET | 任务分页列表 |
| `/cronjob/job/create` | POST | 创建定时任务 |
| `/cronjob/job/trigger` | POST | 手动触发任务 |
| `/cronjob/job/pause` | POST | 暂停任务 |
| `/cronjob/execution/page` | GET | 执行历史分页列表 |
| `/cronjob/shard/status` | GET | 分片状态监控 |
| `/cronjob/dag/visualize` | GET | DAG 可视化数据 |
