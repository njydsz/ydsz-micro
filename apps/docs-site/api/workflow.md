# 流程引擎 API

> **端口**：9005 | **前缀**：`/workflow` | **OpenAPI Spec**：`/openapi/workflow.json`

<script setup>
import RedocEmbed from '../.vitepress/theme/components/RedocEmbed.vue';
</script>

## API 列表

<RedocEmbed spec-url="/openapi/workflow.json" />

## 主要端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/workflow/definition/deploy` | POST | 部署流程定义 |
| `/workflow/instance/start` | POST | 启动流程实例 |
| `/workflow/task/complete` | POST | 完成任务节点 |
| `/workflow/task/transfer` | POST | 转交任务 |
| `/workflow/form/schema` | GET | 获取节点动态表单 JSON Schema |
| `/workflow/dmn/evaluate` | POST | DMN 决策表在线评估 |
| `/workflow/designer/save` | POST | 可视化设计器保存 BPMN |
