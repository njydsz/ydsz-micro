# 身份引擎 (ydsz-userinfo)

> **端口**：9002 | **模块**：`ydsz-userinfo` | **定位**：统一身份认证与权限

## 核心定位

YDSZ 身份引擎是平台的准入网关，负责用户身份认证、RBAC 权限判定、组织/角色/菜单管理，以及多因素认证（MFA）和验证码服务。

## 关键差异化能力

| 能力 | 说明 |
|------|------|
| **RBAC 六要素** | 用户-角色-权限-菜单-部门-数据范围，完整覆盖企业权限场景 |
| **LDAP/ADFS 集成** | 支持企业 LDAP/Active Directory 对接，实现统一账号体系 |
| **OAuth2 授权码模式** | 支持标准 OAuth2 授权码流程，用于第三方系统对接 |
| **多因素认证 MFA** | 支持 TOTP 时间戳动态令牌，绑定/解绑流程完整 |
| **国际化** | 验证码、错误提示、邮件模板支持多语言 |
| **验证码服务** | 图形验证码 + 滑块验证码，可配置多种策略 |

## 核心代码模块

```
ydsz-userinfo/
├── ydzs-userinfo-api/          # FeignClient 接口（UserFeignClient / RoleFeignClient）
├── ydzs-userinfo-domain/       # Entity / DTO / Repository 接口 / DomainService
│   ├── entity/                 # SysUser, SysRole, SysMenu, SysDept, UserOAuth
│   ├── repository/             # UserRepository, RoleRepository, MenuRepository
│   ├── domain-service/         # 认证逻辑、权限判定、MFA 绑定
│   └── converter/              # MapStruct Entity↔VO 转换器
├── ydzs-userinfo-infra/        # Mapper / Repository 实现
└── ydzs-userinfo-server/       # Controller / 定时任务 / 事件监听
```

## 核心 API

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

## 数据库表前缀

`ydsz_`

## 依赖关系

- **被依赖**：所有引擎通过 Feign 获取用户信息、角色权限数据
- **依赖**：ydsz-common-auth、ydsz-common-redis、ydsz-common-jdbc
