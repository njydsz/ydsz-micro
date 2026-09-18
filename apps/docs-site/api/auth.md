# 认证与安全

## 认证方式

YDSZ 支持三种认证方式：

### 1. 用户名密码登录

```http
POST /userinfo/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123",
  "captcha": "8x4k",
  "captcha_id": "abc123"
}
```

### 2. JWT Token（默认）

登录成功后返回 JWT，后续请求在 Header 中携带：

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### 3. OAuth2（SCIM / 第三方集成）

支持标准 OAuth2 授权码流程：

```
/authorize  → 获取 authorization_code
/token      → 交换 access_token
/refresh    → 刷新 token
```

## MFA 多因素认证

支持 TOTP（Time-based One-Time Password），流程如下：

1. 调用 `/userinfo/auth/mfa/setup` 获取绑定二维码
2. 使用 Google Authenticator / Microsoft Authenticator 扫码绑定
3. 登录时输入 TOTP 动态码完成认证

## CSRF 防护

- 前端从 cookie 读取 CSRF token
- 非 GET 请求需在 Header 中携带 `X-CSRF-TOKEN`

## CORS 配置

通过网关层统一配置跨域策略：

```yaml
cors:
  allowed-origins:
    - "http://localhost:5173"
  allowed-methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  allowed-headers: ["*"]
  allow-credentials: true
```
