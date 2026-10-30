# ydzs-vue / ydsz-ui 对标主流竞品全维度差距分析（更新版）

> **分析日期**：2026-10-30  
> **分析范围**：ydzs-vue (Headless 原语层, v1.0.0) + ydsz-ui (有样式层 v5.5.9 + 业务复合组件)  
> **竞品基准版本**：PrimeVue 4.5.5 / Naive UI 2.44.1 / Element Plus 2.14.2 / Ant Design Vue 4.2.6+  
> **竞争格局**：Arco Design Vue 2.x 作为第五参照系纳入对比  
> **状态图例** | ✅ 已完成/领先 | 🔧 本轮已落地 | ❌ 未启动 | ⚠️ 已存在但需增强  

---

## 一、组件覆盖度对比

### 1.1 组件数量全景

| 维度 | ydzs-vue | ydsz-ui | PrimeVue | Naive UI | Element Plus | Ant Design Vue | Arco Design |
|------|----------|---------|----------|----------|-------------|---------------|------------|
| Headless primitives | ~35 | — | (Unstyled 模式) | — | — | — | — |
| 有样式基础组件 | — | ~139 dir / **340+ 导出名** | ~80 | ~90 | ~100 | ~60 | ~70 |
| 高阶 Wrapper (便利性 API) | — | ~40 个 (YdTabPane/YdRow/YdCol 等) | — | — | — | — | — |
| 业务复合组件 (Pro/Advanced) | — | ~25 (ProTable/DataView/TreeTable/Dashboard 等) | 370+ Blocks | — | — | Pro Components | — |
| **合计 API 出口数** | **~35** | **~340+** | **~460+** | **~90** | **~100** | **~60** | **~70** |

> **注**：ydsz-ui 的导出名数量虽多于竞品，但其中包含大量 `YdSelectTriggerBase`/`YdSelectContentBase` 等 primitive 级包装、以及 `CalendarPanel`/`YearPanel`/`MonthPanel` 等子组件独立导出。实际面向开发者的高阶 API 约为 **180 个**。

### 1.2 PrimeVue 4.5.x 有而 ydzs-ui 缺失的核心组件

| PrimeVue 组件 | 分类 | ydzs-ui 差距状态 | 等级 |
|---------------|------|-----------------|------|
| CascadeSelect (级联下拉) | Form | Cascader 存在但 API 不同，无 Form 内联级联 | P2 |
| FloatLabel / IftaLabel (浮动标签) | Form | FloatLabel 已存在，IftaLabel (Incremental Label) 缺失 | P2 |
| IconField (图标输入框) | Form | InputGroup + Icon 可组合，但无独立 IconField | P2 |
| SelectButton (按钮选择器) | Form | CheckButtonGroup 部分覆盖，无 SelectButton 样式 | P3 |
| ToggleButton (切换按钮) | Form | ❌ 缺失 | P3 |
| Knob (角度旋钮) | Form | ❌ 缺失 | P3 |
| SpeedDial (悬浮快捷菜单) | Button | FloatButton 部分覆盖，无 radial menu | P3 |
| DataView (卡片/列表切换视图) | Data | ✅ DataView 已存在 | — |
| OrderList (排序列表) | Data | ✅ OrderList 已存在 | — |
| PickList (穿梭选择列表) | Data | ✅ PickList 已存在 | — |
| VirtualScroller (高级虚拟滚动) | Data | ⚠️ VirtualList 存在，但需深度集成到 Select/Table/Pagination | P1 |
| Stepper (步骤切换) | Panel | ⚠️ Stepper 已存在 (YdStepper) | — |
| ConfirmDialog (命令式确认弹窗) | Overlay | ❌ 仅 ConfirmDialog 组件，缺少命令式 API | **P0** |
| ConfirmPopup (气泡确认) | Overlay | ⚠️ Popconfirm 存在，非完全等同 | P1 |
| DynamicDialog (动态弹窗) | Overlay | ❌ 缺失程序化弹窗 API | **P0** |
| TreeTable (树形表格) | Data | ✅ TreeTable 已存在 | — |
| FileUpload (高级拖拽裁剪) | File | ⚠️ 已存在，但缺少图片裁剪/分片上传完整链路 | P1 |
| MegaMenu (超级菜单) | Menu | ✅ MegaMenu 已存在 | — |
| Toast (轻量多实例消息) | Messages | ✅ Toast 已存在 | — |
| DeferredContent (懒加载内容) | Panel | ❌ 缺失 | P3 |

### 1.3 Naive UI 2.44.x 有而 ydsz-ui 缺失的核心组件

