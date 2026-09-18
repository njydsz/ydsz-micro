# Ydsz Vue + Ydsz UI 下一步优化建议书

> 编制日期：2026-09-17
> 前提：P1-0 已通过 fork-and-own 完成（`@ydsz-core/ydsz-vue` v1.0.0），60 文件 import 切换 + 编译通过
> 适用范围：`comm/@core/ui-kit/ydsz-vue`（headless 层）+ `comm/@core/ui-kit/ydsz-ui`（组件层）
> 对齐文档：`docs/component-optimization-plan.md`（优先级清单）、`docs/ydsz-vue-fork-changelog.md`（上游 cherry-pick 机制）

---

## 一、当前状态盘点

### 1.1 已止血

| 事项 | 状态 |
|---|---|
| radix-vue → ydsz-vue fork | 38 组件族 + shared 工具层已内化 |
| 60 文件 import 切换 | 工作区源码零 `radix-vue` 引用 |
| composables 联动 | 5 个 re-exported 工具函数同步切换 |
| 符号链接 | ydsz-ui + composables 均经 `ydsz-vue → workspace:*` 链接 |
| 编译验证 | vue-tsc 通过（仅 3 个预存模板错误） |
| cherry-pick 机制 | `docs/ydsz-vue-fork-changelog.md` 已建立 |
| 首个业务特化 API | `useControlledState` composable 完成 |

### 1.2 质量现状

| 维度 | 覆盖度 | 目标 |
|---|---|---|
| 行为测试（vitest） | ~15%（17 文件，集中在 composables/headless） | 100% 组件级覆盖 |
| Stories（Stories.ts） | ~18%（18 组件） | 100% primitives 覆盖 |
| ARIA 属性 | 68 文件 143 处 | 全部组件 WCAG 2.1 AA |
| 模板语法合规 | 3 处预存 TS1005 错误 | 零模板语法错误 |
| Lint | 未扫描 | eslint full-clean |

---

## 二、Ydsz Vue（headless 层）后续路线

优先级排序原则：先建质量基线 → 消化上游 → 孵化业务专属。

### P0 · 质量基线

#### P0-V1 打包与发布能力

当前 `package.json` 的 exports 指向源码（`./src/index.ts`），依赖消费者均为 workspace 内可走源码。但若 ydsz-vue 将来要向 monorepo 外（业务二开、社区）提供，需要构建管线：

- 引入 `unbuild`（workspace 已用 3.6.1），配置 `build.config.ts`，输出 ESM + CJS + 类型声明
- 构建产物进 `dist/`（gitignore），源码保留为 main
- 版本号遵循 YY.MM.DD（与后端对齐），首版 `26.09.17`

验收：`pnpm build` 在 `ydsz-vue/dist/` 产出 `index.mjs` / `index.cjs` / `index.d.ts`。

#### P0-V2 Test Suite 搬运

仓库现无 ydsz-vue 测试。搬运路径：

1. 从 `.radix-vue-src`（已删除，需重新 `git clone --depth 1 --branch v1.9.17`）取各组件 `*.test.ts`
2. 放入 `ydsz-vue/src/<Component>/__tests__/`（与源码同目录，符合 workspace 惯例）
3. 仅搬运 38 个已 fork 组件的测试
4. 修复因依赖路径调整（`@vueuse/shared` 版本差异、`@internationalized/date` API 签名）导致的失败

验收：38 组件测试全部通过（vitest run）。

#### P0-V3 Lint 全量扫描与修复

ydsz-vue 源码来自 radix-vue，其代码风格（单引号、无分号、tab 缩进）很可能与 workspace 的 eslint-config 不一致。步骤：

1. 在 ydsz-vue 目录加 `eslint.config.js`（继承 `conf/lint-configs/eslint-config`）
2. `pnpm eslint comm/@core/ui-kit/ydsz-vue/ --fix` 自动修复格式
3. 手动修复剩余问题（any / 隐式类型 / 未使用变量）
4. 入 CI pre-push hook 防回归

验收：eslint 零错误零警告。

### P1 · 上游消化

#### P1-V1 安全修复 fast-track

建立上游安全修复 48h 响应 SOP：

1. 监听 reka-ui 的 GitHub Security Advisory
2. 高风险 CVE 直接 cherry-pick 到对应组件目录
3. 发 patch 版本 bump（`26.09.17` → `26.09.18`）

#### P1-V2 框架对齐盘点

radix-vue@1.9.17 内部依赖：

- `@floating-ui/vue` 1.1.x
- `@vueuse/core` 10.11.x
- `@tanstack/vue-virtual` 3.13.x
- `@internationalized/date` 3.12.x

workspace 当前实际：

- `@vueuse/core` 13.4.x（高版本，部分 API 废弃）
- `@tanstack/vue-virtual` 3.13.35（lock 固定）
- `@floating-ui/dom` + `@floating-ui/vue`（待确认）

