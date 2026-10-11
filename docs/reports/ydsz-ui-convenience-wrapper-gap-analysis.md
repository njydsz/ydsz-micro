# ydsz-ui 业务便利性组件（Convenience Wrapper）差距分析

> 分析日期：2026-10-11
> 基于：《云顶编码规范》v1.0.4 §4.9 组件分层架构原则
> 竞品参照：Element Plus 2.13.x、Ant Design Pro 2.x、PrimeVue 4.x

---

## 一、总览

ydsz-ui 当前已有 **~80 个有样式 primitives + ~30 个无头原语 + ~39 个业务复合组件**，覆盖基础 UI 场景。但在**"组合 → 直觉"**这一层仍有缺口：部分 EP/ADP 中高频使用的组件形态，在 ydsz-ui 中需要开发者手动组合 3-4 个 primitives 才能实现，学习成本和模板代码量偏高。

目标是：**在不改变底层 primitives 的前提下，补建高频便利性 wrapper**，使 ydsz-ui 对 EP/ADP 迁移开发者更友好。

---

## 二、差距矩阵（按优先级排序）

### P0 — 高频 + 开发效率瓶颈（建议 1-2 周内完成）

| # | EP/ADP 组件 | ydsz-ui 现状 | 差距描述 | 预计工时 |
|---|---|---|---|---|
| 1 | **ElTabPane** | `YdTabsTrigger + YdTabsContent` 需手动配对 value | 多 Tab 场景要写 2×N 个组件，心智负担大 | 2h |
| 2 | **ElRow / ElCol** | `grid grid-cols-X gap-X` | 24 栅格系统需要记忆 class，gutter/offset/响应式断点不直观 | 3h |
| 3 | **ElOption** | `YdSelectItem` | 名称不一致导致迁移时需要全文替换 | 1h |
| 4 | **ElBreadcrumb / ElBreadcrumbItem** | `YdBreadcrumb` 系列已存在但缺 `YdBreadcrumbItem` 的子组件写法 | 已有 primitives，API 略繁琐 | 1h |

### P1 — 中频 + 业务直觉差（建议 2-4 周内完成）

| # | EP/ADP 组件 | ydsz-ui 现状 | 差距描述 | 预计工时 |
|---|---|---|---|---|
| 5 | **ElDropdown / ElDropdownMenu / ElDropdownItem** | `YdDropdownMenu` 系列已存在但无配置式 options prop | EP 的 `options: [{label, value, disabled}]` 比手动写 YdDropdownMenuItem 更直接 | 2h |
| 6 | **ElMenu / ElMenuItem / ElSubMenu** | 无对应组件 | 侧边栏/顶栏导航需要，目前只能手写.router-link + 类 | 4h |
| 7 | **ElMessageBox / ElMessageBox.confirm** | 无命令式 API | `YdAlertDialog` 是声明式的，无法在任意 JS 上下文 `await confirm('确定删除吗？')` | 3h |
| 8 | **ElNotification** | `showToast` 已满足基础需求 | 但缺少右上角带操作按钮的复杂通知（如"撤销"、"查看详情"） | 2h |
| 9 | **ElTimeline** | `YdTimeline + YdTimelineItem` 已存在但样式简单 | 缺交替显示、自定义节点 dot、幽灵模式等常见业务形态 | 2h |
| 10 | **ElSteps** | `YdSteps + YdStepItem` 已存在 | 缺 vertical 布局优化、dot 模式、finish-icon 自定义 | 2h |
| 11 | **ElCard shadow/hover** | `YdCard` 存在但 shadow 参数化不全 | `shadow="hover"` / `shadow="never"` 语义不统一 | 1h |
| 12 | **ElTag closable** | `YdTag closable` 已有 | 缺 `checked` / `checkable`（标签选择模式）| 1h |

### P2 — 低频 + 补全长尾（建议 1-2 个月内完成）

