# 统一响应格式

YDSZ 全平台 REST API 统一使用 `ApiResponse<T>` 响应包装格式。

## 响应结构

```typescript
interface ApiResponse<T> {
  code: string;       // 业务状态码，"0" 表示成功
  msg: string;        // 描述信息
  data: T;            // 业务数据（泛型）
  traceId: string;    // 链路追踪 ID（自动注入）
  timestamp: number;  // 响应时间戳（毫秒）
}
```

## 错误码规范

| 错误码范围 | 说明 |
|------------|------|
| `0` | 成功 |
| `1xxxx` | 通用参数错误 |
| `2xxxx` | 引擎内部错误 |
| `3xxxx` | 第三方服务错误 |
| `4xxxx` | 权限鉴权错误 |
| `5xxxx` | 业务逻辑错误 |

## HTTP 状态码映射

| HTTP 状态码 | 说明 | 场景 |
|-------------|------|------|
| 200 | 成功 | 正常业务响应 |
| 400 | 请求参数错误 | 参数校验失败 |
| 401 | 认证失败 | Token 过期/无效 |
| 403 | 权限不足 | RBAC 鉴权失败 |
| 404 | 资源不存在 | URL 不存在 |
| 409 | 资源冲突 | 重复数据 |
| 429 | 请求过于频繁 | 限流触发 |
| 500 | 服务器内部错误 | 未捕获异常 |

## 示例

### 成功响应

```json
{
  "code": "0",
  "msg": "success",
  "data": {
    "total": 100,
    "items": [...]
  },
  "traceId": "a1b2c3d4e5f6",
  "timestamp": 1726560000000
}
```

### 错误响应

```json
{
  "code": "10001",
  "msg": "参数校验失败: userName 不能为空",
  "data": null,
  "traceId": "a1b2c3d4e5f6",
  "timestamp": 1726560000000
}
```