| Naive UI 组件 | ydzs-ui 差距状态 | 等级 |
|--------------|-----------------|------|
| LoadingBar (顶部加载进度条) | ❌ 缺失 | **P1** |
| Countdown (展示型倒计时) | ✅ Countdown 已存在 | — |
| Time (相对时间展示) | ❌ 缺失 | P2 |
| Code (代码高亮) | ⚠️ DiffViewer 部分覆盖，无 CodeBlock | P2 |
| Image (高级预览+懒加载) | ⚠️ Image + ImageEditor 存在，但无 lazy + preview srcList | P2 |
| Equation (KaTeX 公式) | ❌ 缺失 | P3 |
| GradientText (渐变文字) | ❌ 缺失 | P3 |
| Mention (提及/@) | ✅ Mention 已存在 | — |
| AutoComplete (自动完成) | ✅ AutoComplete 已存在 | — |

### 1.4 Element Plus 2.14.x 有而 ydsz-ui 缺失/弱化的组件

| Element Plus 组件 | ydzs-ui 差距状态 | 等级 |
|-------------------|-----------------|------|
| ConfigProvider 全局空态 | ✅ ConfigProvider+RenderContent 覆盖 | — |
| Space (间距) | ✅ Space 已存在 | — |
| Row/Col (24 栅格) | ✅ YdRow/YdCol 已存在 (v5.5.1+) | — |
| ImageViewer (图片预览) | ⚠️ Image 存在但无 ImageViewer 级联预览 | P1 |
| Tour (引导) | ✅ Tour + TourHint 已存在 | — |
| Transfer 虚拟滚动 | ⚠️ Transfer 存在，无虚拟滚动增强 | P2 |
| Popover (高级) | ✅ Popover 已存在 | — |
| Text (文本省略) | ⚠️ Typography 部分覆盖 | P2 |
| CheckTag (可选标签) | ✅ TagCheckable 已存在 | — |

### 1.5 Ant Design Vue 4.x 独有亮点

| Ant Design Vue 组件 | ydzs-ui 差距状态 | 等级 |
|---------------------|-----------------|------|
| Modal 函数式调用 (Modal.confirm/info) | ❌ 仅 ConfirmDialog，无 Modal.confirm 统一命令式 | **P0** |
| Typography 可编辑模式 | ⚠️ Typography 仅展示，无 edit/copy 组件 | P1 |
| Form 动态字段 (Form.List) | ⚠️ Form 基础，无字段级动态增删组件封装 | P1 |
| Form 依赖校验 | ⚠️ 基础 async-validator，无 dependencies/watch 高级集成 | P1 |
| QrCode | ✅ QrCode + QrCodePro 已存在 | — |
| Watermark | ✅ Watermark 已存在 | — |
| ColorPicker | ✅ ColorPicker 已存在 | — |
| App 包裹器 (统一 message/notification) | ❌ 缺失全局容器统一 API | P1 |
| CronExpression (Cron 表达式) | ❌ 缺失 | P3 |

---

## 二、架构设计差距

| 维度 | ydzs-ui / ydsz-vue | PrimeVue | Naive UI | Element Plus | Ant Design Vue |
|------|-------------------|----------|----------|-------------|---------------|
| 架构理念 | **两层架构** (Headless + 有样式 + 业务复合 三层复用) | 4 层 (composition → primitives → styled → volt) | 扁平单层 (CSS-in-JS) | 扁平单层 (SCSS + 行为耦合) | 扁平单层 (CSS-in-JS) |
| Headless 层复用 | ✅ Radix Vue 1.9.x 内化（完全 fork 独立演进） | 自有 Partial 实现 | ❌ 无 Headless 层 | ❌ 无 Headless 层 | ❌ 无 Headless 层 |
| 样式方案独立性 | ⚠️ 组件 className 需加 prefix、以 Tailwind + CSS 变量运行 | ✅ 主题系统随时替换为 Aura/Lara/Nora | ✅ CSS 变量运行时覆盖 | ⚠️ SCSS 变量 + CSS 变量桥接 | ✅ CSS-in-JS 主题 |
| Pass-Through | ✅ 自有 PT 系统 (class/style/attrs 合并) | ✅ 成熟 PT | ❌ 仅 CSS 变量覆盖 | ⚠️ v-deep 覆盖 | ⚠️ CSS-in-JS props |
| CSS Variables 文档 | ✅ 自动提取 (css-vars-reference.ts, 263 行) | ✅ 文档 | ✅ 文档 | ⚠️ 文档不完整 | ✅ 文档 |
| 样式方案 | Tailwind + CSS 变量 | CSS 变量 + 主题系统 | CSS-in-JS (零运行时依赖) | SCSS + CSS 变量桥接 | CSS-in-JS |
| Tailwind 集成 | ✅ 核心依赖 | ✅ Preset 可选 | ⚠️ 可选 | ❌ 纯 SCSS | ⚠️ 可选 |