| # | EP/ADP 组件 | ydsz-ui 现状 | 差距描述 | 预计工时 |
|---|---|---|---|---|
| 13 | **ElTransfer** | `YdTransfer` 已存在 | 缺自定义过滤、高级搜索、批量操作栏 | 4h |
| 14 | **ElTreeSelect** | `YdTreeSelect` 已存在 | 缺多选 tag 模式、异步搜索 | 3h |
| 15 | **ElCascader** | `YdCascader` 已存在 | 缺多选 + 搜索 + 懒加载优化 | 4h |
| 16 | **ElAnchor** | `YdAnchor` 已存在 | 缺自动滚动 + offsetTop 适配 | 2h |
| 17 | **ElRate** | `YdRate` 已存在 | 缺半星模式 + 自定义图标 | 2h |
| 18 | **ElProgress** | `YdProgress` 已存在 | 缺环形（circle）+ 仪表盘（dashboard）| 3h |
| 19 | **ElCollapse** | `YdCollapse` 已存在 | 缺手风琴模式（accordion）已内置但文档不全 | 1h |
| 20 | **ElCarousel** | `YdCarousel` 已存在 | 缺卡片模式 + 指示器位置自定义 | 2h |
| 21 | **ElImage** | `YdImage` 已存在 | 缺预览组（`preview-src-list`）、懒加载、z-index 配置 | 2h |
| 22 | **ElDatePicker / ElTimePicker** | `YdDatePicker + YdTimePicker` 已存在 | 缺快捷选项（shortcuts）、范围联动禁用 | 3h |
| 23 | **ElForm / ElFormItem** | `YdForm` 系列已存在 | 缺栅格布局（inline label-position top/wrapper width 自动对齐）| 4h |
| 24 | **ElTable 树形/展开** | `YdTable` 已存在 | 缺树形 data 的 `row-key` + `tree-props`、展开行 | 4h |
| 25 | **ElDescriptions** | `YdDescriptions` 已存在 | 缺竖直模式（vertical）、自动 spans 合并 | 2h |
| 26 | **ElEmpty** | `YdEmpty + YdEmptyState` 已存在 | 缺 image slot 自定义大插图 | 1h |
| 27 | **ElAvatarGroup** | `YdAvatarGroup` 已存在 | 缺 max-count + 折叠 popover | 2h |
| 28 | **ElDivider** | `YdDivider` 已存在 | 缺虚线 + dashed 类型联调 | 1h |

### P3 — EP/ADP 独有但有业务价值（视需求优先级决定）

| # | 组件 | 价值 | 说明 |
|---|---|---|---|
| 29 | **ElAffix** → YdAffix | 固钉 | 已有 primitives，需 wrapper 业务层 |
| 30 | **ElPageHeader** → YdPageHeader | 页头 | 已有 primitives，需统一 tag + title + extra 结构 |
| 31 | **ElBacktop** → YdBackTop | 回到顶部 | 已有 primitives，需 wrapper 添加可视区判断 |
| 32 | **ElDrawer direction/size** | 抽屉多方位 | YdDrawer 需支持 top/bottom/left/right |
| 33 | **ElResult** → YdResult | 结果页 | 已有 primitives，需 wrapper 提供 extra slot + preset |
| 34 | **ElSkeleton** → YdSkeleton | 骨架屏 | 已存在，需 wrapper 提供典型列表/详情/卡片模板 |
| 35 | **ElCountdown** → YdCountdown | 倒计时 | 已存在，需 wrapper 添加格式化 + 结束回调 |
| 36 | **ElQRCode** → YdQrCode | 二维码 | 已存在，需 wrapper 添加 logo + 颜色 + 容错等级 |
| 37 | **ElWatermark** → YdWatermark | 水印 | 已存在，需 wrapper 提供全屏自适应 |
| 38 | **ElTour** → YdTour | 漫游引导 | 已存在，需 wrapper 提供步骤序列 + 高亮 mask |
| 39 | **ElFloatButton** → YdFloatButton | 浮动按钮 | 已存在，需 wrapper 提供菜单展开 |
| 40 | **ElSegmented** → YdSegmented | 分段控制 | 已存在，需 wrapper 提供 icon + 路由联动 |

---

## 三、高频缺失组件详细设计

### 3.1 YdTabPane（P0）

**当前原始写法**：
```vue
<YdTabs v-model="active">
  <YdTabsList>
    <YdTabsTrigger value="search">实体搜索</YdTabsTrigger>
    <YdTabsTrigger value="graph">图视图</YdTabsTrigger>
  </YdTabsList>
  <YdTabsContent value="search">
    <!-- 内容 -->
  </YdTabsContent>
  <YdTabsContent value="graph">
    <!-- 内容 -->
  </YdTabsContent>
</YdTabs>
```

