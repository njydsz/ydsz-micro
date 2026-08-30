# API 版本管理策略

> **版本**：v1.0.0  
> **适用范围**：ydsz-micro 前端项目 + ydsz-cloud 后端项目  
> **日期**：2026-08-30  
> **状态**：草案

---

## 1. 背景与目标

### 1.1 当前问题

1. API 路径使用 `/api/v1/` 前缀，但无版本演进策略
2. 后端接口变更时，前端需要同步修改，存在兼容性问题
3. 无版本废弃机制，旧版本接口无法下线

### 1.2 目标

1. 建立清晰的 API 版本管理规范
2. 支持多版本共存，平滑迁移
3. 版本废弃有明确的通知和下线机制

---

## 2. 版本规范

### 2.1 版本号格式

采用语义化版本号：`v{major}.{minor}.{patch}`

| 版本类型              | 说明                | 示例            |
| --------------------- | ------------------- | --------------- |
| **主版本（major）**   | 不兼容的 API 变更   | v1 → v2         |
| **次版本（minor）**   | 向后兼容的功能新增  | v1.1 → v1.2     |
| **补丁版本（patch）** | 向后兼容的 bug 修复 | v1.1.0 → v1.1.1 |

### 2.2 版本路径规范

```
/api/v1/config          # 当前默认版本
/api/v2/config          # 新版本（灰度中）
/api/v1.1/config        # 次版本（可选）
```

---

## 3. 版本策略

### 3.1 版本共存策略

```
┌─────────────────────────────────────────────────────────────┐
│                        API Gateway                           │
│                                                              │
│   /api/v1/config  →  ydsz-system-v1（稳定版本）              │
│   /api/v2/config  →  ydsz-system-v2（新版本，灰度中）        │
│   /api/latest/config →  ydsz-system-v2（别名，指向最新）     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 版本路由规则

| 规则         | 说明                     | 示例                                    |
| ------------ | ------------------------ | --------------------------------------- |
| **默认版本** | 未指定版本时使用默认版本 | `/api/config` → `/api/v1/config`        |
| **显式版本** | 请求头或路径指定版本     | `X-API-Version: v2` 或 `/api/v2/config` |
| **最新版本** | 使用 `latest` 别名       | `/api/latest/config`                    |

### 3.3 请求头版本控制

```http
GET /api/config HTTP/1.1
Host: api.ydsz.com
X-API-Version: v2
Accept: application/json
```

---

## 4. 版本生命周期

### 4.1 生命周期阶段

```
Beta → Active → Deprecated → Retired
 │        │          │           │
 │        │          │           └─ 已下线，返回 410 Gone
 │        │          └─ 标记废弃，仍可用但不再更新
 │        └─ 稳定版本，推荐使用
 └─ 测试版本，可能变更