**架构差距小结**：

1. **独有优势**：ydsz-ui 的两层/三层架构是核心护城河 —— Radix Vue 提供 WCAG 原生合规 + DismissableLayer/FocusTrap 底层基础设施；ydsz-ui 层注入品牌设计体系；business 层封装领域模式。竞品中仅 PrimeVue 追求类似理念但分层不如 ydsz-ui 清晰。
2. **劣势**：Naive UI 的 CSS-in-JS 在运行时主题切换和 SSR 场景下更灵活；PrimeVue 的 4 层架构 composition 层独有。

---

## 三、主题与样式系统差距

| 维度 | ydzs-ui | PrimeVue 4.5 | Naive UI 2.44 | Element Plus 2.14 | Ant Design Vue 4.x |
|------|---------|--------------|---------------|-------------------|-------------------|
| 样式方案 | Tailwind + CSS 变量 | CSS 变量 + 主题引擎 | CSS-in-JS | SCSS + CSS 变量 | CSS-in-JS |
| 深色模式 | ✅ CSS 变量 + 类切换 | ✅ 自动/手动 | ✅ 自动/手动 | ✅ | ✅ |
| 设计 Token 体系 | ✅ design-tokens 包 (color/radius/spacing/shadow/font + density + figma sync) | ✅ 多层级 token | ✅ 类型安全 token | ⚠️ 基础 token | ✅ 完整 token |
| 全局运行时主题编辑 | ⚠️ ThemeEditor 组件 (基础) | ✅ GUI Theme Designer 应用 | ✅ ThemeEditor 组件 | ❌ | ✅ 动态算法 + 主题混音 |
| 主题种类/风格 | 自研默认 | Aura/Lara/Nora/Material + 30+ 主题 | 默认亮/暗 | 默认 | 默认/紧凑/暗色/dark |
| 全局样式覆盖 | CSS 变量 | CSS 变量 + PT | 覆盖对象 | CSS 变量 | ConfigProvider token |
| 组件级样式覆盖 | PT 系统 | PT 系统 | CSS 变量覆盖 | v-deep | CSS-in-JS props |
| Figma 集成 | ✅ figma-sync + figma-sync-variable-collections | ✅ 付费 UI Kit | ❌ | ✅ Figma UI Kit + Variables | ✅ 付费 Figma |
| RTL 布局支持 | ❌ 缺失 | ✅ 完整 | ✅ 完整 | ⚠️ 部分 | ✅ 完整 |
| prefers-reduced-motion | ✅ useReducedMotion | ✅ | ✅ | ❌ | ✅ |
| 响应式设计 | ✅ Tailwind 响应式 | ✅ Tailwind 响应式 | ✅ CSS-in-JS | ✅ 媒体查询 | ✅ 媒体查询 |
| 密度模式 | ✅ Density Tokens (compact/standard/loose) | ⚠️ 基础 | ⚠️ 基础 | ⚠️ 基础 | ✅ compact/large |
| 动效系统 | ✅ motion-tokens (duration/easing) | ✅ 丰富动画系统 | ✅ 完整 | ⚠️ 基础 | ✅ 完整 |

**关键差距**：

1. **P0**：缺少运行时可视化 Theme Designer 应用（PrimeGUI Theme Designer 是企业级重要卖点）
2. **P1**：完整 RTL 布局支持缺失（PrimeVue / Naive UI / AntD 原生支持 ltr↔rtl 切换）
3. **P2**：缺少 PrimeVue Aura/Lara/Nora 风格的多主题预设
4. **P2**：Figma 设计工具链深度不如 PrimeVue + AntD（已有 sync 脚本但缺 GUI Maker）

---

## 四、TypeScript 与类型安全差距

| 维度 | ydzs-ui | PrimeVue 4.5 | Naive UI 2.44 | Element Plus 2.14 | Ant Design Vue 4.x |
|------|---------|--------------|---------------|-------------------|-------------------|
| 全量 TS 编写 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 主题配置类型安全 | ⚠️ 基础 | ✅ 完整类型推导 | ✅ **最亮点** 主题 TS 类型完整 | ⚠️ 弱 | ✅ 类型安全 |
| 组件 Props 推断 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 事件类型推断 | ⚠️ 部分缺失 | ✅ 完整 | ✅ 完整 | ✅ 完整 | ✅ 完整 |
| Ref/Expose 类型 | ⚠️ 部分完善 | ✅ 完整 | ✅ 完整 | ✅ 完善 | ✅ 完善 |
| Scoped Slot 类型 | ⚠️ 部分 (typed slots 推进中) | ✅ typed slots | ✅ typed slots | ⚠️ 弱 | ⚠️ 弱 |
| 泛型组件 | ⚠️ 弱 | ✅ 强 | ✅ 强 | ⚠️ 弱 | ✅ Table 泛型强 |
| Form 表单值类型推导 | ⚠️ 基础 | ✅ 较好 | ✅ 强 | ⚠️ 弱 | ✅ 最强 (RC Field) |
| 条件类型/映射类型覆盖率 | ⚠️ 中等 | ✅ 全面 | ✅ 全面 | ⚠️ 一般 | ✅ 全面 |

