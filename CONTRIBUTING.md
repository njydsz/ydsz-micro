# 贡献指南 (Contributing Guide)

感谢你关注并愿意为 REMI Frontend 贡献力量！无论是修复 Bug、新增特性、完善文档，还是提出改进建议，都欢迎通过 Issue 或 Merge Request（MR）参与。

阅读本文档预计 5 分钟，请务必在发起 MR 前通读一遍，可以显著减少来回沟通的成本。

## 目录

- [开发环境](#开发环境)
- [分支模型](#分支模型)
- [如何提交 Issue](#如何提交-issue)
- [如何提交代码（MR 流程）](#如何提交代码mr-流程)
- [代码规范](#代码规范)
- [测试要求](#测试要求)
- [提交信息规范](#提交信息规范)
- [文档与决策记录](#文档与决策记录)
- [安全漏洞报告](#安全漏洞报告)

## 开发环境

| 依赖    | 版本       | 说明                                                  |
| ------- | ---------- | ----------------------------------------------------- |
| Node.js | >= 20.10.0 | 建议使用 LTS                                          |
| pnpm    | >= 9.12.0  | 建议通过 corepack 固定（仓库已声明 `packageManager`） |

> 仓库通过 `preinstall` 钩子强制使用 pnpm（`only-allow pnpm`），使用 npm/yarn 安装会直接失败，这是有意为之。

```bash
# 安装依赖（首次约需几分钟）
pnpm install

# 启动开发环境
pnpm dev

# 跑一遍完整质量检查（提交前必做）
pnpm check
```

## 分支模型

仓库采用 **trunk-based + 短生命周期特性分支** 的轻量模型：

- `main`：主干分支，始终处于可发布状态，禁止直接推送，所有变更必须通过 MR 合入。
- 特性分支命名建议：`feat/<描述>`、`fix/<描述>`、`docs/<描述>`、`refactor/<描述>`、`chore/<描述>`。

```bash
git checkout -b feat/support-xxx
```

## 如何提交 Issue

提交 Issue 前请先搜索是否已有相同或相似的问题，避免重复。

### Bug 报告模板

```markdown
### 描述

（发生了什么？期望行为 vs 实际行为）

### 复现步骤

1. 访问 http://localhost:5600/xxx
2. 执行 …

### 环境

- 浏览器版本：
- Node / pnpm 版本：
- 运行模式：dev / build

### 日志 / 截图

（控制台报错、网络请求、截图等）
```

### 特性建议

请说明**业务场景**（为什么需要）而非只描述实现方案（怎么做），并尽量给出验收标准。

## 如何提交代码（MR 流程）

1. **Fork 或直接基于 `main` 新建分支**（团队内可直接在仓库内建分支）。
2. **小步提交**，每个提交只做一件事，提交信息遵循 [Conventional Commits](#提交信息规范)。
3. **本地全量检查通过**后再推送：

   ```bash
   pnpm check          # lint + 类型 + 循环依赖 + 契约 + 拼写
   pnpm test:unit      # 单元测试（本地会由 lefthook pre-push 自动执行）
   ```

   > Lefthook 会在 `pre-commit` / `pre-push` 自动执行格式化、Lint、单测、类型检查与依赖审计，本地被拦截的改动请先修复再提交。

4. **发起 MR**，描述中说明：变更动机、改动范围、测试方式、是否破坏兼容（Breaking Change）。
5. **响应评审**：MR 至少需要 1 位维护者 approve；评审意见请逐条回复或处理。
6. **合入**：由维护者合入 `main`；合入后请及时删除已合并的特性分支。

## 代码规范

| 项         | 规范                                                                          |
| ---------- | ----------------------------------------------------------------------------- |
| 语言       | TypeScript 严格模式，禁止 `any` 裸用（详见共享 tsconfig）                     |
| 代码风格   | Prettier（勿手工调整格式，交给工具）                                          |
| Lint       | ESLint 9 扁平配置 + Stylelint（Vue/SCSS）                                     |
| 拼写       | 新增标识符必须通过 cspell 检查（新词加入 `cspell.json`）                      |
| 共享包改动 | 修改 `comm/` 下共享包时，须同步考虑所有受影响子应用，并在 MR 描述中列出影响面 |

## 测试要求

- **新增/修改功能**必须配套单元测试（`*.spec.ts`），并满足覆盖率门槛（branches ≥ 70%、lines ≥ 80%，逐文件生效）。
- **涉及核心流程**（登录、路由、微前端生命周期）的改动建议补充 E2E 用例（`e2e/`）。
- **UI 类改动**请本地跑 `pnpm test:a11y` 确认不引入可访问性回归。
- 合入前 `pnpm test:unit` 与 `pnpm check:type` 必须通过（lefthook pre-push 已强制）。

## 提交信息规范

提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)，Commitlint 强制校验：

```
<type>(<scope>): <subject>

[body]
```

- `type`：`feat` / `fix` / `style` / `perf` / `refactor` / `revert` / `test` / `docs` / `chore` / `ci`
- `scope`：可选，建议为模块名，如 `micro-kernel`、`shared-auth`、`userinfo-web`
- 破坏性变更：在 body 中标注 `BREAKING CHANGE: <说明>`

示例：

```text
feat(micro-kernel): 支持 iframe 沙箱按需启用

- 新增 MicroAppEntry.sandbox 配置项
- 默认保持 snapshot 沙箱不变

BREAKING CHANGE: sandbox 配置项由布尔值改为枚举
```

> 使用 `pnpm commit`（czg）可交互式生成符合规范的提交信息。

## 文档与决策记录

- 涉及**架构性决策**的改动，须在 `docs/decisions/` 下补充 ADR（格式参考 [ADR-003](docs/decisions/adr-003-ssr-pre-rendering.md)），并在 MR 描述中链接。
- 修改公共行为、命令或配置时，请同步更新 [README.md](README.md)。

## 安全漏洞报告

请**不要**在公开 Issue 中提交安全漏洞，详见 [SECURITY.md](SECURITY.md) 的报告流程。

---

再次感谢你的贡献 🎉 如有疑问，可以在 Issue 中 @ 维护者，或在 MR 评论中直接沟通。
