# YdStepper — 多步骤向导

> 步骤条 + 内容面板 + 底部导航按钮的多步骤向导容器。支持异步校验、键盘导航、步骤状态自动推导。

## API 一览

### YdStepper 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `steps` | `StepItem[]` | — | **必填**，步骤定义列表 |
| `defaultStep` | `number` | `0` | 初始激活步骤索引 |
| `variant` | `'default' \| 'dot'` | `'default'` | 外观样式：标准 / 点状 |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | 方向 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 尺寸 |
| `finishIcon` | `string \| Component` | — | 完成步骤的自定义图标 |

### StepItem 类型

```typescript
interface StepItem {
  key: string
  title: string
  description?: string
  icon?: string | Component
  disabled?: boolean
  validate?: () => boolean | Promise<boolean>
}
```

### YdStepPanel 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | **必填**，匹配 StepItem.key |

### 双向绑定

| 模型 | 类型 | 说明 |
|------|------|------|
| `activeStep` | `number` | 当前激活步骤 v-model |

### 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `next` | `{ from: number; to: number }` | 点击下一步 |
| `prev` | `{ from: number; to: number }` | 点击上一步 |
| `finish` | `[]` | 完成所有步骤 |
| `change` | `{ index, step }` | 步骤切换 |

---

## 典型用法

### 基础用法 — 水平注册向导

:::demo 标准水平步骤条，包含三步注册流程：填写信息 → 验证邮箱 → 完成。

```vue
<script setup>
import { ref } from 'vue'

const activeStep = ref(0)

const steps = [
  { key: 'info', title: '填写信息', description: '请填写基础信息' },
  { key: 'verify', title: '验证邮箱', description: '查收验证码' },
  { key: 'done', title: '注册完成', description: '欢迎加入' },
]

const form = ref({ username: '', email: '', code: '' })

function validateStep0() {
  return !!(form.value.username && form.value.email)
}

function validateStep1() {
  return form.value.code.length === 6
}

const stepsWithValidation = steps.map((s, i) => ({
  ...s,
  validate: i === 0 ? validateStep0 : i === 1 ? validateStep1 : undefined,
}))
</script>

<template>
  <YdStepper
    v-model:activeStep="activeStep"
    :steps="stepsWithValidation"
  >
    <YdStepPanel name="info">
      <div class="space-y-4">
        <YdInput v-model="form.username" placeholder="用户名" />
        <YdInput v-model="form.email" placeholder="邮箱地址" type="email" />
      </div>
    </YdStepPanel>
    <YdStepPanel name="verify">
      <div class="space-y-4">
        <p class="text-sm text-neutral-500">
          验证码已发送至 {{ form.email || '未填写' }}
        </p>
        <YdInput v-model="form.code" placeholder="6 位验证码" maxlength="6" />
      </div>
    </YdStepPanel>
    <YdStepPanel name="done">
      <div class="text-center py-6">
        <div class="text-4xl mb-2">🎉</div>
        <p class="text-lg font-medium">注册成功！</p>
        <p class="text-sm text-neutral-500 mt-1">欢迎，{{ form.username }}</p>
      </div>
    </YdStepPanel>
  </YdStepper>
</template>
```

:::

### 变体 — 垂直配置流程

:::demo 垂直方向步骤条适合侧边栏布局，配合 dot 变体使界面更简洁。

```vue
<script setup>
import { ref } from 'vue'

const activeStep = ref(1)

const setupSteps = [
  { key: 'base', title: '基础配置', description: '应用名称与图标' },
  { key: 'permissions', title: '权限分配', description: '设置访问控制' },
  { key: 'notify', title: '通知设置', description: 'Webhook 与邮件' },
  { key: 'deploy', title: '发布部署', description: '确认并发布' },
]
</script>

<template>
  <div class="flex gap-6">
    <YdStepper
      v-model:activeStep="activeStep"
      :steps="setupSteps"
      orientation="vertical"
      variant="dot"
      class="flex-1"
    >
      <YdStepPanel name="base">
        <div class="space-y-3">
          <YdInput placeholder="应用名称" />
          <YdUpload accept="image/*" class="w-full">
            <YdButton variant="outline" size="sm">上传图标</YdButton>
          </YdUpload>
        </div>
      </YdStepPanel>
      <YdStepPanel name="permissions">
        <div class="space-y-2">
          <div v-for="perm in ['读取', '写入', '删除', '管理']" :key="perm" class="flex items-center gap-2">
            <YdCheckbox :id="perm" />
            <YdLabel :for="perm">{{ perm }}权限</YdLabel>
          </div>
        </div>
      </YdStepPanel>
      <YdStepPanel name="notify">
        <div class="space-y-3">
          <YdInput placeholder="Webhook URL" />
          <YdButton variant="outline" size="sm">测试通知</YdButton>
        </div>
      </YdStepPanel>
      <YdStepPanel name="deploy">
        <div class="rounded bg-neutral-50 p-3 text-sm text-neutral-600">
          请确认以上配置无误后点击发布。
        </div>
      </YdStepPanel>
    </YdStepper>
  </div>
</template>
```

:::

### 真实业务场景 — 表单分步提交

:::demo 用户注册场景中每步调用后端接口校验，校验通过才允许下一步。

```vue
<script setup>
import { ref } from 'vue'

const activeStep = ref(0)
const isValidating = ref(false)

const form = ref({
  phone: '',
  smsCode: '',
  password: '',
})

const steps = [
  { key: 'phone', title: '验证手机号', description: '输入手机号码' },
  { key: 'code', title: '短信验证', description: '输入 6 位验证码' },
  { key: 'password', title: '设置密码', description: '设置登录密码' },
  { key: 'success', title: '完成', description: '注册成功' },
]

// 模拟接口校验
async function checkPhone() {
  isValidating.value = true
  await new Promise(r => setTimeout(r, 800))
  isValidating.value = false
  return /^1\d{10}$/.test(form.value.phone)
}

async function checkSmsCode() {
  isValidating.value = true
  await new Promise(r => setTimeout(r, 600))
  isValidating.value = false
  return form.value.smsCode === '123456'
}

const stepsWithValidation = steps.map((s, i) => ({
  ...s,
  validate: i === 0 ? checkPhone : i === 1 ? checkSmsCode : undefined,
}))
</script>

<template>
  <YdStepper
    v-model:activeStep="activeStep"
    :steps="stepsWithValidation"
    class="max-w-lg"
  >
    <YdStepPanel name="phone">
      <div class="space-y-3">
        <label class="text-sm font-medium">手机号码</label>
        <YdInputGroup compact>
          <YdInputAddon>+86</YdInputAddon>
          <YdInput v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
        </YdInputGroup>
        <p v-if="isValidating" class="text-xs text-blue-500">正在验证手机号...</p>
      </div>
    </YdStepPanel>
    <YdStepPanel name="code">
      <div class="space-y-3">
        <label class="text-sm font-medium">短信验证码</label>
        <YdInput v-model="form.smsCode" placeholder="6 位验证码" maxlength="6" />
        <YdButton variant="link" size="sm">重新发送</YdButton>
      </div>
    </YdStepPanel>
    <YdStepPanel name="password">
      <div class="space-y-3">
        <label class="text-sm font-medium">登录密码</label>
        <YdInput type="password" v-model="form.password" placeholder="至少 8 位" />
      </div>
    </YdStepPanel>
    <YdStepPanel name="success">
      <div class="text-center py-4">
        <p class="text-lg">注册成功！已自动登录。</p>
      </div>
    </YdStepPanel>
  </YdStepper>
</template>
```

:::
