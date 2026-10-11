# YdInputMask — 格式化输入框

> 通过掩码模板约束输入格式。`9`=数字、`a`=字母、`*=`字母数字，其余字符视为字面量自动插入。支持 unmask 纯值输出。

## API 一览

### YdInputMask 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `string` | — | 输入值（v-model） |
| `mask` | `string` | — | **必填**，掩码模板 |
| `unmask` | `boolean` | `false` | true 时传出去除掩码后的纯值 |
| `placeholderChar` | `string` | `'_'` | 占位符字符 |
| `autoClear` | `boolean` | `true` | 输入不完整时 blur 自动清空 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 尺寸 |
| `variant` | `'default' \| 'filled' \| 'underlined'` | `'default'` | 变体 |
| `placeholder` | `string` | — | 占位文本 |
| `disabled` | `boolean` | `false` | 禁用 |
| `readonly` | `boolean` | `false` | 只读 |

### 掩码字符含义

| 字符 | 含义 | 示例 |
|------|------|------|
| `9` | 数字（0-9） | `9999-99-99` → 日期格式 |
| `a` | 字母（A-Z/a-z） | `aaa-999` → 字母+数字 |
| `*` | 字母数字（A-Z/a-z/0-9） | `***-****` → 任意字符 |
| 其他 | 字面量自动插入 | `-`, `(`, `)`, `:` 等 |

### 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `complete` | `string` | 掩码填满时触发 |

---

## 典型用法

### 基础用法 — 手机号格式化

:::demo 中国大陆手机号 `999-9999-9999` 格式输入。

```vue
<script setup>
import { ref } from 'vue'

const phone = ref('')

function handleComplete(val) {
  console.log('手机号输入完成：', val)
}
</script>

<template>
  <div class="space-y-2">
    <YdInputMask
      v-model="phone"
      mask="999-9999-9999"
      placeholder="请输入手机号"
      size="md"
      @complete="handleComplete"
    />
    <p class="text-xs text-neutral-500">
      当前值：{{ phone || '—' }}
    </p>
  </div>
</template>
```

:::

### 变体 — 银行卡号格式化

:::demo 银行卡号按 4 位分段显示，并使用 underlined 变体以适配表单场景。

```vue
<script setup>
import { ref } from 'vue'

const cardNo = ref('')
const idCard = ref('')
const macAddress = ref('')
</script>

<template>
  <div class="space-y-4">
    <!-- 银行卡号 -->
    <div>
      <label class="mb-1 block text-sm font-medium">银行卡号</label>
      <YdInputMask
        v-model="cardNo"
        mask="9999-9999-9999-9999-999"
        variant="underlined"
        placeholder="____-____-____-____-___"
        size="lg"
        class="w-full font-mono tracking-wider"
      />
    </div>

    <!-- 身份证号 -->
    <div>
      <label class="mb-1 block text-sm font-medium">身份证号</label>
      <YdInputMask
        v-model="idCard"
        mask="999999-99999999-999*"
        variant="underlined"
        placeholder="______-________-___X"
        size="lg"
        class="w-full font-mono tracking-wider"
      />
    </div>

    <!-- MAC 地址 -->
    <div>
      <label class="mb-1 block text-sm font-medium">MAC 地址</label>
      <YdInputMask
        v-model="macAddress"
        mask="**:**:**:**:**:**"
        variant="underlined"
        placeholder="00:00:00:00:00:00"
        size="lg"
        class="w-full font-mono tracking-wider"
      />
    </div>
  </div>
</template>
```

:::

### 真实业务场景 — IP 地址 / 端口配置

:::demo 服务器配置表单中，IPv4 地址与端口号的格式化输入场景。支持 unmask 模式获取纯值提交给后端。

```vue
<script setup>
import { ref } from 'vue'

const server = ref({
  ip: '',
  port: '',
  subnet: '',
})

// 提交时获取无掩码纯值
function handleSubmit() {
  console.log('提交服务器配置：', { ...server.value })
}
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-base font-medium">服务器网络配置</h3>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <!-- IP 地址 -->
      <div>
        <label class="mb-1 block text-sm">IP 地址</label>
        <YdInputMask
          v-model="server.ip"
          mask="999.999.999.999"
          placeholder="192.168.1.100"
          size="md"
          class="font-mono"
        />
      </div>

      <!-- 端口 -->
      <div>
        <label class="mb-1 block text-sm">端口号</label>
        <YdInputMask
          v-model="server.port"
          mask="99999"
          placeholder="8080"
          size="md"
          class="font-mono"
        />
      </div>

      <!-- 子网掩码 -->
      <div>
        <label class="mb-1 block text-sm">子网掩码</label>
        <YdInputMask
          v-model="server.subnet"
          mask="999.999.999.999"
          placeholder="255.255.255.0"
          size="md"
          class="font-mono"
        />
      </div>
    </div>
    <YdButton size="sm" @click="handleSubmit">保存配置</YdButton>
  </div>
</template>
```

:::
