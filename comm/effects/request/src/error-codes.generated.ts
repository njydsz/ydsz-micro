/**
 * 错误码常量（自动生成，禁止手改）
 *
 * <p>由 bash/gen-error-codes.mjs 于 2026-09-01 从后端 ydsz-cloud 静态提取生成，
 * 共 438 个错误码，来源模块：agent(AI Agent)、core(平台通用结果码)、docs(文档管理)、ratelimit(限流模块限流熔断降级异常码)、security(安全模块认证授权异常码)、workflow(工作流)、file(文件存储)、jdbc(JDBC 模块数据访问异常码)、lock(分布式锁)、cronjob(定时任务)、literule(规则引擎)、message(消息中心)、nextwiki(知识库)、system(系统管理)、userinfo(用户中心)。
 * 后端新增/修改错误码后运行 pnpm gen:error-codes 重新生成；
 * CI 通过 gen:error-codes:check 门禁拦截手改与漂移。
 *
 * @path comm/effects/request/src/error-codes.generated.ts
 * @author ydsz-team
 * @since 4.1.0
 */

export const GeneratedErrorCode = {
  // ===== A 段 =====
  /** success */
  SUCCESS: 'A00000',
  /** 操作失败（原 ResponseCode.FAIL 111111） */
  FAIL: 'A01051',
  /** 参数错误（原 ResponseCode.PARAM_ERROR 100001） */
  PARAM_ERROR: 'A01052',
  /** 非法参数 */
  ILLEGAL_ARGUMENT: 'A01053',
  /** 请求格式无效 */
  INVALID_REQUEST_FORMAT: 'A01054',
  /** 业务状态无效 */
  INVALID_BUSINESS_STATE: 'A01055',
  /** 业务规则违反 */
  BUSINESS_RULE_VIOLATION: 'A01056',
  /** 通用业务错误 */
  BUSINESS_ERROR: 'A01057',
  /** 请求方法不允许（原 ResponseCode.METHOD_NOT_ALLOWED 100405） */
  CORE_METHOD_NOT_ALLOWED: 'A01058',
  /** 重复提交 */
  DUPLICATE_SUBMISSION: 'A01059',
  /** 流程状态无效 */
  INVALID_FLOW_STATE: 'A01060',
  /** 乐观锁冲突/并发冲突（可恢复：刷新数据后重试） */
  OPTIMISTIC_LOCK_CONFLICT: 'A01061',
  /** 唯一约束冲突 */
  UNIQUE_CONSTRAINT_VIOLATION: 'A01062',
  /** 外键约束违反 */
  FOREIGN_KEY_VIOLATION: 'A01063',
  /** 非空约束违反 */
  NOT_NULL_VIOLATION: 'A01064',
  /** 检查约束违反 */
  CHECK_CONSTRAINT_VIOLATION: 'A01065',
  /** 未授权（原 ResponseCode.UNAUTHORIZED 100401） */
  SECURITY_UNAUTHORIZED: 'A02051',
  /** 未登录 */
  NOT_LOGGED_IN: 'A02052',
  /** 会话过期 */
  SESSION_EXPIRED: 'A02053',
  /** 认证失败 */
  AUTHENTICATION_FAILED: 'A02054',
  /** 账号已禁用 */
  ACCOUNT_DISABLED: 'A02055',
  /** 账号在其他地方登录 */
  ACCOUNT_LOGGED_ELSEWHERE: 'A02056',
  /** 禁止访问（原 ResponseCode.FORBIDDEN 100403） */
  SECURITY_FORBIDDEN: 'A03051',
  /** 权限不足 */
  INSUFFICIENT_PERMISSIONS: 'A03052',
  /** 访问被拒绝 */
  ACCESS_DENIED: 'A03053',
  /** 角色不匹配 */
  ROLE_MISMATCH: 'A03054',
  /** 资源不存在（原 ResponseCode.NOT_FOUND 100404） */
  CORE_NOT_FOUND: 'A04051',
  /** 资源冲突（原 ResponseCode.CONFLICT 100409） */
  CONFLICT: 'A04052',
  /** 数据未找到 */
  DATA_NOT_FOUND: 'A04053',
  /** 资源未找到 */
  RESOURCE_NOT_FOUND: 'A04054',
  /** 数据已存在 */
  DATA_ALREADY_EXISTS: 'A04055',
  /** 数据冲突 */
  DATA_CONFLICT: 'A04056',
  /** 请求过于频繁（原 ResponseCode.RATE_LIMIT 100429） */
  RATE_LIMIT: 'A04057',
  /** 请求过于频繁（限流） */
  REQUEST_TOO_FREQUENT: 'A04058',
  /** 操作过于频繁 */
  OPERATION_TOO_FREQUENT: 'A04059',
  /** 限流异常 */
  RATE_LIMIT_EXCEEDED: 'A04060',
  /** 文件上传失败 */
  FILE_UPLOAD_FAILED: 'A04061',
  /** 文件下载失败 */
  FILE_DOWNLOAD_FAILED: 'A04062',
  /** 不支持的文件类型 */
  UNSUPPORTED_FILE_TYPE: 'A04063',
  /** 文件大小超限 */
  FILE_SIZE_EXCEEDED: 'A04064',
  /** 批量操作部分成功（HTTP 207 Multi-Status，可恢复：可重试失败的子项） */
  BATCH_PARTIAL_SUCCESS: 'A05001',
  /** 幂等拒绝（重复提交） */
  IDEMPOTENT_REJECT: 'A07001',
  /** 请求参数错误 */
  BAD_REQUEST: 'A10001',
  /** 参数校验失败（JSR-303 校验不通过） */
  VALIDATION_FAILED: 'A10002',
  /** 缺少必填参数 */
  MISSING_PARAMETER: 'A10003',
  /** HTTP 方法不允许 */
  METHOD_NOT_ALLOWED: 'A10004',
  /** 不支持的媒体类型 */
  UNSUPPORTED_MEDIA_TYPE: 'A10005',
  /** 资源不存在 */
  NOT_FOUND: 'A10101',
  /** 资源已存在（重复创建） */
  DUPLICATE_KEY: 'A10102',
  /** 业务规则校验失败 */
  BIZ_ERROR: 'A10103',
  /** 请求超时 */
  REQUEST_TIMEOUT: 'A10203',
  /** 请求过多（限流） */
  TOO_MANY_REQUESTS: 'A10603',
  /** 未登录或 Token 无效 */
  UNAUTHORIZED: 'A20001',
  /** Token 无效 */
  TOKEN_INVALID: 'A20003',
  /** 无权限访问 */
  FORBIDDEN: 'A20101',
  /** 需要双因素认证 */
  MFA_REQUIRED: 'A20108',
  /** 双因素认证码无效 */
  MFA_INVALID: 'A20109',
  /** 账号已锁定，请稍后再试 */
  ACCOUNT_LOCKED: 'A20110',
  /** 敏感操作需要二次认证 */
  SENSITIVE_VERIFY_REQUIRED: 'A20120',
  /** 二次认证已过期，请重新验证 */
  SENSITIVE_VERIFY_EXPIRED: 'A20121',
  /** 二次认证密码错误 */
  SENSITIVE_VERIFY_PASSWORD_INCORRECT: 'A20122',
  /** 需要二级认证 */
  SECONDARY_AUTH_REQUIRED: 'A20123',
  /** 二级认证已过期 */
  SECONDARY_AUTH_EXPIRED: 'A20124',
  /** 账号未激活（用户已注册但未验证邮箱/手机） */
  USER_NOT_ACTIVATED: 'A20125',
  /** 账号已暂停（临时停用，可由管理员恢复） */
  USER_SUSPENDED: 'A20126',
  /** 账号已离职（终态，不可再激活） */
  USER_RESIGNED: 'A20127',
  /** 该设备类型会话数已达上限 */
  DEVICE_SESSION_LIMIT_EXCEEDED: 'A20128',
  /** 缺少签名参数（X-Timestamp/X-Nonce/X-Signature 任一缺失） */
  SIGNATURE_REQUIRED: 'A20129',
  /** 签名无效（签名值不匹配） */
  SIGNATURE_INVALID: 'A20130',
  /** 签名已过期（时间戳超出有效期窗口） */
  SIGNATURE_EXPIRED: 'A20131',
  /** Nonce 已被使用（疑似重放攻击） */
  NONCE_REUSED: 'A20132',
  /** 账号已被封禁 */
  USER_BANNED: 'A20133',
  /** 账号已被永久封禁 */
  USER_BANNED_PERMANENT: 'A20134',
  /** 不能封禁管理员 */
  CANNOT_BAN_ADMIN: 'A20135',
  /** 不能封禁自己 */
  CANNOT_BAN_SELF: 'A20136',
  /** 不受信的跨域来源 */
  SSO_DOMAIN_NOT_TRUSTED: 'A20137',
  /** 令牌交换失败 */
  SSO_TOKEN_EXCHANGE_FAILED: 'A20138',
  /** CORS 预检失败 */
  CORS_PREFLIGHT_FAILED: 'A20139',
  /** Remember-Me 已过期（超过最大续期天数） */
  REMEMBER_ME_EXPIRED: 'A20140',
  /** Remember-Me 无效（Cookie 校验失败或会话不存在） */
  REMEMBER_ME_INVALID: 'A20141',
  /** 设备登录码无效或已过期 */
  SSO_DEVICE_CODE_INVALID: 'A20142',
  /** 设备登录码已被使用（一次性码防重放） */
  SSO_DEVICE_CODE_CONSUMED: 'A20143',
  /** 非法状态流转（如终态 REISIGNED 不可再流转到任何状态） */
  LIFECYCLE_TRANSITION_INVALID: 'A20144',
  /** 会话不存在或已过期 */
  SESSION_NOT_FOUND: 'A20145',
  /** 设备不存在或已被下线 */
  DEVICE_NOT_FOUND: 'A20146',
  // ===== B 段 =====
  /** 系统内部错误（原 ResponseCode.INTERNAL_ERROR 100500） */
  CORE_INTERNAL_ERROR: 'B01051',
  /** 系统错误 */
  SYSTEM_ERROR: 'B01052',
  /** 数据库错误 */
  DATABASE_ERROR: 'B01053',
  /** 服务不可用（原 ResponseCode.SERVICE_UNAVAILABLE 100503，可恢复） */
  CORE_SERVICE_UNAVAILABLE: 'B01054',
  /** 网络错误 */
  NETWORK_ERROR: 'B01055',
  /** 缓存错误 */
  CACHE_ERROR: 'B01056',
  /** 消息队列错误 */
  MQ_ERROR: 'B01057',
  /** 存储错误 */
  STORAGE_ERROR: 'B01058',
  /** 基础设施服务不可用（可恢复） */
  INFRA_SERVICE_UNAVAILABLE: 'B01059',
  /** 熔断器开启（可恢复：等待熔断恢复后重试） */
  CIRCUIT_BREAKER_OPEN: 'B01060',
  /** 资源耗尽（可恢复：降低频率后重试） */
  RESOURCE_EXHAUSTED: 'B01061',
  /** 服务降级（可恢复） */
  SERVICE_DEGRADED: 'B01062',
  /** 网关错误（原 ResponseCode.BAD_GATEWAY 100502） */
  BAD_GATEWAY: 'B02051',
  /** 网关超时（原 ResponseCode.GATEWAY_TIMEOUT 100504） */
  GATEWAY_TIMEOUT: 'B02052',
  /** 其他外部服务错误 */
  OTHER_EXTERNAL_ERROR: 'B02053',
  /** 外部服务超时 */
  EXTERNAL_SERVICE_TIMEOUT: 'B02054',
  /** 外部服务拒绝 */
  EXTERNAL_SERVICE_REJECTED: 'B02055',
  /** 通知发送失败 */
  NOTIFY_ERROR: 'B02056',
  /** 系统内部错误 */
  INTERNAL_ERROR: 'B10201',
  /** 服务暂不可用 */
  SERVICE_UNAVAILABLE: 'B10202',
  /** 用户不存在 */
  USER_NOT_FOUND: 'B30001',
  /** 密码错误 */
  PASSWORD_INCORRECT: 'B30002',
  /** 用户已停用 */
  USER_DISABLED: 'B30003',
  /** 用户名已存在 */
  USERNAME_DUPLICATE: 'B30005',
  /** 验证码无效或已过期 */
  CAPTCHA_INVALID: 'B30007',
  /** 请输入验证码 */
  CAPTCHA_REQUIRED: 'B30008',
  /** 用户未绑定双因素认证 */
  MFA_NOT_BOUND: 'B30009',
  /** 原密码错误 */
  OLD_PASSWORD_INCORRECT: 'B30010',
  /** 新密码不能与旧密码相同 */
  PASSWORD_SAME_AS_OLD: 'B30011',
  /** 密码强度不足 */
  USERINFO_PASSWORD_TOO_WEAK: 'B30012',
  /** 不能使用最近使用过的密码 */
  USERINFO_PASSWORD_REUSED: 'B30013',
  /** 用户已绑定双因素认证，请勿重复绑定 */
  MFA_ALREADY_BOUND: 'B30014',
  /** 授权码无效或已过期 */
  OAUTH2_CODE_INVALID: 'B30016',
  /** 客户端 ID 无效 */
  OAUTH2_CLIENT_INVALID: 'B30017',
  /** 回调地址不匹配 */
  OAUTH2_REDIRECT_URI_MISMATCH: 'B30018',
  /** IP 登录失败次数过多被临时封禁 */
  IP_BLOCKED: 'B30019',
  /** PKCE code_verifier 无效 */
  OAUTH2_PKCE_VERIFIER_INVALID: 'B30020',
  /** 导入文件为空 */
  IMPORT_FILE_EMPTY: 'B30021',
  /** 导入文件无数据 */
  IMPORT_DATA_EMPTY: 'B30022',
  /** 导入数量超过上限 */
  IMPORT_EXCEEDS_LIMIT: 'B30023',
  /** 导入用户名为空 */
  IMPORT_USERNAME_EMPTY: 'B30024',
  /** 导入真实姓名为空 */
  IMPORT_REALNAME_EMPTY: 'B30025',
  /** 导入密码为空 */
  IMPORT_PASSWORD_EMPTY: 'B30026',
  /** 导入用户名已存在 */
  IMPORT_USERNAME_DUPLICATE: 'B30027',
  /** 参数校验失败 */
  PARAM_INVALID: 'B30028',
  /** 导入上级用户不存在 */
  IMPORT_LEADER_NOT_FOUND: 'B30029',
  /** 导入文件读取失败 */
  IMPORT_READ_FAILED: 'B30030',
  /** 内部接口访问被拒绝（缺少 X-Internal-Call 标记，P0-6） */
  INTERNAL_ACCESS_FORBIDDEN: 'B30031',
  /** OAuth2 scope 超出客户端授权范围（P1-3） */
  OAUTH2_SCOPE_INVALID: 'B30032',
  /** 数据已被其他用户修改，请刷新后重试（乐观锁冲突，P1-6） */
  USER_UPDATE_CONFLICT: 'B30033',
  /** OAuth2 state 参数无效或已过期 */
  OAUTH2_STATE_INVALID: 'B30034',
  /** 部门不存在 */
  DEPARTMENT_NOT_FOUND: 'B30101',
  /** 该部门下存在子部门，无法删除 */
  DEPARTMENT_HAS_CHILDREN: 'B30102',
  /** 该部门下存在人员，无法删除 */
  DEPARTMENT_HAS_USERS: 'B30103',
  /** 部门编码已存在 */
  DEPARTMENT_CODE_DUPLICATE: 'B30104',
  /** 公司不存在 */
  COMPANY_NOT_FOUND: 'B30105',
  /** 公司编码已存在 */
  COMPANY_CODE_DUPLICATE: 'B30106',
  /** 用户-部门关联不存在 */
  USER_DEPT_NOT_FOUND: 'B30107',
  /** 角色不存在 */
  ROLE_NOT_FOUND: 'B32001',
  /** 角色编码已存在 */
  ROLE_CODE_DUPLICATE: 'B32002',
  /** 内置角色不允许删除 */
  ROLE_BUILTIN_CANNOT_DELETE: 'B32003',
  /** 该角色下存在用户，无法删除 */
  ROLE_HAS_USERS: 'B32004',
  /** 权限不存在 */
  PERMISSION_NOT_FOUND: 'B32005',
  /** 菜单不存在 */
  MENU_NOT_FOUND: 'B32006',
  /** 岗位不存在 */
  POST_NOT_FOUND: 'B32007',
  /** 岗位编码已存在 */
  POST_CODE_DUPLICATE: 'B32008',
  /** 语言不存在 */
  LANGUAGE_NOT_FOUND: 'B32009',
  /** 语言编码已存在 */
  LANGUAGE_CODE_DUPLICATE: 'B32010',
  /** 该菜单下存在子菜单，无法删除 */
  MENU_HAS_CHILDREN: 'B32011',
  /** 自助注册功能未开启 */
  SELF_REGISTRATION_DISABLED: 'B33001',
  /** 验证码已过期或无效 */
  VERIFY_CODE_INVALID: 'B33002',
  /** 验证码发送过于频繁 */
  VERIFY_CODE_RATE_LIMITED: 'B33003',
  /** 找回密码账号不存在 */
  FORGOT_PASSWORD_USER_NOT_FOUND: 'B33004',
  /** 找回密码手机号与账号不匹配 */
  FORGOT_PASSWORD_PHONE_MISMATCH: 'B33005',
  /** 账号未锁定，无需解锁 */
  ACCOUNT_NOT_LOCKED: 'B33006',
  /** 账号解锁失败，验证信息不匹配 */
  ACCOUNT_UNLOCK_FAILED: 'B33007',
  /** 账号解锁验证码已过期或无效 */
  ACCOUNT_UNLOCK_VERIFY_CODE_INVALID: 'B33008',
  /** 社交认证功能未开启 */
  SOCIAL_AUTH_DISABLED: 'B34001',
  /** 不支持的社交平台 */
  SOCIAL_PLATFORM_NOT_SUPPORTED: 'B34002',
  /** 该社交账号已绑定到其他用户 */
  SOCIAL_BIND_EXISTS: 'B34003',
  /** 社交账号未绑定 */
  SOCIAL_ACCOUNT_NOT_BOUND: 'B34004',
  /** 社交认证失败 */
  SOCIAL_AUTH_FAILED: 'B34005',
  /** 社交认证 CSRF 校验失败（state 无效或已消费） */
  SOCIAL_AUTH_CSRF_FAILED: 'B34006',
  /** LDAP 同步功能未开启 */
  LDAP_SYNC_DISABLED: 'B35001',
  /** LDAP 同步正在进行中 */
  LDAP_SYNC_IN_PROGRESS: 'B35002',
  /** LDAP 同步失败 */
  LDAP_SYNC_FAILED: 'B35003',
  /** LDAP 连接失败 */
  LDAP_CONNECTION_FAILED: 'B35004',
  /** SCIM 服务未开启 */
  SCIM_DISABLED: 'B36001',
  /** SCIM 认证失败（Bearer Token 无效） */
  SCIM_AUTH_FAILED: 'B36002',
  /** SCIM 用户不存在 */
  SCIM_USER_NOT_FOUND: 'B36003',
  /** SCIM 过滤表达式解析错误 */
  SCIM_FILTER_PARSE_ERROR: 'B36004',
  /** SCIM PATCH 操作无效 */
  SCIM_PATCH_INVALID: 'B36005',
  /** SAML 配置缺失（IdP 端点或证书未配置） */
  SAML_CONFIG_MISSING: 'B37001',
  /** SAML Response 无效或解析失败 */
  SAML_RESPONSE_INVALID: 'B37002',
  /** SAML 签名缺失 */
  SAML_SIGNATURE_MISSING: 'B37003',
  /** SAML 签名验证失败 */
  SAML_SIGNATURE_INVALID: 'B37004',
  /** SAML 断言已过期 */
  SAML_ASSERTION_EXPIRED: 'B37005',
  /** SAML 断言尚未生效 */
  SAML_ASSERTION_NOT_YET_VALID: 'B37006',
  /** SAML Audience 不匹配 */
  SAML_AUDIENCE_MISMATCH: 'B37007',
  /** SAML SSO 发起失败 */
  SAML_SSO_INIT_FAILED: 'B37008',
  /** OIDC 配置无效 */
  OIDC_CONFIG_INVALID: 'B38001',
  /** OIDC nonce 无效或已使用 */
  OIDC_NONCE_INVALID: 'B38002',
  /** OIDC ID Token 签发失败 */
  OIDC_ID_TOKEN_ISSUE_FAILED: 'B38003',
  /** WebAuthn 功能未开启 */
  WEBAUTHN_DISABLED: 'B39001',
  /** WebAuthn 挑战码已过期 */
  WEBAUTHN_CHALLENGE_EXPIRED: 'B39002',
  /** WebAuthn 挑战码类型不匹配 */
  WEBAUTHN_CHALLENGE_TYPE_MISMATCH: 'B39003',
  /** WebAuthn 挑战码用户不匹配 */
  WEBAUTHN_CHALLENGE_USER_MISMATCH: 'B39004',
  /** WebAuthn 客户端数据无效 */
  WEBAUTHN_CLIENT_DATA_INVALID: 'B39005',
  /** WebAuthn 签名验证失败 */
  WEBAUTHN_SIGNATURE_INVALID: 'B39006',
  /** WebAuthn 凭证不存在 */
  WEBAUTHN_CREDENTIAL_NOT_FOUND: 'B39007',
  /** WebAuthn 凭证已存在 */
  WEBAUTHN_CREDENTIAL_EXISTS: 'B39008',
  /** WebAuthn 凭证不属于当前用户 */
  WEBAUTHN_CREDENTIAL_NOT_BELONG_TO_USER: 'B39009',
  /** WebAuthn 凭证数已达上限 */
  WEBAUTHN_CREDENTIAL_LIMIT_REACHED: 'B39010',
  /** Template not found */
  WORKFLOW_TEMPLATE_NOT_FOUND: 'B70001',
  /** Template code duplicate */
  WORKFLOW_TEMPLATE_CODE_DUPLICATE: 'B70002',
  /** Template deployed cannot delete */
  TEMPLATE_DEPLOYED_CANNOT_DELETE: 'B70003',
  /** Definition not found */
  DEFINITION_NOT_FOUND: 'B70004',
  /** Bpmn parse error */
  BPMN_PARSE_ERROR: 'B70005',
  /** Unsupported bpmn element (fail-fast on deploy) */
  UNSUPPORTED_BPMN_ELEMENT: 'B70006',
  /** Instance not found */
  INSTANCE_NOT_FOUND: 'B71001',
  /** Instance status invalid */
  INSTANCE_STATUS_INVALID: 'B71002',
  /** Instance already finished */
  INSTANCE_ALREADY_FINISHED: 'B71003',
  /** Task not found */
  TASK_NOT_FOUND: 'B72001',
  /** Task no permission */
  TASK_NO_PERMISSION: 'B72002',
  /** Task already handled */
  TASK_ALREADY_HANDLED: 'B72003',
  /** Task approver duplicate */
  TASK_APPROVER_DUPLICATE: 'B72004',
  /** Illegal state transition */
  ILLEGAL_STATE_TRANSITION: 'B72005',
  /** Delegate auth not found */
  DELEGATE_AUTH_NOT_FOUND: 'B73001',
  /** Delegate auth expired */
  DELEGATE_AUTH_EXPIRED: 'B73002',
  /** Category not found */
  CATEGORY_NOT_FOUND: 'B74001',
  /** Category code duplicate */
  CATEGORY_CODE_DUPLICATE: 'B74002',
  /** Comment not found */
  COMMENT_NOT_FOUND: 'B74003',
  /** Attachment not found */
  ATTACHMENT_NOT_FOUND: 'B74004',
  /** Sla not found */
  SLA_NOT_FOUND: 'B75001',
  /** Sla overdue */
  SLA_OVERDUE: 'B75002',
  /** Urge too frequent */
  URGE_TOO_FREQUENT: 'B75003',
  /** AI Agent 不存在或未启用 */
  AI_AGENT_NOT_FOUND: 'B76001',
  /** AI Agent 调用超时 */
  AI_AGENT_TIMEOUT: 'B76002',
  /** AI Agent 输出格式非法 */
  AI_AGENT_OUTPUT_INVALID: 'B76003',
  /** AI Agent 调用异常 */
  AI_AGENT_EXECUTION_ERROR: 'B76004',
  /** CONFIG_NOT_FOUND */
  CONFIG_NOT_FOUND: 'B90001',
  /** CONFIG_KEY_DUPLICATE */
  CONFIG_KEY_DUPLICATE: 'B90002',
  /** CONFIG_KEY_FORMAT_INVALID */
  CONFIG_KEY_FORMAT_INVALID: 'B90003',
  /** PARAM_ERROR */
  SYSTEM_PARAM_ERROR: 'B90004',
  /** CONFIG_VALUE_TOO_LONG */
  CONFIG_VALUE_TOO_LONG: 'B90005',
  /** CONFIG_VALUE_FORMAT_INVALID */
  CONFIG_VALUE_FORMAT_INVALID: 'B90006',
  /** CONFIG_BATCH_LIMIT_EXCEEDED */
  CONFIG_BATCH_LIMIT_EXCEEDED: 'B90007',
  /** VALUE_TYPE_INVALID */
  VALUE_TYPE_INVALID: 'B90008',
  /** CONFIG_EXPORT_FAILED */
  CONFIG_EXPORT_FAILED: 'B90009',
  /** Template not found */
  TEMPLATE_NOT_FOUND: 'B91001',
  /** Template code duplicate */
  TEMPLATE_CODE_DUPLICATE: 'B91002',
  /** Template audit pending */
  TEMPLATE_AUDIT_PENDING: 'B91003',
  /** Template audit rejected */
  TEMPLATE_AUDIT_REJECTED: 'B91004',
  /** Template variable missing */
  TEMPLATE_VARIABLE_MISSING: 'B91005',
  /** SNAPSHOT_PARSE_ERROR */
  SNAPSHOT_PARSE_ERROR: 'B91006',
  /** DICT_TYPE_HAS_ITEMS */
  DICT_TYPE_HAS_ITEMS: 'B91007',
  /** Notification not found */
  NOTIFICATION_NOT_FOUND: 'B91101',
  /** Message log not found */
  MESSAGE_LOG_NOT_FOUND: 'B91102',
  /** Message send failed */
  MESSAGE_SEND_FAILED: 'B91103',
  /** Message recall failed */
  MESSAGE_RECALL_FAILED: 'B91104',
  /** Channel not configured */
  CHANNEL_NOT_CONFIGURED: 'B91201',
  /** Channel send failed */
  CHANNEL_SEND_FAILED: 'B91202',
  /** Route rule not found */
  ROUTE_RULE_NOT_FOUND: 'B91203',
  /** Channel blocked */
  CHANNEL_BLOCKED: 'B91204',
  /** Batch not found */
  BATCH_NOT_FOUND: 'B91301',
  /** Batch already running */
  BATCH_ALREADY_RUNNING: 'B91302',
  /** Canary not found */
  CANARY_NOT_FOUND: 'B91303',
  /** Unsubscribe token invalid */
  UNSUBSCRIBE_TOKEN_INVALID: 'B91401',
  /** Preference not found */
  PREFERENCE_NOT_FOUND: 'B91402',
  /** Feedback not found */
  FEEDBACK_NOT_FOUND: 'B91403',
  /** Channel not enabled */
  CHANNEL_NOT_ENABLED: 'B91501',
  /** Send rate limited */
  SEND_RATE_LIMITED: 'B91502',
  /** Send dimension limited */
  SEND_DIMENSION_LIMITED: 'B91503',
  /** Send frequency limited */
  SEND_FREQUENCY_LIMITED: 'B91504',
  /** Send quota exhausted */
  SEND_QUOTA_EXHAUSTED: 'B91505',
  /** User unsubscribed */
  USER_UNSUBSCRIBED: 'B91506',
  /** Dnd period active */
  DND_PERIOD_ACTIVE: 'B91507',
  /** Dnd defer exceed */
  DND_DEFER_EXCEED: 'B91508',
  /** Message duplicated */
  MESSAGE_DUPLICATED: 'B91509',
  /** Channel suppressed */
  CHANNEL_SUPPRESSED: 'B91510',
  /** Job not found */
  JOB_NOT_FOUND: 'B92001',
  /** Job code duplicate */
  JOB_CODE_DUPLICATE: 'B92002',
  /** Job already running */
  JOB_ALREADY_RUNNING: 'B92003',
  /** Job handler not found */
  JOB_HANDLER_NOT_FOUND: 'B92004',
  /** Job cron invalid */
  JOB_CRON_INVALID: 'B92005',
  /** Dag not found */
  DAG_NOT_FOUND: 'B92101',
  /** Dag cycle detected */
  DAG_CYCLE_DETECTED: 'B92102',
  /** Dag instance not found */
  DAG_INSTANCE_NOT_FOUND: 'B92103',
  /** Dag node not found */
  DAG_NODE_NOT_FOUND: 'B92104',
  /** Job history not found */
  JOB_HISTORY_NOT_FOUND: 'B92201',
  /** Job version not found */
  JOB_VERSION_NOT_FOUND: 'B92202',
  /** Job log not found */
  JOB_LOG_NOT_FOUND: 'B92203',
  /** Alert rule not found */
  ALERT_RULE_NOT_FOUND: 'B92301',
  /** Webhook not found */
  WEBHOOK_NOT_FOUND: 'B92302',
  /** Connector not found */
  CONNECTOR_NOT_FOUND: 'B92303',
  /** Webhook send failed */
  WEBHOOK_SEND_FAILED: 'B92304',
  /** 规则不存在 */
  RULE_NOT_FOUND: 'B93001',
  /** 规则编码重复 */
  RULE_CODE_DUPLICATE: 'B93002',
  /** 规则表达式非法 */
  RULE_EXPRESSION_INVALID: 'B93003',
  /** 规则状态非法 */
  RULE_STATUS_INVALID: 'B93004',
  /** 规则状态迁移非法 */
  RULE_STATUS_TRANSITION_ILLEGAL: 'B93005',
  /** 规则包不存在 */
  RULE_PACK_NOT_FOUND: 'B93101',
  /** 规则版本不存在 */
  RULE_VERSION_NOT_FOUND: 'B93102',
  /** 规则包已安装 */
  RULE_PACK_ALREADY_INSTALLED: 'B93103',
  /** 规则链不存在 */
  RULE_CHAIN_NOT_FOUND: 'B93201',
  /** 决策表不存在 */
  DECISION_TABLE_NOT_FOUND: 'B93202',
  /** AB 策略不存在 */
  AB_POLICY_NOT_FOUND: 'B93203',
  /** 测试用例不存在 */
  TEST_CASE_NOT_FOUND: 'B93301',
  /** DSL 解析错误 */
  DSL_PARSE_ERROR: 'B93302',
  /** 变量定义不存在 */
  VARIABLE_DEF_NOT_FOUND: 'B93303',
  /** 模型调用错误 */
  MODEL_INVOCATION_ERROR: 'B93401',
  /** agent.not.found */
  AGENT_NOT_FOUND: 'B94001',
  /** agent.code.duplicate */
  AGENT_CODE_DUPLICATE: 'B94002',
  /** agent.type.not.supported */
  AGENT_TYPE_NOT_SUPPORTED: 'B94003',
  /** agent.execution.failed */
  AGENT_EXECUTION_FAILED: 'B94004',
  /** agent.dag.cycle.detected */
  AGENT_DAG_CYCLE_DETECTED: 'B94005',
  /** agent.conversation.not.found */
  CONVERSATION_NOT_FOUND: 'B94101',
  /** agent.memory.overflow */
  MEMORY_OVERFLOW: 'B94102',
  /** agent.llm.call.failed */
  LLM_CALL_FAILED: 'B94201',
  /** agent.llm.response.invalid */
  LLM_RESPONSE_INVALID: 'B94202',
  /** agent.llm.token.exceeded */
  LLM_TOKEN_EXCEEDED: 'B94203',
  /** agent.llm.provider.not.configured */
  LLM_PROVIDER_NOT_CONFIGURED: 'B94204',
  /** agent.quota.daily.token.exceeded */
  QUOTA_DAILY_TOKEN_EXCEEDED: 'B94251',
  /** agent.quota.monthly.budget.exceeded */
  QUOTA_MONTHLY_BUDGET_EXCEEDED: 'B94252',
  /** agent.rag.retrieval.failed */
  RAG_RETRIEVAL_FAILED: 'B94301',
  /** agent.tool.not.found */
  TOOL_NOT_FOUND: 'B94302',
  /** agent.tool.execution.failed */
  TOOL_EXECUTION_FAILED: 'B94303',
  /** agent.prompt.template.not.found */
  PROMPT_TEMPLATE_NOT_FOUND: 'B94304',
  /** agent.prompt.template.duplicate */
  PROMPT_TEMPLATE_DUPLICATE: 'B94305',
  /** agent.guardrail.rejected */
  GUARDRAIL_REJECTED: 'B94306',
  /** agent.trace.not.found */
  TRACE_NOT_FOUND: 'B94401',
  /** agent.trace.empty */
  TRACE_EMPTY: 'B94402',
  /** TENANT_PLAN_NOT_FOUND */
  TENANT_PLAN_NOT_FOUND: 'B95001',
  /** TENANT_PLAN_CODE_DUPLICATE */
  TENANT_PLAN_CODE_DUPLICATE: 'B95002',
  /** ENTITY_VERSION_NOT_FOUND */
  ENTITY_VERSION_NOT_FOUND: 'B96001',
  // ===== C 段 =====
  /** 安全访问被拒绝 */
  SEC_ACCESS_DENIED: 'C01051',
  /** 需要认证 */
  AUTHENTICATION_REQUIRED: 'C01052',
  /** Token过期 */
  TOKEN_EXPIRED: 'C01053',
  /** 权限拒绝（通用） */
  PERMISSION_DENIED: 'C01054',
  /** 菜单权限拒绝 */
  PERMISSION_DENIED_MENU: 'C01061',
  /** 按钮权限拒绝 */
  PERMISSION_DENIED_BUTTON: 'C01062',
  /** 接口权限拒绝 */
  PERMISSION_DENIED_API: 'C01063',
  /** 数据权限拒绝 */
  PERMISSION_DENIED_DATA: 'C01064',
  /** 列权限拒绝 */
  PERMISSION_DENIED_COLUMN: 'C01065',
  /** 密码强度不足（P0-1：注册/修改密码时强度校验失败） */
  PASSWORD_TOO_WEAK: 'C01071',
  /** 密码与历史密码重复（P0-1：修改密码时与最近 N 条历史密码重复） */
  PASSWORD_REUSED: 'C01072',
  /** 内部签名校验失败（P0-3：网关 X-Internal-Sig 下游验签不通过） */
  INTERNAL_SIGNATURE_INVALID: 'C01081',
  /** 未知错误（兜底） */
  UNKNOWN: 'C99999',
  // ===== D 段 =====
  /** 数据源不可用 <p>连接池耗尽、数据源未注册或数据源健康检查失败时抛出。 */
  DATASOURCE_UNAVAILABLE: 'D01001',
  /** 数据源路由失败 <p>动态路由数据源无法解析目标数据源时抛出。 */
  DATASOURCE_ROUTE_FAILED: 'D01002',
  /** 连接池耗尽 <p>HikariCP 连接池达到最大连接数且等待超时时抛出。 */
  CONNECTION_POOL_EXHAUSTED: 'D01003',
  /** SQL 解析失败 <p>JSqlParser 无法解析 SQL 语法时抛出（通常由 SQL 注入或语法错误导致）。 */
  SQL_PARSE_FAILED: 'D02001',
  /** SQL 防火墙拦截 <p>SQL 防火墙检测到危险操作（如全表 UPDATE/DELETE 无 WHERE 条件）时拦截。 */
  SQL_FIREWALL_BLOCKED: 'D02002',
  /** 数据权限拦截 <p>数据权限上下文缺失或权限配置错误时抛出。 */
  DATA_PERMISSION_DENIED: 'D02003',
  /** 深度分页被拒绝 <p>查询偏移量超过安全阈值时拦截，防止深度分页导致数据库性能劣化。 */
  DEEP_PAGINATION_BLOCKED: 'D02004',
  /** 从库不可用 <p>所有从库均因延迟超标被摘除时抛出，读写分离自动降级走主库。 */
  SLAVE_UNAVAILABLE: 'D03001',
  /** 从库延迟超标 <p>单个从库复制延迟超过阈值，被临时摘除出路由池。 */
  SLAVE_LATENCY_EXCEEDED: 'D03002',
  /** 数据库熔断器打开 <p>数据库熔断器处于 OPEN 状态，请求被拒绝。 触发条件：连续失败次数达到阈值。 */
  JDBC_CIRCUIT_BREAKER_OPEN: 'D04001',
  /** 数据库熔断器半开探测失败 <p>熔断器处于 HALF_OPEN 状态但探测请求仍然失败。 */
  CIRCUIT_BREAKER_HALF_OPEN_FAILED: 'D04002',
  // ===== F 段 =====
  /** 上传文件为空 */
  FILE_EMPTY: 'F01001',
  /** 文件扩展名不在允许列表中 */
  FILE_SUFFIX_NOT_ALLOWED: 'F01002',
  /** 文件大小超出限制 */
  FILE_FILE_SIZE_EXCEEDED: 'F01003',
  /** 文件名无效 */
  FILE_NAME_INVALID: 'F01004',
  /** 文件上传失败 */
  FILE_FILE_UPLOAD_FAILED: 'F01005',
  /** 文件操作失败（下载/删除/拷贝/列举/目录操作/私有链接等） */
  FILE_OPERATE_FAILED: 'F01006',
  /** 文件不存在 */
  FILE_NOT_FOUND: 'F01008',
  /** 文件路径非法/为空 */
  FILE_PATH_EMPTY: 'F01010',
  /** 文件病毒检测命中 */
  FILE_VIRUS_DETECTED: 'F01014',
  /** 存储桶错误（创建失败/不存在） */
  BUCKET_ERROR: 'F02001',
  /** 存储配置无效（Endpoint 格式错误/客户端构建失败/域名未配置） */
  CONFIG_INVALID: 'F04001',
  /** 分片上传失败（初始化/完成/并发冲突） */
  MULTIPART_UPLOAD_FAILED: 'F07001',
  /** 未知错误（兜底） */
  FILE_UNKNOWN: 'F99999',
  // ===== G 段 =====
  /** 不支持的文档格式 */
  UNSUPPORTED_FORMAT: 'G01001',
  /** 文档解析失败 */
  PARSE_FAILED: 'G01002',
  /** 文档解析超时 */
  PARSE_TIMEOUT: 'G01004',
  /** 文档为空或无法读取 */
  DOCUMENT_EMPTY: 'G01005',
  /** 文档已加密，无法解析 */
  DOCUMENT_ENCRYPTED: 'G01006',
  /** 安全扫描失败 */
  SECURITY_SCAN_FAILED: 'G03001',
  /** 检测到高危安全风险 */
  SECURITY_RISK_DETECTED: 'G03002',
  /** PII 检测异常 */
  PII_DETECTION_FAILED: 'G04002',
  /** 格式转换失败 */
  CONVERT_FAILED: 'G07001',
  /** 未知错误（兜底） */
  DOCS_UNKNOWN: 'G99999',
  // ===== I 段 =====
  /** 默认 / 未知错误 */
  LOCK_ERROR: 'I01000',
  /** 获取锁超时 */
  ACQUIRE_TIMEOUT: 'I01001',
  /** 获取锁被中断 */
  ACQUIRE_INTERRUPTED: 'I01002',
  /** 释放锁失败 */
  RELEASE_FAILED: 'I01003',
  /** 锁续期失败 */
  RENEW_FAILED: 'I01004',
  /** 超过最大重入深度 */
  MAX_DEPTH_EXCEEDED: 'I01005',
  /** Redis 不可用 */
  REDIS_UNAVAILABLE: 'I01006',
  /** 未知错误 */
  LOCK_UNKNOWN: 'I01007',
  // ===== W 段 =====
  /** 文件节点不存在 */
  NEXTWIKI_FILE_NOT_FOUND: 'W01001',
  /** 文件名为空 */
  FILE_NAME_EMPTY: 'W01002',
  /** 文件名无效 */
  NEXTWIKI_FILE_NAME_INVALID: 'W01003',
  /** 文件大小超过限制 */
  FILE_TOO_LARGE: 'W01004',
  /** 文件类型不允许 */
  FILE_TYPE_NOT_ALLOWED: 'W01005',
  /** 同名文件/目录已存在 */
  FILE_ALREADY_EXISTS: 'W01006',
  /** 父目录不存在 */
  FILE_FOLDER_NOT_FOUND: 'W01007',
  /** 不能将目录移动到自身或其子目录下 */
  FILE_MOVE_TO_SELF: 'W01008',
  /** 目标父节点不是目录 */
  FILE_PARENT_NOT_FOLDER: 'W01009',
  /** 上传文件为空 */
  FILE_UPLOAD_EMPTY: 'W01010',
  /** 文件病毒扫描未通过 */
  NEXTWIKI_FILE_VIRUS_DETECTED: 'W01011',
  /** 文件存储未配置 */
  FILE_STORAGE_NOT_CONFIGURED: 'W01012',
  /** 文件下载失败 */
  NEXTWIKI_FILE_DOWNLOAD_FAILED: 'W01013',
  /** 签名URL无效或已过期 */
  SIGN_URL_EXPIRED: 'W01014',
  /** 下载限流 */
  NEXTWIKI_RATE_LIMIT_EXCEEDED: 'W01015',
  /** 同名文件冲突 */
  FILE_NAME_CONFLICT: 'W01016',
  /** 文件已被锁定 */
  FILE_LOCKED: 'W01017',
  /** 文件未锁定 */
  FILE_NOT_LOCKED: 'W01018',
  /** 分片上传未找到 */
  CHUNK_UPLOAD_NOT_FOUND: 'W01019',
  /** 分片上传已完成 */
  CHUNK_UPLOAD_COMPLETED: 'W01020',
  /** 分片不完整 */
  CHUNK_INCOMPLETE: 'W01021',
  /** 节点不属于指定父目录（批量排序越权校验） */
  FILE_NOT_BELONG_TO_PARENT: 'W01022',
  /** 参数错误 */
  NEXTWIKI_PARAM_ERROR: 'W01999',
  /** 版本不存在 */
  VERSION_NOT_FOUND: 'W02001',
  /** 版本无效 */
  VERSION_INVALID: 'W02002',
  /** 版本数超过限制 */
  VERSION_EXCEED_LIMIT: 'W02003',
  /** 分享链接不存在 */
  SHARE_NOT_FOUND: 'W03001',
  /** 分享链接已失效/过期 */
  SHARE_EXPIRED: 'W03002',
  /** 分享链接访问次数已用尽 */
  SHARE_ACCESS_LIMIT: 'W03003',
  /** 提取码错误 */
  SHARE_EXTRACT_CODE_ERROR: 'W03004',
  /** 密码错误 */
  SHARE_PASSWORD_ERROR: 'W03005',
  /** 分享验证失败次数过多，已被临时锁定 */
  SHARE_LOCKED: 'W03006',
  /** 存储空间不足 */
  QUOTA_INSUFFICIENT: 'W04001',
  /** 文件数量已达上限 */
  QUOTA_FILE_LIMIT: 'W04002',
  /** 配额记录不存在 */
  QUOTA_NOT_FOUND: 'W04003',
  /** 文件类型配额不足（S3-P2-6 新增：按文件类型分别限额） */
  QUOTA_FILE_TYPE_LIMIT: 'W04004',
  /** 权限不足 */
  NEXTWIKI_PERMISSION_DENIED: 'W05001',
  /** 回收站条目不存在 */
  TRASH_NOT_FOUND: 'W06001',
  /** 回收站条目已被清理 */
  TRASH_ALREADY_PURGED: 'W06002',
  /** 回收站条目状态不允许操作 */
  TRASH_INVALID_STATUS: 'W06003',
  /** 标签不存在 */
  TAG_NOT_FOUND: 'W07001',
  /** 标签已存在 */
  TAG_ALREADY_EXISTS: 'W07002',
  /** 标签名称为空 */
  TAG_NAME_EMPTY: 'W07003',
  /** 预览未就绪 */
  PREVIEW_NOT_READY: 'W08001',
  /** 预览生成失败 */
  PREVIEW_GENERATION_FAILED: 'W08002',
  /** 系统内部错误 */
  NEXTWIKI_INTERNAL_ERROR: 'W09001',
  /** 操作正在处理中（锁竞争） */
  LOCK_BUSY: 'W09002',
  /** AI 服务未启用或未配置 */
  AI_SERVICE_DISABLED: 'W10001',
  /** AI 摘要生成失败 */
  AI_SUMMARY_FAILED: 'W10002',
  /** AI 服务超时 */
  AI_SERVICE_TIMEOUT: 'W10003',
  /** 收藏已存在 */
  FAVORITE_ALREADY_EXISTS: 'W11001',
  /** 收藏记录不存在 */
  FAVORITE_NOT_FOUND: 'W11002',
  /** 空间不存在 */
  SPACE_NOT_FOUND: 'W12001',
  /** 空间名称为空 */
  SPACE_NAME_EMPTY: 'W12002',
  /** 空间名称过长 */
  SPACE_NAME_TOO_LONG: 'W12003',
  /** 空间名称重复 */
  SPACE_NAME_DUPLICATE: 'W12004',
  /** 空间状态转换不合法 */
  SPACE_STATUS_TRANSITION_INVALID: 'W12005',
  /** 空间成员不存在 */
  SPACE_MEMBER_NOT_FOUND: 'W12006',
  /** 空间成员角色不合法 */
  SPACE_MEMBER_ROLE_INVALID: 'W12007',
  /** 空间不存在所有者（数据异常） */
  SPACE_NO_OWNER: 'W12008',
  /** 模板不存在 */
  NEXTWIKI_TEMPLATE_NOT_FOUND: 'W13001',
  /** 系统模板不可编辑 */
  TEMPLATE_SYSTEM_NOT_EDITABLE: 'W13002',
  /** 系统模板不可删除 */
  TEMPLATE_SYSTEM_NOT_DELETABLE: 'W13003',
} as const;

