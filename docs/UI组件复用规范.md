# YDSZ-Micro 前端 UI 组件复用规范

> 本规范对标 ForgeLab forge-admin（https://gitee.com/ForgeLab/forge-admin）UI 风格，
> 对齐 YDSZ「云顶编码规范」与前端构建规则。

## 1. 视图模式选择准则

### 1.1 列表页何时用卡片视图，何时用表格视图

| 条件 | 推荐视图 | 理由 |
|------|----------|------|
| 数据行 < 50，信息密度低（3-5 核心字段） | **卡片视图** | 扫读快、视觉层次清晰，一眼抓重点 |
| 数据行 > 50，列数 > 8 | **表格视图** | 表格紧凑、可排序、可固定列 |
| 数据有生命周期状态（草稿/已发布等） | **卡片视图** | StatusBadge 彩色标签 比文字列辨识度高 |
| 数据有业务域分类（空间/分类/租户） | **卡片视图 + DomainFilterPanel** | 左栏分类面板 + 右侧卡片网格是 ForgeLab 标配 |
| 需要大量字段对比、导出、批量编辑 | **表格视图** | VxeTable 在批量场景天然占优 |
| 数据有 SSE 实时推送 | **两者皆可** | 卡片实时更新 badge/进度，表格更新单元格 |

### 1.2 默认视图策略

- **新建页面统一默认卡片视图**，用户可切换至表格视图（通过 viewMode ref 实现）
- 记住用户偏好：`localStorage.setItem('ydsz.viewMode.<module>', mode)`

## 2. 卡片视图组件栈

### 2.1 列表页容器

```
Page → CardGrid → EntityCard × N
            ↓ (empty slot)
       EmptyState
```

**标准编写模板**：

```vue
<CardGrid :is-empty="list.length === 0" :is-loading="loading">
  <template #empty>
    <EmptyState
      description="创建后可在大屏查看"
      preset="created"
      action-text="立即创建"
      title="暂无数据"
      @action="handleAdd"
    />
  </template>
  <EntityCard
    v-for="item in list"
    :key="item.id"
    :avatar-text="item.name"
    :avatar-variant="resolveVariant(item)"
    :code="item.code"
    :description="item.description"
    class="transition-transform hover:-translate-y-0.5"
    @click="handleClick(item)"
  >
    <template #status-badge>
      <StatusBadge :status="resolveStatus(item)" />
    </template>
    <template #meta>
      <!-- 自定义字段行 -->
    </template>
    <template #actions>
      <ElDropdown trigger="click" @command="handleCommand($event, item)">
        <!-- ... -->
      </ElDropdown>
    </template>
  </EntityCard>
</CardGrid>
```

### 2.2 左侧域筛选面板（可选）

当数据具有业务域分类属性时，在卡片区左侧加入域筛选面板：

```vue
<div class="flex min-h-[500px] gap-4">
  <div class="w-52 shrink-0">
    <DomainFilterPanel
      v-model="selectedCategory"
      :items="categoryItems"
      title="分类"
      show-search
      @select="handleCategorySelect"
    />
  </div>
  <div class="min-w-0 flex-1">
    <CardGrid ... />
  </div>
</div>
```

## 3. 状态语义映射规范

### 3.1 StatusBadge 状态名约定

| 状态值 | 语义 | 颜色 | 适用场景 |
|--------|------|------|----------|
| `published` | 已发布/生效 | 绿色 | 已上线、已通过审批 |
| `running` | 运行中/待执行 | 蓝色 | 任务执行中、流程进行中 |
| `draft` | 草稿 | 灰色 outline | 未发布 |
| `offline` | 已下线/已归档 | 灰色 outline | 停用、过期 |
| `pending` | 待审核/排队中 | 蓝色 | 审核队列、等待审批 |
| `failed` | 失败/异常 | 红色 | 运行失败、发送失败 |
| `success` | 成功 | 绿色 | 操作成功、发送成功 |
| `dirty` | 有变更未发布 | 橙色 | 编辑后未保存发布 |
| `archived` | 已归档 | 次要色 | 历史归档数据 |

### 3.2 各模块统一映射函数

**规则**：每个子应用须在列表页实现一个 `resolveXxxStatus(row)` 函数，函数以 `resolve` 开头，返回 StatusBadge 的语义值。

| 子应用 | 函数名 | 示例 |
|--------|--------|------|
| agent-web | `resolveAgentStatus(row)` | isActive → running |
| workflow-web | `resolveTemplateStatus(row)` | PUBLISHED → published |
| literule-web | `resolveRuleStatus(row)` | isEnabled + status 组合 |
| message-web | `resolveBatchStatus(row)` | status 枚举映射 |
| nextwiki-web | `resolveNodeType(row)` | isFolder / isShared |
| cronjob-web | `resolveJobStatus(row)` | triggerState 映射 |
| userinfo-web | `resolveUserStatus(row)` | isEnabled / isLocked |
| system-web | 按需 | 参数状态 |

## 4. 头像变体约定

### 4.1 avatarVariant 映射

| 值 | 背景色 | 适用场景 |
|----|--------|----------|
| `primary` | 主色（紫蓝） | 默认、主要业务实体 |
| `success` | 绿色 | 已完成、已发布 |
| `blue` | 蓝色 | 流程、消息、通讯 |
| `purple` | 紫色 | 工作流、AI/Agent |
| `orange` | 橙色 | 任务、待办 |
| `red` | 红色 | 告警、错误、紧急 |
| `green` | 绿色 | 成功、通过 |
| `neutral` | 灰色 | 停用、归档、草稿 |

