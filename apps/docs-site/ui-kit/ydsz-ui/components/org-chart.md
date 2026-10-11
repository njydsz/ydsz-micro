# YdOrgChart — 组织架构图

> 树形组织架构图组件，支持垂直/水平布局、折叠展开、单选/多选模式、自定义节点模板。对标 PrimeVue OrganizationChart。

## API 一览

### YdOrganizationChart 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `root` | `OrgNode` | — | **必填**，根节点数据 |
| `horizontal` | `boolean` | `false` | 水平布局（默认垂直自上而下） |
| `collapsible` | `boolean` | `true` | 是否允许折叠 |
| `selectionMode` | `'single' \| 'multiple' \| null` | `null` | 选择模式 |
| `template` | `(node: OrgNode) => VNode \| string` | — | 自定义节点渲染模板 |
| `showTypeBadge` | `boolean` | `true` | 是否显示节点类型徽标 |
| `class` | `string` | — | 自定义类名 |

### OrgNode 类型

```typescript
interface OrgNode {
  id: string
  label: string
  type?: string
  expanded?: boolean
  children?: OrgNode[]
  data?: Record<string, any>
}
```

### 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `nodeSelect` | `OrgNode` | 节点选中 |
| `nodeUnselect` | `OrgNode` | 节点取消选中 |
| `nodeExpand` | `OrgNode` | 节点展开 |
| `nodeCollapse` | `OrgNode` | 节点折叠 |

---

## 典型用法

### 基础用法 — 公司组织架构

:::demo 展示总公司到各部门的树形结构，点击节点可折叠展开。

```vue
<script setup>
import { ref } from 'vue'

const companyData = ref({
  id: 'Root',
  label: '有样式科技',
  type: 'root',
  expanded: true,
  data: { members: 128, head: 'CEO · 张三' },
  children: [
    {
      id: 'Tech',
      label: '技术中心',
      type: 'dept',
      expanded: true,
      data: { members: 65, head: 'CTO · 李四' },
      children: [
        { id: 'FE', label: '前端组', type: 'team', data: { members: 20, head: '王五' } },
        { id: 'BE', label: '后端组', type: 'team', data: { members: 25, head: '赵六' } },
        { id: 'DevOps', label: '运维组', type: 'team', data: { members: 8, head: '陈七' } },
        { id: 'QA', label: '测试组', type: 'team', data: { members: 12, head: '孙八' } },
      ],
    },
    {
      id: 'Product',
      label: '产品中心',
      type: 'dept',
      expanded: true,
      data: { members: 22, head: '产品VP · 周九' },
      children: [
        { id: 'UX', label: '设计组', type: 'team', data: { members: 10, head: '吴十' } },
        { id: 'PM', label: '产品组', type: 'team', data: { members: 12, head: '郑一' } },
      ],
    },
    {
      id: 'Biz',
      label: '商务中心',
      type: 'dept',
      data: { members: 18, head: '商务总监 · 王二' },
    },
  ],
})
</script>

<template>
  <YdOrganizationChart
    :root="companyData"
    collapsible
    class="overflow-auto rounded border p-4"
  />
</template>
```

:::

### 变体 — 水平布局 + 自定义节点

:::demo 水平布局适合宽幅展示，自定义模板添加头像与人员信息卡片。

```vue
<script setup>
import { ref } from 'vue'

const teamData = ref({
  id: 'lead',
  label: '项目总监',
  type: 'leader',
  expanded: true,
  data: { name: '陈志远', avatar: '👨', role: '项目总监' },
  children: [
    {
      id: 'dev',
      label: '开发组',
      type: 'group',
      expanded: true,
      data: { name: '刘建华', avatar: '🧑', role: '开发组长' },
      children: [
        { id: 'dev1', label: '张三', type: 'member', data: { name: '张三', avatar: '👨', role: '高级工程师' } },
        { id: 'dev2', label: '李四', type: 'member', data: { name: '李四', avatar: '👩', role: '工程师' } },
      ],
    },
    {
      id: 'design',
      label: '设计组',
      type: 'group',
      expanded: true,
      data: { name: '林小雨', avatar: '👩', role: '设计组长' },
      children: [
        { id: 'des1', label: '王五', type: 'member', data: { name: '王五', avatar: '👩', role: 'UI 设计师' } },
      ],
    },
  ],
})

function customTemplate(node) {
  return null // 实际使用 h() 函数渲染自定义内容
}
</script>

<template>
  <YdOrganizationChart
    :root="teamData"
    :horizontal="true"
    collapsible
    class="overflow-x-auto rounded border p-4"
  />
</template>
```

:::

### 真实业务场景 — 部门人员结构（带选择与操作）

:::demo 组织架构图中支持节点选择，用来批量管理人员信息。配合 selectionMode 选择部门查看成员详情。

```vue
<script setup>
import { ref } from 'vue'

const orgData = ref({
  id: 'HQ',
  label: '总部',
  type: 'hq',
  expanded: true,
  data: { name: '总部', location: '北京' },
  children: [
    {
      id: 'RD',
      label: '研发中心',
      type: 'center',
      expanded: true,
      data: { name: '研发中心', location: '北京' },
      children: [
        {
          id: 'PLAT',
          label: '平台研发部',
          type: 'dept',
          expanded: true,
          data: { name: '平台研发部', count: 35 },
          children: [
            { id: 'P1', label: '基础设施组', type: 'team', data: { count: 12 } },
            { id: 'P2', label: '业务中台组', type: 'team', data: { count: 15 } },
            { id: 'P3', label: '数据平台组', type: 'team', data: { count: 8 } },
          ],
        },
        {
          id: 'APP',
          label: '应用研发部',
          type: 'dept',
          expanded: true,
          data: { name: '应用研发部', count: 28 },
          children: [
            { id: 'A1', label: '移动端组', type: 'team', data: { count: 10 } },
            { id: 'A2', label: 'Web 端组', type: 'team', data: { count: 18 } },
          ],
        },
      ],
    },
    {
      id: 'MKT',
      label: '市场中心',
      type: 'center',
      data: { name: '市场中心', location: '上海' },
      children: [
        { id: 'M1', label: '品牌组', type: 'dept', data: { count: 8 } },
        { id: 'M2', label: '增长组', type: 'dept', data: { count: 12 } },
      ],
    },
  ],
})

const selectedNode = ref(null)

function handleNodeSelect(node) {
  selectedNode.value = node
  console.log('选中节点：', node.label)
}
</script>

<template>
  <div class="flex gap-4">
    <!-- 组织架构图 -->
    <div class="flex-1 overflow-auto rounded border p-4">
      <YdOrganizationChart
        :root="orgData"
        collapsible
        selection-mode="single"
        class="min-w-[400px]"
        @node-select="handleNodeSelect"
      />
    </div>

    <!-- 选中节点详情面板 -->
    <div class="w-64 shrink-0 rounded border p-4">
      <h4 class="text-sm font-medium mb-3">节点详情</h4>
      <div v-if="selectedNode" class="space-y-2">
        <p class="text-sm font-medium">{{ selectedNode.label }}</p>
        <p class="text-xs text-neutral-500">类型：{{ selectedNode.type }}</p>
        <p v-if="selectedNode.data" class="text-xs text-neutral-500">
          信息：{{ JSON.stringify(selectedNode.data) }}
        </p>
        <YdButton size="xs" variant="outline" class="w-full mt-3">
          查看完整信息
        </YdButton>
      </div>
      <p v-else class="text-xs text-neutral-400">点击节点查看详情</p>
    </div>
  </div>
</template>
```

:::