/**
 * 错误码元信息
 */
export interface GeneratedErrorCodeMeta {
  /** 错误码 */
  code: string;
  /** 默认中文消息 */
  message: string;
  /** 后端 i18n 消息键 */
  i18nKey?: string;
  /** 来源模块 */
  module: string;
  /** 后端枚举常量名 */
  enumName: string;
  /** 后端声明的 HTTP 状态码 */
  httpStatus?: number;
  /** 是否可重试 */
  retryable?: boolean;
}

/**
 * 错误码元信息映射（与 GeneratedErrorCode 同源生成）
 */
export const GENERATED_ERROR_CODE_META: Record<string, GeneratedErrorCodeMeta> = {
  SUCCESS: { code: 'A00000', message: 'success', module: 'core', enumName: 'SUCCESS' },
  FAIL: { code: 'A01051', message: '操作失败（原 ResponseCode.FAIL 111111）', i18nKey: 'operation.fail', module: 'core', enumName: 'FAIL', httpStatus: 400 },
  PARAM_ERROR: { code: 'A01052', message: '参数错误（原 ResponseCode.PARAM_ERROR 100001）', i18nKey: 'param.error', module: 'core', enumName: 'PARAM_ERROR', httpStatus: 400 },
  ILLEGAL_ARGUMENT: { code: 'A01053', message: '非法参数', i18nKey: 'illegal.argument', module: 'core', enumName: 'ILLEGAL_ARGUMENT', httpStatus: 400 },
  INVALID_REQUEST_FORMAT: { code: 'A01054', message: '请求格式无效', i18nKey: 'invalid.request.format', module: 'core', enumName: 'INVALID_REQUEST_FORMAT', httpStatus: 400 },
  INVALID_BUSINESS_STATE: { code: 'A01055', message: '业务状态无效', i18nKey: 'invalid.business.state', module: 'core', enumName: 'INVALID_BUSINESS_STATE', httpStatus: 400 },
  BUSINESS_RULE_VIOLATION: { code: 'A01056', message: '业务规则违反', i18nKey: 'business.rule.violation', module: 'core', enumName: 'BUSINESS_RULE_VIOLATION', httpStatus: 400 },
  BUSINESS_ERROR: { code: 'A01057', message: '通用业务错误', i18nKey: 'business.error', module: 'core', enumName: 'BUSINESS_ERROR', httpStatus: 400 },
  CORE_METHOD_NOT_ALLOWED: { code: 'A01058', message: '请求方法不允许（原 ResponseCode.METHOD_NOT_ALLOWED 100405）', i18nKey: 'method.not.allowed', module: 'core', enumName: 'METHOD_NOT_ALLOWED', httpStatus: 405 },
  DUPLICATE_SUBMISSION: { code: 'A01059', message: '重复提交', i18nKey: 'duplicate.submission', module: 'core', enumName: 'DUPLICATE_SUBMISSION', httpStatus: 400 },
  INVALID_FLOW_STATE: { code: 'A01060', message: '流程状态无效', i18nKey: 'invalid.flow.state', module: 'core', enumName: 'INVALID_FLOW_STATE', httpStatus: 400 },
  OPTIMISTIC_LOCK_CONFLICT: { code: 'A01061', message: '乐观锁冲突/并发冲突（可恢复：刷新数据后重试）', i18nKey: 'optimistic.lock.conflict', module: 'core', enumName: 'OPTIMISTIC_LOCK_CONFLICT', httpStatus: 409, retryable: true },
  UNIQUE_CONSTRAINT_VIOLATION: { code: 'A01062', message: '唯一约束冲突', i18nKey: 'unique.constraint.violation', module: 'core', enumName: 'UNIQUE_CONSTRAINT_VIOLATION', httpStatus: 409 },
  FOREIGN_KEY_VIOLATION: { code: 'A01063', message: '外键约束违反', i18nKey: 'foreign.key.violation', module: 'core', enumName: 'FOREIGN_KEY_VIOLATION', httpStatus: 409 },
  NOT_NULL_VIOLATION: { code: 'A01064', message: '非空约束违反', i18nKey: 'not.null.violation', module: 'core', enumName: 'NOT_NULL_VIOLATION', httpStatus: 409 },
  CHECK_CONSTRAINT_VIOLATION: { code: 'A01065', message: '检查约束违反', i18nKey: 'check.constraint.violation', module: 'core', enumName: 'CHECK_CONSTRAINT_VIOLATION', httpStatus: 409 },
  SECURITY_UNAUTHORIZED: { code: 'A02051', message: '未授权（原 ResponseCode.UNAUTHORIZED 100401）', module: 'security', enumName: 'UNAUTHORIZED', httpStatus: 401 },
  NOT_LOGGED_IN: { code: 'A02052', message: '未登录', i18nKey: 'not.logged.in', module: 'security', enumName: 'NOT_LOGGED_IN', httpStatus: 401 },
  SESSION_EXPIRED: { code: 'A02053', message: '会话过期', i18nKey: 'session.expired', module: 'security', enumName: 'SESSION_EXPIRED', httpStatus: 401 },
  AUTHENTICATION_FAILED: { code: 'A02054', message: '认证失败', i18nKey: 'authentication.failed', module: 'security', enumName: 'AUTHENTICATION_FAILED', httpStatus: 401 },
  ACCOUNT_DISABLED: { code: 'A02055', message: '账号已禁用', i18nKey: 'account.disabled', module: 'security', enumName: 'ACCOUNT_DISABLED', httpStatus: 401 },
  ACCOUNT_LOGGED_ELSEWHERE: { code: 'A02056', message: '账号在其他地方登录', i18nKey: 'account.logged.elsewhere', module: 'security', enumName: 'ACCOUNT_LOGGED_ELSEWHERE', httpStatus: 401 },
  SECURITY_FORBIDDEN: { code: 'A03051', message: '禁止访问（原 ResponseCode.FORBIDDEN 100403）', module: 'security', enumName: 'FORBIDDEN', httpStatus: 403 },
  INSUFFICIENT_PERMISSIONS: { code: 'A03052', message: '权限不足', i18nKey: 'insufficient.permissions', module: 'security', enumName: 'INSUFFICIENT_PERMISSIONS', httpStatus: 403 },
  ACCESS_DENIED: { code: 'A03053', message: '访问被拒绝', i18nKey: 'access.denied', module: 'security', enumName: 'ACCESS_DENIED', httpStatus: 403 },
  ROLE_MISMATCH: { code: 'A03054', message: '角色不匹配', i18nKey: 'role.mismatch', module: 'security', enumName: 'ROLE_MISMATCH', httpStatus: 403 },
  CORE_NOT_FOUND: { code: 'A04051', message: '资源不存在（原 ResponseCode.NOT_FOUND 100404）', i18nKey: 'not.found', module: 'core', enumName: 'NOT_FOUND', httpStatus: 404 },
  CONFLICT: { code: 'A04052', message: '资源冲突（原 ResponseCode.CONFLICT 100409）', module: 'core', enumName: 'CONFLICT', httpStatus: 409 },
  DATA_NOT_FOUND: { code: 'A04053', message: '数据未找到', i18nKey: 'data.not.found', module: 'core', enumName: 'DATA_NOT_FOUND', httpStatus: 404 },
  RESOURCE_NOT_FOUND: { code: 'A04054', message: '资源未找到', i18nKey: 'resource.not.found', module: 'core', enumName: 'RESOURCE_NOT_FOUND', httpStatus: 404 },
  DATA_ALREADY_EXISTS: { code: 'A04055', message: '数据已存在', i18nKey: 'data.already.exists', module: 'core', enumName: 'DATA_ALREADY_EXISTS', httpStatus: 409 },
  DATA_CONFLICT: { code: 'A04056', message: '数据冲突', i18nKey: 'data.conflict', module: 'core', enumName: 'DATA_CONFLICT', httpStatus: 409 },
  RATE_LIMIT: { code: 'A04057', message: '请求过于频繁（原 ResponseCode.RATE_LIMIT 100429）', i18nKey: 'rate.limit', module: 'ratelimit', enumName: 'RATE_LIMIT', httpStatus: 429 },
  REQUEST_TOO_FREQUENT: { code: 'A04058', message: '请求过于频繁（限流）', i18nKey: 'request.too.frequent', module: 'ratelimit', enumName: 'REQUEST_TOO_FREQUENT', httpStatus: 429 },
  OPERATION_TOO_FREQUENT: { code: 'A04059', message: '操作过于频繁', i18nKey: 'operation.too.frequent', module: 'ratelimit', enumName: 'OPERATION_TOO_FREQUENT', httpStatus: 429 },
  RATE_LIMIT_EXCEEDED: { code: 'A04060', message: '限流异常', i18nKey: 'rate.limit.exceeded', module: 'ratelimit', enumName: 'RATE_LIMIT_EXCEEDED', httpStatus: 429 },
  FILE_UPLOAD_FAILED: { code: 'A04061', message: '文件上传失败', i18nKey: 'file.upload.failed', module: 'core', enumName: 'FILE_UPLOAD_FAILED', httpStatus: 500 },
  FILE_DOWNLOAD_FAILED: { code: 'A04062', message: '文件下载失败', i18nKey: 'file.download.failed', module: 'core', enumName: 'FILE_DOWNLOAD_FAILED', httpStatus: 500 },
  UNSUPPORTED_FILE_TYPE: { code: 'A04063', message: '不支持的文件类型', i18nKey: 'unsupported.file.type', module: 'core', enumName: 'UNSUPPORTED_FILE_TYPE', httpStatus: 400 },
  FILE_SIZE_EXCEEDED: { code: 'A04064', message: '文件大小超限', i18nKey: 'file.size.exceeded', module: 'core', enumName: 'FILE_SIZE_EXCEEDED', httpStatus: 400 },
  BATCH_PARTIAL_SUCCESS: { code: 'A05001', message: '批量操作部分成功（HTTP 207 Multi-Status，可恢复：可重试失败的子项）', i18nKey: 'batch.partial.success', module: 'core', enumName: 'BATCH_PARTIAL_SUCCESS', httpStatus: 207, retryable: true },
  IDEMPOTENT_REJECT: { code: 'A07001', message: '幂等拒绝（重复提交）', i18nKey: 'idempotent.reject', module: 'core', enumName: 'IDEMPOTENT_REJECT', httpStatus: 409 },
  BAD_REQUEST: { code: 'A10001', message: '请求参数错误', module: 'core', enumName: 'BAD_REQUEST' },
  VALIDATION_FAILED: { code: 'A10002', message: '参数校验失败（JSR-303 校验不通过）', module: 'core', enumName: 'VALIDATION_FAILED' },
  MISSING_PARAMETER: { code: 'A10003', message: '缺少必填参数', module: 'core', enumName: 'MISSING_PARAMETER' },
  METHOD_NOT_ALLOWED: { code: 'A10004', message: 'HTTP 方法不允许', module: 'core', enumName: 'METHOD_NOT_ALLOWED' },
  UNSUPPORTED_MEDIA_TYPE: { code: 'A10005', message: '不支持的媒体类型', module: 'core', enumName: 'UNSUPPORTED_MEDIA_TYPE' },
  NOT_FOUND: { code: 'A10101', message: '资源不存在', module: 'core', enumName: 'NOT_FOUND' },
  DUPLICATE_KEY: { code: 'A10102', message: '资源已存在（重复创建）', module: 'core', enumName: 'DUPLICATE_KEY' },
  BIZ_ERROR: { code: 'A10103', message: '业务规则校验失败', module: 'core', enumName: 'BIZ_ERROR' },
  REQUEST_TIMEOUT: { code: 'A10203', message: '请求超时', module: 'core', enumName: 'REQUEST_TIMEOUT' },
  TOO_MANY_REQUESTS: { code: 'A10603', message: '请求过多（限流）', module: 'core', enumName: 'TOO_MANY_REQUESTS' },
  UNAUTHORIZED: { code: 'A20001', message: '未登录或 Token 无效', module: 'core', enumName: 'UNAUTHORIZED' },
  TOKEN_INVALID: { code: 'A20003', message: 'Token 无效', i18nKey: 'userinfo.token.invalid', module: 'userinfo', enumName: 'TOKEN_INVALID', httpStatus: 401 },
  FORBIDDEN: { code: 'A20101', message: '无权限访问', module: 'core', enumName: 'FORBIDDEN' },
  MFA_REQUIRED: { code: 'A20108', message: '需要双因素认证', i18nKey: 'userinfo.mfa.required', module: 'userinfo', enumName: 'MFA_REQUIRED', httpStatus: 401 },
  MFA_INVALID: { code: 'A20109', message: '双因素认证码无效', i18nKey: 'userinfo.mfa.invalid', module: 'userinfo', enumName: 'MFA_INVALID', httpStatus: 401 },
  ACCOUNT_LOCKED: { code: 'A20110', message: '账号已锁定，请稍后再试', i18nKey: 'userinfo.account.locked', module: 'userinfo', enumName: 'ACCOUNT_LOCKED', httpStatus: 401 },
  SENSITIVE_VERIFY_REQUIRED: { code: 'A20120', message: '敏感操作需要二次认证', i18nKey: 'userinfo.sensitive.verify.required', module: 'userinfo', enumName: 'SENSITIVE_VERIFY_REQUIRED', httpStatus: 401 },
  SENSITIVE_VERIFY_EXPIRED: { code: 'A20121', message: '二次认证已过期，请重新验证', i18nKey: 'userinfo.sensitive.verify.expired', module: 'userinfo', enumName: 'SENSITIVE_VERIFY_EXPIRED', httpStatus: 401 },
  SENSITIVE_VERIFY_PASSWORD_INCORRECT: { code: 'A20122', message: '二次认证密码错误', i18nKey: 'userinfo.sensitive.verify.password.incorrect', module: 'userinfo', enumName: 'SENSITIVE_VERIFY_PASSWORD_INCORRECT', httpStatus: 401 },
  SECONDARY_AUTH_REQUIRED: { code: 'A20123', message: '需要二级认证', i18nKey: 'userinfo.secondary.auth.required', module: 'userinfo', enumName: 'SECONDARY_AUTH_REQUIRED', httpStatus: 401 },
  SECONDARY_AUTH_EXPIRED: { code: 'A20124', message: '二级认证已过期', i18nKey: 'userinfo.secondary.auth.expired', module: 'userinfo', enumName: 'SECONDARY_AUTH_EXPIRED', httpStatus: 401 },
  USER_NOT_ACTIVATED: { code: 'A20125', message: '账号未激活（用户已注册但未验证邮箱/手机）', i18nKey: 'userinfo.user.not.activated', module: 'userinfo', enumName: 'USER_NOT_ACTIVATED', httpStatus: 403 },
  USER_SUSPENDED: { code: 'A20126', message: '账号已暂停（临时停用，可由管理员恢复）', i18nKey: 'userinfo.user.suspended', module: 'userinfo', enumName: 'USER_SUSPENDED', httpStatus: 403 },
  USER_RESIGNED: { code: 'A20127', message: '账号已离职（终态，不可再激活）', i18nKey: 'userinfo.user.resigned', module: 'userinfo', enumName: 'USER_RESIGNED', httpStatus: 403 },
  DEVICE_SESSION_LIMIT_EXCEEDED: { code: 'A20128', message: '该设备类型会话数已达上限', i18nKey: 'userinfo.device.session.limit.exceeded', module: 'userinfo', enumName: 'DEVICE_SESSION_LIMIT_EXCEEDED', httpStatus: 401 },
  SIGNATURE_REQUIRED: { code: 'A20129', message: '缺少签名参数（X-Timestamp/X-Nonce/X-Signature 任一缺失）', i18nKey: 'userinfo.signature.required', module: 'userinfo', enumName: 'SIGNATURE_REQUIRED', httpStatus: 401 },
  SIGNATURE_INVALID: { code: 'A20130', message: '签名无效（签名值不匹配）', i18nKey: 'userinfo.signature.invalid', module: 'userinfo', enumName: 'SIGNATURE_INVALID', httpStatus: 401 },
  SIGNATURE_EXPIRED: { code: 'A20131', message: '签名已过期（时间戳超出有效期窗口）', i18nKey: 'userinfo.signature.expired', module: 'userinfo', enumName: 'SIGNATURE_EXPIRED', httpStatus: 401 },
  NONCE_REUSED: { code: 'A20132', message: 'Nonce 已被使用（疑似重放攻击）', i18nKey: 'userinfo.nonce.reused', module: 'userinfo', enumName: 'NONCE_REUSED', httpStatus: 401 },
  USER_BANNED: { code: 'A20133', message: '账号已被封禁', i18nKey: 'userinfo.user.banned', module: 'userinfo', enumName: 'USER_BANNED', httpStatus: 403 },
  USER_BANNED_PERMANENT: { code: 'A20134', message: '账号已被永久封禁', i18nKey: 'userinfo.user.banned.permanent', module: 'userinfo', enumName: 'USER_BANNED_PERMANENT', httpStatus: 403 },
  CANNOT_BAN_ADMIN: { code: 'A20135', message: '不能封禁管理员', i18nKey: 'userinfo.cannot.ban.admin', module: 'userinfo', enumName: 'CANNOT_BAN_ADMIN', httpStatus: 403 },
  CANNOT_BAN_SELF: { code: 'A20136', message: '不能封禁自己', i18nKey: 'userinfo.cannot.ban.self', module: 'userinfo', enumName: 'CANNOT_BAN_SELF', httpStatus: 400 },
  SSO_DOMAIN_NOT_TRUSTED: { code: 'A20137', message: '不受信的跨域来源', i18nKey: 'userinfo.sso.domain.not.trusted', module: 'userinfo', enumName: 'SSO_DOMAIN_NOT_TRUSTED', httpStatus: 403 },
  SSO_TOKEN_EXCHANGE_FAILED: { code: 'A20138', message: '令牌交换失败', i18nKey: 'userinfo.sso.token.exchange.failed', module: 'userinfo', enumName: 'SSO_TOKEN_EXCHANGE_FAILED', httpStatus: 401 },
  CORS_PREFLIGHT_FAILED: { code: 'A20139', message: 'CORS 预检失败', i18nKey: 'userinfo.cors.preflight.failed', module: 'userinfo', enumName: 'CORS_PREFLIGHT_FAILED', httpStatus: 403 },
  REMEMBER_ME_EXPIRED: { code: 'A20140', message: 'Remember-Me 已过期（超过最大续期天数）', i18nKey: 'userinfo.remember.me.expired', module: 'userinfo', enumName: 'REMEMBER_ME_EXPIRED', httpStatus: 401 },
  REMEMBER_ME_INVALID: { code: 'A20141', message: 'Remember-Me 无效（Cookie 校验失败或会话不存在）', i18nKey: 'userinfo.remember.me.invalid', module: 'userinfo', enumName: 'REMEMBER_ME_INVALID', httpStatus: 401 },
  SSO_DEVICE_CODE_INVALID: { code: 'A20142', message: '设备登录码无效或已过期', i18nKey: 'userinfo.sso.device.code.invalid', module: 'userinfo', enumName: 'SSO_DEVICE_CODE_INVALID', httpStatus: 401 },
  SSO_DEVICE_CODE_CONSUMED: { code: 'A20143', message: '设备登录码已被使用（一次性码防重放）', i18nKey: 'userinfo.sso.device.code.consumed', module: 'userinfo', enumName: 'SSO_DEVICE_CODE_CONSUMED', httpStatus: 401 },
  LIFECYCLE_TRANSITION_INVALID: { code: 'A20144', message: '非法状态流转（如终态 REISIGNED 不可再流转到任何状态）', i18nKey: 'userinfo.lifecycle.transition.invalid', module: 'userinfo', enumName: 'LIFECYCLE_TRANSITION_INVALID', httpStatus: 400 },
  SESSION_NOT_FOUND: { code: 'A20145', message: '会话不存在或已过期', i18nKey: 'userinfo.session.not.found', module: 'userinfo', enumName: 'SESSION_NOT_FOUND', httpStatus: 404 },
  DEVICE_NOT_FOUND: { code: 'A20146', message: '设备不存在或已被下线', i18nKey: 'userinfo.device.not.found', module: 'userinfo', enumName: 'DEVICE_NOT_FOUND', httpStatus: 404 },
  CORE_INTERNAL_ERROR: { code: 'B01051', message: '系统内部错误（原 ResponseCode.INTERNAL_ERROR 100500）', i18nKey: 'internal.error', module: 'core', enumName: 'INTERNAL_ERROR', httpStatus: 500 },
  SYSTEM_ERROR: { code: 'B01052', message: '系统错误', i18nKey: 'system.error', module: 'core', enumName: 'SYSTEM_ERROR', httpStatus: 500 },
  DATABASE_ERROR: { code: 'B01053', message: '数据库错误', i18nKey: 'database.error', module: 'core', enumName: 'DATABASE_ERROR', httpStatus: 500 },
  CORE_SERVICE_UNAVAILABLE: { code: 'B01054', message: '服务不可用（原 ResponseCode.SERVICE_UNAVAILABLE 100503，可恢复）', i18nKey: 'service.unavailable', module: 'core', enumName: 'SERVICE_UNAVAILABLE', httpStatus: 503, retryable: true },
  NETWORK_ERROR: { code: 'B01055', message: '网络错误', i18nKey: 'network.error', module: 'core', enumName: 'NETWORK_ERROR', httpStatus: 500 },
  CACHE_ERROR: { code: 'B01056', message: '缓存错误', i18nKey: 'cache.error', module: 'core', enumName: 'CACHE_ERROR', httpStatus: 500 },
  MQ_ERROR: { code: 'B01057', message: '消息队列错误', i18nKey: 'mq.error', module: 'core', enumName: 'MQ_ERROR', httpStatus: 500 },
  STORAGE_ERROR: { code: 'B01058', message: '存储错误', i18nKey: 'storage.error', module: 'core', enumName: 'STORAGE_ERROR', httpStatus: 500 },
  INFRA_SERVICE_UNAVAILABLE: { code: 'B01059', message: '基础设施服务不可用（可恢复）', i18nKey: 'infrastructure.service.unavailable', module: 'core', enumName: 'INFRA_SERVICE_UNAVAILABLE', httpStatus: 503, retryable: true },
  CIRCUIT_BREAKER_OPEN: { code: 'B01060', message: '熔断器开启（可恢复：等待熔断恢复后重试）', i18nKey: 'circuit.breaker.open', module: 'core', enumName: 'CIRCUIT_BREAKER_OPEN', httpStatus: 503, retryable: true },
  RESOURCE_EXHAUSTED: { code: 'B01061', message: '资源耗尽（可恢复：降低频率后重试）', i18nKey: 'resource.exhausted', module: 'core', enumName: 'RESOURCE_EXHAUSTED', httpStatus: 429, retryable: true },
  SERVICE_DEGRADED: { code: 'B01062', message: '服务降级（可恢复）', i18nKey: 'service.degraded', module: 'core', enumName: 'SERVICE_DEGRADED', httpStatus: 503, retryable: true },
  BAD_GATEWAY: { code: 'B02051', message: '网关错误（原 ResponseCode.BAD_GATEWAY 100502）', i18nKey: 'bad.gateway', module: 'core', enumName: 'BAD_GATEWAY', httpStatus: 502 },
  GATEWAY_TIMEOUT: { code: 'B02052', message: '网关超时（原 ResponseCode.GATEWAY_TIMEOUT 100504）', i18nKey: 'gateway.timeout', module: 'core', enumName: 'GATEWAY_TIMEOUT', httpStatus: 504 },
  OTHER_EXTERNAL_ERROR: { code: 'B02053', message: '其他外部服务错误', i18nKey: 'other.external.error', module: 'core', enumName: 'OTHER_EXTERNAL_ERROR', httpStatus: 502 },
  EXTERNAL_SERVICE_TIMEOUT: { code: 'B02054', message: '外部服务超时', i18nKey: 'external.service.timeout', module: 'core', enumName: 'EXTERNAL_SERVICE_TIMEOUT', httpStatus: 504 },
  EXTERNAL_SERVICE_REJECTED: { code: 'B02055', message: '外部服务拒绝', i18nKey: 'external.service.rejected', module: 'core', enumName: 'EXTERNAL_SERVICE_REJECTED', httpStatus: 502 },
  NOTIFY_ERROR: { code: 'B02056', message: '通知发送失败', i18nKey: 'notify.error', module: 'core', enumName: 'NOTIFY_ERROR', httpStatus: 500 },
  INTERNAL_ERROR: { code: 'B10201', message: '系统内部错误', module: 'core', enumName: 'INTERNAL_ERROR' },
  SERVICE_UNAVAILABLE: { code: 'B10202', message: '服务暂不可用', module: 'core', enumName: 'SERVICE_UNAVAILABLE' },
  USER_NOT_FOUND: { code: 'B30001', message: '用户不存在', i18nKey: 'userinfo.user.not.found', module: 'userinfo', enumName: 'USER_NOT_FOUND', httpStatus: 404 },
  PASSWORD_INCORRECT: { code: 'B30002', message: '密码错误', i18nKey: 'userinfo.password.incorrect', module: 'userinfo', enumName: 'PASSWORD_INCORRECT' },
  USER_DISABLED: { code: 'B30003', message: '用户已停用', i18nKey: 'userinfo.user.disabled', module: 'userinfo', enumName: 'USER_DISABLED', httpStatus: 403 },
  USERNAME_DUPLICATE: { code: 'B30005', message: '用户名已存在', i18nKey: 'userinfo.username.duplicate', module: 'userinfo', enumName: 'USERNAME_DUPLICATE' },
  CAPTCHA_INVALID: { code: 'B30007', message: '验证码无效或已过期', i18nKey: 'userinfo.captcha.invalid', module: 'userinfo', enumName: 'CAPTCHA_INVALID' },
  CAPTCHA_REQUIRED: { code: 'B30008', message: '请输入验证码', i18nKey: 'userinfo.captcha.required', module: 'userinfo', enumName: 'CAPTCHA_REQUIRED' },
  MFA_NOT_BOUND: { code: 'B30009', message: '用户未绑定双因素认证', i18nKey: 'userinfo.mfa.not.bound', module: 'userinfo', enumName: 'MFA_NOT_BOUND' },
  OLD_PASSWORD_INCORRECT: { code: 'B30010', message: '原密码错误', i18nKey: 'userinfo.password.old.incorrect', module: 'userinfo', enumName: 'OLD_PASSWORD_INCORRECT' },
  PASSWORD_SAME_AS_OLD: { code: 'B30011', message: '新密码不能与旧密码相同', i18nKey: 'userinfo.password.same.as.old', module: 'userinfo', enumName: 'PASSWORD_SAME_AS_OLD' },
  USERINFO_PASSWORD_TOO_WEAK: { code: 'B30012', message: '密码强度不足', i18nKey: 'userinfo.password.too.weak', module: 'userinfo', enumName: 'PASSWORD_TOO_WEAK' },
  USERINFO_PASSWORD_REUSED: { code: 'B30013', message: '不能使用最近使用过的密码', i18nKey: 'userinfo.password.reused', module: 'userinfo', enumName: 'PASSWORD_REUSED' },
  MFA_ALREADY_BOUND: { code: 'B30014', message: '用户已绑定双因素认证，请勿重复绑定', i18nKey: 'userinfo.mfa.already.bound', module: 'userinfo', enumName: 'MFA_ALREADY_BOUND' },
  OAUTH2_CODE_INVALID: { code: 'B30016', message: '授权码无效或已过期', i18nKey: 'userinfo.oauth2.code.invalid', module: 'userinfo', enumName: 'OAUTH2_CODE_INVALID', httpStatus: 401 },
  OAUTH2_CLIENT_INVALID: { code: 'B30017', message: '客户端 ID 无效', i18nKey: 'userinfo.oauth2.client.invalid', module: 'userinfo', enumName: 'OAUTH2_CLIENT_INVALID', httpStatus: 401 },
  OAUTH2_REDIRECT_URI_MISMATCH: { code: 'B30018', message: '回调地址不匹配', i18nKey: 'userinfo.oauth2.redirect.uri.mismatch', module: 'userinfo', enumName: 'OAUTH2_REDIRECT_URI_MISMATCH', httpStatus: 401 },
  IP_BLOCKED: { code: 'B30019', message: 'IP 登录失败次数过多被临时封禁', i18nKey: 'userinfo.login.ip.blocked', module: 'userinfo', enumName: 'IP_BLOCKED', httpStatus: 403 },
  OAUTH2_PKCE_VERIFIER_INVALID: { code: 'B30020', message: 'PKCE code_verifier 无效', i18nKey: 'userinfo.oauth2.pkce.verifier.invalid', module: 'userinfo', enumName: 'OAUTH2_PKCE_VERIFIER_INVALID', httpStatus: 401 },
  IMPORT_FILE_EMPTY: { code: 'B30021', message: '导入文件为空', i18nKey: 'userinfo.import.file.empty', module: 'userinfo', enumName: 'IMPORT_FILE_EMPTY' },
  IMPORT_DATA_EMPTY: { code: 'B30022', message: '导入文件无数据', i18nKey: 'userinfo.import.data.empty', module: 'userinfo', enumName: 'IMPORT_DATA_EMPTY' },
  IMPORT_EXCEEDS_LIMIT: { code: 'B30023', message: '导入数量超过上限', i18nKey: 'userinfo.import.exceeds.limit', module: 'userinfo', enumName: 'IMPORT_EXCEEDS_LIMIT' },
  IMPORT_USERNAME_EMPTY: { code: 'B30024', message: '导入用户名为空', i18nKey: 'userinfo.import.username.empty', module: 'userinfo', enumName: 'IMPORT_USERNAME_EMPTY' },
  IMPORT_REALNAME_EMPTY: { code: 'B30025', message: '导入真实姓名为空', i18nKey: 'userinfo.import.realname.empty', module: 'userinfo', enumName: 'IMPORT_REALNAME_EMPTY' },
  IMPORT_PASSWORD_EMPTY: { code: 'B30026', message: '导入密码为空', i18nKey: 'userinfo.import.password.empty', module: 'userinfo', enumName: 'IMPORT_PASSWORD_EMPTY' },
  IMPORT_USERNAME_DUPLICATE: { code: 'B30027', message: '导入用户名已存在', i18nKey: 'userinfo.import.username.duplicate', module: 'userinfo', enumName: 'IMPORT_USERNAME_DUPLICATE' },
  PARAM_INVALID: { code: 'B30028', message: '参数校验失败', i18nKey: 'userinfo.param.invalid', module: 'userinfo', enumName: 'PARAM_INVALID' },
  IMPORT_LEADER_NOT_FOUND: { code: 'B30029', message: '导入上级用户不存在', i18nKey: 'userinfo.import.leader.not.found', module: 'userinfo', enumName: 'IMPORT_LEADER_NOT_FOUND' },
  IMPORT_READ_FAILED: { code: 'B30030', message: '导入文件读取失败', i18nKey: 'userinfo.import.read.failed', module: 'userinfo', enumName: 'IMPORT_READ_FAILED' },
  INTERNAL_ACCESS_FORBIDDEN: { code: 'B30031', message: '内部接口访问被拒绝（缺少 X-Internal-Call 标记，P0-6）', i18nKey: 'userinfo.internal.access.forbidden', module: 'userinfo', enumName: 'INTERNAL_ACCESS_FORBIDDEN', httpStatus: 403 },
  OAUTH2_SCOPE_INVALID: { code: 'B30032', message: 'OAuth2 scope 超出客户端授权范围（P1-3）', i18nKey: 'userinfo.oauth2.scope.invalid', module: 'userinfo', enumName: 'OAUTH2_SCOPE_INVALID', httpStatus: 401 },
  USER_UPDATE_CONFLICT: { code: 'B30033', message: '数据已被其他用户修改，请刷新后重试（乐观锁冲突，P1-6）', i18nKey: 'userinfo.user.update.conflict', module: 'userinfo', enumName: 'USER_UPDATE_CONFLICT', httpStatus: 409 },
  OAUTH2_STATE_INVALID: { code: 'B30034', message: 'OAuth2 state 参数无效或已过期', i18nKey: 'userinfo.oauth2.state.invalid', module: 'userinfo', enumName: 'OAUTH2_STATE_INVALID', httpStatus: 401 },
  DEPARTMENT_NOT_FOUND: { code: 'B30101', message: '部门不存在', module: 'userinfo', enumName: 'DEPARTMENT_NOT_FOUND', httpStatus: 404 },
  DEPARTMENT_HAS_CHILDREN: { code: 'B30102', message: '该部门下存在子部门，无法删除', module: 'userinfo', enumName: 'DEPARTMENT_HAS_CHILDREN' },
  DEPARTMENT_HAS_USERS: { code: 'B30103', message: '该部门下存在人员，无法删除', module: 'userinfo', enumName: 'DEPARTMENT_HAS_USERS' },
  DEPARTMENT_CODE_DUPLICATE: { code: 'B30104', message: '部门编码已存在', module: 'userinfo', enumName: 'DEPARTMENT_CODE_DUPLICATE' },
  COMPANY_NOT_FOUND: { code: 'B30105', message: '公司不存在', module: 'userinfo', enumName: 'COMPANY_NOT_FOUND', httpStatus: 404 },
  COMPANY_CODE_DUPLICATE: { code: 'B30106', message: '公司编码已存在', module: 'userinfo', enumName: 'COMPANY_CODE_DUPLICATE' },
  USER_DEPT_NOT_FOUND: { code: 'B30107', message: '用户-部门关联不存在', module: 'userinfo', enumName: 'USER_DEPT_NOT_FOUND', httpStatus: 404 },
  ROLE_NOT_FOUND: { code: 'B32001', message: '角色不存在', module: 'userinfo', enumName: 'ROLE_NOT_FOUND', httpStatus: 404 },
  ROLE_CODE_DUPLICATE: { code: 'B32002', message: '角色编码已存在', module: 'userinfo', enumName: 'ROLE_CODE_DUPLICATE' },
  ROLE_BUILTIN_CANNOT_DELETE: { code: 'B32003', message: '内置角色不允许删除', module: 'userinfo', enumName: 'ROLE_BUILTIN_CANNOT_DELETE' },
  ROLE_HAS_USERS: { code: 'B32004', message: '该角色下存在用户，无法删除', module: 'userinfo', enumName: 'ROLE_HAS_USERS' },
  PERMISSION_NOT_FOUND: { code: 'B32005', message: '权限不存在', i18nKey: 'userinfo.permission.not.found', module: 'userinfo', enumName: 'PERMISSION_NOT_FOUND', httpStatus: 404 },
  MENU_NOT_FOUND: { code: 'B32006', message: '菜单不存在', module: 'userinfo', enumName: 'MENU_NOT_FOUND', httpStatus: 404 },
  POST_NOT_FOUND: { code: 'B32007', message: '岗位不存在', module: 'userinfo', enumName: 'POST_NOT_FOUND', httpStatus: 404 },
  POST_CODE_DUPLICATE: { code: 'B32008', message: '岗位编码已存在', module: 'userinfo', enumName: 'POST_CODE_DUPLICATE' },
  LANGUAGE_NOT_FOUND: { code: 'B32009', message: '语言不存在', module: 'userinfo', enumName: 'LANGUAGE_NOT_FOUND', httpStatus: 404 },
  LANGUAGE_CODE_DUPLICATE: { code: 'B32010', message: '语言编码已存在', module: 'userinfo', enumName: 'LANGUAGE_CODE_DUPLICATE' },
  MENU_HAS_CHILDREN: { code: 'B32011', message: '该菜单下存在子菜单，无法删除', module: 'userinfo', enumName: 'MENU_HAS_CHILDREN' },
  SELF_REGISTRATION_DISABLED: { code: 'B33001', message: '自助注册功能未开启', i18nKey: 'userinfo.self.registration.disabled', module: 'userinfo', enumName: 'SELF_REGISTRATION_DISABLED' },
  VERIFY_CODE_INVALID: { code: 'B33002', message: '验证码已过期或无效', i18nKey: 'userinfo.verify.code.invalid', module: 'userinfo', enumName: 'VERIFY_CODE_INVALID' },
  VERIFY_CODE_RATE_LIMITED: { code: 'B33003', message: '验证码发送过于频繁', i18nKey: 'userinfo.verify.code.rate.limited', module: 'userinfo', enumName: 'VERIFY_CODE_RATE_LIMITED' },
  FORGOT_PASSWORD_USER_NOT_FOUND: { code: 'B33004', message: '找回密码账号不存在', i18nKey: 'userinfo.forgot.password.user.not.found', module: 'userinfo', enumName: 'FORGOT_PASSWORD_USER_NOT_FOUND' },
  FORGOT_PASSWORD_PHONE_MISMATCH: { code: 'B33005', message: '找回密码手机号与账号不匹配', i18nKey: 'userinfo.forgot.password.phone.mismatch', module: 'userinfo', enumName: 'FORGOT_PASSWORD_PHONE_MISMATCH' },
  ACCOUNT_NOT_LOCKED: { code: 'B33006', message: '账号未锁定，无需解锁', i18nKey: 'userinfo.account.not.locked', module: 'userinfo', enumName: 'ACCOUNT_NOT_LOCKED' },
  ACCOUNT_UNLOCK_FAILED: { code: 'B33007', message: '账号解锁失败，验证信息不匹配', i18nKey: 'userinfo.account.unlock.failed', module: 'userinfo', enumName: 'ACCOUNT_UNLOCK_FAILED' },
  ACCOUNT_UNLOCK_VERIFY_CODE_INVALID: { code: 'B33008', message: '账号解锁验证码已过期或无效', i18nKey: 'userinfo.account.unlock.verify.code.invalid', module: 'userinfo', enumName: 'ACCOUNT_UNLOCK_VERIFY_CODE_INVALID' },
  SOCIAL_AUTH_DISABLED: { code: 'B34001', message: '社交认证功能未开启', i18nKey: 'userinfo.social.auth.disabled', module: 'userinfo', enumName: 'SOCIAL_AUTH_DISABLED' },
  SOCIAL_PLATFORM_NOT_SUPPORTED: { code: 'B34002', message: '不支持的社交平台', i18nKey: 'userinfo.social.platform.not.supported', module: 'userinfo', enumName: 'SOCIAL_PLATFORM_NOT_SUPPORTED' },
  SOCIAL_BIND_EXISTS: { code: 'B34003', message: '该社交账号已绑定到其他用户', i18nKey: 'userinfo.social.bind.exists', module: 'userinfo', enumName: 'SOCIAL_BIND_EXISTS' },
  SOCIAL_ACCOUNT_NOT_BOUND: { code: 'B34004', message: '社交账号未绑定', i18nKey: 'userinfo.social.account.not.bound', module: 'userinfo', enumName: 'SOCIAL_ACCOUNT_NOT_BOUND' },
  SOCIAL_AUTH_FAILED: { code: 'B34005', message: '社交认证失败', i18nKey: 'userinfo.social.auth.failed', module: 'userinfo', enumName: 'SOCIAL_AUTH_FAILED' },
  SOCIAL_AUTH_CSRF_FAILED: { code: 'B34006', message: '社交认证 CSRF 校验失败（state 无效或已消费）', i18nKey: 'userinfo.social.auth.csrf.failed', module: 'userinfo', enumName: 'SOCIAL_AUTH_CSRF_FAILED', httpStatus: 401 },
  LDAP_SYNC_DISABLED: { code: 'B35001', message: 'LDAP 同步功能未开启', i18nKey: 'userinfo.ldap.sync.disabled', module: 'userinfo', enumName: 'LDAP_SYNC_DISABLED' },
  LDAP_SYNC_IN_PROGRESS: { code: 'B35002', message: 'LDAP 同步正在进行中', i18nKey: 'userinfo.ldap.sync.in.progress', module: 'userinfo', enumName: 'LDAP_SYNC_IN_PROGRESS' },
  LDAP_SYNC_FAILED: { code: 'B35003', message: 'LDAP 同步失败', i18nKey: 'userinfo.ldap.sync.failed', module: 'userinfo', enumName: 'LDAP_SYNC_FAILED' },
  LDAP_CONNECTION_FAILED: { code: 'B35004', message: 'LDAP 连接失败', i18nKey: 'userinfo.ldap.connection.failed', module: 'userinfo', enumName: 'LDAP_CONNECTION_FAILED' },
  SCIM_DISABLED: { code: 'B36001', message: 'SCIM 服务未开启', i18nKey: 'userinfo.scim.disabled', module: 'userinfo', enumName: 'SCIM_DISABLED' },
  SCIM_AUTH_FAILED: { code: 'B36002', message: 'SCIM 认证失败（Bearer Token 无效）', i18nKey: 'userinfo.scim.auth.failed', module: 'userinfo', enumName: 'SCIM_AUTH_FAILED', httpStatus: 401 },
  SCIM_USER_NOT_FOUND: { code: 'B36003', message: 'SCIM 用户不存在', i18nKey: 'userinfo.scim.user.not.found', module: 'userinfo', enumName: 'SCIM_USER_NOT_FOUND', httpStatus: 404 },
  SCIM_FILTER_PARSE_ERROR: { code: 'B36004', message: 'SCIM 过滤表达式解析错误', i18nKey: 'userinfo.scim.filter.parse.error', module: 'userinfo', enumName: 'SCIM_FILTER_PARSE_ERROR' },
  SCIM_PATCH_INVALID: { code: 'B36005', message: 'SCIM PATCH 操作无效', i18nKey: 'userinfo.scim.patch.invalid', module: 'userinfo', enumName: 'SCIM_PATCH_INVALID' },
  SAML_CONFIG_MISSING: { code: 'B37001', message: 'SAML 配置缺失（IdP 端点或证书未配置）', i18nKey: 'userinfo.saml.config.missing', module: 'userinfo', enumName: 'SAML_CONFIG_MISSING' },
  SAML_RESPONSE_INVALID: { code: 'B37002', message: 'SAML Response 无效或解析失败', i18nKey: 'userinfo.saml.response.invalid', module: 'userinfo', enumName: 'SAML_RESPONSE_INVALID' },
  SAML_SIGNATURE_MISSING: { code: 'B37003', message: 'SAML 签名缺失', i18nKey: 'userinfo.saml.signature.missing', module: 'userinfo', enumName: 'SAML_SIGNATURE_MISSING' },
  SAML_SIGNATURE_INVALID: { code: 'B37004', message: 'SAML 签名验证失败', i18nKey: 'userinfo.saml.signature.invalid', module: 'userinfo', enumName: 'SAML_SIGNATURE_INVALID' },
  SAML_ASSERTION_EXPIRED: { code: 'B37005', message: 'SAML 断言已过期', i18nKey: 'userinfo.saml.assertion.expired', module: 'userinfo', enumName: 'SAML_ASSERTION_EXPIRED' },
  SAML_ASSERTION_NOT_YET_VALID: { code: 'B37006', message: 'SAML 断言尚未生效', i18nKey: 'userinfo.saml.assertion.not.yet.valid', module: 'userinfo', enumName: 'SAML_ASSERTION_NOT_YET_VALID' },
  SAML_AUDIENCE_MISMATCH: { code: 'B37007', message: 'SAML Audience 不匹配', i18nKey: 'userinfo.saml.audience.mismatch', module: 'userinfo', enumName: 'SAML_AUDIENCE_MISMATCH' },
  SAML_SSO_INIT_FAILED: { code: 'B37008', message: 'SAML SSO 发起失败', i18nKey: 'userinfo.saml.sso.init.failed', module: 'userinfo', enumName: 'SAML_SSO_INIT_FAILED' },
  OIDC_CONFIG_INVALID: { code: 'B38001', message: 'OIDC 配置无效', i18nKey: 'userinfo.oidc.config.invalid', module: 'userinfo', enumName: 'OIDC_CONFIG_INVALID' },
  OIDC_NONCE_INVALID: { code: 'B38002', message: 'OIDC nonce 无效或已使用', i18nKey: 'userinfo.oidc.nonce.invalid', module: 'userinfo', enumName: 'OIDC_NONCE_INVALID' },
  OIDC_ID_TOKEN_ISSUE_FAILED: { code: 'B38003', message: 'OIDC ID Token 签发失败', i18nKey: 'userinfo.oidc.id.token.issue.failed', module: 'userinfo', enumName: 'OIDC_ID_TOKEN_ISSUE_FAILED' },
  WEBAUTHN_DISABLED: { code: 'B39001', message: 'WebAuthn 功能未开启', i18nKey: 'userinfo.webauthn.disabled', module: 'userinfo', enumName: 'WEBAUTHN_DISABLED' },
  WEBAUTHN_CHALLENGE_EXPIRED: { code: 'B39002', message: 'WebAuthn 挑战码已过期', i18nKey: 'userinfo.webauthn.challenge.expired', module: 'userinfo', enumName: 'WEBAUTHN_CHALLENGE_EXPIRED' },
  WEBAUTHN_CHALLENGE_TYPE_MISMATCH: { code: 'B39003', message: 'WebAuthn 挑战码类型不匹配', i18nKey: 'userinfo.webauthn.challenge.type.mismatch', module: 'userinfo', enumName: 'WEBAUTHN_CHALLENGE_TYPE_MISMATCH' },
  WEBAUTHN_CHALLENGE_USER_MISMATCH: { code: 'B39004', message: 'WebAuthn 挑战码用户不匹配', i18nKey: 'userinfo.webauthn.challenge.user.mismatch', module: 'userinfo', enumName: 'WEBAUTHN_CHALLENGE_USER_MISMATCH' },
  WEBAUTHN_CLIENT_DATA_INVALID: { code: 'B39005', message: 'WebAuthn 客户端数据无效', i18nKey: 'userinfo.webauthn.client.data.invalid', module: 'userinfo', enumName: 'WEBAUTHN_CLIENT_DATA_INVALID' },
  WEBAUTHN_SIGNATURE_INVALID: { code: 'B39006', message: 'WebAuthn 签名验证失败', i18nKey: 'userinfo.webauthn.signature.invalid', module: 'userinfo', enumName: 'WEBAUTHN_SIGNATURE_INVALID' },
  WEBAUTHN_CREDENTIAL_NOT_FOUND: { code: 'B39007', message: 'WebAuthn 凭证不存在', i18nKey: 'userinfo.webauthn.credential.not.found', module: 'userinfo', enumName: 'WEBAUTHN_CREDENTIAL_NOT_FOUND' },
  WEBAUTHN_CREDENTIAL_EXISTS: { code: 'B39008', message: 'WebAuthn 凭证已存在', i18nKey: 'userinfo.webauthn.credential.exists', module: 'userinfo', enumName: 'WEBAUTHN_CREDENTIAL_EXISTS' },
  WEBAUTHN_CREDENTIAL_NOT_BELONG_TO_USER: { code: 'B39009', message: 'WebAuthn 凭证不属于当前用户', i18nKey: 'userinfo.webauthn.credential.not.belong.to.user', module: 'userinfo', enumName: 'WEBAUTHN_CREDENTIAL_NOT_BELONG_TO_USER' },
  WEBAUTHN_CREDENTIAL_LIMIT_REACHED: { code: 'B39010', message: 'WebAuthn 凭证数已达上限', i18nKey: 'userinfo.webauthn.credential.limit.reached', module: 'userinfo', enumName: 'WEBAUTHN_CREDENTIAL_LIMIT_REACHED' },
  WORKFLOW_TEMPLATE_NOT_FOUND: { code: 'B70001', message: 'Template not found', i18nKey: 'workflow.template.not.found', module: 'workflow', enumName: 'TEMPLATE_NOT_FOUND', httpStatus: 404 },
  WORKFLOW_TEMPLATE_CODE_DUPLICATE: { code: 'B70002', message: 'Template code duplicate', i18nKey: 'workflow.template.code.duplicate', module: 'workflow', enumName: 'TEMPLATE_CODE_DUPLICATE' },
  TEMPLATE_DEPLOYED_CANNOT_DELETE: { code: 'B70003', message: 'Template deployed cannot delete', i18nKey: 'workflow.template.deployed.cannot.delete', module: 'workflow', enumName: 'TEMPLATE_DEPLOYED_CANNOT_DELETE' },
  DEFINITION_NOT_FOUND: { code: 'B70004', message: 'Definition not found', i18nKey: 'workflow.definition.not.found', module: 'workflow', enumName: 'DEFINITION_NOT_FOUND', httpStatus: 404 },
  BPMN_PARSE_ERROR: { code: 'B70005', message: 'Bpmn parse error', i18nKey: 'workflow.bpmn.parse.error', module: 'workflow', enumName: 'BPMN_PARSE_ERROR' },
  UNSUPPORTED_BPMN_ELEMENT: { code: 'B70006', message: 'Unsupported bpmn element (fail-fast on deploy)', i18nKey: 'workflow.bpmn.unsupported.element', module: 'workflow', enumName: 'UNSUPPORTED_BPMN_ELEMENT' },
  INSTANCE_NOT_FOUND: { code: 'B71001', message: 'Instance not found', i18nKey: 'workflow.instance.not.found', module: 'workflow', enumName: 'INSTANCE_NOT_FOUND', httpStatus: 404 },
  INSTANCE_STATUS_INVALID: { code: 'B71002', message: 'Instance status invalid', i18nKey: 'workflow.instance.status.invalid', module: 'workflow', enumName: 'INSTANCE_STATUS_INVALID' },
  INSTANCE_ALREADY_FINISHED: { code: 'B71003', message: 'Instance already finished', i18nKey: 'workflow.instance.already.finished', module: 'workflow', enumName: 'INSTANCE_ALREADY_FINISHED' },
  TASK_NOT_FOUND: { code: 'B72001', message: 'Task not found', i18nKey: 'workflow.task.not.found', module: 'workflow', enumName: 'TASK_NOT_FOUND', httpStatus: 404 },
  TASK_NO_PERMISSION: { code: 'B72002', message: 'Task no permission', i18nKey: 'workflow.task.no.permission', module: 'workflow', enumName: 'TASK_NO_PERMISSION', httpStatus: 403 },
  TASK_ALREADY_HANDLED: { code: 'B72003', message: 'Task already handled', i18nKey: 'workflow.task.already.handled', module: 'workflow', enumName: 'TASK_ALREADY_HANDLED' },
  TASK_APPROVER_DUPLICATE: { code: 'B72004', message: 'Task approver duplicate', i18nKey: 'workflow.task.approver.duplicate', module: 'workflow', enumName: 'TASK_APPROVER_DUPLICATE' },
  ILLEGAL_STATE_TRANSITION: { code: 'B72005', message: 'Illegal state transition', i18nKey: 'workflow.task.illegal.state.transition', module: 'workflow', enumName: 'ILLEGAL_STATE_TRANSITION' },
  DELEGATE_AUTH_NOT_FOUND: { code: 'B73001', message: 'Delegate auth not found', i18nKey: 'workflow.delegate.auth.not.found', module: 'workflow', enumName: 'DELEGATE_AUTH_NOT_FOUND', httpStatus: 404 },
  DELEGATE_AUTH_EXPIRED: { code: 'B73002', message: 'Delegate auth expired', i18nKey: 'workflow.delegate.auth.expired', module: 'workflow', enumName: 'DELEGATE_AUTH_EXPIRED' },
  CATEGORY_NOT_FOUND: { code: 'B74001', message: 'Category not found', i18nKey: 'workflow.category.not.found', module: 'workflow', enumName: 'CATEGORY_NOT_FOUND', httpStatus: 404 },
  CATEGORY_CODE_DUPLICATE: { code: 'B74002', message: 'Category code duplicate', i18nKey: 'workflow.category.code.duplicate', module: 'workflow', enumName: 'CATEGORY_CODE_DUPLICATE' },
  COMMENT_NOT_FOUND: { code: 'B74003', message: 'Comment not found', i18nKey: 'workflow.comment.not.found', module: 'workflow', enumName: 'COMMENT_NOT_FOUND', httpStatus: 404 },
  ATTACHMENT_NOT_FOUND: { code: 'B74004', message: 'Attachment not found', i18nKey: 'workflow.attachment.not.found', module: 'workflow', enumName: 'ATTACHMENT_NOT_FOUND', httpStatus: 404 },
  SLA_NOT_FOUND: { code: 'B75001', message: 'Sla not found', i18nKey: 'workflow.sla.not.found', module: 'workflow', enumName: 'SLA_NOT_FOUND', httpStatus: 404 },
  SLA_OVERDUE: { code: 'B75002', message: 'Sla overdue', i18nKey: 'workflow.sla.overdue', module: 'workflow', enumName: 'SLA_OVERDUE' },
  URGE_TOO_FREQUENT: { code: 'B75003', message: 'Urge too frequent', i18nKey: 'workflow.urge.too.frequent', module: 'workflow', enumName: 'URGE_TOO_FREQUENT', httpStatus: 429 },
  AI_AGENT_NOT_FOUND: { code: 'B76001', message: 'AI Agent 不存在或未启用', i18nKey: 'workflow.ai.agent.not.found', module: 'workflow', enumName: 'AI_AGENT_NOT_FOUND', httpStatus: 404 },
  AI_AGENT_TIMEOUT: { code: 'B76002', message: 'AI Agent 调用超时', i18nKey: 'workflow.ai.agent.timeout', module: 'workflow', enumName: 'AI_AGENT_TIMEOUT' },
  AI_AGENT_OUTPUT_INVALID: { code: 'B76003', message: 'AI Agent 输出格式非法', i18nKey: 'workflow.ai.agent.output.invalid', module: 'workflow', enumName: 'AI_AGENT_OUTPUT_INVALID' },
  AI_AGENT_EXECUTION_ERROR: { code: 'B76004', message: 'AI Agent 调用异常', i18nKey: 'workflow.ai.agent.execution.error', module: 'workflow', enumName: 'AI_AGENT_EXECUTION_ERROR' },
  CONFIG_NOT_FOUND: { code: 'B90001', message: 'CONFIG_NOT_FOUND', i18nKey: 'system.config.not.found', module: 'system', enumName: 'CONFIG_NOT_FOUND', httpStatus: 404 },
  CONFIG_KEY_DUPLICATE: { code: 'B90002', message: 'CONFIG_KEY_DUPLICATE', i18nKey: 'system.config.key.duplicate', module: 'system', enumName: 'CONFIG_KEY_DUPLICATE' },
  CONFIG_KEY_FORMAT_INVALID: { code: 'B90003', message: 'CONFIG_KEY_FORMAT_INVALID', i18nKey: 'system.config.key.format.invalid', module: 'system', enumName: 'CONFIG_KEY_FORMAT_INVALID' },
  SYSTEM_PARAM_ERROR: { code: 'B90004', message: 'PARAM_ERROR', i18nKey: 'system.param.error', module: 'system', enumName: 'PARAM_ERROR' },
  CONFIG_VALUE_TOO_LONG: { code: 'B90005', message: 'CONFIG_VALUE_TOO_LONG', i18nKey: 'system.config.value.too.long', module: 'system', enumName: 'CONFIG_VALUE_TOO_LONG' },
  CONFIG_VALUE_FORMAT_INVALID: { code: 'B90006', message: 'CONFIG_VALUE_FORMAT_INVALID', i18nKey: 'system.config.value.format.invalid', module: 'system', enumName: 'CONFIG_VALUE_FORMAT_INVALID' },
  CONFIG_BATCH_LIMIT_EXCEEDED: { code: 'B90007', message: 'CONFIG_BATCH_LIMIT_EXCEEDED', i18nKey: 'system.config.batch.limit.exceeded', module: 'system', enumName: 'CONFIG_BATCH_LIMIT_EXCEEDED' },
  VALUE_TYPE_INVALID: { code: 'B90008', message: 'VALUE_TYPE_INVALID', i18nKey: 'system.value.type.invalid', module: 'system', enumName: 'VALUE_TYPE_INVALID' },
  CONFIG_EXPORT_FAILED: { code: 'B90009', message: 'CONFIG_EXPORT_FAILED', i18nKey: 'system.config.export.failed', module: 'system', enumName: 'CONFIG_EXPORT_FAILED' },
  TEMPLATE_NOT_FOUND: { code: 'B91001', message: 'Template not found', i18nKey: 'message.template.not.found', module: 'message', enumName: 'TEMPLATE_NOT_FOUND', httpStatus: 404 },
  TEMPLATE_CODE_DUPLICATE: { code: 'B91002', message: 'Template code duplicate', i18nKey: 'message.template.code.duplicate', module: 'message', enumName: 'TEMPLATE_CODE_DUPLICATE' },
  TEMPLATE_AUDIT_PENDING: { code: 'B91003', message: 'Template audit pending', i18nKey: 'message.template.audit.pending', module: 'message', enumName: 'TEMPLATE_AUDIT_PENDING' },
  TEMPLATE_AUDIT_REJECTED: { code: 'B91004', message: 'Template audit rejected', i18nKey: 'message.template.audit.rejected', module: 'message', enumName: 'TEMPLATE_AUDIT_REJECTED' },
  TEMPLATE_VARIABLE_MISSING: { code: 'B91005', message: 'Template variable missing', i18nKey: 'message.template.variable.missing', module: 'message', enumName: 'TEMPLATE_VARIABLE_MISSING' },
  SNAPSHOT_PARSE_ERROR: { code: 'B91006', message: 'SNAPSHOT_PARSE_ERROR', i18nKey: 'system.dict.snapshot.parse.error', module: 'system', enumName: 'SNAPSHOT_PARSE_ERROR', httpStatus: 500 },
  DICT_TYPE_HAS_ITEMS: { code: 'B91007', message: 'DICT_TYPE_HAS_ITEMS', i18nKey: 'system.dict.type.has.items', module: 'system', enumName: 'DICT_TYPE_HAS_ITEMS' },
  NOTIFICATION_NOT_FOUND: { code: 'B91101', message: 'Notification not found', i18nKey: 'message.notification.not.found', module: 'message', enumName: 'NOTIFICATION_NOT_FOUND', httpStatus: 404 },
  MESSAGE_LOG_NOT_FOUND: { code: 'B91102', message: 'Message log not found', module: 'message', enumName: 'MESSAGE_LOG_NOT_FOUND', httpStatus: 404 },
  MESSAGE_SEND_FAILED: { code: 'B91103', message: 'Message send failed', i18nKey: 'message.send.failed', module: 'message', enumName: 'MESSAGE_SEND_FAILED', httpStatus: 500 },
  MESSAGE_RECALL_FAILED: { code: 'B91104', message: 'Message recall failed', i18nKey: 'message.recall.failed', module: 'message', enumName: 'MESSAGE_RECALL_FAILED' },
  CHANNEL_NOT_CONFIGURED: { code: 'B91201', message: 'Channel not configured', i18nKey: 'message.channel.not.configured', module: 'message', enumName: 'CHANNEL_NOT_CONFIGURED' },
  CHANNEL_SEND_FAILED: { code: 'B91202', message: 'Channel send failed', i18nKey: 'message.channel.send.failed', module: 'message', enumName: 'CHANNEL_SEND_FAILED', httpStatus: 500 },
  ROUTE_RULE_NOT_FOUND: { code: 'B91203', message: 'Route rule not found', i18nKey: 'message.route.rule.not.found', module: 'message', enumName: 'ROUTE_RULE_NOT_FOUND', httpStatus: 404 },
  CHANNEL_BLOCKED: { code: 'B91204', message: 'Channel blocked', i18nKey: 'message.channel.blocked', module: 'message', enumName: 'CHANNEL_BLOCKED' },
  BATCH_NOT_FOUND: { code: 'B91301', message: 'Batch not found', i18nKey: 'message.batch.not.found', module: 'message', enumName: 'BATCH_NOT_FOUND', httpStatus: 404 },
  BATCH_ALREADY_RUNNING: { code: 'B91302', message: 'Batch already running', i18nKey: 'message.batch.already.running', module: 'message', enumName: 'BATCH_ALREADY_RUNNING' },
  CANARY_NOT_FOUND: { code: 'B91303', message: 'Canary not found', i18nKey: 'message.canary.not.found', module: 'message', enumName: 'CANARY_NOT_FOUND', httpStatus: 404 },
  UNSUBSCRIBE_TOKEN_INVALID: { code: 'B91401', message: 'Unsubscribe token invalid', i18nKey: 'message.unsubscribe.token.invalid', module: 'message', enumName: 'UNSUBSCRIBE_TOKEN_INVALID' },
  PREFERENCE_NOT_FOUND: { code: 'B91402', message: 'Preference not found', i18nKey: 'message.preference.not.found', module: 'message', enumName: 'PREFERENCE_NOT_FOUND', httpStatus: 404 },
  FEEDBACK_NOT_FOUND: { code: 'B91403', message: 'Feedback not found', i18nKey: 'message.feedback.not.found', module: 'message', enumName: 'FEEDBACK_NOT_FOUND', httpStatus: 404 },
  CHANNEL_NOT_ENABLED: { code: 'B91501', message: 'Channel not enabled', i18nKey: 'message.channel.not.enabled', module: 'message', enumName: 'CHANNEL_NOT_ENABLED' },
  SEND_RATE_LIMITED: { code: 'B91502', message: 'Send rate limited', i18nKey: 'message.send.rate.limit', module: 'message', enumName: 'SEND_RATE_LIMITED', httpStatus: 429 },
  SEND_DIMENSION_LIMITED: { code: 'B91503', message: 'Send dimension limited', i18nKey: 'message.send.dimension.limit', module: 'message', enumName: 'SEND_DIMENSION_LIMITED', httpStatus: 429 },
  SEND_FREQUENCY_LIMITED: { code: 'B91504', message: 'Send frequency limited', i18nKey: 'message.send.frequency.limit', module: 'message', enumName: 'SEND_FREQUENCY_LIMITED', httpStatus: 429 },
  SEND_QUOTA_EXHAUSTED: { code: 'B91505', message: 'Send quota exhausted', i18nKey: 'message.send.quota.exhausted', module: 'message', enumName: 'SEND_QUOTA_EXHAUSTED', httpStatus: 429 },
  USER_UNSUBSCRIBED: { code: 'B91506', message: 'User unsubscribed', i18nKey: 'message.user.unsubscribed', module: 'message', enumName: 'USER_UNSUBSCRIBED' },
  DND_PERIOD_ACTIVE: { code: 'B91507', message: 'Dnd period active', i18nKey: 'message.dnd.period.active', module: 'message', enumName: 'DND_PERIOD_ACTIVE' },
  DND_DEFER_EXCEED: { code: 'B91508', message: 'Dnd defer exceed', i18nKey: 'message.dnd.defer.exceed', module: 'message', enumName: 'DND_DEFER_EXCEED' },
  MESSAGE_DUPLICATED: { code: 'B91509', message: 'Message duplicated', i18nKey: 'message.duplicated', module: 'message', enumName: 'MESSAGE_DUPLICATED' },
  CHANNEL_SUPPRESSED: { code: 'B91510', message: 'Channel suppressed', i18nKey: 'message.channel.suppressed', module: 'message', enumName: 'CHANNEL_SUPPRESSED' },
  JOB_NOT_FOUND: { code: 'B92001', message: 'Job not found', i18nKey: 'cronjob.job.not.found', module: 'cronjob', enumName: 'JOB_NOT_FOUND', httpStatus: 404 },
  JOB_CODE_DUPLICATE: { code: 'B92002', message: 'Job code duplicate', i18nKey: 'cronjob.job.code.duplicate', module: 'cronjob', enumName: 'JOB_CODE_DUPLICATE' },
  JOB_ALREADY_RUNNING: { code: 'B92003', message: 'Job already running', i18nKey: 'cronjob.job.already.running', module: 'cronjob', enumName: 'JOB_ALREADY_RUNNING' },
  JOB_HANDLER_NOT_FOUND: { code: 'B92004', message: 'Job handler not found', i18nKey: 'cronjob.job.handler.not.found', module: 'cronjob', enumName: 'JOB_HANDLER_NOT_FOUND' },
  JOB_CRON_INVALID: { code: 'B92005', message: 'Job cron invalid', i18nKey: 'cronjob.job.cron.invalid', module: 'cronjob', enumName: 'JOB_CRON_INVALID' },
  DAG_NOT_FOUND: { code: 'B92101', message: 'Dag not found', i18nKey: 'cronjob.dag.not.found', module: 'cronjob', enumName: 'DAG_NOT_FOUND', httpStatus: 404 },
  DAG_CYCLE_DETECTED: { code: 'B92102', message: 'Dag cycle detected', i18nKey: 'cronjob.dag.cycle.detected', module: 'cronjob', enumName: 'DAG_CYCLE_DETECTED' },
  DAG_INSTANCE_NOT_FOUND: { code: 'B92103', message: 'Dag instance not found', i18nKey: 'cronjob.dag.instance.not.found', module: 'cronjob', enumName: 'DAG_INSTANCE_NOT_FOUND', httpStatus: 404 },
  DAG_NODE_NOT_FOUND: { code: 'B92104', message: 'Dag node not found', i18nKey: 'cronjob.dag.node.not.found', module: 'cronjob', enumName: 'DAG_NODE_NOT_FOUND', httpStatus: 404 },
  JOB_HISTORY_NOT_FOUND: { code: 'B92201', message: 'Job history not found', i18nKey: 'cronjob.job.history.not.found', module: 'cronjob', enumName: 'JOB_HISTORY_NOT_FOUND', httpStatus: 404 },
  JOB_VERSION_NOT_FOUND: { code: 'B92202', message: 'Job version not found', i18nKey: 'cronjob.job.version.not.found', module: 'cronjob', enumName: 'JOB_VERSION_NOT_FOUND', httpStatus: 404 },
  JOB_LOG_NOT_FOUND: { code: 'B92203', message: 'Job log not found', module: 'cronjob', enumName: 'JOB_LOG_NOT_FOUND', httpStatus: 404 },
  ALERT_RULE_NOT_FOUND: { code: 'B92301', message: 'Alert rule not found', i18nKey: 'cronjob.alert.rule.not.found', module: 'cronjob', enumName: 'ALERT_RULE_NOT_FOUND', httpStatus: 404 },
  WEBHOOK_NOT_FOUND: { code: 'B92302', message: 'Webhook not found', i18nKey: 'cronjob.webhook.not.found', module: 'cronjob', enumName: 'WEBHOOK_NOT_FOUND', httpStatus: 404 },
  CONNECTOR_NOT_FOUND: { code: 'B92303', message: 'Connector not found', i18nKey: 'cronjob.connector.not.found', module: 'cronjob', enumName: 'CONNECTOR_NOT_FOUND', httpStatus: 404 },
  WEBHOOK_SEND_FAILED: { code: 'B92304', message: 'Webhook send failed', i18nKey: 'cronjob.webhook.send.failed', module: 'cronjob', enumName: 'WEBHOOK_SEND_FAILED', httpStatus: 502 },
  RULE_NOT_FOUND: { code: 'B93001', message: '规则不存在', i18nKey: 'literule.rule.not.found', module: 'literule', enumName: 'RULE_NOT_FOUND', httpStatus: 404 },
  RULE_CODE_DUPLICATE: { code: 'B93002', message: '规则编码重复', i18nKey: 'literule.rule.code.duplicate', module: 'literule', enumName: 'RULE_CODE_DUPLICATE' },
  RULE_EXPRESSION_INVALID: { code: 'B93003', message: '规则表达式非法', i18nKey: 'literule.rule.expression.invalid', module: 'literule', enumName: 'RULE_EXPRESSION_INVALID' },
  RULE_STATUS_INVALID: { code: 'B93004', message: '规则状态非法', i18nKey: 'literule.rule.status.invalid', module: 'literule', enumName: 'RULE_STATUS_INVALID' },
  RULE_STATUS_TRANSITION_ILLEGAL: { code: 'B93005', message: '规则状态迁移非法', i18nKey: 'literule.rule.status.transition.illegal', module: 'literule', enumName: 'RULE_STATUS_TRANSITION_ILLEGAL' },
  RULE_PACK_NOT_FOUND: { code: 'B93101', message: '规则包不存在', i18nKey: 'literule.rule.pack.not.found', module: 'literule', enumName: 'RULE_PACK_NOT_FOUND', httpStatus: 404 },
  RULE_VERSION_NOT_FOUND: { code: 'B93102', message: '规则版本不存在', i18nKey: 'literule.rule.version.not.found', module: 'literule', enumName: 'RULE_VERSION_NOT_FOUND', httpStatus: 404 },
  RULE_PACK_ALREADY_INSTALLED: { code: 'B93103', message: '规则包已安装', i18nKey: 'literule.rule.pack.already.installed', module: 'literule', enumName: 'RULE_PACK_ALREADY_INSTALLED' },
  RULE_CHAIN_NOT_FOUND: { code: 'B93201', message: '规则链不存在', i18nKey: 'literule.rule.chain.not.found', module: 'literule', enumName: 'RULE_CHAIN_NOT_FOUND', httpStatus: 404 },
  DECISION_TABLE_NOT_FOUND: { code: 'B93202', message: '决策表不存在', i18nKey: 'literule.decision.table.not.found', module: 'literule', enumName: 'DECISION_TABLE_NOT_FOUND', httpStatus: 404 },
  AB_POLICY_NOT_FOUND: { code: 'B93203', message: 'AB 策略不存在', i18nKey: 'literule.ab.policy.not.found', module: 'literule', enumName: 'AB_POLICY_NOT_FOUND', httpStatus: 404 },
  TEST_CASE_NOT_FOUND: { code: 'B93301', message: '测试用例不存在', i18nKey: 'literule.test.case.not.found', module: 'literule', enumName: 'TEST_CASE_NOT_FOUND', httpStatus: 404 },
  DSL_PARSE_ERROR: { code: 'B93302', message: 'DSL 解析错误', i18nKey: 'literule.dsl.parse.error', module: 'literule', enumName: 'DSL_PARSE_ERROR' },
  VARIABLE_DEF_NOT_FOUND: { code: 'B93303', message: '变量定义不存在', i18nKey: 'literule.variable.def.not.found', module: 'literule', enumName: 'VARIABLE_DEF_NOT_FOUND', httpStatus: 404 },
  MODEL_INVOCATION_ERROR: { code: 'B93401', message: '模型调用错误', i18nKey: 'literule.model.invocation.error', module: 'literule', enumName: 'MODEL_INVOCATION_ERROR' },
  AGENT_NOT_FOUND: { code: 'B94001', message: 'agent.not.found', i18nKey: 'agent.not.found', module: 'agent', enumName: 'AGENT_NOT_FOUND', httpStatus: 404 },
  AGENT_CODE_DUPLICATE: { code: 'B94002', message: 'agent.code.duplicate', i18nKey: 'agent.code.duplicate', module: 'agent', enumName: 'AGENT_CODE_DUPLICATE' },
  AGENT_TYPE_NOT_SUPPORTED: { code: 'B94003', message: 'agent.type.not.supported', i18nKey: 'agent.type.not.supported', module: 'agent', enumName: 'AGENT_TYPE_NOT_SUPPORTED' },
  AGENT_EXECUTION_FAILED: { code: 'B94004', message: 'agent.execution.failed', i18nKey: 'agent.execution.failed', module: 'agent', enumName: 'AGENT_EXECUTION_FAILED', httpStatus: 500 },
  AGENT_DAG_CYCLE_DETECTED: { code: 'B94005', message: 'agent.dag.cycle.detected', i18nKey: 'agent.dag.cycle.detected', module: 'agent', enumName: 'AGENT_DAG_CYCLE_DETECTED' },
  CONVERSATION_NOT_FOUND: { code: 'B94101', message: 'agent.conversation.not.found', i18nKey: 'agent.conversation.not.found', module: 'agent', enumName: 'CONVERSATION_NOT_FOUND', httpStatus: 404 },
  MEMORY_OVERFLOW: { code: 'B94102', message: 'agent.memory.overflow', i18nKey: 'agent.memory.overflow', module: 'agent', enumName: 'MEMORY_OVERFLOW' },
  LLM_CALL_FAILED: { code: 'B94201', message: 'agent.llm.call.failed', i18nKey: 'agent.llm.call.failed', module: 'agent', enumName: 'LLM_CALL_FAILED', httpStatus: 502 },
  LLM_RESPONSE_INVALID: { code: 'B94202', message: 'agent.llm.response.invalid', i18nKey: 'agent.llm.response.invalid', module: 'agent', enumName: 'LLM_RESPONSE_INVALID' },
  LLM_TOKEN_EXCEEDED: { code: 'B94203', message: 'agent.llm.token.exceeded', i18nKey: 'agent.llm.token.exceeded', module: 'agent', enumName: 'LLM_TOKEN_EXCEEDED' },
  LLM_PROVIDER_NOT_CONFIGURED: { code: 'B94204', message: 'agent.llm.provider.not.configured', i18nKey: 'agent.llm.provider.not.configured', module: 'agent', enumName: 'LLM_PROVIDER_NOT_CONFIGURED' },
  QUOTA_DAILY_TOKEN_EXCEEDED: { code: 'B94251', message: 'agent.quota.daily.token.exceeded', i18nKey: 'agent.quota.daily.token.exceeded', module: 'agent', enumName: 'QUOTA_DAILY_TOKEN_EXCEEDED', httpStatus: 429 },
  QUOTA_MONTHLY_BUDGET_EXCEEDED: { code: 'B94252', message: 'agent.quota.monthly.budget.exceeded', i18nKey: 'agent.quota.monthly.budget.exceeded', module: 'agent', enumName: 'QUOTA_MONTHLY_BUDGET_EXCEEDED', httpStatus: 429 },
  RAG_RETRIEVAL_FAILED: { code: 'B94301', message: 'agent.rag.retrieval.failed', i18nKey: 'agent.rag.retrieval.failed', module: 'agent', enumName: 'RAG_RETRIEVAL_FAILED', httpStatus: 500 },
  TOOL_NOT_FOUND: { code: 'B94302', message: 'agent.tool.not.found', i18nKey: 'agent.tool.not.found', module: 'agent', enumName: 'TOOL_NOT_FOUND', httpStatus: 404 },
  TOOL_EXECUTION_FAILED: { code: 'B94303', message: 'agent.tool.execution.failed', i18nKey: 'agent.tool.execution.failed', module: 'agent', enumName: 'TOOL_EXECUTION_FAILED', httpStatus: 500 },
  PROMPT_TEMPLATE_NOT_FOUND: { code: 'B94304', message: 'agent.prompt.template.not.found', i18nKey: 'agent.prompt.template.not.found', module: 'agent', enumName: 'PROMPT_TEMPLATE_NOT_FOUND', httpStatus: 404 },
  PROMPT_TEMPLATE_DUPLICATE: { code: 'B94305', message: 'agent.prompt.template.duplicate', i18nKey: 'agent.prompt.template.duplicate', module: 'agent', enumName: 'PROMPT_TEMPLATE_DUPLICATE' },
  GUARDRAIL_REJECTED: { code: 'B94306', message: 'agent.guardrail.rejected', i18nKey: 'agent.guardrail.rejected', module: 'agent', enumName: 'GUARDRAIL_REJECTED', httpStatus: 403 },
  TRACE_NOT_FOUND: { code: 'B94401', message: 'agent.trace.not.found', i18nKey: 'agent.trace.not.found', module: 'agent', enumName: 'TRACE_NOT_FOUND', httpStatus: 404 },
  TRACE_EMPTY: { code: 'B94402', message: 'agent.trace.empty', i18nKey: 'agent.trace.empty', module: 'agent', enumName: 'TRACE_EMPTY', httpStatus: 400 },
  TENANT_PLAN_NOT_FOUND: { code: 'B95001', message: 'TENANT_PLAN_NOT_FOUND', i18nKey: 'system.tenant.plan.not.found', module: 'system', enumName: 'TENANT_PLAN_NOT_FOUND', httpStatus: 404 },
  TENANT_PLAN_CODE_DUPLICATE: { code: 'B95002', message: 'TENANT_PLAN_CODE_DUPLICATE', i18nKey: 'system.tenant.plan.code.duplicate', module: 'system', enumName: 'TENANT_PLAN_CODE_DUPLICATE' },
  ENTITY_VERSION_NOT_FOUND: { code: 'B96001', message: 'ENTITY_VERSION_NOT_FOUND', i18nKey: 'system.entity.version.not.found', module: 'system', enumName: 'ENTITY_VERSION_NOT_FOUND', httpStatus: 404 },
  SEC_ACCESS_DENIED: { code: 'C01051', message: '安全访问被拒绝', i18nKey: 'security.access.denied', module: 'security', enumName: 'SEC_ACCESS_DENIED', httpStatus: 403 },
  AUTHENTICATION_REQUIRED: { code: 'C01052', message: '需要认证', i18nKey: 'security.authentication.required', module: 'security', enumName: 'AUTHENTICATION_REQUIRED', httpStatus: 401 },
  TOKEN_EXPIRED: { code: 'C01053', message: 'Token过期', i18nKey: 'security.token.expired', module: 'security', enumName: 'TOKEN_EXPIRED', httpStatus: 401 },
  PERMISSION_DENIED: { code: 'C01054', message: '权限拒绝（通用）', i18nKey: 'security.permission.denied', module: 'security', enumName: 'PERMISSION_DENIED', httpStatus: 403 },
  PERMISSION_DENIED_MENU: { code: 'C01061', message: '菜单权限拒绝', i18nKey: 'security.permission.denied.menu', module: 'security', enumName: 'PERMISSION_DENIED_MENU', httpStatus: 403 },
  PERMISSION_DENIED_BUTTON: { code: 'C01062', message: '按钮权限拒绝', i18nKey: 'security.permission.denied.button', module: 'security', enumName: 'PERMISSION_DENIED_BUTTON', httpStatus: 403 },
  PERMISSION_DENIED_API: { code: 'C01063', message: '接口权限拒绝', i18nKey: 'security.permission.denied.api', module: 'security', enumName: 'PERMISSION_DENIED_API', httpStatus: 403 },
  PERMISSION_DENIED_DATA: { code: 'C01064', message: '数据权限拒绝', i18nKey: 'security.permission.denied.data', module: 'security', enumName: 'PERMISSION_DENIED_DATA', httpStatus: 403 },
  PERMISSION_DENIED_COLUMN: { code: 'C01065', message: '列权限拒绝', i18nKey: 'security.permission.denied.column', module: 'security', enumName: 'PERMISSION_DENIED_COLUMN', httpStatus: 403 },
  PASSWORD_TOO_WEAK: { code: 'C01071', message: '密码强度不足（P0-1：注册/修改密码时强度校验失败）', i18nKey: 'security.password.too.weak', module: 'security', enumName: 'PASSWORD_TOO_WEAK', httpStatus: 400 },
  PASSWORD_REUSED: { code: 'C01072', message: '密码与历史密码重复（P0-1：修改密码时与最近 N 条历史密码重复）', i18nKey: 'security.password.reused', module: 'security', enumName: 'PASSWORD_REUSED', httpStatus: 400 },
  INTERNAL_SIGNATURE_INVALID: { code: 'C01081', message: '内部签名校验失败（P0-3：网关 X-Internal-Sig 下游验签不通过）', i18nKey: 'security.internal.signature.invalid', module: 'security', enumName: 'INTERNAL_SIGNATURE_INVALID', httpStatus: 403 },
  UNKNOWN: { code: 'C99999', message: '未知错误（兜底）', module: 'core', enumName: 'UNKNOWN' },
  DATASOURCE_UNAVAILABLE: { code: 'D01001', message: '数据源不可用 <p>连接池耗尽、数据源未注册或数据源健康检查失败时抛出。', i18nKey: 'jdbc.datasource.unavailable', module: 'jdbc', enumName: 'DATASOURCE_UNAVAILABLE', httpStatus: 503 },
  DATASOURCE_ROUTE_FAILED: { code: 'D01002', message: '数据源路由失败 <p>动态路由数据源无法解析目标数据源时抛出。', i18nKey: 'jdbc.datasource.route.failed', module: 'jdbc', enumName: 'DATASOURCE_ROUTE_FAILED', httpStatus: 500 },
  CONNECTION_POOL_EXHAUSTED: { code: 'D01003', message: '连接池耗尽 <p>HikariCP 连接池达到最大连接数且等待超时时抛出。', i18nKey: 'jdbc.connection.pool.exhausted', module: 'jdbc', enumName: 'CONNECTION_POOL_EXHAUSTED', httpStatus: 503 },
  SQL_PARSE_FAILED: { code: 'D02001', message: 'SQL 解析失败 <p>JSqlParser 无法解析 SQL 语法时抛出（通常由 SQL 注入或语法错误导致）。', i18nKey: 'jdbc.sql.parse.failed', module: 'jdbc', enumName: 'SQL_PARSE_FAILED', httpStatus: 400 },
  SQL_FIREWALL_BLOCKED: { code: 'D02002', message: 'SQL 防火墙拦截 <p>SQL 防火墙检测到危险操作（如全表 UPDATE/DELETE 无 WHERE 条件）时拦截。', i18nKey: 'jdbc.sql.firewall.blocked', module: 'jdbc', enumName: 'SQL_FIREWALL_BLOCKED', httpStatus: 403 },
  DATA_PERMISSION_DENIED: { code: 'D02003', message: '数据权限拦截 <p>数据权限上下文缺失或权限配置错误时抛出。', i18nKey: 'jdbc.data.permission.denied', module: 'jdbc', enumName: 'DATA_PERMISSION_DENIED', httpStatus: 403 },
  DEEP_PAGINATION_BLOCKED: { code: 'D02004', message: '深度分页被拒绝 <p>查询偏移量超过安全阈值时拦截，防止深度分页导致数据库性能劣化。', i18nKey: 'jdbc.deep.pagination.blocked', module: 'jdbc', enumName: 'DEEP_PAGINATION_BLOCKED', httpStatus: 400 },
  SLAVE_UNAVAILABLE: { code: 'D03001', message: '从库不可用 <p>所有从库均因延迟超标被摘除时抛出，读写分离自动降级走主库。', i18nKey: 'jdbc.slave.unavailable', module: 'jdbc', enumName: 'SLAVE_UNAVAILABLE', httpStatus: 503 },
  SLAVE_LATENCY_EXCEEDED: { code: 'D03002', message: '从库延迟超标 <p>单个从库复制延迟超过阈值，被临时摘除出路由池。', i18nKey: 'jdbc.slave.latency.exceeded', module: 'jdbc', enumName: 'SLAVE_LATENCY_EXCEEDED', httpStatus: 503 },
  JDBC_CIRCUIT_BREAKER_OPEN: { code: 'D04001', message: '数据库熔断器打开 <p>数据库熔断器处于 OPEN 状态，请求被拒绝。 触发条件：连续失败次数达到阈值。', i18nKey: 'jdbc.circuit.breaker.open', module: 'jdbc', enumName: 'CIRCUIT_BREAKER_OPEN', httpStatus: 503 },
  CIRCUIT_BREAKER_HALF_OPEN_FAILED: { code: 'D04002', message: '数据库熔断器半开探测失败 <p>熔断器处于 HALF_OPEN 状态但探测请求仍然失败。', i18nKey: 'jdbc.circuit.breaker.half.open.failed', module: 'jdbc', enumName: 'CIRCUIT_BREAKER_HALF_OPEN_FAILED', httpStatus: 503 },
  FILE_EMPTY: { code: 'F01001', message: '上传文件为空', i18nKey: 'file.empty', module: 'file', enumName: 'FILE_EMPTY' },
  FILE_SUFFIX_NOT_ALLOWED: { code: 'F01002', message: '文件扩展名不在允许列表中', i18nKey: 'file.suffix.not.allowed', module: 'file', enumName: 'FILE_SUFFIX_NOT_ALLOWED' },
  FILE_FILE_SIZE_EXCEEDED: { code: 'F01003', message: '文件大小超出限制', i18nKey: 'file.size.exceeded', module: 'file', enumName: 'FILE_SIZE_EXCEEDED' },
  FILE_NAME_INVALID: { code: 'F01004', message: '文件名无效', i18nKey: 'file.name.invalid', module: 'file', enumName: 'FILE_NAME_INVALID' },
  FILE_FILE_UPLOAD_FAILED: { code: 'F01005', message: '文件上传失败', i18nKey: 'file.upload.failed', module: 'file', enumName: 'FILE_UPLOAD_FAILED' },
  FILE_OPERATE_FAILED: { code: 'F01006', message: '文件操作失败（下载/删除/拷贝/列举/目录操作/私有链接等）', i18nKey: 'file.operate.failed', module: 'file', enumName: 'FILE_OPERATE_FAILED' },
  FILE_NOT_FOUND: { code: 'F01008', message: '文件不存在', i18nKey: 'file.not.found', module: 'file', enumName: 'FILE_NOT_FOUND' },
  FILE_PATH_EMPTY: { code: 'F01010', message: '文件路径非法/为空', i18nKey: 'file.path.empty', module: 'file', enumName: 'FILE_PATH_EMPTY' },
  FILE_VIRUS_DETECTED: { code: 'F01014', message: '文件病毒检测命中', i18nKey: 'file.virus.detected', module: 'file', enumName: 'FILE_VIRUS_DETECTED' },
  BUCKET_ERROR: { code: 'F02001', message: '存储桶错误（创建失败/不存在）', i18nKey: 'bucket.error', module: 'file', enumName: 'BUCKET_ERROR' },
  CONFIG_INVALID: { code: 'F04001', message: '存储配置无效（Endpoint 格式错误/客户端构建失败/域名未配置）', i18nKey: 'config.invalid', module: 'file', enumName: 'CONFIG_INVALID' },
  MULTIPART_UPLOAD_FAILED: { code: 'F07001', message: '分片上传失败（初始化/完成/并发冲突）', i18nKey: 'multipart.upload.failed', module: 'file', enumName: 'MULTIPART_UPLOAD_FAILED' },
  FILE_UNKNOWN: { code: 'F99999', message: '未知错误（兜底）', i18nKey: 'unknown.error', module: 'file', enumName: 'UNKNOWN' },
  UNSUPPORTED_FORMAT: { code: 'G01001', message: '不支持的文档格式', i18nKey: 'docs.format.unsupported', module: 'docs', enumName: 'UNSUPPORTED_FORMAT' },
  PARSE_FAILED: { code: 'G01002', message: '文档解析失败', i18nKey: 'docs.parse.failed', module: 'docs', enumName: 'PARSE_FAILED' },
  PARSE_TIMEOUT: { code: 'G01004', message: '文档解析超时', i18nKey: 'docs.parse.timeout', module: 'docs', enumName: 'PARSE_TIMEOUT' },
  DOCUMENT_EMPTY: { code: 'G01005', message: '文档为空或无法读取', i18nKey: 'docs.empty', module: 'docs', enumName: 'DOCUMENT_EMPTY' },
  DOCUMENT_ENCRYPTED: { code: 'G01006', message: '文档已加密，无法解析', i18nKey: 'docs.encrypted', module: 'docs', enumName: 'DOCUMENT_ENCRYPTED' },
  SECURITY_SCAN_FAILED: { code: 'G03001', message: '安全扫描失败', i18nKey: 'docs.security.scan.failed', module: 'docs', enumName: 'SECURITY_SCAN_FAILED' },
  SECURITY_RISK_DETECTED: { code: 'G03002', message: '检测到高危安全风险', i18nKey: 'docs.security.risk.detected', module: 'docs', enumName: 'SECURITY_RISK_DETECTED' },
  PII_DETECTION_FAILED: { code: 'G04002', message: 'PII 检测异常', i18nKey: 'docs.pii.detection.failed', module: 'docs', enumName: 'PII_DETECTION_FAILED' },
  CONVERT_FAILED: { code: 'G07001', message: '格式转换失败', i18nKey: 'docs.convert.failed', module: 'docs', enumName: 'CONVERT_FAILED' },
  DOCS_UNKNOWN: { code: 'G99999', message: '未知错误（兜底）', i18nKey: 'unknown.error', module: 'docs', enumName: 'UNKNOWN' },
  LOCK_ERROR: { code: 'I01000', message: '默认 / 未知错误', i18nKey: 'lock.error', module: 'lock', enumName: 'LOCK_ERROR', httpStatus: 409 },
  ACQUIRE_TIMEOUT: { code: 'I01001', message: '获取锁超时', i18nKey: 'lock.acquire.timeout', module: 'lock', enumName: 'ACQUIRE_TIMEOUT', httpStatus: 409 },
  ACQUIRE_INTERRUPTED: { code: 'I01002', message: '获取锁被中断', i18nKey: 'lock.acquire.interrupted', module: 'lock', enumName: 'ACQUIRE_INTERRUPTED', httpStatus: 409 },
  RELEASE_FAILED: { code: 'I01003', message: '释放锁失败', i18nKey: 'lock.release.failed', module: 'lock', enumName: 'RELEASE_FAILED', httpStatus: 409 },
  RENEW_FAILED: { code: 'I01004', message: '锁续期失败', i18nKey: 'lock.renew.failed', module: 'lock', enumName: 'RENEW_FAILED', httpStatus: 409 },
  MAX_DEPTH_EXCEEDED: { code: 'I01005', message: '超过最大重入深度', i18nKey: 'lock.max.depth.exceeded', module: 'lock', enumName: 'MAX_DEPTH_EXCEEDED', httpStatus: 409 },
  REDIS_UNAVAILABLE: { code: 'I01006', message: 'Redis 不可用', i18nKey: 'lock.redis.unavailable', module: 'lock', enumName: 'REDIS_UNAVAILABLE', httpStatus: 503 },
  LOCK_UNKNOWN: { code: 'I01007', message: '未知错误', i18nKey: 'lock.unknown', module: 'lock', enumName: 'UNKNOWN', httpStatus: 409 },
  NEXTWIKI_FILE_NOT_FOUND: { code: 'W01001', message: '文件节点不存在', i18nKey: 'nextwiki.file.not.found', module: 'nextwiki', enumName: 'FILE_NOT_FOUND', httpStatus: 404 },
  FILE_NAME_EMPTY: { code: 'W01002', message: '文件名为空', i18nKey: 'nextwiki.file.name.empty', module: 'nextwiki', enumName: 'FILE_NAME_EMPTY' },
  NEXTWIKI_FILE_NAME_INVALID: { code: 'W01003', message: '文件名无效', i18nKey: 'nextwiki.file.name.invalid', module: 'nextwiki', enumName: 'FILE_NAME_INVALID' },
  FILE_TOO_LARGE: { code: 'W01004', message: '文件大小超过限制', i18nKey: 'nextwiki.file.too.large', module: 'nextwiki', enumName: 'FILE_TOO_LARGE' },
  FILE_TYPE_NOT_ALLOWED: { code: 'W01005', message: '文件类型不允许', i18nKey: 'nextwiki.file.type.not.allowed', module: 'nextwiki', enumName: 'FILE_TYPE_NOT_ALLOWED' },
  FILE_ALREADY_EXISTS: { code: 'W01006', message: '同名文件/目录已存在', i18nKey: 'nextwiki.file.already.exists', module: 'nextwiki', enumName: 'FILE_ALREADY_EXISTS' },
  FILE_FOLDER_NOT_FOUND: { code: 'W01007', message: '父目录不存在', i18nKey: 'nextwiki.folder.not.found', module: 'nextwiki', enumName: 'FILE_FOLDER_NOT_FOUND', httpStatus: 404 },
  FILE_MOVE_TO_SELF: { code: 'W01008', message: '不能将目录移动到自身或其子目录下', i18nKey: 'nextwiki.file.move.to.self', module: 'nextwiki', enumName: 'FILE_MOVE_TO_SELF' },
  FILE_PARENT_NOT_FOLDER: { code: 'W01009', message: '目标父节点不是目录', i18nKey: 'nextwiki.parent.not.folder', module: 'nextwiki', enumName: 'FILE_PARENT_NOT_FOLDER' },
  FILE_UPLOAD_EMPTY: { code: 'W01010', message: '上传文件为空', i18nKey: 'nextwiki.file.upload.empty', module: 'nextwiki', enumName: 'FILE_UPLOAD_EMPTY' },
  NEXTWIKI_FILE_VIRUS_DETECTED: { code: 'W01011', message: '文件病毒扫描未通过', i18nKey: 'nextwiki.file.virus.detected', module: 'nextwiki', enumName: 'FILE_VIRUS_DETECTED', httpStatus: 422 },
  FILE_STORAGE_NOT_CONFIGURED: { code: 'W01012', message: '文件存储未配置', i18nKey: 'nextwiki.storage.not.configured', module: 'nextwiki', enumName: 'FILE_STORAGE_NOT_CONFIGURED', httpStatus: 500 },
  NEXTWIKI_FILE_DOWNLOAD_FAILED: { code: 'W01013', message: '文件下载失败', i18nKey: 'nextwiki.file.download.failed', module: 'nextwiki', enumName: 'FILE_DOWNLOAD_FAILED', httpStatus: 500 },
  SIGN_URL_EXPIRED: { code: 'W01014', message: '签名URL无效或已过期', i18nKey: 'nextwiki.sign.url.expired', module: 'nextwiki', enumName: 'SIGN_URL_EXPIRED' },
  NEXTWIKI_RATE_LIMIT_EXCEEDED: { code: 'W01015', message: '下载限流', i18nKey: 'nextwiki.rate.limit.exceeded', module: 'nextwiki', enumName: 'RATE_LIMIT_EXCEEDED', httpStatus: 429 },
  FILE_NAME_CONFLICT: { code: 'W01016', message: '同名文件冲突', i18nKey: 'nextwiki.file.name.conflict', module: 'nextwiki', enumName: 'FILE_NAME_CONFLICT', httpStatus: 409 },
  FILE_LOCKED: { code: 'W01017', message: '文件已被锁定', i18nKey: 'nextwiki.file.locked', module: 'nextwiki', enumName: 'FILE_LOCKED', httpStatus: 409 },
  FILE_NOT_LOCKED: { code: 'W01018', message: '文件未锁定', i18nKey: 'nextwiki.file.not.locked', module: 'nextwiki', enumName: 'FILE_NOT_LOCKED' },
  CHUNK_UPLOAD_NOT_FOUND: { code: 'W01019', message: '分片上传未找到', i18nKey: 'nextwiki.chunk.upload.not.found', module: 'nextwiki', enumName: 'CHUNK_UPLOAD_NOT_FOUND', httpStatus: 404 },
  CHUNK_UPLOAD_COMPLETED: { code: 'W01020', message: '分片上传已完成', i18nKey: 'nextwiki.chunk.upload.completed', module: 'nextwiki', enumName: 'CHUNK_UPLOAD_COMPLETED' },
  CHUNK_INCOMPLETE: { code: 'W01021', message: '分片不完整', i18nKey: 'nextwiki.chunk.incomplete', module: 'nextwiki', enumName: 'CHUNK_INCOMPLETE' },
  FILE_NOT_BELONG_TO_PARENT: { code: 'W01022', message: '节点不属于指定父目录（批量排序越权校验）', i18nKey: 'nextwiki.file.not.belong.to.parent', module: 'nextwiki', enumName: 'FILE_NOT_BELONG_TO_PARENT', httpStatus: 403 },
  NEXTWIKI_PARAM_ERROR: { code: 'W01999', message: '参数错误', i18nKey: 'nextwiki.param.error', module: 'nextwiki', enumName: 'PARAM_ERROR' },
  VERSION_NOT_FOUND: { code: 'W02001', message: '版本不存在', i18nKey: 'nextwiki.version.not.found', module: 'nextwiki', enumName: 'VERSION_NOT_FOUND', httpStatus: 404 },
  VERSION_INVALID: { code: 'W02002', message: '版本无效', i18nKey: 'nextwiki.version.invalid', module: 'nextwiki', enumName: 'VERSION_INVALID' },
  VERSION_EXCEED_LIMIT: { code: 'W02003', message: '版本数超过限制', i18nKey: 'nextwiki.version.exceed.limit', module: 'nextwiki', enumName: 'VERSION_EXCEED_LIMIT' },
  SHARE_NOT_FOUND: { code: 'W03001', message: '分享链接不存在', i18nKey: 'nextwiki.share.not.found', module: 'nextwiki', enumName: 'SHARE_NOT_FOUND', httpStatus: 404 },
  SHARE_EXPIRED: { code: 'W03002', message: '分享链接已失效/过期', i18nKey: 'nextwiki.share.expired', module: 'nextwiki', enumName: 'SHARE_EXPIRED' },
  SHARE_ACCESS_LIMIT: { code: 'W03003', message: '分享链接访问次数已用尽', i18nKey: 'nextwiki.share.access.limit', module: 'nextwiki', enumName: 'SHARE_ACCESS_LIMIT' },
  SHARE_EXTRACT_CODE_ERROR: { code: 'W03004', message: '提取码错误', i18nKey: 'nextwiki.share.extract.code.error', module: 'nextwiki', enumName: 'SHARE_EXTRACT_CODE_ERROR' },
  SHARE_PASSWORD_ERROR: { code: 'W03005', message: '密码错误', i18nKey: 'nextwiki.share.password.error', module: 'nextwiki', enumName: 'SHARE_PASSWORD_ERROR' },
  SHARE_LOCKED: { code: 'W03006', message: '分享验证失败次数过多，已被临时锁定', i18nKey: 'nextwiki.share.locked', module: 'nextwiki', enumName: 'SHARE_LOCKED', httpStatus: 429 },
  QUOTA_INSUFFICIENT: { code: 'W04001', message: '存储空间不足', i18nKey: 'nextwiki.quota.insufficient', module: 'nextwiki', enumName: 'QUOTA_INSUFFICIENT' },
  QUOTA_FILE_LIMIT: { code: 'W04002', message: '文件数量已达上限', i18nKey: 'nextwiki.quota.file.limit', module: 'nextwiki', enumName: 'QUOTA_FILE_LIMIT' },
  QUOTA_NOT_FOUND: { code: 'W04003', message: '配额记录不存在', i18nKey: 'nextwiki.quota.not.found', module: 'nextwiki', enumName: 'QUOTA_NOT_FOUND', httpStatus: 404 },
  QUOTA_FILE_TYPE_LIMIT: { code: 'W04004', message: '文件类型配额不足（S3-P2-6 新增：按文件类型分别限额）', i18nKey: 'nextwiki.quota.file.type.limit', module: 'nextwiki', enumName: 'QUOTA_FILE_TYPE_LIMIT' },
  NEXTWIKI_PERMISSION_DENIED: { code: 'W05001', message: '权限不足', i18nKey: 'nextwiki.permission.denied', module: 'nextwiki', enumName: 'PERMISSION_DENIED', httpStatus: 403 },
  TRASH_NOT_FOUND: { code: 'W06001', message: '回收站条目不存在', i18nKey: 'nextwiki.trash.not.found', module: 'nextwiki', enumName: 'TRASH_NOT_FOUND', httpStatus: 404 },
  TRASH_ALREADY_PURGED: { code: 'W06002', message: '回收站条目已被清理', i18nKey: 'nextwiki.trash.already.purged', module: 'nextwiki', enumName: 'TRASH_ALREADY_PURGED' },
  TRASH_INVALID_STATUS: { code: 'W06003', message: '回收站条目状态不允许操作', i18nKey: 'nextwiki.trash.invalid.status', module: 'nextwiki', enumName: 'TRASH_INVALID_STATUS' },
  TAG_NOT_FOUND: { code: 'W07001', message: '标签不存在', i18nKey: 'nextwiki.tag.not.found', module: 'nextwiki', enumName: 'TAG_NOT_FOUND', httpStatus: 404 },
  TAG_ALREADY_EXISTS: { code: 'W07002', message: '标签已存在', i18nKey: 'nextwiki.tag.already.exists', module: 'nextwiki', enumName: 'TAG_ALREADY_EXISTS' },
  TAG_NAME_EMPTY: { code: 'W07003', message: '标签名称为空', i18nKey: 'nextwiki.tag.name.empty', module: 'nextwiki', enumName: 'TAG_NAME_EMPTY' },
  PREVIEW_NOT_READY: { code: 'W08001', message: '预览未就绪', i18nKey: 'nextwiki.preview.not.ready', module: 'nextwiki', enumName: 'PREVIEW_NOT_READY' },
  PREVIEW_GENERATION_FAILED: { code: 'W08002', message: '预览生成失败', i18nKey: 'nextwiki.preview.generation.failed', module: 'nextwiki', enumName: 'PREVIEW_GENERATION_FAILED', httpStatus: 500 },
  NEXTWIKI_INTERNAL_ERROR: { code: 'W09001', message: '系统内部错误', i18nKey: 'nextwiki.internal.error', module: 'nextwiki', enumName: 'INTERNAL_ERROR', httpStatus: 500 },
  LOCK_BUSY: { code: 'W09002', message: '操作正在处理中（锁竞争）', i18nKey: 'nextwiki.lock.busy', module: 'nextwiki', enumName: 'LOCK_BUSY', httpStatus: 409 },
  AI_SERVICE_DISABLED: { code: 'W10001', message: 'AI 服务未启用或未配置', i18nKey: 'nextwiki.ai.service.disabled', module: 'nextwiki', enumName: 'AI_SERVICE_DISABLED', httpStatus: 503 },
  AI_SUMMARY_FAILED: { code: 'W10002', message: 'AI 摘要生成失败', i18nKey: 'nextwiki.ai.summary.failed', module: 'nextwiki', enumName: 'AI_SUMMARY_FAILED', httpStatus: 500 },
  AI_SERVICE_TIMEOUT: { code: 'W10003', message: 'AI 服务超时', i18nKey: 'nextwiki.ai.service.timeout', module: 'nextwiki', enumName: 'AI_SERVICE_TIMEOUT', httpStatus: 504 },
  FAVORITE_ALREADY_EXISTS: { code: 'W11001', message: '收藏已存在', i18nKey: 'nextwiki.favorite.already.exists', module: 'nextwiki', enumName: 'FAVORITE_ALREADY_EXISTS' },
  FAVORITE_NOT_FOUND: { code: 'W11002', message: '收藏记录不存在', i18nKey: 'nextwiki.favorite.not.found', module: 'nextwiki', enumName: 'FAVORITE_NOT_FOUND', httpStatus: 404 },
  SPACE_NOT_FOUND: { code: 'W12001', message: '空间不存在', i18nKey: 'nextwiki.space.not.found', module: 'nextwiki', enumName: 'SPACE_NOT_FOUND', httpStatus: 404 },
  SPACE_NAME_EMPTY: { code: 'W12002', message: '空间名称为空', i18nKey: 'nextwiki.space.name.empty', module: 'nextwiki', enumName: 'SPACE_NAME_EMPTY' },
  SPACE_NAME_TOO_LONG: { code: 'W12003', message: '空间名称过长', i18nKey: 'nextwiki.space.name.too.long', module: 'nextwiki', enumName: 'SPACE_NAME_TOO_LONG' },
  SPACE_NAME_DUPLICATE: { code: 'W12004', message: '空间名称重复', i18nKey: 'nextwiki.space.name.duplicate', module: 'nextwiki', enumName: 'SPACE_NAME_DUPLICATE' },
  SPACE_STATUS_TRANSITION_INVALID: { code: 'W12005', message: '空间状态转换不合法', i18nKey: 'nextwiki.space.status.transition.invalid', module: 'nextwiki', enumName: 'SPACE_STATUS_TRANSITION_INVALID' },
  SPACE_MEMBER_NOT_FOUND: { code: 'W12006', message: '空间成员不存在', i18nKey: 'nextwiki.space.member.not.found', module: 'nextwiki', enumName: 'SPACE_MEMBER_NOT_FOUND', httpStatus: 404 },
  SPACE_MEMBER_ROLE_INVALID: { code: 'W12007', message: '空间成员角色不合法', i18nKey: 'nextwiki.space.member.role.invalid', module: 'nextwiki', enumName: 'SPACE_MEMBER_ROLE_INVALID' },
  SPACE_NO_OWNER: { code: 'W12008', message: '空间不存在所有者（数据异常）', i18nKey: 'nextwiki.space.no.owner', module: 'nextwiki', enumName: 'SPACE_NO_OWNER' },
  NEXTWIKI_TEMPLATE_NOT_FOUND: { code: 'W13001', message: '模板不存在', i18nKey: 'nextwiki.template.not.found', module: 'nextwiki', enumName: 'TEMPLATE_NOT_FOUND', httpStatus: 404 },
  TEMPLATE_SYSTEM_NOT_EDITABLE: { code: 'W13002', message: '系统模板不可编辑', i18nKey: 'nextwiki.template.system.not.editable', module: 'nextwiki', enumName: 'TEMPLATE_SYSTEM_NOT_EDITABLE' },
  TEMPLATE_SYSTEM_NOT_DELETABLE: { code: 'W13003', message: '系统模板不可删除', i18nKey: 'nextwiki.template.system.not.deletable', module: 'nextwiki', enumName: 'TEMPLATE_SYSTEM_NOT_DELETABLE' },
};