**目标写法（EP/ADP 对齐）**：
```vue
<YdTabs v-model="active">
  <YdTabPane label="实体搜索" name="search">
    <!-- 内容 -->
  </YdTabPane>
  <YdTabPane label="图视图" name="graph" disabled>
    <!-- 内容 -->
  </YdTabPane>
</YdTabs>
```

**实现要点**：
- `YdTabPane` 内部根据 `name` 自动注册 trigger + content
- 利用 `provide/inject` 与父级 `YdTabs` 通信
- 内部组合 `YdTabsTrigger + YdTabsContent`，用 `<Teleport>` 或 slot 重排

### 3.2 YdRow / YdCol（P0）

**当前原始写法**：
```vue
<div class="grid grid-cols-4 gap-4">
  <div class="col-span-6">...</div>
  <div class="col-span-6">...</div>
  <div class="col-span="6">...</div>
  <div class="col-span-6">...</div>
</div>
```

**目标写法（EP 24 栅格对齐）**：
```vue
<YdRow :gutter="16">
  <YdCol :span="6"><YdCard shadow="hover">实体总数：{{ count }}</YdCard></YdCol>
  <YdCol :span="6"><YdCard shadow="hover">关系总数：{{ count }}</YdCard></YdCol>
  <YdCol :span="6"><YdCard shadow="hover">类型数：{{ count }}</YdCard></YdCol>
  <YdCol :span="6"><YdCard shadow="hover">任务数：{{ count }}</YdCard></YdCol>
</YdRow>
```

**实现要点**：
- `YdRow`：用 CSS Grid template 由 `gutter` 推导 `gap`、由 `justify`/`align` 推导对齐
- `YdCol`：`:span` → `grid-column: span X / span X`，支持 `offset/pull/push`
- 响应式：`:xs`/`:sm`/`:md`/`:lg`/`:xl` 断点映射到 Tailwind 断点
- 类型：`'flex' | 'grid'` 默认 `'grid'`

### 3.3 YdOption（P0）

**目标**：在 `YdSelect` 内提供 `YdOption` 的便利 alias

**实现**：
```typescript
// primitives/select/YdOption.vue — 零实现 alias
export { YdSelectItem as YdOption } from './YdSelectItem.vue';
```

同时 `YdSelectItem` 保留原名（Radix 原生）。这是纯命名 alias，无额外运行时代价。

### 3.4 ElMessageBox 命令式 API（P1）

**当前写法**：
```vue
<YdAlertDialog v-model:open="dialogOpen">
  <YdAlertDialogTitle>确认删除</YdAlertDialogTitle>
  <YdAlertDialogContent>此操作不可撤销</YdAlertDialogContent>
  <YdAlertDialogFooter>
    <YdButton @click="dialogOpen = false">取消</YdButton>
    <YdButton variant="destructive" @click="handleDelete">确定</YdButton>
  </YdAlertDialogFooter>
</YdAlertDialog>
```

**目标写法**：
```typescript
import { showMessageBox } from '@ydsz-core/ydsz-ui';

const ok = await showMessageBox.confirm({
  title: '确认删除',
  content: '此操作不可撤销',
  type: 'warning',  // 'info' | 'success' | 'warning' | 'error'
  confirmText: '确定',
  cancelText: '取消',
});
if (ok) handleDelete();
```

**实现要点**：
- 使用 Vue 的 `createApp` + 挂载到 body 临时节点
- 返回 `Promise<boolean>`，确认 resolve(true)，取消/关闭 resolve(false)
- 参考 AntD 的 `Modal.confirm()` + Element 的 `ElMessageBox.alert()`

---

## 四、与竞品映射完整版

### 4.1 Element Plus → ydsz-ui 对照