## 5. 仪表盘规范

### 5.1 StatCard 使用约定

```vue
<StatCard
  title="本周发送量"
  :value="stats.total"
  :delta="stats.deltaPercent"
  delta-label="vs 上周"
  suffix="条"
  variant="primary"
>
  <template #icon>
    <Send :size="16" />
  </template>
  <template #trend>
    <MiniChart :data="stats.trend" color="hsl(var(--primary))" :height="32" />
  </template>
</StatCard>
```

### 5.2 DashboardGrid 列数约定

| 场景 | 列数 |
|------|------|
| 核心指标 ≤ 4 个 | `columns="4"` |
| 扩展指标 5-6 个 | `columns="3"` |
| 附带侧边栏面板 | `columns="3"` + 侧栏 |
| 移动端 | 自动降级为 1-2 列 |

## 6. 高级筛选规范

### 6.1 AdvancedFilterBar 使用约定

- 每个 Chip 代表一个活动筛选条件
- 所有 Chip 共享左侧搜索框（互不影响）
- 清空按钮始终在 Chip 集合最末尾
- 必须的空态文案："暂无筛选条件"

### 6.2 筛选 Chip 数据结构

```ts
import type { FilterChip } from '@ydsz-core/shadcn-ui';

const filters = ref<FilterChip[]>([
  { field: 'status', label: '状态', value: '已发布', rawValue: 'PUBLISHED' },
  { field: 'category', label: '分类', value: '客户管理', rawValue: 'cust_manage' },
]);
```

## 7. 性能监控规范

### 7.1 useRenderPerformance 使用约定

开发环境默认启用，用于检测卡片/列表组件是否存在不必要的重渲染。

```vue
<script setup name="AgentCard">
  useRenderPerformance('AgentCard', { threshold: 30 });
</script>
```

### 7.2 告警阈值

| 组件类型 | 阈值 |
|----------|------|
| 卡片类（EntityCard / StatCard） | 30 |
| 列表容器（CardGrid / DashboardGrid） | 10 |
| 复杂组件（DomainFilterBar / AdvancedFilterBar） | 20 |

### 7.3 调试工具

DevTools 控制台可访问：

```js
window.__YDSZ_RENDER_PERF__.getSnapshot()  // 查看所有组件渲染统计
window.__YDSZ_RENDER_PERF__.reset('AgentCard') // 重置指定组件统计
window.__YDSZ_RENDER_PERF__.reset()            // 清空全部统计
```

## 8. 快捷创建规范

### 8.1 QuickCreateButton 注册项

各子应用在 bootstrap 或 layout 中注册快捷创建项：

```ts
const quickCreateItems = [
  { key: 'message', label: '发送消息', path: '/message/send', description: '新建一条消息' },
  { key: 'template', label: '创建模板', path: '/message/template/create', description: '消息发送模板' },
  { key: 'batch', label: '批量任务', path: '/message/batch/create', description: '批量发送' },
];
```

### 8.2 按钮位置

- 位置：页面中部偏右（bottom: 96px, right: 24px）
- 与 SettingsFloatButton（右下角 bottom: 24px）错开
- variant: orange（暖色，与设置的紫色形成区分）

## 9. 设计 Token 使用规范

### 9.1 文本色阶

| Token | 用途 |
|-------|------|
| `text-text-primary` | 主文本、标题、重要数值 |
| `text-text-secondary` | 副标题、说明、少量辅助文本 |
| `text-text-tertiary` | 标签、徽章、最次要的辅助说明 |
| `text-primary` | 品牌色文本、链接 |

### 9.2 背景色阶

| Token | 用途 |
|-------|------|
| `bg-surface-2` | 卡片、弹出层容器、域面板背景 |
| `bg-accent` | 按钮悬浮、hover 背景、次级容器 |
| `bg-accent/60` | 标签、徽章、行内 chip |
| `bg-primary-subtle` | 主要图标背景、语义标识 |

### 9.3 圆角与阴影

| 类型 | class |
|------|-------|
| 卡片 | `rounded-xl`（12px） |
| 按钮 | `rounded-lg`（8px） |
| Chip | `rounded-full` |
| 迷你图标 | `rounded-lg`（6-8px） |
| 阴影提升 | `shadow-raised`（hover 时统一应用） |

## 10. 暗色模式规范

- 所有自定义颜色必须提供 `dark:` 前缀变体
- 文本使用 Token 而非 `text-white / text-black`
- 背景使用 `bg-surface-2` 而非 `bg-white`
- 参考 forge-admin 暗色模式：整体降低饱和度，背景使用中性灰而非纯黑

## 11. 无障碍 (a11y) 规范

- 按钮必须带 `aria-label` 或在文本中表达语义
- 交互容器用 `role="toolbar" / "menu" / "option"` 等语义化角色
- 图标仅装饰用 `aria-hidden="true"`
- 状态色觉无障碍：不过颜色唯一载体，StatusBadge 内置圆点 + 文字双重标识

---

> 本规范由 ydsz-team 维护，如有场景未被覆盖请补充。
> 规范变更需同步更新本文件并知会前后端贯通负责人。