**关键差距**：

1. **P1**：Naive UI 主题类型系统最强（ydsz-ui 主题配置 untyped 隐患）
2. **P2**：事件类型推断、Slot 类型安全性需持续提升
3. **P2**：Form 表单泛型推导相比 AntD Vue 4.x 有显著差距

---

## 五、可访问性 (A11y) 差距

| 维度 | ydsz-ui | PrimeVue 4.5 | Naive UI 2.44 | Element Plus 2.14 | Ant Design Vue 4.x |
|------|---------|--------------|---------------|-------------------|-------------------|
| WCAG 合规基础 | ✅ Radix Vue 原生 (2.1 AA) | ✅ 原生完整 | ✅ 完整 | ⚠️ 部分缺失 | ✅ 较完整 |
| Focus Trap / Focus Scope | ✅ Radix DismissableLayer + FocusGuards | ✅ 手动实现 | ✅ 手动实现 | ⚠️ 部分 | ✅ 完整 |
| ARIA 自动注入 | ✅ Radix 自动 | ✅ 手动注入 | ✅ 手动注入 | ⚠️ 部分 | ✅ 较完整 |
| 键盘导航 (完整组合键) | ✅ 全盘内置 (Esc/Tab/Arrow/Enter/Space) | ✅ 完整 | ✅ 完整 | ⚠️ 部分缺失 | ✅ 较完整 |
| Screen Reader 播报 | ✅ ARIA live regions 通过 primitive | ✅ | ✅ | ⚠️ 部分 | ✅ |
| Focus Indicators | ✅ | ✅ | ✅ | ⚠️ 部分 | ✅ |
| ARIA Role 契约标准化文件 | ✅ aria-role-map.ts (15+ 组件契约声明) | ❌ 无 | ❌ 无 | ❌ 无 | ❌ 无 |
| Vitest 级别 a11y 测试工具 | ✅ a11y-test-utils.ts + axe-core 集成 | ❌ 无内置 | ❌ 无内置 | ❌ 无内置 | ❌ 无内置 |
| 无障碍冒烟测试 (CI) | ✅ playwright 扫描配置 | ❌ 部分 | ❌ 部分 | ❌ | ❌ |
| prefers-reduced-motion | ✅ 全组件响应 + reduced-motion.css | ✅ | ✅ | ❌ | ✅ |

**优势**：ydsz-ui 在可访问性是**全面超越竞品**的最大差异化 —— Radix 原生解决核心交互；aria-role-map.ts 是合规工具链独创；Vitest-axe 集成和冒烟配置也是竞品不具备的。

---

## 六、国际化 (i18n) 差距

| 维度 | ydzs-ui | PrimeVue 4.5 | Naive UI 2.44 | Element Plus 2.14 | Ant Design Vue 4.x |
|------|---------|--------------|---------------|-------------------|-------------------|
| 内置语言数量 | **9** (ar/de/en/es/fr/hi/ja/ko/zh/ru/th/vi — 12) | **40+** | **30+** | **50+** | **40+** |
| RTL 布局 | ❌ 缺失 | ✅ 完整 | ✅ 完整 | ⚠️ 部分 | ✅ |
| 运行时语言切换 | ✅ locale/ composable | ✅ | ✅ | ✅ | ✅ |
| 组件内文案 i18n | ✅ use-component-i18n composable | ✅ | ✅ | ⚠️ 不统一 | ✅ |
| 日期/数字本地化 | ✅ (@internationalized/date) | ✅ 内置 | ✅ 内置 | ✅ 内置 | ✅ 内置 |
| 复数规则 (ICU MessageFormat) | ❌ 缺失 | ✅ ICU | ✅ 内置 | ✅ 内置 | ✅ 内置 |
| 区域回退 (zh-CN → zh) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 组件 i18n 标准 | ✅ 标准化 (useLocale + use-component-i18n) | ✅ | ✅ | ⚠️ 零散 | ✅ |

**关键差距**：

1. **P0**：缺少 RTL 布局支持（影响阿语/希伯来语用户体验）
2. **P1**：内置语言 12 vs 30-50+，覆盖不足
3. **P1**：缺少 ICU MessageFormat 复数规则（单复数国际化薄弱）

