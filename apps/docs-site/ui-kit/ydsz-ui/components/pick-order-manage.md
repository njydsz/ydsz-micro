# YdPickList + YdOrderList — 先选后排序综合管理

> 在权限配置、菜单排序、项排列等业务场景中，常常需要**先选择可用项，再对已选项排序**。将 YdPickList 与 YdOrderList 组合使用，实现"选 + 排一体化"。

## 设计思路

1. **YdPickList** 负责从备选池中穿梭选择目标项
2. **YdOrderList** 负责对已选项进行拖拽排序 / 上下位移
3. 两个组件共享 `已选项` 数据源，pick 改变自动同步到 order

---

## 典型用法

### 基础用法 — 菜单权限选择 + 排序

:::demo 先从左侧选择需要启用的菜单项，再在右侧拖拽排序确定菜单栏顺序。

```vue
<script setup>
import { ref, computed } from 'vue'

// PickList 的双向绑定数据
const pickData = ref([
  // 左侧：可选菜单
  [
    { id: 'dashboard', name: '工作台', icon: '📊' },
    { id: 'orders', name: '订单管理', icon: '📦' },
    { id: 'products', name: '商品管理', icon: '🏷️' },
    { id: 'customers', name: '客户管理', icon: '👥' },
    { id: 'analytics', name: '数据分析', icon: '📈' },
    { id: 'settings', name: '系统设置', icon: '⚙️' },
    { id: 'finance', name: '财务管理', icon: '💰' },
  ],
  // 右侧：已选菜单
  [
    { id: 'dashboard', name: '工作台', icon: '📊' },
    { id: 'orders', name: '订单管理', icon: '📦' },
    { id: 'products', name: '商品管理', icon: '🏷️' },
  ],
])

// 已选菜单（用于 OrderList，与 PickList 右侧同步）
const selectedMenus = computed({
  get: () => pickData.value[1],
  set: (val) => { pickData.value = [pickData.value[0], val] },
})

function handleSubmit() {
  console.log('菜单配置：', selectedMenus.value.map(m => m.name))
}
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-base font-medium">导航菜单配置</h3>
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <!-- 左侧：穿梭选择 -->
      <div>
        <h4 class="mb-2 text-sm text-neutral-500">① 选择启用菜单</h4>
        <YdPickList
          v-model="pickData"
          option-label="name"
          option-value="id"
          filter
          responsive
          source-header="全部菜单"
          target-header="已启用菜单"
          class="w-full"
        />
      </div>

      <!-- 右侧：排序 -->
      <div>
        <h4 class="mb-2 text-sm text-neutral-500">② 拖拽排序菜单</h4>
        <YdOrderList
          v-model="selectedMenus"
          option-label="name"
          filter
          dragdrop
          class="w-full"
        />
      </div>
    </div>
    <YdButton size="sm" @click="handleSubmit">保存配置</YdButton>
  </div>
</template>
```

:::

### 变体 — 多角色权限分配

:::demo 不同角色先选择适用模块，再排序显示优先级。使用 YdTabs 切换角色。

```vue
<script setup>
import { ref, computed } from 'vue'

const roles = ['管理员', '编辑者', '访客']
const currentRole = ref('管理员')

// 各角色的权限配置
const rolePermissions = ref({
  管理员: [
    [
      { id: 'user:read', label: '查看用户' },
      { id: 'user:write', label: '创建/编辑用户' },
      { id: 'user:delete', label: '删除用户' },
      { id: 'role:read', label: '查看角色' },
      { id: 'role:write', label: '创建/编辑角色' },
      { id: 'role:delete', label: '删除角色' },
      { id: 'log:read', label: '查看日志' },
      { id: 'log:export', label: '导出日志' },
      { id: 'config:write', label: '修改配置' },
    ],
    [
      { id: 'user:read', label: '查看用户' },
      { id: 'user:write', label: '创建/编辑用户' },
      { id: 'role:read', label: '查看角色' },
      { id: 'role:write', label: '创建/编辑角色' },
      { id: 'log:read', label: '查看日志' },
      { id: 'log:export', label: '导出日志' },
      { id: 'config:write', label: '修改配置' },
    ],
  ],
  编辑者: [
    [
      { id: 'user:read', label: '查看用户' },
      { id: 'user:write', label: '创建/编辑用户' },
      { id: 'user:delete', label: '删除用户' },
      { id: 'role:read', label: '查看角色' },
      { id: 'role:write', label: '创建/编辑角色' },
      { id: 'log:read', label: '查看日志' },
    ],
    [
      { id: 'user:read', label: '查看用户' },
      { id: 'user:write', label: '创建/编辑用户' },
      { id: 'role:read', label: '查看角色' },
      { id: 'log:read', label: '查看日志' },
    ],
  ],
  访客: [
    [
      { id: 'user:read', label: '查看用户' },
      { id: 'user:write', label: '创建/编辑用户' },
      { id: 'user:delete', label: '删除用户' },
      { id: 'role:read', label: '查看角色' },
    ],
    [
      { id: 'user:read', label: '查看用户' },
    ],
  ],
})

const currentPick = computed({
  get: () => rolePermissions.value[currentRole.value],
  set: (val) => { rolePermissions.value[currentRole.value] = val },
})

const currentOrder = computed({
  get: () => rolePermissions.value[currentRole.value][1],
  set: (val) => { rolePermissions.value[currentRole.value] = [rolePermissions.value[currentRole.value][0], val] },
})
</script>

<template>
  <div class="space-y-4">
    <YdTabs v-model="currentRole">
      <YdTabItem v-for="r in roles" :key="r" :value="r">{{ r }}</YdTabItem>
    </YdTabs>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div>
        <p class="mb-2 text-sm text-neutral-500">可用权限池</p>
        <YdPickList
          v-model="currentPick"
          option-label="label"
          option-value="id"
          filter
          responsive
          source-header="全部权限"
          target-header="已分配权限"
          class="w-full"
        />
      </div>
      <div>
        <p class="mb-2 text-sm text-neutral-500">权限优先级排序</p>
        <YdOrderList
          v-model="currentOrder"
          option-label="label"
          filter
          dragdrop
          class="w-full"
        />
      </div>
    </div>

    <YdButton size="sm">保存"{{ currentRole }}"权限</YdButton>
  </div>
</template>
```

