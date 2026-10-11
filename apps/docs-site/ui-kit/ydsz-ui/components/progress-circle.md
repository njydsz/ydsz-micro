# YdProgressCircle — 圆形进度环

> SVG 双 circle 实现的圆形进度环。通过 stroke-dasharray / stroke-dashoffset 完成填充长度的可动画控制，支持中心文本与进度仪表盘变体。

## API 一览

### YdProgressCircle 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `number` | `0` | **必填**，当前进度值（0-100） |
| `size` | `number` | `80` | SVG 画布尺寸（px） |
| `strokeWidth` | `number` | `6` | 线条宽度（px） |
| `color` | `string` | `'rgb(var(--primary))'` | 指示器颜色（CSS 颜色值） |
| `trackColor` | `string` | `'rgba(var(--primary), 0.15)'` | 轨道颜色 |
| `showInfo` | `boolean` | `true` | 是否在中心显示百分比文本 |
| `class` | `any` | — | 自定义类名 |

### YdProgressDashboard 属性

> 半圆仪表盘变体，支持 `startAngle`、`endAngle` 等配置。

---

## 典型用法

### 基础用法 — 带百分比文本的进度环

:::demo 展示三个不同进度的圆形进度环，自动钳制到 0-100 范围。

```vue
<script setup>
import { ref, onMounted } from 'vue'

const uploadProgress = ref(0)

// 模拟上传进度
onMounted(() => {
  const timer = setInterval(() => {
    uploadProgress.value = Math.min(100, uploadProgress.value + Math.random() * 15)
    if (uploadProgress.value >= 100) clearInterval(timer)
  }, 500)
})
</script>

<template>
  <div class="flex items-center gap-8">
    <!-- 固定进度 -->
    <div class="flex flex-col items-center gap-2">
      <YdProgressCircle :value="65" :size="80" :stroke-width="6" color="#3b82f6" />
      <span class="text-xs text-neutral-500">65%</span>
    </div>

    <!-- 动态进度 -->
    <div class="flex flex-col items-center gap-2">
      <YdProgressCircle
        :value="uploadProgress"
        :size="80"
        :stroke-width="6"
        color="#10b981"
      />
      <span class="text-xs text-neutral-500">上传中</span>
    </div>

    <!-- 完成 -->
    <div class="flex flex-col items-center gap-2">
      <YdProgressCircle :value="100" :size="80" :stroke-width="6" color="#22c55e" />
      <span class="text-xs text-neutral-500">完成</span>
    </div>
  </div>
</template>
```

:::

### 变体 — 进度仪表盘

:::demo 使用 YdProgressDashboard 半圆仪表盘展示系统负载指标。

```vue
<script setup>
import { ref } from 'vue'

const cpuUsage = ref(72)
const memoryUsage = ref(88)
const diskUsage = ref(45)
</script>

<template>
  <div class="grid grid-cols-3 gap-6">
    <div class="flex flex-col items-center gap-2">
      <YdProgressCircle
        :value="cpuUsage"
        :size="120"
        :stroke-width="10"
        color="#f59e0b"
        track-color="rgba(245, 158, 11, 0.15)"
      />
      <span class="text-sm font-medium">CPU</span>
      <span class="text-xs text-neutral-500">{{ cpuUsage }}%</span>
    </div>
    <div class="flex flex-col items-center gap-2">
      <YdProgressCircle
        :value="memoryUsage"
        :size="120"
        :stroke-width="10"
        color="#ef4444"
        track-color="rgba(239, 68, 68, 0.15)"
      />
      <span class="text-sm font-medium">内存</span>
      <span class="text-xs text-neutral-500">{{ memoryUsage }}%</span>
    </div>
    <div class="flex flex-col items-center gap-2">
      <YdProgressCircle
        :value="diskUsage"
        :size="120"
        :stroke-width="10"
        color="#3b82f6"
        track-color="rgba(59, 130, 246, 0.15)"
      />
      <span class="text-sm font-medium">磁盘</span>
      <span class="text-xs text-neutral-500">{{ diskUsage }}%</span>
    </div>
  </div>
</template>
```

:::

### 真实业务场景 — 任务进度卡片（带操作按钮）

:::demo 数据看板中展示任务完成进度，中心区域显示具体统计数字，下方提供操作按钮。

```vue
<script setup>
import { ref, computed } from 'vue'

const tasks = ref([
  { id: 1, name: '待办事项', value: 35, color: '#3b82f6', icon: '📋', total: 120 },
  { id: 2, name: '进行中', value: 68, color: '#f59e0b', icon: '⚡', total: 45 },
  { id: 3, name: '已验收', value: 92, color: '#22c55e', icon: '✅', total: 200 },
  { id: 4, name: '已驳回', value: 15, color: '#ef4444', icon: '❌', total: 18 },
])

const selectedTask = ref(null)
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <div
      v-for="task in tasks"
      :key="task.id"
      class="flex flex-col items-center gap-3 rounded-lg border p-4 transition-shadow hover:shadow-md"
    >
      <div class="text-2xl">{{ task.icon }}</div>
      <YdProgressCircle
        :value="task.value"
        :size="90"
        :stroke-width="7"
        :color="task.color"
        :track-color="task.color + '20'"
      />
      <div class="text-center">
        <p class="text-sm font-medium">{{ task.name }}</p>
        <p class="text-xs text-neutral-500">共 {{ task.total }} 项</p>
      </div>
      <YdButton
        variant="outline"
        size="xs"
        class="w-full"
        @click="selectedTask = task"
      >
        查看详情
      </YdButton>
    </div>
  </div>
</template>
```

:::
