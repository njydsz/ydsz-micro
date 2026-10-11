# YdPickList — 双栏穿梭列表

> source / target 两栏 + 中间控制按钮的穿梭组件。支持单选/多选（Ctrl/Shift+Click）、双击穿梭、过滤、拖拽排序与响应式布局。

## API 一览

### YdPickList 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `[unknown[], unknown[]]` | `[[], []]` | **必填**，`[source, target]` 双数组 |
| `optionLabel` | `string` | — | 显示文本字段名 |
| `optionValue` | `string` | — | 唯一值字段名 |
| `filter` | `boolean` | `false` | 是否开启过滤 |
| `filterBy` | `string` | — | 过滤字段名（不传则全字段匹配） |
| `dragdrop` | `boolean` | `false` | 是否开启拖拽排序 |
| `responsive` | `boolean` | `false` | 响应式布局（窄屏上下排列） |
| `striped` | `boolean` | `false` | 斑马纹 |
| `sourceHeader` | `string` | `'来源'` | 左侧面板标题 |
| `targetHeader` | `string` | `'目标'` | 右侧面板标题 |
| `sourceClass` / `targetClass` | `string` | — | 面板自定义类名 |

### 双向绑定

| 模型 | 类型 | 说明 |
|------|------|------|
| `modelValue` | `[unknown[], unknown[]]` | `[sourceItems, targetItems]` |

### 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `move-to-target` | `{ items }` | 选中项移到目标 |
| `move-to-source` | `{ items }` | 选中项移到来源 |
| `move-all-to-target` | `{ items }` | 全部移到目标 |
| `move-all-to-source` | `{ items }` | 全部移到来源 |
| `reorder` | `{ originalEvent, value, fromIndex, toIndex }` | 拖拽重排 |

---

## 典型用法

### 基础用法 — 角色分配

:::demo 从可选角色列表中穿梭选择用户拥有的角色，带过滤搜索。

```vue
<script setup>
import { ref } from 'vue'

const roles = ref([
  [
    { id: 1, name: '管理员', desc: '全部权限' },
    { id: 2, name: '编辑者', desc: '创建与编辑内容' },
    { id: 3, name: '审阅者', desc: '审核与发布' },
    { id: 4, name: '访客', desc: '只读访问' },
    { id: 5, name: '审计员', desc: '查看日志' },
  ],
  [
    { id: 1, name: '管理员', desc: '全部权限' },
  ],
])

const allRoles = [
  { id: 1, name: '管理员', desc: '全部权限' },
  { id: 2, name: '编辑者', desc: '创建与编辑内容' },
  { id: 3, name: '审阅者', desc: '审核与发布' },
  { id: 4, name: '访客', desc: '只读访问' },
  { id: 5, name: '审计员', desc: '查看日志' },
]
</script>

<template>
  <YdPickList
    v-model="roles"
    option-label="name"
    option-value="id"
    filter
    source-header="可选角色"
    target-header="已分配角色"
    class="max-w-xl"
  />
</template>
```

:::

### 变体 — 权限穿梭（带拖拽排序）

:::demo 已选权限列表支持拖拽排序，确定权限优先级。

```vue
<script setup>
import { ref } from 'vue'

const permissions = ref([
  [
    { id: 'read', label: '读取资源', cat: '数据' },
    { id: 'write', label: '写入资源', cat: '数据' },
    { id: 'delete', label: '删除资源', cat: '数据' },
    { id: 'audit', label: '审计日志', cat: '管理' },
    { id: 'config', label: '系统配置', cat: '管理' },
  ],
  [
    { id: 'read', label: '读取资源', cat: '数据' },
    { id: 'write', label: '写入资源', cat: '数据' },
  ],
])
</script>

<template>
  <YdPickList
    v-model="permissions"
    option-label="label"
    option-value="id"
    filter
    filter-by="label"
    dragdrop
    striped
    source-header="可用权限"
    target-header="已启用权限（拖拽排序）"
    class="max-w-2xl"
  />
</template>
```

:::

### 真实业务场景 — 批量员工分配部门

:::demo 组织架构管理中，批量选择员工后穿梭到目标部门，支持响应式布局和批量操作。

```vue
<script setup>
import { ref } from 'vue'

const members = ref([
  [
    { empId: 'E001', name: '张三', role: '前端工程师' },
    { empId: 'E002', name: '李四', role: '后端工程师' },
    { empId: 'E003', name: '王五', role: '产品经理' },
    { empId: 'E004', name: '赵六', role: 'UI 设计师' },
    { empId: 'E005', name: '陈七', role: '测试工程师' },
    { empId: 'E006', name: '孙八', role: '运维工程师' },
  ],
  [
    { empId: 'E007', name: '周九', role: '技术总监' },
  ],
])

function handleSubmit() {
  const assigned = members.value[1]
  console.log('已分配部门人员：', assigned.map(m => m.name))
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-base font-medium">研发二部 — 人员配置</h3>
        <p class="text-xs text-neutral-500">
          从左侧选择员工加入部门，右侧为当前部门成员
        </p>
      </div>
      <YdButton size="sm" @click="handleSubmit">
        保存配置
      </YdButton>
    </div>
    <YdPickList
      v-model="members"
      option-label="name"
      option-value="emp-id"
      filter
      filter-by="name"
      responsive
      striped
      source-header="公司员工池"
      target-header="研发二部（{{ members[1].length }} 人）"
      class="w-full"
    />
  </div>
</template>
```

:::
