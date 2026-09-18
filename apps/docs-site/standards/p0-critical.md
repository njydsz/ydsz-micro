# P0 阻断级规则

> 共 39 条，违反将导致 PR 自动拒绝。AI 编码绝对禁止违反。

## 架构层

| ID | 内容摘要 |
|----|----------|
| **YDIZ-ARCH-001** | 高层模块可依赖低层模块，低层模块禁止依赖高层模块（enforce-l1-purity） |

## 编码层

| ID | 内容摘要 |
|----|----------|
| **YDIZ-CODE-001** | 所有源文件必须使用 UTF-8（无 BOM）编码 |

## 导入层

| ID | 内容摘要 |
|----|----------|
| **YDIZ-IMPORT-001** | 禁止行内全限定类名（FQN），必须通过 import 顶部声明 |
| **YDIZ-IMPORT-002** | 禁止通配符 import（`import xxx.*`） |
| **YDIZ-IMPORT-003** | 禁止未使用的 import 语句 |
| **YDIZ-IMPORT-004** | 禁止直接 import 第三方 JSON 库，统一使用 ydsz-common-json |
| **YDIZ-IMPORT-005** | 禁止业务模块直接 import Netty，必须通过 ydsz-common-netty 封装 |

## 命名层

| ID | 内容摘要 |
|----|----------|
| **YDIZ-NAME-001** | entity 包下禁止使用 DO 后缀 |
| **YDIZ-NAME-002** | 数据库表名必须使用 `ydsz_` 前缀 |

## OOP 层

| ID | 内容摘要 |
|----|----------|
| **YDIZ-OOP-001** | 覆盖 equals 必须同时覆盖 hashCode |
| **YDIZ-OOP-002** | 包装类比较必须使用 equals，禁止使用 == |
| **YDIZ-OOP-003** | 禁止定义为 double/float 类型，一律使用 BigDecimal |
| **YDIZ-OOP-006** | **布尔字段必须带 is 前缀**（数据库 `is_xxx` ↔ Java `isXxx`，`@ConfigurationProperties` 豁免） |

## 日志层

| ID | 内容摘要 |
|----|----------|
| **YDIZ-LOG-001** | 禁止空 catch 块（吞异常） |
| **YDIZ-LOG-002** | 日志必须使用 `{}` 占位符，禁止字符串拼接 |
| **YDIZ-LOG-003** | 禁止 System.out/err 和 printStackTrace |

## 日期层

| ID | 内容摘要 |
|----|----------|
| **YDIZ-DATE-001** | SimpleDateFormat 非线程安全，禁止作为共享变量 |
| **YDIZ-DATE-002** | 使用 Java 8+ 时间 API，禁止 Date/Calendar |

## 集合层

| ID | 内容摘要 |
|----|----------|
| **YDIZ-COLL-002** | 方法返回集合禁止返回 null，必须返回空集合 |

## DDD 层

| ID | 内容摘要 |
|----|----------|
| **YDIZ-DDD-001** | 依赖方向必须单向，禁止反向依赖 |
| **YDIZ-DDD-002** | Repository 必须返回 VO/DTO，禁止返回 Entity（PO） |
| **YDIZ-DDD-003** | server 层禁止直接使用 Mapper/QueryWrapper |
| **YDIZ-DDD-004** | **Entity 和 Converter 必须放在 domain 层，infra 层禁止声明 MapStruct 依赖** |
| **YDIZ-DDD-005** | **api 模块禁止自建 domain/vo/dto/query 子包** |

## 并发层

| ID | 内容摘要 |
|----|----------|
| **YDIZ-CONC-001** | 禁止业务代码自建线程池，统一使用 ydsz-common-thread |
| **YDIZ-CONC-002** | ThreadLocal 必须在 finally 中 remove |

## 性能层

| ID | 内容摘要 |
|----|----------|
| **YDIZ-PERF-001** | 禁止 N+1 查询（循环中执行数据库查询） |

## 公共模块层

| ID | 内容摘要 |
|----|----------|
| **YDIZ-COMMON-001** | 文件存储必须通过 ydsz-common-file 接入 |
| **YDIZ-COMMON-002** | Excel 必须通过 ydsz-common-excel 处理 |
| **YDIZ-COMMON-003** | 分布式事务禁止直接使用 Seata 原生 API |
| **YDIZ-COMMON-004** | 本地缓存必须通过 ydsz-common-cache |
| **YDIZ-COMMON-005** | Sentry/监控指标必须通过 ydsz-common-sentry |

## 安全层

| ID | 内容摘要 |
|----|----------|
| **YDIZ-SEC-001** | 禁止 SQL 字符串拼接（SQL 注入） |

## 引擎层

| ID | 内容摘要 |
|----|----------|
| **YDIZ-ENG-001** | 禁止在 ydsz-common 下自行创建新子模块 |

## API 层

| ID | 内容摘要 |
|----|----------|
| **YDIZ-API-001** | **API 版本通过 Header 协商，/api 前缀为网关层命名空间** |

## 事务层

| ID | 内容摘要 |
|----|----------|
| **YDIZ-TX-001** | @GlobalTransactional 最大嵌套深度不超过 1 层 |
| **YDIZ-TX-002** | 全局事务超时不超过 30000ms |

## 测试层

| ID | 内容摘要 |
|----|----------|
| **YDIZ-TEST-001** | 项目建立分层测试体系（测试金字塔），核心模块必须编写单元测试 |
| **YDIZ-TEST-002** | Mock 外部依赖规则：生产/Mock 行为一致，禁止 Mock 被测类和纯 POJO |