---

## 七、性能差距

| 维度 | ydzs-ui / ydsz-vue | PrimeVue 4.5 | Naive UI 2.44 | Element Plus 2.14 | Ant Design Vue 4.x |
|------|-------------------|--------------|---------------|-------------------|-------------------|
| Tree-shaking | ✅ 完整 (Resolver) | ✅ 完整 | ✅ 完整 | ✅ 完整 | ✅ 完整 |
| 虚拟列表 | ✅ VirtualList + VirtualTable (@tanstack/vue-virtual) | ✅ VirtualScroller | ✅ **全覆盖** (Select/Table/Tree/Transfer/Cascader) | ⚠️ 外部引入 | ✅ 可用 |
| 虚拟滚动深度集成 | ⚠️ 独立组件未下沉到 Select/Tree/Transfer | ✅ 组件级集成 | ✅ 所有数据组件默认 | ❌ 外部 | ⚠️ 部分 |
| 组件级懒加载 | ⚠️ use-idle-hydrate 部分实现 | ❌ | ✅ 内置 | ❌ | ❌ |
| SSR / 水合 | ✅ ClientOnly | ✅ 完整 | ✅ 零运行时问题 | ✅ 完整 | ✅ 完整 (SSR perf CSS-in-JS 成本) |
| 大包体积 (gzip, 全量) | ~依赖 Tailwind 较大 (~150KB+) | ~85KB | ~68KB | ~100KB | ~100KB |
| Passkey / WebAuthn | ❌ | ✅ | ❌ | ❌ | ❌ |
| 大列表 10K+ 渲染 | ✅ VirtualList 支持 | ✅ VirtualScroller | ✅ 深度优化 | ❌ 无内部方案 | ✅ |
| 表单大数据渲染 | ⚠️ 基础优化 | ✅ 多级优化 | ✅ 高效 | ⚠️ 中等 | ✅ |

**关键差距**：

1. **P0**：虚拟滚动未深度集成到 Select、Tree、Transfer、Cascader 等高频组件（参考 Naive UI 做派）
2. **P1**：use-idle-hydrate 应全面推广到所有重型组件
3. **P2**：SSR 水合策略相比 Naive UI 基础
4. **P2**：CSS-in-JS 方案在 SSR 下运行时开销 vs ydsz-ui 零运行时更优

---

## 八、交互与设计系统差距

### 8.1 交互模式

| 维度 | ydzs-ui | PrimeVue 4.5 | Naive UI 2.44 | Element Plus 2.14 | Ant Design Vue 4.x |
|------|---------|--------------|---------------|-------------------|-------------------|
| 命令式 API 完整度 | ⚠️ showNotification 部分 | ✅ confirm/popup/toast/message | ✅ dialog/message/notification | ✅ ElMessage/ElNotification/ElMessageBox | ✅ Modal/message/notification (函数式) |
| 动画系统集成 | ⚠️ motion-tokens 基础级别 | ✅ 丰富过渡/动画系统 | ✅ 完整 Animation 方案 | ⚠️ 基础 fade | ✅ Motion |
| 拖拽排序 | ✅ sortablejs + use-sortable | ✅ 内置 | ✅ Tree 内置 | ❌ 外部引入 | ⚠️ 部分 |
| 键盘快捷键系统 | ❌ 缺失 | ✅ 全局 Hotkeys | ❌ | ❌ | ❌ |
| 引导式 Tour | ✅ Tour + TourHint | ✅ Tour | ✅ Tour | ✅ Tour | — |
| 手势交互 (移动端) | ⚠️ 基础 | ✅ 丰富 | ✅ 完整 (Carousel swipe) | ⚠️ 基础 | ⚠️ 基础 |
| 可访问性设计 Token | ✅ aria-role-map | ❌ | ❌ | ❌ | ❌ |

### 8.2 设计系统工具链

| 维度 | ydzs-ui | PrimeVue | Ant Design Vue |
|------|---------|----------|---------------|
| Figma 双向同步 | ✅ figma-sync (import + export) | ❌ | ❌ |
| Figma Variable Collections | ✅ generateFigmaVariableCollections | ❌ | ❌ |
| 设计 Token JSON 导出 | ✅ tokens-export.json | ⚠️ 部分 | ✅ |
| Token Diff 比较 | ✅ figma-sync TokenDiff | ❌ | ❌ |
| 设计稿自动代码生成 | ❌ 缺失 | ❌ | ❌ |

**独有优势**：ydsz-ui 的 figma-sync 设计工具链（双向同步 + Variable Collections 导出 + Token Diff）是所有竞品不具备的工程化方案，连接了设计→代码→设计闭环。