```

### 4.2 各阶段定义

| 阶段           | 状态   | 说明                         | 响应头                     |
| -------------- | ------ | ---------------------------- | -------------------------- |
| **Beta**       | 测试中 | 功能可能变更，不保证兼容性   | `X-API-Status: beta`       |
| **Active**     | 稳定   | 推荐使用，持续维护           | `X-API-Status: active`     |
| **Deprecated** | 废弃   | 仍可用，但不再更新，计划下线 | `X-API-Status: deprecated` |
| **Retired**    | 下线   | 不再可用                     | 返回 `410 Gone`            |

### 4.3 版本迁移时间线

| 阶段           | 时间  | 说明                        |
| -------------- | ----- | --------------------------- |
| **新版本发布** | T+0   | v2 发布，进入 Beta          |
| **稳定版本**   | T+1月 | v2 进入 Active，v1 仍为默认 |
| **旧版本废弃** | T+3月 | v1 标记 Deprecated          |
| **旧版本下线** | T+6月 | v1 下线，返回 410           |

---

## 5. 前端适配方案

### 5.1 版本配置

```typescript
// api-version.config.ts
export const API_VERSION_CONFIG = {
  /** 当前默认版本 */
  defaultVersion: 'v1',
  /** 各服务版本映射 */
  serviceVersions: {
    system: 'v1',
    userinfo: 'v1',
    workflow: 'v2', // workflow 已升级到 v2
    message: 'v1',
  },
  /** 是否启用版本检查 */
  enableVersionCheck: true,
  /** 版本不匹配时警告 */
  warnOnVersionMismatch: true,
};
```

### 5.2 请求拦截器

```typescript
// 在请求拦截器中添加版本头
client.addRequestInterceptor({
  fulfilled: (config) => {
    const service = detectService(config.url);
    const version = API_VERSION_CONFIG.serviceVersions[service];
    if (version) {
      config.headers['X-API-Version'] = version;
    }
    return config;
  },
});
```

### 5.3 响应拦截器

```typescript
// 检查版本状态
client.addResponseInterceptor({
  fulfilled: (response) => {
    const status = response.headers['x-api-status'];
    if (status === 'deprecated') {
      console.warn(`API ${response.url} 已废弃，请尽快迁移`);
    }
    return response;
  },
});
```

---

## 6. 后端实现

### 6.1 网关路由配置

```yaml
# routes-nacos.yaml
spring:
  cloud:
    gateway:
      routes:
        - id: system-v1
          uri: lb://ydsz-system
          predicates:
            - Path=/api/v1/system/**
          filters:
            - StripPrefix=2
        - id: system-v2
          uri: lb://ydsz-system-v2
          predicates:
            - Path=/api/v2/system/**
          filters:
            - StripPrefix=2
```

### 6.2 版本注解

```java
@RestController
@RequestMapping("/api/{version}/config")
public class ConfigController {

    @GetMapping("/{id}")
    @ApiVersion(since = "v1", deprecatedIn = "v2")
    public ResponseEntity<ConfigVO> getConfig(@PathVariable String version, @PathVariable Long id) {
        // ...
    }

    @GetMapping("/{id}")
    @ApiVersion(since = "v2")
    public ResponseEntity<ConfigV2VO> getConfigV2(@PathVariable String version, @PathVariable Long id) {
        // v2 实现
    }
}
```

---

## 7. 监控与告警

### 7.1 版本使用统计

| 指标         | 说明                     | 告警阈值   |
| ------------ | ------------------------ | ---------- |
| 版本分布     | 各版本请求占比           | -          |
| 废弃版本请求 | 对 Deprecated 版本的请求 | > 10% 告警 |
| 下线版本请求 | 对 Retired 版本的请求    | > 0 告警   |

### 7.2 日志格式

```json
{
  "timestamp": "2026-08-30T10:00:00.000Z",
  "level": "warn",
  "message": "Deprecated API called",
  "api": "/api/v1/config",
  "version": "v1",
  "status": "deprecated",
  "client": "system-web"
}
```

---

## 8. 迁移指南

### 8.1 前端迁移步骤

1. **评估影响范围**：确认哪些页面使用了待迁移接口
2. **更新版本配置**：修改 `serviceVersions` 映射
3. **测试验证**：在测试环境验证新版本接口
4. **灰度发布**：先灰度部分用户，观察稳定性
5. **全量切换**：确认无问题后全量切换

### 8.2 迁移检查清单

- [ ] 接口功能验证通过
- [ ] 响应数据结构确认
- [ ] 错误处理逻辑更新
- [ ] 单元测试更新
- [ ] E2E 测试通过
- [ ] 性能测试通过
- [ ] 监控告警配置

---

## 9. 总结

API 版本管理是前后端协作的重要规范，通过清晰的版本策略和迁移机制，确保接口变更的平滑过渡。本方案以路径版本为主、请求头版本为辅，支持多版本共存和渐进式迁移。

---

> **文档维护**：本方案由 ydsz-team 负责，如有疑问请提交 Issue。
