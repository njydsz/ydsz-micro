# YDSZ UI — 业务组件 + Headless + Locale 参考

> 30+ 高级业务组件 + 3 个 Headless 控制器 + 国际化系统

---

## 业务组件 (components/)

通过 primitives 组合封装的、面向 YDSZ 业务场景的高级组件。

### YdProTable

基于 YdTable + 高级筛选 + 列设置 + 导出功能的增强表格。

**适用场景**: 各引擎 CRUD 列表页的标准表格容器。

```vue
<YdProTable :columns="columns" :data-source="data" />
```

---

### YdDataTable

封装 useTableData + YdTable 的数据表格，零配置实现排序/筛选/分页。

```vue
<YdDataTable :data="rawData" :column-defs="columnDefs" />
```

---

### YdVirtualTable

虚拟滚动表格，基于 useVirtualList 实现万级数据流畅渲染。

| 属性 | 类型 | 说明 |
|------|------|------|
| `itemHeight` | `number` | 单行高度（默认 32px） |
| `viewportHeight` | `number` | 视口高度 |
| `overscan` | `number` | 缓冲行数 |

---

### YdButtonSmart / YdButtonGroup / YdCheckButtonGroup / YdIconButton

| 组件 | 说明 |
|------|------|
| `YdButtonSmart` | 智能按钮，自动适配 variant/size |
| `YdButtonGroup` | 按钮组容器，管理间距与对齐 |
| `YdCheckButtonGroup` | 可勾选按钮组，支持单选/多选模式 |
| `YdIconButton` | 固定 icon size + icon variant 的封装 |

---

### YdAvatarSmart

智能头像，支持自动加载 fallback、状态展示、组合 AvatarGroup。

---

### YdBreadcrumbView

增强面包屑，支持背景样式、路由集成、自动折叠。

---

### YdContextMenu (业务增强版)

基于 primitives/context-menu 封装，增加快捷键支持。

---

### YdDropdownMenuSmart / YdDropdownRadioMenu

| 组件 | 说明 |
|------|------|
| `YdDropdownMenuSmart` | 智能下拉菜单，支持搜索、分组、虚拟滚动 |
| `YdDropdownRadioMenu` | 单选下拉菜单 |

---

### YdTooltipSmart

智能 Tooltip，支持延迟、错误边界、自动销毁。

---

### YdHoverCardSmart

智能悬停卡片，支持异步内容加载。

---

### YdAlertBanner

顶部告警横幅，支持持久化、多级 severity、可关闭。

| 属性 | 类型 | 说明 |
|------|------|------|
| `severity` | `'info' \| 'success' \| 'warning' \| 'error'` | 告警级别 |
| `isDismissible` | `boolean` | 是否可手动关闭 |
| `isPersistent` | `boolean` | 是否持久化（跨页面保持） |

---

### YdAdvancedFilterBar

高级筛选栏，支持动态条件组合、保存筛选方案。

---

### YdDomainFilterPanel

领域筛选面板，支持多域字段筛选。

---

### YdSettingsFloatButton

设置浮动按钮，支持拖拽停靠、弹出设置面板。

---

### YdQuickCreateButton

快速创建按钮，支持命令面板集成。

---

### YdContextHelp

上下文帮助，支持快捷键触发、内容面板。

---

### YdIcon

图标组件，支持 IconFont / SVG / Lucide 多来源。

```vue
<YdIcon name="settings" :size="16" />
```

---

### YdLogo

Logo 组件，支持主题适配、尺寸变体。

---

### YdEmptyState

空状态占位，支持自定义插图、操作按钮。

```vue
<YdEmptyState title="暂无数据" description="请先添加一条记录" />
```

---

### YdInputPassword / password-strength

密码输入框，支持强度指示、显示/隐藏切换。

| 属性 | 类型 | 说明 |
|------|------|------|
| `showStrength` | `boolean` | 是否显示强度指示器 |
| `levels` | `PasswordStrengthLevel[]` | 自定义强度分级 |

---

### YdPinInputSmart