---

## 九、开发体验 (DX) 差距

| 维度 | ydsz-ui | PrimeVue 4.5 | Naive UI 2.44 | Element Plus 2.14 | Ant Design Vue 4.x |
|------|---------|--------------|---------------|-------------------|-------------------|
| Auto-import Resolver | ✅ YdszUiResolver | ✅ PrimeVueResolver | ✅ NaiveUiResolver | ✅ ElementPlusResolver | ✅ AntdResolver |
| 自动导入 Directive | ✅ (ripple + click-outside) | ❌ | ❌ | ❌ | ❌ |
| 配置 Provider | ✅ ConfigProvider | ✅ App.vue + PT | ✅ ConfigProvider | ✅ ConfigProvider | ✅ ConfigProvider |
| CLI 工具 | ✅ ydsz-init / ydsz-analyze | ❌ | ✅ nlxe | ❌ | ❌ |
| 命令式 API 统一封装 | ❌ 仅 showNotification | ✅ useConfirm/useToast | ✅ 完整 | ✅ 完整 | ✅ 完整 |
| 在线文档 | ✅ docs-site (本地+部署) | ✅ 完整 | ✅ 完整 | ✅ 完整 | ✅ 完整 |
| Playground / REPL | ⚠️ 本地 | ✅ 在线 Playground | ✅ | ✅ | ✅ |
| 示例/案例库 | ⚠️ 有限 | ✅ Premium Templates | ❌ | ✅ | ✅ Pro Components |
| Codemod 迁移工具 | ❌ | ✅ codemod | ❌ | ✅ | ❌ |
| Changeset 管理 | ✅ .changeset 完整 | ✅ | ✅ | ✅ | ✅ |
| ESLint 插件 | ❌ | ❌ | ✅ @naive-ui/eslint-plugin | ❌ | ❌ |
| Vitest 测试覆盖 | ✅ 部分组件有 test | ⚠️ 有限 | ⚠️ 有限 | ⚠️ 有限 | ⚠️ 有限 |

**关键差距**：

1. **P0**：缺少完整的命令式 API（Modal.confirm/info/warning/error、Toast.content 等）
2. **P2**：缺少 Naive UI 那样的 ESLint 插件
3. **P2**：缺少 PrimeVue codemod 自动化迁移工具
4. **P2**：Playground 实时代码编辑能力不足

---

## 十、组件能力深度差距

### 已有组件 vs 竞品的能力深度对标

| 组件 | ydzs-ui 当前水准 | 竞品最高水准 (PrimeVue DataTable / Naive DataTable) | 差距 |
|------|-----------------|--------------------------------------------------|------|
| **Table** | VirtualTable (虚拟滚动) + DataView + 基础列配置 | 列冻结/编辑/行展开/导出/列重排/多选/排序/过滤/聚合/CSV export | **编辑模式、列操作、列固定、导出缺位** |
| **ProTable** | 基础 CRUD 集成 + 搜索 + 行内编辑 | PrimeVue CRUD 模板 + 完整 toolbar + 导出 | 中等差距 |
| **FileUpload** | use-chunk-upload (分片) + 基础上传 | 拖拽上传/多文件/进度条/裁剪/验证/自动上传 | 缺裁剪、自动上传、高级 UI |
| **Form** | 基础验证 + FormItem 封装 | 动态字段/依赖校验/异步校验/自定义校验器 (AntD) | 动态表单能力不足 |
| **Modal/Dialog** | 组件式 Dialog | PrimeVue DynamicDialog: 程序化创建 + 依赖注入 + 动画 | 程序化弹窗缺失 |
| **Toast/Message** | showNotification 命令式 + Toast 组件 | PrimeVue Toast: 多位置/多类型/粘性/自定义内容/可关闭 | Position 与 contentTemplate |
| **Select** | 基础 + 搜索 + 多选 | 远程搜索缓存/tag 模式/虚拟加载/创建选项 (Naive 深度集成) | 虚拟加载、tag 模式弱 |
| **Tree** | 异步加载 + 搜索 + 虚拟 | PrimeVue Tree: 连接线/完整过滤/Checkbox tri-state | tri-state checkbox |
| **DatePicker** | shortcuts + range + 基础 | PrimeVue: 多日期/月年选择/time/inline/月份范围预设 | 多选模式 |
| **Tabs** | 基础 + TabPane wrapper | 拖拽排序/AntD 可编辑 Tabs/PrimeVue 滚动 | 拖拽/可编辑缺失 |
| **Menu** | YdMenu (配置式) | PrimeVue Menubar/MegaMenu/TieredMenu/Dock | Menubar/Dock 缺失 |

---

## 十一、组件生态与工程化工具差距

