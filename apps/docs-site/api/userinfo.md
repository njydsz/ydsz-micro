# 身份引擎 API

> **端口**：9002 | **前缀**：`/userinfo` | **OpenAPI Spec**：`/openapi/userinfo.json`

<script setup>
import RedocEmbed from '../.vitepress/theme/components/RedocEmbed.vue';
</script>

## API 列表

<RedocEmbed spec-url="/openapi/userinfo.json" />

## 主要端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/userinfo/auth/login` | POST | 用户名密码登录 |
| `/userinfo/auth/captcha` | GET | 获取图形验证码 |
| `/userinfo/auth/mfa/setup` | POST | MFA 绑定初始化 |
| `/userinfo/auth/mfa/verify` | POST | MFA 验证 |
| `/userinfo/user/page` | GET | 用户分页列表 |
| `/userinfo/role/page` | GET | 角色分页列表 |
| `/userinfo/menu/tree` | GET | 菜单树形结构 |
| `/userinfo/dept/tree` | GET | 部门树形结构 |
