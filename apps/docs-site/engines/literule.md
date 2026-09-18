# 规则引擎 (ydsz-literule)

> **端口**：9007 | **模块**：`ydsz-literule` | **定位**：业务规则决策

## 核心定位

YDSZ 规则引擎是平台的业务规则决策中心，通过 LiteExpr 表达式语言 + AST 沙箱执行环境，实现业务规则的动态热加载、实时生效，无需重启服务即可修改业务逻辑。同时支持 CEP（复杂事件处理）和 A/B 测试能力。

## 关键差异化能力

| 能力 | 说明 |
|------|------|
| **LiteExpr** | 自研轻量级表达式语言，支持算术运算、逻辑判断、函数调用、集合操作 |
| **AST + 沙箱** | 表达式编译为 AST（抽象语法树），在安全沙箱中执行，禁止反射/文件系统访问 |
| **热加载** | 规则变更后秒级热加载生效，支持灰度发布和版本回滚 |
| **CEP 复杂事件** | 支持事件流模式匹配（如"连续 3 次登录失败触发锁定"） |
| **A/B 测试** | 规则支持 A/B 测试模式，按流量比例分流验证规则效果 |
| **规则链** | 多条规则组成规则链，按优先级顺序命中第一条后停止 |

## 核心代码模块

```
ydsz-literule/
├── ydzs-literule-api/          # FeignClient 接口（RuleFeignClient）
├── ydzs-literule-domain/       # Entity / DTO / Repository 接口 / DomainService
│   ├── entity/                 # RuleDefinition, RuleVersion, EvalContext, RuleHitLog
│   ├── repository/             # 规则定义/版本/命中记录 Repository
│   ├── domain-service/         # LiteExpr 编译器、AST 解释器、沙箱执行器
│   ├── enums/                  # RuleStatusEnum, SandboxModeEnum
│   └── converter/              # MapStruct Entity↔VO 转换器
├── ydzs-literule-infra/        # Mapper / Repository 实现
└── ydzs-literule-server/       # Controller / 热加载 Worker / 命中统计聚合
```

## 核心 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/literule/rule/page` | GET | 规则分页列表 |
| `/literule/rule/deploy` | POST | 部署规则（支持热加载） |
| `/literule/rule/evaluate` | POST | 在线评估规则（调试模式） |
| `/literule/rule/rollback` | POST | 回滚规则到历史版本 |
| `/literule/version/page` | GET | 规则版本历史 |
| `/literule/hit/stats` | GET | 规则命中统计（命中率/命中率趋势） |
| `/literule/cep/pattern` | POST | CEP 模式注册 |

## LiteExpr 语法示例

```
// 算术表达式
price * quantity * (1 - discount)

// 逻辑判断
user.level == 'VIP' AND cart.total > 1000

// 集合操作
orders.any(o -> o.status == 'PENDING')
products.filter(p -> p.stock > 0).size() > 10

// 自定义函数调用
date.daysBetween(order.createTime, now()) <= 30
```

## 沙箱安全限制

- 禁止反射（`Class.forName` / `Method.invoke`）
- 禁止文件 I/O（`File` / `FileInputStream`）
- 禁止网络访问（`Socket` / `HttpURLConnection`）
- 禁止执行系统命令（`Runtime.exec`）
- 单次执行超时：100ms（可配置）

## 数据库表前缀

`ydsz_`

## 依赖关系

- **被依赖**：智能引擎（Agent 决策）、流程引擎（审批规则）、任务引擎（执行条件判断）
- **依赖**：ydsz-common-cache、ydsz-common-seata（多规则事务）