| 维度 | ydzs-ui | PrimeVue 4.5 | Naive UI 2.44 | Ant Design Vue 4.x |
|------|---------|--------------|---------------|-------------------|
| 业务模板/脚手架 | ❌ | ✅ Premium Templates (付费) | ❌ | ✅ Pro Components (付费) |
| 在线主题市场 | ❌ | ✅ | ❌ | ✅ |
| Blocks 可复用代码片段 | ❌ | ✅ 370+ Blocks | ❌ | ✅ Pro Components |
| 付费 UI Kit 集成 | ❌ | ✅ Figma UI Kit | ❌ | ✅ Figma UI Kit |
| Figma ↔ Code 双向 | ✅ figma-sync (自研) | ❌ 单向 | ❌ | ❌ |
| 设计 Token Diff | ✅ TokenDiff 工具 | ❌ | ❌ | ❌ |
| 组件级别 Bundle 分析 | ✅ ydsz-analyze CLI | ❌ | ❌ | ❌ |

---

## 十二、综合差距矩阵（更新版）

| 维度 | 方向 | 核心差距 | 竞争力度 |
|------|------|---------|---------|
| **组件覆盖度** | ⬇️ ydsz-ui 偏少 | 命令式 API 组件缺 Confirm/Drawer/Toast/Modal.confirm；TreeTable 已有但能力深度不够 | 7/10 |
| **能力深度** | ⬇️ ydsz-ui 偏弱 | Table 编辑/列操作/导出；FileUpload 完整流程；Form 动态校验；Select 虚拟加载 | 6/10 |
| **架构设计** | ⬆️ ydsz-ui 领先 | 两层/三层架构 + business composite 独有 | 9/10 |
| **可访问性** | ⬆️ ydsz-ui 领先 | Radix Vue 原生合规 + a11y 测试工具 + aria-role-map 契约 | 9/10 |
| **主题与样式** | ≈ 各有优劣 | Tailwind+CSS Vars vs CSS-in-JS vs SCSS；缺 Theme Designer 应用；缺 RTL | 7/10 |
| **性能** | ≈ 基本持平 | 虚拟列表已独立，但深度集成不够；水合策略待提升 | 7/10 |
| **国际化** | ⬇️ ydsz-ui 落后 | 12 vs 30-50+ 语言；缺 RTL；缺 ICU 复数规则 | 5/10 |
| **TypeScript 类型** | ⬇️ 偏弱 | 主题类型/事件类型/Slot 类型/Form 泛型全面落后 Naive UI | 6/10 |
| **DX 开发体验** | ≈ 基本持平 | Resolver/Provider/Figma CLI 已覆盖；缺命令式 API 完整封装；缺 ESLint 插件 | 7/10 |
| **生态与外部** | ➡️ 内部定位不适用 | 但应借鉴 Pro Components 理念封装业务套件 | — |
| **设计工具链** | ⬆️ ydsz-ui 独有 | figma-sync + TokenDiff + Variable Collections 导出 — 竞品无此方案 | 9/10 |
| **无障碍工程化** | ⬆️ ydsz-ui 独有 | aria-role-map + a11y-test-utils + playwright 冒烟 — 唯一实现全链路 | 9/10 |

---

## 十三、优先级路线图（修订版）

### P0 — 阻塞级（必须补全）

| 序号 | 缺口 | 当前状态 | 建议 |
|------|------|---------|------|
| 1 | **命令式 Dialog/Modal API** | ❌ 组件式 Dialog 存在，无 `Dialog.open/confirm/info` | 参考 AntD `Modal.confirm` 实现统一的 `useDialog`/`useModal` composable |
| 2 | **Drawer 命令式增强** | ⚠️ 组件式 Drawer 存在 | 增加 `Drawer.open({title, content, footer})` 命令式入口 |
| 3 | **Table 列冻结 + 编辑模式** | ⚠️ 行内编辑已有(use-table-editing) | 列冻结、列选择、CSV 导出（对齐 PrimeVue DataTable） |
| 4 | **VirtualScroller 深度集成** | ⚠️ 独立组件 | 集成到 TreeSelect、Transfer、Cascader 高频组件 |
| 5 | **Toast full API** | ⚠️ 已存在 | Position + contentTemplate + 多实例 + 全局配置（对齐 PrimeVue Toast API） |
| 6 | **Form 动态字段 (Form.List)** | ❌ | 动态增删字段 + 依赖校验 + 异步校验 |

### P1 — 重要缺失

