# ADR-007: 三沙箱支持矩阵 — snapshot / proxy / iframe 的定位与投入策略

- **状态**: 已采纳（v4.4.0 明确矩阵，iframe 降级 experimental）
- **关联代码**: `micro-kernel/src/sandbox.ts`、`proxy-sandbox.ts`、`iframe-sandbox.ts`、`sandbox-strategy.ts`、`iframe-rpc.ts`

## 背景

内核实现三种沙箱并支持按子应用配置切换。项目定位（README）为「同团队、统一构建链的同源子应用集群」——该场景下 iframe 沙箱（含跨 realm RPC、origin 白名单加固）尚无真实用例，但维护三套沙箱的测试与演进成本持续发生。

## 决策（支持矩阵）

| 沙箱 | 适用场景 | 状态 | 维护策略 |
| ---- | ---- | ---- | ---- |
| snapshot（快照） | 同源同构子应用默认选项 | 默认 | 全量支持，缺陷 P0 级响应 |
| proxy | 需要更强隔离/多次进出挂载的场景 | 支持 | 全量支持 |
| iframe | 跨域 / 不可信三方子应用接入（预留） | **experimental** | 仅安全修复；新特性不默认覆盖；启用前须评审 |

约定：

1. 子应用通过注册表 `sandbox` 字段选择策略（`micro-apps.config.ts`），默认 snapshot
2. iframe 沙箱的新增能力（RPC 方法扩展、样式策略等）以"有真实接入方"为前提再排期
3. 沙箱相关用例须覆盖三条链路的卸载副作用清理（`sandbox.spec.ts` 等已覆盖）

## 后果

- 正面：明确投入边界，避免三套沙箱同步演进的成本；为未来异构接入保留能力
- 负面：iframe 路径的功能覆盖会随时间落后于 snapshot/proxy（接受，有 ADR 记录）
