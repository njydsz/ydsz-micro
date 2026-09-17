# Select 选择器

选择器用于从预定义选项中选择一个或多个值。基于 Radix Vue 实现，提供完整的无障碍支持。

## 设计要点

- 容器 `YdSelect` 转发 Radix Vue `SelectRoot` 的全部 props 与 emits
- 触发器 `YdSelectTrigger` 展示当前选中值，右侧带下拉箭头
- `YdSelectItemText` 确保选项文本正确渲染，`YdSelectValue` 管理占位符与选中值展示
- 选项面板虚拟化支持（`YdSelectVirtualContent`）

## 引入

```vue
<script setup lang="ts">
import {
  YdSelect,
  YdSelectContent,
  YdSelectGroup,
  YdSelectItem,
  YdSelectItemText,
  YdSelectLabel,
  YdSelectSeparator,
  YdSelectTrigger,
  YdSelectValue,
} from '@ydsz-core/ui-kit/ydsz-ui';
</script>
```

## 基础选择器

:::code-group

```vue [Single Select]
<script setup lang="ts">
import { ref } from 'vue';
import {
  YdSelect,
  YdSelectContent,
  YdSelectItem,
  YdSelectTrigger,
  YdSelectValue,
} from '@ydsz-core/ui-kit/ydsz-ui';

const selected = ref('');
</script>

<template>
  <YdSelect v-model="selected">
    <YdSelectTrigger class="w-[200px]">
      <YdSelectValue placeholder="请选择" />
    </YdSelectTrigger>
    <YdSelectContent>
      <YdSelectItem value="apple">苹果</YdSelectItem>
      <YdSelectItem value="banana">香蕉</YdSelectItem>
      <YdSelectItem value="orange">橙子</YdSelectItem>
      <YdSelectItem value="grape">葡萄</YdSelectItem>
    </YdSelectContent>
  </YdSelect>
</template>
```

:::

## 带分组的选项

:::code-group

```vue [Grouped]
<script setup lang="ts">
import { ref } from 'vue';

const selected = ref('');
</script>

<template>
  <YdSelect v-model="selected">
    <YdSelectTrigger class="w-[200px]">
      <YdSelectValue placeholder="请选择分类" />
    </YdSelectTrigger>
    <YdSelectContent>
      <YdSelectGroup>
        <YdSelectLabel>水果</YdSelectLabel>
        <YdSelectItem value="apple">苹果</YdSelectItem>
        <YdSelectItem value="banana">香蕉</YdSelectItem>
      </YdSelectGroup>
      <YdSelectSeparator />
      <YdSelectGroup>
        <YdSelectLabel>蔬菜</YdSelectLabel>
        <YdSelectItem value="carrot">胡萝卜</YdSelectItem>
        <YdSelectItem value="tomato">番茄</YdSelectItem>
      </YdSelectGroup>
    </YdSelectContent>
  </YdSelect>
</template>
```

:::

## 禁用选项

:::code-group

```vue [With Disabled]
<script setup lang="ts">
import { ref } from 'vue';

const selected = ref('');
</script>

<template>
  <YdSelect v-model="selected">
    <YdSelectTrigger class="w-[200px]">
      <YdSelectValue placeholder="部分选项不可用" />
    </YdSelectTrigger>
    <YdSelectContent>
      <YdSelectItem value="a">选项 A</YdSelectItem>
      <YdSelectItem value="b" disabled>选项 B（禁用）</YdSelectItem>
      <YdSelectItem value="c">选项 C</YdSelectItem>
    </YdSelectContent>
  </YdSelect>
</template>
```

:::

## 禁用整个选择器

:::code-group

```vue [Disabled Select]
<template>
  <YdSelect disabled>
    <YdSelectTrigger class="w-[200px]">
      <YdSelectValue placeholder="整个组件禁用" />
    </YdSelectTrigger>
    <YdSelectContent>
      <YdSelectItem value="a">选项 A</YdSelectItem>
    </YdSelectContent>
  </YdSelect>
</template>
```

:::

## 表单集成

:::code-group