:::

### 真实业务场景 — 首页仪表盘组件编排

:::demo 企业门户首页的自定义仪表盘：先选择需要展示的统计组件（PickList），再确定它们在页面中的排列顺序和优先级（OrderList），所见即所得。

```vue
<script setup>
import { ref, computed } from 'vue'

const dashboardConfig = ref([
  // 左侧：所有可用的仪表盘组件
  [
    { id: 'sales', name: '销售总额卡片', icon: '💰', category: '数据' },
    { id: 'orders', name: '今日订单趋势', icon: '📈', category: '数据' },
    { id: 'users', name: '活跃用户数', icon: '👥', category: '数据' },
    { id: 'tasks', name: '待办事项列表', icon: '✅', category: '任务' },
    { id: 'notif', name: '通知公告', icon: '🔔', category: '信息' },
    { id: 'calendar', name: '工作日历', icon: '📅', category: '任务' },
    { id: 'quick', name: '快捷操作面板', icon: '⚡', category: '工具' },
    { id: 'weather', name: '天气信息', icon: '🌤️', category: '信息' },
    { id: 'news', name: '公司动态', icon: '📰', category: '信息' },
    { id: 'chart', name: '转化漏斗图', icon: '📊', category: '数据' },
  ],
  // 右侧：首页展示的组件（已选）
  [
    { id: 'sales', name: '销售总额卡片', icon: '💰', category: '数据' },
    { id: 'orders', name: '今日订单趋势', icon: '📈', category: '数据' },
    { id: 'tasks', name: '待办事项列表', icon: '✅', category: '任务' },
    { id: 'notif', name: '通知公告', icon: '🔔', category: '信息' },
  ],
])

const activeWidgets = computed({
  get: () => dashboardConfig.value[1],
  set: (val) => { dashboardConfig.value = [dashboardConfig.value[0], val] },
})

function handleSave() {
  const layout = activeWidgets.value.map((w, i) => ({
    id: w.id, name: w.name, order: i,
  }))
  console.log('仪表盘布局保存：', layout)
}
</script>

<template>
  <div class="rounded border">
    <!-- 顶部提示 -->
    <div class="border-b bg-neutral-50 px-4 py-3">
      <h3 class="text-sm font-medium">仪表盘编排工具</h3>
      <p class="mt-1 text-xs text-neutral-500">
        从左侧选择组件 → 右侧拖拽调整显示顺序
      </p>
    </div>

    <div class="grid grid-cols-1 gap-4 p-4 lg:grid-cols-3">
      <!-- 左侧：组件库 -->
      <div class="lg:col-span-2">
        <YdPickList
          v-model="dashboardConfig"
          option-label="name"
          option-value="id"
          filter
          filter-by="name"
          striped
          source-header="组件库"
          target-header="首页组件"
          class="w-full"
        />
      </div>

      <!-- 右侧：排序预览 -->
      <div>
        <p class="mb-2 text-xs text-neutral-500">
          拖拽排序 — 共 {{ activeWidgets.length }} 个组件
        </p>
        <YdOrderList
          v-model="activeWidgets"
          option-label="name"
          dragdrop
          class="w-full"
        />
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="flex items-center justify-between border-t bg-neutral-50 px-4 py-3">
      <span class="text-xs text-neutral-500">
        提示：排序结果影响首页组件展示顺序
      </span>
      <div class="flex gap-2">
        <YdButton size="sm" variant="outline">重置</YdButton>
        <YdButton size="sm" @click="handleSave">保存布局</YdButton>
      </div>
    </div>
  </div>
</template>
```

:::
