# 文件引擎 API

> **端口**：9003 | **前缀**：`/nextwiki` | **OpenAPI Spec**：`/openapi/nextwiki.json`

<script setup>
import RedocEmbed from '../.vitepress/theme/components/RedocEmbed.vue';
</script>

## API 列表

<RedocEmbed spec-url="/openapi/nextwiki.json" />

## 主要端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/nextwiki/file/upload` | POST | 文件上传（支持秒传） |
| `/nextwiki/file/download` | GET | 文件下载 |
| `/nextwiki/file/version/page` | GET | 文件版本列表 |
| `/nextwiki/file/rollback` | POST | 回滚到指定版本 |
| `/nextwiki/share/create` | POST | 创建分享链接 |
| `/nextwiki/share/verify` | POST | 验证分享密码 |
| `/nextwiki/ocr/recognize` | POST | OCR 文字识别 |
| `/nextwiki/summary/generate` | POST | AI 摘要生成 |
