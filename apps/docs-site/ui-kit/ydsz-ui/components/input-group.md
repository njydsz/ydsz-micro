# YdInputGroup — 前缀/后缀输入框组合

> 将输入框、按钮、标签、选择器组合为一行的 flex 容器。支持 compact 紧凑模式与尺寸切换。

## API 一览

### YdInputGroup 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `compact` | `boolean` | `false` | 紧凑模式：相邻元素共享边框，类似 ANT compact |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 尺寸档位，影响内部 input 高度与字号 |
| `class` | `any` | — | 自定义类名 |

### YdInputAddon 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `isPlain` | `boolean` | `false` | 裸边模式：去除内边距，紧贴输入框 |
| `class` | `any` | — | 自定义类名 |

### 子组件

- `YdInputGroup` — flex 容器
- `YdInputAddon` — 前后缀内嵌元素（标签、按钮、选择器）

---

## 典型用法

### 基础用法 — 前后缀组合

:::demo 前后缀输入框：URL 输入框前后分别加入协议和域名后缀。

```vue
<script setup>
import { ref } from 'vue'

const url = ref('')
</script>

<template>
  <YdInputGroup>
    <YdInputAddon>https://</YdInputAddon>
    <YdInput v-model="url" placeholder="请输入域名" />
    <YdInputAddon>.com</YdInputAddon>
  </YdInputGroup>
</template>
```

:::

### 变体 — compact 紧凑搜索栏

:::demo compact 模式下相邻元素共享边框、圆角合并，适合搜索栏场景。

```vue
<script setup>
import { ref } from 'vue'

const keyword = ref('')
const category = ref('article')

const categories = [
  { label: '文章', value: 'article' },
  { label: '用户', value: 'user' },
  { label: '标签', value: 'tag' },
]

function handleSearch() {
  console.log('搜索：', category.value, keyword.value)
}
</script>

<template>
  <YdInputGroup compact class="max-w-md">
    <YdSelect v-model="category" class="w-24">
      <YdSelectTrigger class="rounded-r-none border-r-0">
        {{ categories.find(c => c.value === category)?.label }}
      </YdSelectTrigger>
      <YdSelectContent>
        <YdSelectItem
          v-for="opt in categories"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </YdSelectItem>
      </YdSelectContent>
    </YdSelect>
    <YdInput
      v-model="keyword"
      placeholder="搜索文章、用户、标签..."
      class="flex-1 rounded-none"
    />
    <YdButton variant="default" class="rounded-l-none" @click="handleSearch">
      搜索
    </YdButton>
  </YdInputGroup>
</template>
```

:::

### 真实业务场景 — 带单位的数字输入

:::demo 价格、数量等数字输入框前后添加单位标识，结合 YdInputNumber 使用。

```vue
<script setup>
import { ref } from 'vue'

const price = ref(0)
const quantity = ref(1)
const discount = ref(100)
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <!-- 单价 -->
    <div>
      <label class="mb-1 block text-sm text-neutral-600">单价（元）</label>
      <YdInputGroup size="md">
        <YdInputAddon isPlain>¥</YdInputAddon>
        <YdInputNumber
          v-model="price"
          :min="0"
          :precision="2"
          placeholder="0.00"
          class="text-right"
        />
        <YdInputAddon>/ 件</YdInputAddon>
      </YdInputGroup>
    </div>

    <!-- 数量 -->
    <div>
      <label class="mb-1 block text-sm text-neutral-600">数量</label>
      <YdInputGroup size="md">
        <YdInputNumber
          v-model="quantity"
          :min="1"
          :max="9999"
          placeholder="1"
          class="text-center"
        />
        <YdInputAddon>件</YdInputAddon>
      </YdInputGroup>
    </div>

    <!-- 折扣 -->
    <div>
      <label class="mb-1 block text-sm text-neutral-600">折扣</label>
      <YdInputGroup size="md">
        <YdInputNumber
          v-model="discount"
          :min="0"
          :max="100"
          placeholder="100"
          class="text-center"
        />
        <YdInputAddon>%</YdInputAddon>
      </YdInputGroup>
    </div>
  </div>
</template>
```

:::
