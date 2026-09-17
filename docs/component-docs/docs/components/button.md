# Button 按钮

按钮用于触发一个操作或行为，是用户与系统交互的核心入口。

## 设计要点

- 基于 Radix Vue `Primitive` 实现，支持 `as` / `asChild` 将样式套到任意元素
- 视觉风格通过 `class-variance-authority`（cva）配置，`variant` 控制外观，`size` 控制尺寸
- 同一页面区域内应只有一个 `default` 按钮（主操作），避免焦点分散

## 引入

```vue
<script setup lang="ts">
import { YdButton } from '@ydsz-core/ui-kit/ydsz-ui';
</script>
```

## 基础用法

:::code-group

```vue [Primary]
<template>
  <div class="flex gap-2">
    <YdButton>主按钮</YdButton>
    <YdButton variant="secondary">次按钮</YdButton>
    <YdButton variant="outline">线框按钮</YdButton>
  </div>
</template>
```

```vue [All Variants]
<template>
  <div class="flex flex-wrap gap-2">
    <YdButton variant="default">Default</YdButton>
    <YdButton variant="secondary">Secondary</YdButton>
    <YdButton variant="outline">Outline</YdButton>
    <YdButton variant="ghost">Ghost</YdButton>
    <YdButton variant="link">Link</YdButton>
    <YdButton variant="destructive">Destructive</YdButton>
    <YdButton variant="heavy">Heavy</YdButton>
    <YdButton variant="subtle">Subtle</YdButton>
  </div>
</template>
```

:::

## 尺寸

:::code-group

```vue [Sizes]
<template>
  <div class="flex items-center gap-2">
    <YdButton size="xs">极小</YdButton>
    <YdButton size="sm">小</YdButton>
    <YdButton size="default">默认</YdButton>
    <YdButton size="lg">大</YdButton>
    <YdButton size="xl">特大</YdButton>
  </div>
</template>
```

:::

## 加载中

通过 `loading` 属性让按钮进入加载状态，此时按钮自动禁用并显示旋转动效。

:::code-group

```vue [Loading]
<template>
  <div class="flex gap-2">
    <YdButton loading>提交中...</YdButton>
    <YdButton variant="secondary" loading>保存中...</YdButton>
    <YdButton variant="outline" loading>
      <template #default>处理中</template>
    </YdButton>
  </div>
</template>
```

:::

## 图标按钮

`size="icon"` 配合 `variant="icon"` 可生成正方形图标按钮；同时可使用 `loading` 属性显示加载态。

:::code-group

```vue [Icon Button]
<template>
  <div class="flex gap-2">
    <YdButton size="icon" variant="icon">
      <!-- 放置图标组件 -->
      <span>+</span>
    </YdButton>
    <YdButton size="icon" variant="outline">
      <span>⚙</span>
    </YdButton>
  </div>
</template>
```

:::

## 链接跳转

通过 `as` 属性将按钮渲染为 `RouterLink` 或其他组件，保留按钮样式的同时具备导航能力。

:::code-group

```vue [As Link]
<template>
  <YdButton as="a" href="/dashboard" variant="link">
    前往仪表盘
  </YdButton>
</template>
```

:::

## API

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `as` | `string` | `'button'` | 渲染的目标 HTML 标签或 Vue 组件，如 `'a'`、`RouterLink` |
| `asChild` | `boolean` | `false` | 跳过自身渲染，将属性与事件透传至子元素 |
| `variant` | `'default' \| 'destructive' \| 'ghost' \| 'heavy' \| 'icon' \| 'link' \| 'outline' \| 'secondary' \| 'subtle'` | `'default'` | 视觉风格变体 |
| `size` | `'default' \| 'icon' \| 'lg' \| 'sm' \| 'xl' \| 'xs'` | `'default'` | 按钮尺寸 |
| `loading` | `boolean` | `false` | 加载状态：禁用按钮并显示旋转动效 |
| `class` | `string \| Record<string,boolean> \| Array` | `''` | 自定义类名，通过 `cn()` 与默认变体合并 |

### Events

继承自 Radix Vue `Primitive`，支持原生 `button` 的所有事件（`click`、`focus` 等）。

### Slots

| 插槽 | 说明 |
|------|------|
| `default` | 按钮内容，可包含文本或图标 |

## 样式变体参考

| variant | 样式效果 | 使用场景 |
|---------|---------|---------|
| `default` | 蓝色实心背景 + 白色文字 | 主操作、提交 |
| `secondary` | 浅灰背景 + 深色文字 | 次要按钮 |
| `outline` | 透明背景 + 边框 | 取消、返回 |
| `ghost` | 透明背景，hover 显浅灰 | 工具栏按钮 |
| `link` | 无边框 + 下划线 | 文本链接 |
| `destructive` | 红色实心背景 | 删除、危险操作 |
| `heavy` | 深色悬停背景 | 强调但非主操作 |
| `subtle` | 品牌色浅色背景 | 弱化的强调操作 |

| size | 高度 | 内边距 | 字号 |
|------|------|--------|------|
| `xs` | 28px (w-7 h-7) | px-1 | 12px |
| `sm` | 32px (h-8) | px-2.5 | 12px |
| `default` | 36px (h-9) | px-4 py-2 | 14px |
| `lg` | 40px (h-10) | px-5 | 16px |
| `xl` | 44px (h-11) | px-6 | 16px |
| `icon` | 32px (size-8) | px-1 | 18px |