| Element Plus | ydsz-ui 原始 primitives | 需 wrapper | 状态 |
|---|---|---|---|
| ElButton | YdButton | 否 | ✅ 完整 |
| ElInput | YdInput | 否 | ✅ 完整 |
| ElSelect / ElOption | YdSelect / YdSelectItem | YdAlias(YdOption) | ⚠️ 缺 alias |
| ElTabs / ElTabPane | YdTabs / TabsList/Trigger/Content | **YdTabPane** | ❌ 缺 |
| ElTable / ElTableColumn | YdTable / YdTableColumn | 否 | ✅ 完整 |
| ElForm / ElFormItem | YdForm / YdFormItem | 否 | ⚠️ 需验证 |
| ElMessage | `showToast` | 否 | ✅ 完整 |
| ElMessageBox | YdAlertDialog | **showMessageBox.confirm** | ❌ 缺 |
| ElNotification | YdNotification | 否 | ⚠️ 需增强 |
| ElDrawer | YdDrawer | 否 | ✅ 完整 |
| ElDialog | YdDialog | 否 | ✅ 完整 |
| ElRow / ElCol | CSS Grid | **YdRow / YdCol** | ❌ 缺 |
| ElCard | YdCard | 否 | ✅ 完整 |
| ElTag | YdTag | 否 | ✅ 完整 |
| ElAlert | YdAlert | 否 | ✅ 完整 |
| ElProgress | YdProgress | 否 | ⚠️ 缺 circle |
| ElPagination | YdPagination | 否 | ✅ 完整 |
| ElUpload | YdUpload | 否 | ✅ 完整 |
| ElDatePicker | YdDatePicker | 否 | ⚠️ 缺 shortcuts |
| ElTimePicker | YdTimePicker | 否 | ✅ 基本 |
| ElTreeSelect | YdTreeSelect | 否 | ⚠️ 缺多选 |
| ElCascader | YdCascader | 否 | ⚠️ 缺搜索 |
| ElTransfer | YdTransfer | 否 | ⚠️ 缺过滤 |
| ElSteps | YdSteps | 否 | ⚠️ 缺 vertical dot |
| ElTimeline | YdTimeline | 否 | ⚠️ 缺交替 |
| ElBreadcrumb | YdBreadcrumb 系列 | **YdBreadcrumbItem** | ⚠️ 缺 |
| ElDropdown | YdDropdownMenu 系列 | 否 | ⚠️ 缺 options |
| ElMenu / ElSubMenu | 无 | **YdMenu** | ❌ 缺 |
| ElAnchor | YdAnchor | 否 | ⚠️ 缺 auto-scroll |
| ElRate | YdRate | 否 | ⚠️ 缺 half |
| ElSwitch | YdSwitch | 否 | ✅ 完整 |
| ElCheckbox / ElCheckboxGroup | YdCheckbox / YdCheckboxGroup | 否 | ✅ 完整 |
| ElRadio / ElRadioGroup | YdRadioGroup / Item | 否 | ✅ 完整 |
| ElAvatar / ElAvatarGroup | YdAvatar / Group | 否 | ⚠️ 缺 max |
| ElBadge | YdBadge | 否 | ✅ 完整 |
| ElCollapse | YdCollapse | 否 | ⚠️ 缺文档 |
| ElCarousel | YdCarousel | 否 | ⚠️ 缺卡片模式 |
| ElImage | YdImage | 否 | ⚠️ 缺 preview-group |
| ElEmpty | YdEmpty / YdEmptyState | 否 | ✅ 完整 |
| ElDescriptions | YdDescriptions | 否 | ⚠️ 缺 vertical |
| ElStatistic | YdStatistic | 否 | ✅ 完整 |
| ElSkeleton | YdSkeleton | 否 | ⚠️ 缺模板 |
| ElResult | YdResult | 否 | ⚠️ 缺 presets |
| ElPageHeader | YdPageHeader | 否 | ⚠️ 缺 |
| ElAffix | YdAffix | 否 | ✅ 有 primitives |
| ElBacktop | YdBackTop | 否 | ✅ 有 primitives |
| ElDivider | YdDivider | 否 | ✅ 完整 |
| ElFloatButton | YdFloatButton | 否 | ⚠️ 缺菜单 |
| ElTour | YdTour | 否 | ⚠️ 缺流程 |
| ElWatermark | YdWatermark | 否 | ⚠️ 缺全屏 |
| ElSegmented | YdSegmented | 否 | ⚠️ 缺 |
| ElCountdown | YdCountdown | 否 | ✅ 有 primitives |
| ElQrCode | YdQrCode | 否 | ⚠️ 缺 logo |
| ElColorPicker | YdColorPicker | 否 | ✅ 基本 |

**统计**：
- ✅ 完整：20 个（48.8%）
- ⚠️ 需增强：15 个（36.6%）
- ❌ 缺 wrapper：6 个（14.6%）

### 4.2 Ant Design Pro → ydsz-ui 对照