智能 PIN 输入，支持自动跳转、粘贴、类型配置。

---

### YdSegmented

分段控制器，含 tabs-indicator.vue 滑块指示器。

```vue
<YdSegmented v-model:modelValue="view">
  <SegmentedOption value="table">表格视图</SegmentedOption>
  <SegmentedOption value="card">卡片视图</SegmentedOption>
</YdSegmented>
```

---

### YdScrollbar

自定义滚动条，基于 primitives/scroll-area 封装。

---

### YdCountToAnimator

数字滚动动画组件。

```vue
<YdCountToAnimator :from="0" :to="12345" :duration="2000" />
```

---

### YdHelpTooltip

帮助提示，问号图标 + 轻量 tooltip。

---

### YdDashboardGrid / YdStatCard / YdMiniChart

仪表盘组件集：

| 组件 | 说明 |
|------|------|
| `YdDashboardGrid` | 仪表盘网格布局，支持拖拽位置、自定义列数 |
| `YdStatCard` | 统计卡片，标题+数值+趋势 |
| `YdMiniChart` | 迷你图表（Sparkline） |

---

### YdNotificationBell / YdNotificationPanel

通知中心：

| 组件 | 说明 |
|------|------|
| `YdNotificationBell` | 通知铃铛（带未读计数） |
| `YdNotificationPanel` | 通知面板（列表 + 操作） |

---

### YdThemeEditor

主题编辑器，运行时调色（修改 CSS 变量）。

```vue
<YdThemeEditor />
```

---

### YdEntityCard

实体信息卡片（用于展示用户/角色/部门等实体详情）。

---

### YdBackTop (业务增强)

基于 primitives/back-top + use-backtop composable，支持滚动监听。

---

### YdStatusBadge

状态徽标，自动适配颜色和图标。

---

### YdExpandableArrow

可展开箭头（用于折叠面板的指示器）。

---

### YdFullScreen

全屏容器。

---

### YdQuickCreateButton

快速创建按钮，支持命令面板集成。

---

### YdRenderContent

渲染内容组件（支持函数式渲染）。

---

### YdSpineText

脊柱文字（常用于侧边栏导航）。

---

### YdStatusBadge

状态徽标（active/inactive/pending 预设样式）。

---

## Headless 控制器

内部状态管理 composables，需要在业务组件中组合使用。

### useSelectHeadless<T>

选择器逻辑抽象。

```typescript
function useSelectHeadless<T>(options: UseSelectHeadlessOptions<T>): SelectHeadlessHandle<T>
```

**UseSelectHeadlessOptions:**

| 字段 | 类型 | 默认值 |
|------|------|--------|
| `items` | `MaybeRefOrGetter<T[]>` | — |
| `multiple` | `MaybeRefOrGetter<boolean>` | — |
| `virtualThreshold` | `MaybeRefOrGetter<number>` | `100` |
| `getValue` | `(item) => string \| number` | **必填** |
| `getLabel` | `(item) => string` | **必填** |
| `getKey` | `(item, index) => string \| number` | **必填** |

**SelectHeadlessHandle:**

| 字段 | 类型 |
|------|------|
| `resolvedItems` | `MaybeRefOrGetter<T[]>` |
| `isVirtualEnabled` | `MaybeRefOrGetter<boolean>` |
| `getLabelByValue` | `(value) => string` |
| `toggleItem` | `(current, itemValue, multiple) => value` |
| `clearValue` | `(multiple) => clearValue` |
| `isSelected` | `(current, itemValue, multiple) => boolean` |

---

### useTreeHeadless<T>

树形组件逻辑抽象。

```typescript
function useTreeHeadless<T>(options: UseTreeHeadlessOptions<T>): TreeHeadlessHandle<T>
```

**UseTreeHeadlessOptions:**

| 字段 | 类型 | 默认值 |
|------|------|--------|
| `treeData` | `() => T[] \| T[]` | **必填** |
| `getValue` | `(node) => string \| number` | **必填** |
| `getChildren` | `(node) => T[]` | **必填** |
| `multiple` | `boolean` | — |
| `cascadeSelect` | `boolean` | — |
| `defaultExpandedKeys` | `(string \| number)[]` | — |