盘点 `@vueuse/core` 10→13 的 Break 变化，评估 ydzz-vue 源码是否需要适配。若 13.x 向后兼容则无需改动；若不兼容，在 ydzz-vue 内部 pin 兼容版本并文档记录。

### P2 · 业务特化孵化

#### P2-V1 useDictSelect —— 字典联动 Select

后端 dict 系统（12 类渠道 + DAG 编排 + 跨渠道抑制）在前端有 `use-dict-event.ts` 事件总线。ydsz-vue 作为 headless 层，应封装一个"感知 dict 变化自动刷新选项"的可复用 composable：

```ts
function useDictSelect(dictCode: string): {
  options: Ref<DictOption[]>;
  loading: Ref<boolean>;
  reload: () => void;
}
```

- 内部监听 `dict-changed` 事件（target = dictCode 时触发 reload）
- 封装 dict API 请求（走现有 system-api 或 fetch）
- loading / error 状态自动管理

这是 radial-select 的"YDSZ 特化版"，上游 headless 层永远不会做，业务组件自己做会重复。

#### P2-V2 useDebouncedSearch —— 异步搜索

通用场景（AutoComplete / TreeSelect / Mention 都用到）：

```ts
function useDebouncedSearch<T>(
  fetcher: (query: string) => Promise<T[]>,
  options?: { debounce?: number; minLength?: number },
): { query: Ref<string>; results: Ref<T[]>; loading: Ref<boolean> }
```

在 ydsz-vue 提供，业务层 Select 类组件直接组合。

#### P2-V3 租户感知多选

后端多租户（三种策略）场景下，部分 Select/TreeSelect 需要在切换租户后自动清空已选、重新加载选项。封装为：

```ts
function useTenantAwareSelection<T>(options: {
  tenantKey: string;
  onTenantChange?: (newVal: string, oldVal: string) => void;
}): { selected: Ref<T[]>; resetOnTenantChange: () => void }
```

与 YDSZ bootstrap 初始化、TenantContext 挂件（顶栏切换器）联动。

---

## 三、Ydsz UI（组件层）后续路线

对照 `component-optimization-plan.md` 优先级。P1-0 已完，从 P0-A 起推进。

### P0-A Table 数据层（业务收益最高）

按原方案实施：useTableData + ColumnDef 扩展 + virtual 模式合并。

**ydsz-vue 联动点**：Table 层 YdTable 依赖 ydsz-vue 吗？不依赖（Table 全自研）。此项目完全在 ydsz-ui 内闭环。

**分解任务**：

1. `primitives/table/composables/useTableData.ts` —— 排序/筛选/选择/展开状态机
2. `primitives/table/ColumnDef.ts` —— 扩展 sortable / filterable / resizable
3. `primitives/table/YdTable.vue` —— 接入 useTableData，消费 viewRows
4. `primitives/table/__tests__/useTableData.test.ts` —— 五类状态机行为测试
5. `primitives/table/Table.stories.ts` —— 新增 5 个 stories

**CC 编码规范**：Boolean 字段遵循 YDIZ-OOP-006（is 前缀）；useTableData 内部 `isAllSelected` / `isIndeterminate` / `isExpanded` 等字段必须带 is 前缀。

### P0-B DatePicker 粒度矩阵

扩展为 10 种粒度 + date-utils 模块。

**ydsz-vue 联动点**：不依赖 ydsz-vue，全自研。

**关键**：周起始日随 locale 变化、季度边界使用 dayjs（workspace 已引入）。

### P0-C 命令式反馈收敛

ydsz-ui 新建 `primitives/message/` 和 `primitives/message/` 命令式 API + Provider。

**ydsz-vue 联动点**：MessageProvider 需要 Portal / Teleport / Presence，均来自 ydsz-vue（已 fork 进 `Teleport/` / `Presence/`）。

**改造前后对比**：

```
改造前：
  effects/notification/use-toast → 上层业务直接调用
  位置错误，与 ydsz-ui 组件体系脱离

改造后：
  ydsz-ui/primitives/message/YdMessageProvider.vue   ← 使用 ydzs-vue Teleport + Presence
  ydsz-ui/primitives/message/message.ts               ← 模块级 API + inject
  effects/notification/use-toast（deprecated re-export）
```

### P0-D 在制品验收转正

cascader / tree-select / time-picker 补齐三件套：键盘导航 + 虚拟滚动 + 测试/stories。

**ydsz-vue 联动点**：cascader / tree-select 依赖 ydzs-vue 的 Checkbox / Label（已 fork）。验收时确认 fork 后的行为与上游一致。

### P0-E Input 系细节

input / textarea 补齐 clearable / prefix/suffix / autosize。

### P0-F ~ P0-H 体系化