| Ant Design Pro | ydsz-ui 对应 | 状态 |
|---|---|---|
| ProTable | YdTable + 自行封装 | ❌ 缺（强业务组件，需单独包）|
| ProForm | YdForm + 自行封装 | ❌ 缺 |
| ProDescriptions | YdDescriptions + 自行封装 | ❌ 缺 |
| ProList | YdCardList | ⚠️ 基本 |
| ProLayout | apps/ 内的 layouts/ | ⚠️ 重复实现 |
| FooterToolbar | 无 | ❌ 缺 |
*注：Ant Design Pro 是业务层组件，通常不应放在通用 ydsz-ui 库中，但可以作为单独的 `pro-ui` 扩展包开发。*

---

## 五、分阶段补建计划

### Phase 1（Week 1-2，P0 + 部分 P1）

| 优先级 | 组件 | 工时 | 产出 |
|---|---|---|---|
| P0-1 | YdTabPane | 2h | `primitives/tabs/YdTabPane.vue` |
| P0-2 | YdRow / YdCol | 3h | `primitives/layout/YdRow.vue`、`YdCol.vue` |
| P0-3 | YdOption（alias） | 0.5h | `primitives/select/YdOption.vue` |
| P0-4 | YdBreadcrumbItem 简化 | 1h | 简化 slot 结构 |
| P1-1 | YdDropdown options prop | 2h | 配置式 API |
| P1-2 | showMessageBox 命令式 API | 3h | `composables/useMessageBox.ts` |

**Phase 1 总计：~11.5h**

### Phase 2（Week 3-4，P1 主体）

| 优先级 | 组件 | 工时 |
|---|---|---|
| P1-3 | YdMenu / YdMenuItem / YdSubMenu | 4h |
| P1-4 | showNotification 增强（action 按钮） | 2h |
| P1-5 | YdTimeline 业务模式 | 2h |
| P1-6 | YdSteps 增强 | 2h |
| P1-7 | YdCard shadow 参数化 | 1h |
| P1-8 | YdTag checkable | 1h |

**Phase 2 总计：~12h**

### Phase 3（Week 5-8，P1 收尾 + P2 高频部分）

| 优先级 | 组件 | 工时 |
|---|---|---|
| P2-1 | YdTransfer 增强（搜索+过滤） | 4h |
| P2-2 | YdTreeSelect 多选 tag | 3h |
| P2-3 | YdProgress circle / dashboard | 3h |
| P2-4 | YdForm grid 模式 | 4h |
| P2-5 | YdCascader 多选 + 搜索 | 4h |
| P2-6 | YdImage preview-group + lazy | 2h |
| P2-7 | YdTable 树形 + 展开行 | 4h |
| P2-8 | YdDatePicker shortcuts 标准化 | 3h |

**Phase 3 总计：~27h**

### 风险与注意

1. **API 设计惯性**：wrapper API 必须参考 EP/ADP 的常见用法，但不要照搬——底层是 Radix，差异要文档化
2. **Tree-shakability**：多个 wrapper 文件意味着 tree-shaking 的成本，需确保每个 wrapper 是独立 export
3. **测试覆盖**：每个 wrapper 至少配一份 `.test.ts` + `.stories.ts`，Storybook 视化回归
4. **文档同步**：ydsz-ui docs-site 的 primitives.md 需在每次新增 wrapper 后更新

---

## 六、推荐策略

### 短期目标（推荐）

先做 Phase 1 的 6 个 P0/P1 项（~11.5h），原因：

1. **YdTabPane / YdRow / YdCol** — 本次知识图谱重构已经遇到了痛点，立即见效
2. **showMessageBox** — 配合 YdAlertDialog，解决业务侧大量确认弹窗的样板代码
3. **YdOption alias** — 零成本高效益，alias 一行代码

### 宏观建议

ydsz-ui 不应追求 EP 的 1:1 组件覆盖率——大量的 P2/P3 组件可以：

1. **下沉为 example/stories** 在 Storybook 中展示如何使用 primitives 组合
2. **独立为 pro-ui 扩展包**（对标 Ant Design Pro 的业务组件）
3. **由业务侧自行封装**（apps/ 内的高内聚低复用场景）

核心原则保持不变：**ydsz-ui 负责高频 + 通用；低频 + 业务域由上层封装**。
