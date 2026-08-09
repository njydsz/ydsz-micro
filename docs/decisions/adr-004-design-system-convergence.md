# ADR-004: 设计系统收敛策略

## 状态

已接受 (Accepted) — 2026-08-05

## 背景

当前项目中并存三套 UI 组件库/样式方案：

| 库 | 用途 | 包体积 | 使用频率 |
|----|------|--------|----------|
| **Element Plus** | 基础表单/布局/弹窗 | ~300KB gzip | 极高（所有子应用） |
| **Tailwind CSS** | 原子化布局/间距辅助 | ~15KB (purge 后) | 高（shadcn-ui 依赖） |
| **shadcn-ui** | 自研可定制组件 | ~80KB gzip | 中（YDSZButton 等） |

三套方案并存带来：
1. **视觉风格不一致**：Element Plus 的圆角/阴影规范与 shadcn-ui 有差异
2. **包体积冗余**：Element Plus + shadcn-ui 组件功能重叠（Button / Select / Dialog）
3. **开发者认知负担**：同一交互需求，三种实现方式选择困难
4. **维护成本**：Bug 修复需跨三处改动

## 决策

采用 **「Element Plus 为主 + shadcn-ui 补位」** 的两层收敛策略：

### 层级一：Element Plus（基础层）

**定位**：表单控件、布局容器、弹窗交互、通知反馈

保留原因：
- 团队熟悉度最高，学习成本最低
- 业务后台场景下表格/表单/弹窗覆盖最全面
- 国际化（i18n）支持成熟
- 主题定制能力满足品牌色需求

### 层级二：shadcn-ui（增强层）

**定位**：品牌差异化组件、精细交互组件

保留并限定使用范围：
- `YDSZButton`（品牌主按钮，带 loading/disabled 复合状态）
- `YDSZLogo`（品牌 Logo 组件）
- `BackTop`、`FullScreen` 等 Element Plus 无内置的功能组件
- `PinInput`、`Avatar` 等视觉差异化组件

### 规范：Tailwind CSS 限定用途

保留但限定范围：
- **仅** 用于布局工具类（`flex` / `grid` / `p-4` / `gap-2`）
- **仅** 用于 shadcn-ui 内部实现
- **不** 用于 Element Plus 页面样式（改用 SCSS 变量）

## 迁移计划

### Phase 1: 规范制定（1 周）

- [ ] 编写《YDSZ UI 开发规范》文档，明确各场景用哪套组件
- [ ] 在 ESLint 配置中增加 `no-restricted-imports` 规则限制混用
- [ ] 新增组件评审 checklist（是否 Element Plus 能实现？是否需要品牌差异化？）

### Phase 2: 存量收敛（2 周）

- [ ] 审计 9 个子应用中 shadcn-ui 使用情况
- [ ] 非品牌类 shadcn-ui 组件替换为 Element Plus 等价物
- [ ] 保留差异化组件，统一视觉 token

### Phase 3: 增量管控（持续）

- [ ] 新组件开发前先查询 Element Plus 是否已有
- [ ] 组件库版本升级同步评估替代方案
- [ ] 季度 audit 包体积变化

## 组件对照表（收敛指南）

| 场景 | 推荐方案 | 避免混用 |
|------|----------|----------|
| 按钮 | `YDSZButton`（品牌差异化） | 不要同时用 ElButton |
| 表单输入 | `ElInput` / `ElSelect` | 不用 shadcn 同名组件 |
| 弹窗 | `ElDialog` / `ElMessageBox` | 不用 shadcn Dialog |
| 日期选择 | `ElDatePicker` | 不用 shadcn 日期组件 |
| 数据表格 | `vxe-table`（重度表格场景） | 不用 shadcn Table |
| 面包屑 | shadcn `Breadcrumb` | 不用 ElBreadcrumb |
| 卡片 | `ElCard` | 不用 shadcn Card |
| 标签页 | shadcn `Tabs` | 不用 ElTabs |
| 品牌按钮 | `YDSZButton` | 不用 ElButton |
| 返回顶部 | shadcn `BackTop` | Element Plus 无此组件 |

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 收敛期开发效率下降 | 提供 codemod 脚本自动迁移常见替换 |
| 视觉回归 | 视觉回归测试覆盖关键页面（已有 playright visual-regression.spec.ts） |
| 团队惯性阻力 | 文档 + CR 提醒 + ESLint 自动化拦截 |

## 参考

- [Element Plus 组件库](https://element-plus.org/)
- [shadcn/ui 官网](https://ui.shadcn.com/)
- [Tailwind CSS 最佳实践](https://tailwindcss.com/docs/reusing-styles)
- ADR-001: 微前端架构选型