**TreeHeadlessHandle:**

| 字段/方法 | 类型 |
|-----------|------|
| `expandedKeys` | `Set<string \| number>` |
| `selectedKeys` | `Set<string \| number>` |
| `toggleExpand` | `(value) => void` |
| `toggleSelect` | `(value) => void` |
| `expandAll` / `collapseAll` | `() => void` |
| `clearSelection` | `() => void` |
| `flattenedNodes` | `{ data; level; hasChildren; parents; value }[]` |

---

### useTreeDrag<T>

树形拖拽排序逻辑。

```typescript
function useTreeDrag<T>(options: UseTreeDragOptions<T>): TreeDragHandle
```

**UseTreeDragOptions:**

| 字段 | 类型 | 默认值 |
|------|------|--------|
| `expandedKeys` | `Ref<Set<string \| number>>` | **必填** |
| `flattenedNodes` | `Ref<FlatTreeNode[]>` | **必填** |
| `getValue` | `(node) => string \| number` | **必填** |
| `getChildren` | `(node) => T[]` | **必填** |
| `setChildren` | `(node, children) => void` | **必填** |
| `treeData` | `Ref<T[]>` | **必填** |
| `autoExpandDelay` | `number` | `600ms` |
| `canDrag` | `(node) => boolean` | — |
| `onReorder` | `(payload) => void` | **必填** |

**TreeDropPosition:** `'before'` / `'inside'` / `'after'`

---

## Locale 国际化系统

### 内置语言

| 语言 | 文件 | 说明 |
|------|------|------|
| `zh-CN` | `locale/zh-CN.ts` | 简体中文（默认） |
| `en-US` | `locale/en-US.ts` | English |

### 命名空间分区

文案按业务域划分：

| 命名空间 | 覆盖范围 |
|----------|----------|
| `common` | 通用操作（确认/取消/提交...） |
| `table` | 表格相关（共X条/暂无数据...） |
| `form` | 表单校验提示（必填/格式错误...） |
| `dialog` | 弹窗相关 |
| `upload` | 上传相关 |
| `pagination` | 分页相关 |
| `datepicker` | 日期选择器 |
| `select` | 选择器 |
| `tree` | 树形组件 |
| `message` | 全局消息提示 |
| `notification` | 通知中心 |
| `empty` | 空状态描述 |

### 插值语法

```typescript
// 定义
'pagination.total': '共 {count} 条'

// 使用
t('pagination.total', { count: 42 })  // → "共 42 条"
```

### 使用方式

```vue
<script setup lang="ts">
import { useLocale } from '@ydsz-core/ydsz-ui'
const { t, lang, isRTL } = useLocale()
</script>

<template>
  <span>{{ t('common.confirm') }}</span>  <!-- "确定" -->
  <span>{{ t('pagination.total', { count: 100}) }}</span>  <!-- "共 100 条" -->
</template>
```

### 全局配置

```vue
<YdConfigProvider :locale="{ lang: 'zh-CN', isRTL: false }">
  <App />
</YdConfigProvider>
```

---

## 变体速查 (button.ts / badge.ts / tag.ts / sheet.ts / toggle.ts)

### Button 变体

```
variants:  default | destructive | ghost | heavy | icon | link | outline | secondary | subtle
sizes:     xs | sm | default | lg | xl | icon
```

### Badge 变体

```
variants:  default | primary | destructive | outline | secondary | success | warning | info
```

### Tag 变体

```
variants:  default | primary | success | warning | destructive | info
sizes:     sm | md | lg
```

### Sheet 侧边方向

```
sides:     bottom | left | right(default) | top
```

### Toggle 变体

```
variants:  default | outline
sizes:     sm | default | lg
```

### Avatar 形状与大小

```
shapes:    circle | square
sizes:     xs(24) | sm(32) | base(40) | lg(48) | xl(64) | 2xl(96) | 3xl(128)
```
