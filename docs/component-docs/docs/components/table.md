# Table 表格

表格用于展示结构化数据，支持列驱动渲染、排序、固定列、虚拟滚动与列宽拖拽调整等高级特性。

## 设计要点

- 语义化 `<table>` 标签，屏幕阅读器自动识别行列关系
- 列驱动模式：通过 `<YdTableColumn>` 子组件声明列定义，父级自动渲染 thead/tbody
- 支持虚拟滚动（`virtual` prop），可应对万级数据渲染
- 内置列宽拖拽调整（`columnResizable` prop）
- 表头固定（`maxHeight` 超出时）、隔行变色（`stripe` prop）

## 引入

```vue
<script setup lang="ts">
import { YdTable, YdTableColumn } from '@ydsz-core/ui-kit/ydsz-ui';
</script>
```

## 基础表格

:::code-group

```vue [Basic]
<script setup lang="ts">
import { YdTable, YdTableColumn } from '@ydsz-core/ui-kit/ydsz-ui';

interface DataRow {
  id: number;
  name: string;
  age: number;
  email: string;
}

const data: DataRow[] = [
  { id: 1, name: '张三', age: 28, email: 'zhangsan@example.com' },
  { id: 2, name: '李四', age: 32, email: 'lisi@example.com' },
  { id: 3, name: '王五', age: 25, email: 'wangwu@example.com' },
];
</script>

<template>
  <YdTable :data="data" row-key="id">
    <YdTableColumn prop="name" label="姓名" />
    <YdTableColumn prop="age" label="年龄" />
    <YdTableColumn prop="email" label="邮箱" />
  </YdTable>
</template>
```

:::

## 带边框与隔行变色

:::code-group

```vue [Bordered & Striped]
<template>
  <YdTable :data="data" row-key="id" border stripe>
    <YdTableColumn prop="name" label="姓名" />
    <YdTableColumn prop="age" label="年龄" />
    <YdTableColumn prop="email" label="邮箱" />
  </YdTable>
</template>
```

:::

## 不同尺寸

:::code-group

```vue [Sizes]
<template>
  <div class="space-y-6">
    <div>
      <p class="text-sm font-medium mb-2">Small</p>
      <YdTable :data="data" size="small">
        <YdTableColumn prop="name" label="姓名" />
        <YdTableColumn prop="age" label="年龄" />
      </YdTable>
    </div>
    <div>
      <p class="text-sm font-medium mb-2">Large</p>
      <YdTable :data="data" size="large">
        <YdTableColumn prop="name" label="姓名" />
        <YdTableColumn prop="age" label="年龄" />
      </YdTable>
    </div>
  </div>
</template>
```

:::

## 可调列宽

:::code-group

```vue [Column Resizable]
<template>
  <YdTable :data="data" row-key="id" column-resizable>
    <YdTableColumn prop="name" label="姓名" width="200px" />
    <YdTableColumn prop="age" label="年龄" width="100px" />
    <YdTableColumn prop="email" label="邮箱" width="300px" />
  </YdTable>
</template>
```

:::

## 固定列

:::code-group

```vue [Fixed Columns]
<template>
  <YdTable :data="data" row-key="id" border>
    <YdTableColumn prop="name" label="姓名" width="120px" fixed="left" />
    <YdTableColumn prop="age" label="年龄" width="80px" />
    <YdTableColumn prop="email" label="邮箱" width="200px" />
    <YdTableColumn prop="address" label="地址" width="300px" />
    <YdTableColumn prop="action" label="操作" width="120px" fixed="right" />
  </YdTable>
</template>
```

:::

## 排序功能

:::code-group

```vue [Sortable]
<script setup lang="ts">
import { ref } from 'vue';

const sortProp = ref<string>('');
const sortOrder = ref<'asc' | 'desc' | null>(null);

function handleSort(prop: string, order: 'asc' | 'desc' | null) {
  sortProp.value = order ? prop : '';
  sortOrder.value = order;
}
</script>

<template>
  <YdTable
    :data="data"
    row-key="id"
    :sort-prop="sortProp"
    :sort-order="sortOrder"
    @sort-change="handleSort"
  >
    <YdTableColumn prop="name" label="姓名" :is-sortable="true" />
    <YdTableColumn prop="age" label="年龄" :is-sortable="true" />
    <YdTableColumn prop="email" label="邮箱" />
  </YdTable>
</template>
```

:::

## 虚拟滚动

:::code-group

```vue [Virtual Scroll]
<script setup lang="ts">
import { ref } from 'vue';

const largeData = ref(
  Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `用户 ${i}`,
    age: 20 + (i % 50),
    email: `user${i}@example.com`,
  }))
);
</script>

<template>
  <YdTable :data="largeData" row-key="id" virtual :max-height="400">
    <YdTableColumn prop="id" label="ID" width="80px" />
    <YdTableColumn prop="name" label="姓名" width="150px" />
    <YdTableColumn prop="age" label="年龄" width="100px" />
    <YdTableColumn prop="email" label="邮箱" width="250px" />
  </YdTable>
</template>
```

:::

## 自定义列渲染

:::code-group

