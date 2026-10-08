# ADR-009：前后端错误码命名约定

> **状态**：ACCEPTED
> **日期**：2026-10-06
> **决策者**：ydsz-team

## 现状（Context）

后端使用 `ExceptionCodeEnum`（每模块一个枚举，约 457 个常量），前端使用 36 个 `locale properties JSON` 文件中的 key 做错误提示。目前两者没有强关联，导致：

1. 后端新增错误码 → 前端必须手动同步 key
2. 同一错误码在不同模块可能映射多个 i18n key
3. 前端 `try-catch` 中做 code 判断时硬编码字符串，重构风险高

## 决策（Decision）

建立以下命名约定，使后端枚举常量名 → 前端 locale key 可双向推导。

### 1. 后端命名格式

```
{Module}ExceptionCodeEnum._{domain}_{action}_{reason}
```

| 字段 | 规则 | 示例 |
|------|------|------|
| `Module` | 模块大写缩写 | `SYS`, `USR`, `FLOW`, `JOB` |
| `domain` | 业务域小写 | `role`, `user`, `flow`, `dag` |
| `action` | 动作小写 | `create`, `update`, `delete`, `login` |
| `reason` | 原因小写 | `duplicate`, `not_found`, `permission_denied` |

**示例**：
```java
// ydsz-userinfo-server
public enum UserInfoExceptionCode implements ExceptionCode {
    USR_ROLE_CREATE_DUPLICATE("U1001"),
    USR_USER_LOGIN_PERMISSION_DENIED("U2001");
}
```

### 2. 前端 locale key 格式

```
{module}.error.{domain}.{action}_{reason}
```

| 字段 | 规则 |
|------|------|
| `module` | 模块小写前缀 (与 messages.properties 一致) |
| `error` | 固定前缀域名 |
| `domain` | 与后端同名 |
| `action_reason` | 与后端 action_reason 同名 |

**示例**：
```json
// apps/userinfo-web/src/locales/langs/{lang}/page.json
{
  "userinfo.error.role.create_duplicate": "角色编码 {code} 已存在",
  "userinfo.error.user.login_permission_denied": "账号 {username} 已被禁用"
}
```

### 3. 推导规则

```
后端枚举名:  USR_ROLE_CREATE_DUPLICATE
                          ↓ split("_") 取 [1:]
前端 key:    userinfo.error.role.create_duplicate
```

即：将后端枚举常量名去掉模块前缀后，剩余部分转为小写 → 前端 `{module}.error.` + 剩余部分。

### 4. 兼容性约定

- 已有 key 不强制重命名（避免破坏翻译），新错误码一律按本约定新增
- 前端 `locale` 文件中的老 key 通过 JSDoc `@deprecated` 标记并保留至少 2 个版本周期
- `gen-contract.py` 脚本扩展时，自动输出枚举常量名 → key 的映射表 JSON

## 影响（Consequences）

**正效应：**
- Trace 日志中看到 code 即可定位前端文案
- 前端 key 可批量从后端枚举校验完整性
- 减少 i18n key 遗漏

**代价：**
- 存量 ~457 个常量需评估是否需要渐进对齐（不强制一次完成）
- 新增错误码需遵守命名规范（通过 checkstyle 正则校验）

## 参考资源

- 后端异常 ADR：`CLAUDE.md` 中 EXCEPT-001/002 红线规则
- 前端 i18n 实现：`comm/locales/` + `apps/{module}/src/locales/`
