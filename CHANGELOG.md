# Changelog

本文件记录 REMI Frontend 所有重要变更，格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 新增

- 开源治理文档：`LICENSE`（MIT）、`CONTRIBUTING.md`、`CODE_OF_CONDUCT.md`、`SECURITY.md`
- 根目录与全部 workspace 包声明 `license: "MIT"`

### 修复

- README 移除已删除的 `project-web` 幽灵引用，应用清单校正为 8 个子应用
- 微应用架构图端口标注与实际一致（9001–9009 后端端口）

## [1.0.0] - 2026-08-05

### 新增

- 基于自研 micro-kernel（ESM 原生微前端运行时）的 Monorepo 工程
- 主应用 `main-web`（5600）+ 8 个业务子应用（5601–5610）
- 多级沙箱（快照 / Proxy / iframe）、版本与灰度管理、keep-alive 资源调度、分级错误降级
- 路由预测（马尔可夫链）+ 四类预加载策略 + link-hints / speculation-rules 预热
- `@remi/shared-auth` 公共认证包、`@remi/monitor` 前端监控（Web Vitals）
- 全链路工程设施：ESLint 9 / Stylelint / Commitlint / Lefthook、Vitest 覆盖率门槛、Playwright E2E + a11y、Lighthouse 性能预算
- micro-kernel DevTools Chrome 扩展（Manifest V3）

### 变更

- 仓库品牌由 `ydzs-frontend` 统一迁移为 `remi-micro`（作用域 `@remi/*`）
- 移除 `apps/project-web` 子应用（monorepo 结构整合）

<!-- 版本发布时：将 Unreleased 内容迁移至新版本段落，并按模板补充 -->