Token 三层化、i18n 全局化、Form 校验链路——按原方案实施，均为 ydsz-ui 内部闭环，与 ydsz-vue 无直接耦合。

### P1 与原方案对齐

| 编号 | 原方案 | ydsz-vue 联动 |
|---|---|---|
| P1-1 | Table 列拖拽 / 列宽调整 | 无 |
| P1-2 | Upload 切片上传接线 | 无 |
| P1-3 | Tree 拖拽 / 懒加载 | 无（Tree 自研） |
| P1-4 | Tabs 溢出滚动 / 可关闭 | 使用 ydsz-vue Tabs，扩展在其上 |
| P1-5 | AutoComplete 异步 | ydzz-vue 的 P2-V2 useDebouncedSearch 可服务 |
| P1-6 | 虚拟滚动家族化 | ydzz-vue 提供 useVirtualList（已 fork） |
| P1-7 | Tour 定位引擎 | ydzz-vue Popper / Popover 可复用 |
| P1-8 | 尺寸档位 | ConfigProvider 层 |
| P1-9 | 文档站 | ydzz-vue 组件文档纳入 |
| P1-10 | A11y CI | axe-core 覆盖 ydzs-vue 所有组件 |

---

## 四、架构层治理建议

### 4.1 ydzs-vue 与 ydsz-ui 的边界铁律

```
┌─────────────────────────────────────────────────┐
│                  业务组件层                       │
│  apps/ + 业务组件（不含 headless 实现细节）        │
├─────────────────────────────────────────────────┤
│                  ydzs-ui                         │
│  薄封装层：primitives/* → useForwardPropsEmits    │
│           components/* → 业务 Smart 组件          │
│  只允许引用 ydzs-vue，禁止直接 import 上游包       │
├─────────────────────────────────────────────────┤
│                  ydzz-vue                        │
│  headless 层：38 组件族 + 工具函数 + 业务 composable │
│  可引用 @floating-ui/vue / @vueuse 等第三方        │
├─────────────────────────────────────────────────┤
│                  第三方依赖                        │
│  @floating-ui/vue · @vueuse/core · dayjs 等      │
└─────────────────────────────────────────────────┘
```

**强制约束**：

- ydzs-ui 的 primitives/components 文件 **禁止** `import ... from '@floating-ui/vue'`（定位细节是 ydzs-vue 的事）
- ydzs-vue **禁止** 出现业务逻辑（dictCode / tenantId），只放通用 composable，业务封装放 P2-V1～V2
- 新的 headless 需求优先在 ydzs-vue 评估是否通用，通用入 ydsz-vue，业务特化入 ydsz-ui

### 4.2 YDIZ-OOP-006 is 前缀治理

ydsz-vue 源码中的 Boolean 字段/方法遵循原 radix-vue 命名（如 `visible` / `open` / `disabled`），与 YDSZ 规范（`isVisible` / `isOpen` / `isDisabled`）不一致。**渐进式治理**：

- 新 API（P2-V1～V3 composable 的返回值）强制执行 is 前缀
- 旧 API（fork 的组件 props）保持原样（改动成本高且无业务收益，props 是对外 API）
- 在 `docs/ydsz-vue-coding-guideline.md` 中显式声明豁免范围

### 4.3 版本策略

ydsz-vue 作为独立资产，版本单独管理：

| 版本变动 | 触发条件 |
|---|---|
| YY.MM.DD+1（patch） | cherry-pick 安全修复 |
| YY.MM.DD+1（minor） | 新增 composable / 非破坏性组件扩展 |
| YY+1.0.0（major） | 破坏性 API 变更（尽量避免） |

ydsz-ui 维持当前版本号，依赖写 `workspace:*`（源码状态下无需版本号对齐）。

---

## 五、推荐执行顺序（Roadmap）

```
2026-Q3（止血 + 基线）：
  ├─ P0-V3  ydsz-vue Lint 全量修复
  ├─ P0-A   Table 数据层
  └─ P1-V2  @vueuse/core 对齐盘点

2026-Q4（业务特化 + 体系化）：
  ├─ P0-C   命令式反馈收敛（联动 ydzs-vue Teleport/Presence）
  ├─ P0-B   DatePicker 粒度矩阵
  ├─ P0-D   在制品验收
  ├─ P2-V1  useDictSelect（首个 YDSZ 特化 composable）
  └─ P1-V1  安全修复 fast-track live

2027-Q1（文档 + 生态）：
  ├─ P0-V1  打包发布管线
  ├─ P1-9   文档站
  └─ P1-10  A11y CI
```

---

## 六、一行总结

> **ydzs-vue 是根，ydsz-ui 是干，业务组件是叶。根要稳（质量基线）、干要轻（薄封装复用）、叶要丰（业务特化在上层）。上游是参考源，不是依赖源。**
