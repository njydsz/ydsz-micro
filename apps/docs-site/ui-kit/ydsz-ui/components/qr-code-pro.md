# YdQrCodePro — 二维码生成

> 基于 Canvas / SVG 渲染的二维码组件。支持尺寸、纠错级别、颜色、边距等自定义配置，适用于链接分享、WiFi 配置、名片等场景。

## API 一览

### YdQrCode 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `string` | — | **必填**，二维码编码内容 |
| `size` | `number` | `160` | 尺寸（px） |
| `level` | `'H' \| 'L' \| 'M' \| 'Q'` | `'M'` | 纠错级别 |
| `bgColor` | `string` | `'#ffffff'` | 背景色 |
| `fgColor` | `string` | `'#000000'` | 前景色 |
| `includeMargin` | `boolean` | `false` | 是否包含边距 |
| `renderAs` | `'canvas' \| 'svg'` | `'canvas'` | 渲染方式 |
| `class` | `any` | — | 自定义类名 |

---

## 典型用法

### 基础用法 — 链接二维码

:::demo 将 URL 编码为二维码，支持点击分享链接。

```vue
<script setup>
import { ref } from 'vue'

const shareUrl = ref('https://github.com/ydsz-micro/platform')
const qrSize = ref(160)
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <YdQrCode
      :value="shareUrl"
      :size="qrSize"
      level="M"
      render-as="canvas"
      class="rounded border p-2 bg-white"
    />
    <p class="text-sm text-neutral-500 max-w-[200px] text-center truncate">
      扫描二维码访问链接
    </p>
    <div class="flex items-center gap-2">
      <span class="text-xs text-neutral-400">尺寸：</span>
      <YdButton size="xs" variant="outline" @click="qrSize = 120">小</YdButton>
      <YdButton size="xs" variant="outline" @click="qrSize = 160">中</YdButton>
      <YdButton size="xs" variant="outline" @click="qrSize = 200">大</YdButton>
    </div>
  </div>
</template>
```

:::

### 变体 — WiFi 分享二维码

:::demo 生成 WiFi 连接二维码，格式为 `WIFI:T:WPA;S:网络名;P:密码;;`，扫描后手机自动连接。

```vue
<script setup>
import { ref, computed } from 'vue'

const ssid = ref('YDSZ-Guest')
const password = ref('welcome2024')
const encryption = ref('WPA')

const wifiQrValue = computed(() =>
  `WIFI:T:${encryption.value};S:${ssid.value};P:${password.value};;`
)
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <YdQrCode
      :value="wifiQrValue"
      :size="180"
      level="H"
      bgColor="#f8fafc"
      fgColor="#1e293b"
      include-margin
      class="rounded-lg shadow-sm"
    />
    <div class="text-center space-y-1">
      <p class="text-sm font-medium">WiFi：{{ ssid }}</p>
      <p class="text-xs text-neutral-500">使用相机扫码即可自动连接</p>
    </div>
    <div class="flex gap-2">
      <YdButton size="sm" variant="outline" @click="console.log('已复制WiFi配置')">
        复制配置文本
      </YdButton>
      <YdButton size="sm" @click="console.log('已保存二维码')">
        保存二维码
      </YdButton>
    </div>
  </div>
</template>
```

:::

### 真实业务场景 — vCard 名片二维码

:::demo 生成包含联系人信息的 vCard 格式二维码，扫码后手机直接添加到联系人。

```vue
<script setup>
import { ref, computed } from 'vue'

const contact = ref({
  name: '张三',
  company: '有样式科技',
  title: '前端架构师',
  phone: '+86-138-0013-8000',
  email: 'zhangsan@ydsz.com',
  website: 'https://yzsz.com',
  address: '北京市海淀区中关村软件园',
})

const vcardValue = computed(() => `BEGIN:VCARD
VERSION:3.0
FN:${contact.value.name}
ORG:${contact.value.company}
TITLE:${contact.value.title}
TEL:${contact.value.phone}
EMAIL:${contact.value.email}
URL:${contact.value.website}
ADR:;;${contact.value.address};;;;
END:VCARD`)
</script>

<template>
  <div class="flex items-start gap-8">
    <!-- 二维码 -->
    <div class="flex flex-col items-center gap-3">
      <YdQrCode
        :value="vcardValue"
        :size="160"
        level="M"
        fgColor="#1e40af"
        bgColor="#eff6ff"
        include-margin
        class="rounded border border-blue-100 p-1"
      />
      <span class="text-xs text-neutral-500">扫码添加名片</span>
    </div>

    <!-- 联系人信息预览 -->
    <div class="space-y-2">
      <h4 class="text-base font-medium">{{ contact.name }}</h4>
      <p class="text-sm text-neutral-600">{{ contact.title }} @ {{ contact.company }}</p>
      <div class="space-y-1 text-xs text-neutral-500">
        <p>📞 {{ contact.phone }}</p>
        <p>📧 {{ contact.email }}</p>
        <p>🌐 {{ contact.website }}</p>
        <p>📍 {{ contact.address }}</p>
      </div>
    </div>
  </div>
</template>
```

:::
