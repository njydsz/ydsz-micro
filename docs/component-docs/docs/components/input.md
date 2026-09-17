# Input 输入框

输入框用于接收用户输入的单行文本数据，支持 `v-model` 双向绑定。

## 设计要点

- 标准单行文本输入，语义化 `<input>` 标签，屏幕阅读器自动识别
- 通过 `useVModel` 封装，同时支持 `v-model` 与 `modelValue` / `defaultValue`
- 内置 focus ring、disabled 态、placeholder 样式

## 引入

```vue
<script setup lang="ts">
import { YdInput } from '@ydsz-core/ui-kit/ydsz-ui';
</script>
```

## 基础用法

:::code-group

```vue [Basic]
<script setup lang="ts">
import { ref } from 'vue';
import { YdInput } from '@ydsz-core/ui-kit/ydsz-ui';

const value = ref('');
</script>

<template>
  <YdInput v-model="value" placeholder="请输入内容" />
</template>
```

```vue [With Default Value]
<script setup lang="ts">
import { ref } from 'vue';

const value = ref('默认内容');
</script>

<template>
  <YdInput
    v-model="value"
    placeholder="请输入内容"
  />
</template>
```

:::

## 禁用状态

通过 `disabled` 属性（原生 HTML disabled 属性）禁用输入框。

:::code-group

```vue [Disabled]
<template>
  <YdInput disabled value="禁用状态的输入框" />
</template>
```

:::

## 自定义样式

通过 `class` 属性传入自定义类名。

:::code-group

```vue [Custom Class]
<template>
  <YdInput
    class="max-w-sm"
    placeholder="最多 200 个字符"
  />
</template>
```

:::

## 表单场景

:::code-group

```vue [Form Complete]
<script setup lang="ts">
import { ref } from 'vue';
import { YdInput, YdButton } from '@ydsz-core/ui-kit/ydsz-ui';

const username = ref('');
const email = ref('');
</script>

<template>
  <form class="space-y-4 max-w-md" @submit.prevent>
    <div class="space-y-1">
      <label class="text-sm font-medium">用户名</label>
      <YdInput v-model="username" placeholder="请输入用户名" />
    </div>
    <div class="space-y-1">
      <label class="text-sm font-medium">邮箱</label>
      <YdInput v-model="email" placeholder="请输入邮箱地址" />
    </div>
    <YdButton type="submit">提交</YdButton>
  </form>
</template>
```

:::

## API

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `string \| number` | `undefined` | 输入框的值（受控模式），通过 `v-model` 绑定 |
| `defaultValue` | `string \| number` | `undefined` | 非受控模式下的默认值 |
| `class` | `any` | `undefined` | 自定义类名，通过 `cn()` 与默认样式合并 |

### Events

| 事件名 | 参数类型 | 说明 |
|--------|---------|------|
| `update:modelValue` | `string \| number` | 输入值变化时触发，用于 `v-model` 绑定 |

### 原生 Input 属性

除上述自定义 Props 外，`YdInput` 还支持所有标准 HTML `<input>` 属性（`placeholder`、`disabled`、`readonly`、`type`、`maxlength`、`autocomplete` 等），会透传至底层 `<input>` 元素。

### Slots

无具名插槽，组件为单标签自闭合。

## 样式细节

| 状态 | 样式效果 |
|------|---------|
| 默认 | `border-input` 边框，透明背景 |
| hover | `border-border-strong` 边框加深 |
| focus | 2px ring + 2px offset（聚焦环） |
| disabled | `not-allowed` 光标 + 50% 透明度 |
| placeholder | 使用 `text-muted-foreground` 颜色 |

## 与 YdTextarea 的区别

| 对比项 | YdInput | YdTextarea |
|--------|---------|------------|
| 渲染元素 | `<input>` | `<textarea>` |
| 行数 | 单行 | 多行 |
| 自动撑高 | 否 | 是 |
| 适用场景 | 短文本、搜索框 | 长文本、备注、描述 |