| 序号 | 缺口 | 当前状态 |
|------|------|---------|
| 1 | **RTL 完整布局** | ❌ 有 ar-SA locale，缺 RTL 布局 |
| 2 | **语言覆盖 12 → 30+** | ⚠️ 已覆盖 12 种语言，需扩增 |
| 3 | **LoadingBar** | ❌ 顶部加载进度条缺失 |
| 4 | **Select 虚拟滚动 + Tag 模式** | ⚠️ 基础缺失，参考 Naive UI 深集成 |
| 5 | **在线文档站点完善+部署** | ⚠️ docs-site 骨架已存在 |
| 6 | **Select/Form TS 泛型类型** | ⚠️ 进行中 |
| 7 | **ImageViewer 级联预览** | ⚠️ 基础 Image 存在 |
| 8 | **Keyboard Shortcuts 系统** | ❌ 全局快捷键缺失 |

### P2 — 锦上添花

| 序号 | 缺口 |
|------|------|
| 1 | ESLint 插件 (@ydsz-core/ydsz-ui-eslint) |
| 2 | Codemod 迁移工具 (EP → ydsz-ui) |
| 3 | Playground / REPL 在线体验 |
| 4 | PrimeVue Theme Designer 对标品 |
| 5 | CronExpression 可视化编辑器 |
| 6 | Dock (程序坞) |
| 7 | SpeedDial 径向菜单 |
| 8 | Draggable Tabs 拖拽排序标签页 |

---

## 十四、ydsz-ui 独有优势（竞品不具备的护城河）

1. **两层/三层架构**：Radix Vue Headless + ydsz-ui 样式 + 业务复合组件三层复用 — PrimeVue 有类似追求但不如 ydsz-ui 清晰。

2. **无障碍全链路工具**：aria-role-map.ts + a11y-test-utils.ts + axe-core 集成 + playwright WCAG 冒烟 — 竞品均无此完整工程化方案。

3. **Figma ↔ Code 双向同步**：figma-sync (import + export) + Variable Collections 出码 + Token Diff 可视化 — 在 Vue 组件库中独一无二。

4. **组件 Bundle 分析 CLI**：`ydsz-analyze` CLI 提供依赖可视化 — PrimeVue 不具备。

5. **Composable 能力丰富**：use-idle-hydrate、use-chunk-upload、use-cross-tab-state、use-form-draft、use-density — 业务集成度高。

6. **Pass-Through 轻量实现**：API 类似 PrimeVue PT，但实现无运行时额外依赖。

7. **i18n 组件内标准化**：use-component-i18n composable 提供组件级 i18n 标准 — 比竞品零散方案更统一。

8. **命令式 showNotification 扩展**：action 按钮 + 持久时长控制 + 持续模式 — 灵活性高于 ElMessage。

9. **Density Token 系统**：compact / standard / loose 三档密度切换 — 布局灵活性。

10. **Changeset + Resolver + Design Tokens 三件套**：工程化闭环完备。

---

## 十五、战略总结

### 定位判断

ydsz-ui 不是"又一个组件库"，而是 **Vue 生态中唯一一个同时具备**：

- Radix Vue 原生 WCAG 合规 Headless 层
- Tailwind + CSS 变量 + PT 的三层样式方案
- 业务复合组件封装（ProTable / DataView / TreeTable / Dashboard）
- Figma ↔ Code 双向工具链
- 无障碍测试工具链

的组件库。在可访问性和设计工具链两个维度，ydsz-ui 领先所有竞品。

### 差距判断

差距最悬殊的三个维度是：

1. **国际化**：12 vs 30-50+ 语言 + RTL + ICU 复数（差距最大）
2. **组件能力深度**：Table 编辑/列操作/导出链路不完整
3. **命令式 API**：缺少 Modal.confirm/Toast/Drawer.open 这类企业后台高频入口

### 战略建议

1. **不要破坏两层架构**：这是 ydsz-ui 的技术护城河，追赶竞品时不应破坏分层原则。
2. **补齐命令式 API**：`useDialog` / `useToast` / `useDrawer` / `useNotification` 统一封装 — 阻塞级。
3. **深度集成 VirtualScroller**：将虚拟列表下沉到 Select、Tree、Transfer、Cascader 所有数据组件 — 对齐 Naive UI。
4. **扩大国际化覆盖**：12 → 30+ 语言 + RTL 布局支持。
5. **Table 组件能力拉齐 PrimeVue DataTable**：编辑模式 + 列操作 + 列冻结 + 导出 CSV/Excel — 企业级中后台核心需求。
6. **发挥 A11y + Figma 独有优势**：作为竞品对标时的差异化卖点，不应在追赶中舍弃。

---

> **参考**：本报告基于仓库源码分析 + 竞品公开文档（2026-10 状态）编写。原始初版报告见 `docs/reports/ydsz-ui-vs-competitors-full-gap-analysis.md`（2026-10-12）。