```vue [Form Usage]
<script setup lang="ts">
import { ref } from 'vue';

const role = ref('');
const dept = ref('');
</script>

<template>
  <form class="space-y-4 max-w-md" @submit.prevent>
    <div class="flex items-center gap-3">
      <label class="w-16 text-sm">角色</label>
      <YdSelect v-model="role">
        <YdSelectTrigger class="w-[200px]">
          <YdSelectValue placeholder="选择角色" />
        </YdSelectTrigger>
        <YdSelectContent>
          <YdSelectItem value="admin">管理员</YdSelectItem>
          <YdSelectItem value="editor">编辑者</YdSelectItem>
          <YdSelectItem value="viewer">访客</YdSelectItem>
        </YdSelectContent>
      </YdSelect>
    </div>
    <div class="flex items-center gap-3">
      <label class="w-16 text-sm">部门</label>
      <YdSelect v-model="dept">
        <YdSelectTrigger class="w-[200px]">
          <YdSelectValue placeholder="选择部门" />
        </YdSelectTrigger>
        <YdSelectContent>
          <YdSelectItem value="tech">技术部</YdSelectItem>
          <YdSelectItem value="product">产品部</YdSelectItem>
          <YdSelectItem value="design">设计部</YdSelectItem>
        </YdSelectContent>
      </YdSelect>
    </div>
  </form>
</template>
```

:::

## API

### YdSelect（容器）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `string` | `undefined` | 选中值（受控模式），通过 `v-model` 绑定 |
| `defaultOpen` | `boolean` | `false` | 默认是否展开下拉面板 |
| `open` | `boolean` | `undefined` | 受控展开状态 |
| `disabled` | `boolean` | `false` | 禁用整个选择器 |
| `required` | `boolean` | `false` | 表单必填 |
| `name` | `string` | `undefined` | 表单字段名 |
| `dir` | `'ltr' \| 'rtl'` | `undefined` | 文本方向 |

### YdSelectTrigger

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `any` | `undefined` | 自定义类名 |
| `disabled` | `boolean` | `false` | 禁用触发器 |
| `asChild` | `boolean` | `false` | 透传属性至子元素 |

### YdSelectItem

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `string` | **必填** | 选项值 |
| `disabled` | `boolean` | `false` | 禁用该选项 |
| `class` | `any` | `undefined` | 自定义类名 |
| `textValue` | `string` | `undefined` | 用于搜索过滤的文本值 |

### Events

| 事件名 | 参数类型 | 说明 |
|--------|---------|------|
| `update:modelValue` | `string` | 选中值变化时触发 |
| `update:open` | `boolean` | 面板开闭状态变化时触发 |

### Slots

| 组件 | 插槽 | 说明 |
|------|------|------|
| `YdSelect` | `default` | 包含 `YdSelectTrigger` 与 `YdSelectContent` |
| `YdSelectTrigger` | `default` | 通常为 `YdSelectValue` |
| `YdSelectContent` | `default` | 包含 `YdSelectItem` / 分组 |
| `YdSelectItem` | `default` | 选项文本内容 |
| `YdSelectValue` | `default` | 自定义占位符内容 |

## 子组件一览

| 组件 | 作用 |
|------|------|
| `YdSelect` | 容器，状态托管，forward radix SelectRoot |
| `YdSelectTrigger` | 触发器按钮，显示当前选中值 + 箭头图标 |
| `YdSelectValue` | 占位符与选中值展示 |
| `YdSelectContent` | 下拉面板容器 |
| `YdSelectGroup` | 选项分组 |
| `YdSelectLabel` | 分组标签（不可点击） |
| `YdSelectItem` | 单个选项（含选中图标区域） |
| `YdSelectItemText` | 选项文本容器（必须包裹文本） |
| `YdSelectSeparator` | 分割线 |
| `YdSelectScrollUpButton` | 上滚动按钮（溢出时自动显示） |
| `YdSelectScrollDownButton` | 下滚动按钮（溢出时自动显示） |
| `YdSelectVirtualContent` | 虚拟化内容容器（大数据量场景） |
| `YdVSelect` | 虚拟化选择器（独立入口） |
| `YdVSelectTrigger` | 虚拟化选择器触发器 |
