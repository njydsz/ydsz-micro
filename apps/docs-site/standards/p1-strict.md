# P1 严格级规则

> 共 19 条，违反需人工确认（CI warning + review 阶段确认）。

| ID | 内容摘要 |
|----|----------|
| **YDIZ-NAME-003** | 禁止中文拼音混合命名 — 命名必须使用英文单词，禁止中文拼音、拼音首字母缩写 |
| **YDIZ-NAME-004** | 禁止无意义命名 — 命名必须"见名知意"，禁止 a、b、tmp、data、flag 等无意义命名 |
| **YDIZ-COLL-001** | 集合初始化必须指定初始容量（已知大小时） |
| **YDIZ-DDD-006** | Repository 接口禁止暴露 getMapper 方法，防止 Mapper 泄漏到 server 层 |
| **YDIZ-CONC-003** | 正则表达式必须预编译为 static final，禁止在循环中编译 |
| **YDIZ-PERF-002** | IO 资源必须使用 try-with-resources 自动关闭 |
| **YDIZ-COMMON-006** | 分布式锁必须通过 ydsz-common-lock，禁止直接使用 Redisson RLock |
| **YDIZ-COMMON-007** | 树形结构必须使用 ydzs-common-domain TreeBuilder，禁止自建递归建树算法 |
| **YDIZ-COMMON-008** | 通知服务必须通过 ydsz-common-notify，禁止直接调用 ydsz-message 内部 API |
| **YDIZ-SEC-002** | 禁止日志打印敏感信息（密码、Token、密钥、API Key 等） |
| **YDIZ-ENG-002** | 禁止硬编码 TTL/容量等配置值，必须通过 @ConfigurationProperties |
| **YDIZ-API-002** | @ApiVersion 注解必须放在 @RequestMapping 上方 |
| **YDIZ-TX-003** | TCC 模式 Try 阶段必须支持幂等 |
| **YDIZ-TX-004** | Feign 调用链必须透传 XID（ydzs-common-feign 自动拦截器） |
| **YDIZ-TEST-003** | 测试基础设施依赖管理：统一版本声明、按需引入 |
| **YDIZ-RESILIENCE-001** | LLM 外部调用必须通过熔断器保护（Resilience4j CircuitBreaker） |
| **YDIZ-CONFIG-001** | @ConfigurationProperties 类超过 200 行必须拆分为子配置类 |
