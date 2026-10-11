# YdEllipsis — 文本省略自适应

> 自动检测文字是否溢出容器：溢出时用 Tooltip 包裹显示全文，不溢出时纯文本展示。支持单行/多行省略与复制按钮。使用 ResizeObserver 在容器尺寸变化时重新检测。

## API 一览

### YdEllipsis 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `content` | `string` | — | **必填**，要显示的文本内容 |
| `lines` | `number` | `1` | 最大行数，1 = 单行省略 |
| `width` | `number \| string` | — | 容器宽度（不传则自动 fill parent） |
| `tooltip` | `boolean` | `true` | 是否显示 Tooltip |
| `placement` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'` | Tooltip 位置 |
| `copyable` | `boolean` | `false` | 是否带复制按钮 |
| `class` | `any` | — | 自定义类名 |

### 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `copy` | `text: string` | 点击复制按钮时触发 |

---

## 典型用法

### 基础用法 — 单行文本省略与 Tooltip

:::demo 容器宽度不足时自动省略并显示 Tooltip，hover 时展示全文。

```vue
<script setup>
const longText = '这是一段非常长的用户评论文本，包含了产品使用体验的详细描述。当容器宽度不够时，超出部分将被省略号截断，并在 hover 时通过 Tooltip 展示完整内容。'
</script>

<template>
  <div class="space-y-4">
    <!-- 自动宽度省略 -->
    <div class="w-64 rounded border p-3">
      <p class="text-sm text-neutral-500 mb-1">自动宽度：</p>
      <YdEllipsis :content="longText" />
    </div>

    <!-- 固定宽度省略 -->
    <div class="rounded border p-3">
      <p class="text-sm text-neutral-500 mb-1">固定宽度（300px）：</p>
      <YdEllipsis :content="longText" :width="300" />
    </div>

    <!-- 多行省略 -->
    <div class="rounded border p-3">
      <p class="text-sm text-neutral-500 mb-1">多行省略（3 行）：</p>
      <YdEllipsis :content="longText" :lines="3" :width="400" />
    </div>
  </div>
</template>
```

:::

### 变体 — 带复制按钮的省略

:::demo `copyable` 开启复制按钮，点击复制全文到剪贴板。

```vue
<script setup>
const configs = [
  { label: 'API Key', value: 'sk-ydsz-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
  { label: '数据库连接串', value: 'postgresql://admin:password123@db.ydsz.com:5432/production' },
  { label: 'Webhook URL', value: 'https://api.ydsz.com/v1/webhooks/callback?token=abc123def456' },
]

function handleCopy(text) {
  console.log('已复制：', text)
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="cfg in configs"
      :key="cfg.label"
      class="flex items-center gap-3 rounded bg-neutral-50 px-3 py-2"
    >
      <span class="shrink-0 text-xs text-neutral-500 w-24">{{ cfg.label }}</span>
      <YdEllipsis
        :content="cfg.value"
        copyable
        class="flex-1 font-mono text-xs"
        @copy="handleCopy"
      />
    </div>
  </div>
</template>
```

:::

### 真实业务场景 — 用户署名省略 + 表格单元格

:::demo 评论列表场景中，用户昵称、文章内容等可能超长，使用省略组件自适应显示。同时展示表格单元格中的省略用法。

```vue
<script setup>
const comments = [
  {
    user: '张三丰道长',
    avatar: '🧙',
    content: '这个组件库真的非常好用，特别是表单组件的设计理念和校验机制值得学习！强烈推荐大家试用一下，我已经在生产环境中使用了快半年了。',
    time: '2026-06-15 14:30',
  },
  {
    user: '李小明同学',
    avatar: '👨',
    content: '希望能增加更多图表相关的组件，比如雷达图、热力图等可视化元素。',
    time: '2026-06-15 15:22',
  },
  {
    user: '前端架构师-王永庆-workspace',
    avatar: '🧑',
    content: '我们团队正在从 Ant Design 迁移过来，目前遇到的唯一问题是文档中缺少一些复杂场景的示例代码。',
    time: '2026-06-16 09:10',
  },
]

const tableData = [
  { id: 1, name: '系统通知模板 - 订单支付成功', config: '{"trigger":"payment.success","channels":["sms","email"],"template":"您的订单{orderId}已支付成功，金额{amount}元，预计{deliveryTime}送达。"}' },
  { id: 2, name: '系统通知模板 - 密码重置', config: '{"trigger":"user.reset_password","channels":["email"],"template":"您的验证码是{code}，5分钟内有效。如非本人操作请忽略本邮件。"}' },
]
</script>

<template>
  <div class="space-y-4">
    <!-- 评论列表 -->
    <div class="space-y-3">
      <h4 class="text-sm font-medium">评论列表</h4>
      <div
        v-for="(c, i) in comments"
        :key="i"
        class="flex gap-3 rounded border p-3"
      >
        <span class="text-xl">{{ c.avatar }}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <YdEllipsis :content="c.user" class="text-sm font-medium" :width="120" />
            <span class="text-xs text-neutral-400">{{ c.time }}</span>
          </div>
          <YdEllipsis :content="c.content" :lines="2" class="text-sm text-neutral-600" />
        </div>
      </div>
    </div>

    <!-- 表格单元格省略 -->
    <div class="space-y-2">
      <h4 class="text-sm font-medium">配置项表格</h4>
      <YdTable :data="tableData" :striped="true">
        <YdTableColumn key="name" header="模板名称" :width="200">
          <template #cell="{ row }">
            <YdEllipsis :content="row.name" :width="180" />
          </template>
        </YdTableColumn>
        <YdTableColumn key="config" header="配置内容">
          <template #cell="{ row }">
            <YdEllipsis :content="row.config" copyable :lines="1" class="font-mono text-xs" />
          </template>
        </YdTableColumn>
      </YdTable>
    </div>
  </div>
</template>
```

:::