```vue [Custom Render]
<script setup lang="ts">
import { h } from 'vue';
</script>

<template>
  <YdTable :data="data" row-key="id">
    <YdTableColumn prop="name" label="姓名" />
    <YdTableColumn prop="status" label="状态" :formatter="(row) => row.active ? '启用' : '禁用'" />
    <YdTableColumn label="操作" width="150px">
      <template #default="{ row }">
        <button class="text-blue-600 hover:underline mr-2">编辑</button>
        <button class="text-red-600 hover:underline">删除</button>
      </template>
    </YdTableColumn>
  </YdTable>
</template>
```

:::

## API

### YdTable Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `data` | `Record<string, unknown>[]` | `undefined` | 行数据数组（列驱动模式必须） |
| `width` | `string` | `'100%'` | 整个表格的宽度 |
| `border` | `boolean` | `false` | 显示外边框与单元格边框 |
| `stripe` | `boolean` | `false` | 隔行变色 |
| `size` | `'default' \| 'small' \| 'large'` | `'default'` | 密度 |
| `maxHeight` | `string \| number` | `undefined` | 最大高度（超出时表头固定、表体滚动） |
| `loading` | `boolean` | `false` | 加载状态（显示 loading 遮罩） |
| `emptyText` | `string` | `'暂无数据'` | 空数据提示文本 |
| `class` | `string` | `undefined` | 自定义类名 |
| `rowKey` | `string` | `undefined` | 行数据的唯一 key 字段 |
| `sortProp` | `string` | `undefined` | 当前排序列的 prop |
| `sortOrder` | `'asc' \| 'desc' \| null` | `null` | 当前排序方向 |
| `virtual` | `boolean` | `false` | 开启虚拟滚动 |
| `itemHeight` | `number` | `40` | 虚拟滚动单行高度（px） |
| `overscan` | `number` | `5` | 虚拟滚动缓冲区行数 |
| `viewportHeight` | `number` | `400` | 虚拟滚动视口高度（px） |
| `columnResizable` | `boolean` | `false` | 开启列宽拖拽调整 |
| `summaryData` | `Record<string, unknown>` | `undefined` | 聚合行数据 |

### YdTable Events

| 事件名 | 参数类型 | 说明 |
|--------|---------|------|
| `sort-change` | `[prop: string, order: 'asc' \| 'desc' \| null]` | 列排序变更事件，由调用方处理后重新传入 `sortProp` / `sortOrder` |

### YdTableColumn Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `'index' \| 'selection' \| 'expand'` | `undefined` | 列类型：序号列 / 多选框 / 展开行 |
| `prop` | `string` | `undefined` | 对应行数据的字段名 |
| `label` | `string` | `undefined` | 表头文本 |
| `width` | `string` | `undefined` | 列宽度（CSS 值） |
| `minWidth` | `string` | `undefined` | 最小宽度 |
| `maxWidth` | `string` | `undefined` | 最大宽度（可拖拽拉宽场景使用） |
| `fixed` | `'left' \| 'right'` | `undefined` | 列固定位置 |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | 对齐方式 |
| `showOverflowTooltip` | `boolean` | `false` | 内容超长省略 + tooltip |
| `formatter` | `(row, column, cellValue, index) => string` | `undefined` | 格式化函数 |
| `isHidden` | `boolean` | `false` | 是否隐藏（可被列设置面板控制） |
| `hideable` | `boolean` | `true` | 是否允许用户通过列设置面板隐藏 |
| `draggable` | `boolean` | `true` | 是否允许列拖拽排序 |
| `isSortable` | `boolean` | `false` | 是否允许通过表头点击排序 |
| `sortOrder` | `'asc' \| 'desc' \| null` | `undefined` | 当前排序方向 |
| `sort` | `number` | `undefined` | 列拖拽顺序权重 |
| `children` | `ColumnDef[]` | `undefined` | 多级表头子列 |

### YdTableColumn Slots

| 插槽 | 属性 | 说明 |
|------|------|------|
| `default` | `{ row, index, value }` | 单元格自定义内容 |
| `header` | — | 表头自定义内容 |
| `summary` | `{ column, value }` | 聚合行单元格内容 |

### Exposed Methods / Properties

| 名称 | 类型 | 说明 |
|------|------|------|
| `columns` | `ComputedRef<ColumnDef[]>` | 当前注册的列定义 |
| `columnWidths` | `Ref<Record<string, number>>` | 拖拽后的列宽（columnResizable=true 时有效） |

## 两种渲染模式

| 模式 | 说明 | 使用场景 |
|------|------|---------|
| **列驱动** | `:data` + `<YdTableColumn>` 子组件声明列定义，自动渲染 `thead` / `tbody` | 绝大多数场景（推荐） |
| **语义插槽** | 直接使用 `YdTableHeader` / `YdTableBody` / `YdTableRow` / `YdTableCell` 子组件填充，`YdTable` 仅提供 overflow 容器 | 需要完全自定义表格结构 |

## 虚拟滚动参数调优

| 参数 | 建议 | 说明 |
|------|------|------|
| `itemHeight` | 设置为实际行高（px） | 影响滚动条位置计算精度 |
| `overscan` | 3 ~ 8 | 缓冲区过大会浪费内存，过小会导致快速滚动时白屏 |
| `viewportHeight` | 或由 `maxHeight` 推导 | 视口高度影响可见行数计算 |
