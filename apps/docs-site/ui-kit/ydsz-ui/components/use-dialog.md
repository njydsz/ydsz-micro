# useDialog — 命令式对话框

> 在任意 JS/TS 上下文中以 Promise 方式调用对话框。基于 Radix Vue dialog anatomy 的命令式封装，支持阻塞等待用户选择、自定义内容组件和按钮组。对标 ANT DynamicDialog / EP ElMessageBox.confirm。

## API 一览

### useDialog(options)

```typescript
function useDialog(options: DialogOptions): DialogInstance
```

**参数 — DialogOptions：**

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | — | 标题 |
| `description` | `string` | — | 描述文本 |
| `component` | `Component` | — | 内容组件（任意 Vue 组件） |
| `componentProps` | `Record<string, unknown>` | — | 内容组件的 props |
| `actions` | `DialogAction[]` | — | 自定义底部按钮组，覆盖默认 confirm/cancel |
| `confirmText` | `string` | `'确定'` | 确认按钮文字 |
| `cancelText` | `string` | `'取消'` | 取消按钮文字 |
| `width` | `string \| number` | `'28rem'` | 宽度 |
| `closeOnClickOutside` | `boolean` | `true` | 点击遮罩关闭 |
| `closeOnEsc` | `boolean` | `true` | ESC 关闭 |

**返回值 — DialogInstance：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `promise` | `Promise<boolean>` | 用户确认时 resolve(true)，取消/关闭时 resolve(false) |
| `close` | `() => void` | 手动关闭对话框 |

### DialogAction 类型

```typescript
interface DialogAction {
  label: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
  handler?: () => boolean | void | Promise<boolean | void>
}
```

### closeAllDialogs()

```typescript
function closeAllDialogs(): void
```

关闭所有已打开的命令式对话框。

---

## 典型用法

### 基础用法 — 确认删除

:::demo 最简单的确认对话框，await 阻塞等待用户选择。

```vue
<script setup>
import { useDialog } from '@ydsz-core/ydsz-ui'

async function handleDelete(itemName) {
  const ok = await useDialog({
    title: '确认删除',
    description: `确定要删除「${itemName}」吗？此操作不可恢复。`,
    confirmText: '确认删除',
    cancelText: '取消',
  })

  if (ok) {
    console.log('执行删除操作')
    // await api.deleteItem(itemName)
  } else {
    console.log('用户取消删除')
  }
}
</script>

<template>
  <div class="space-y-2">
    <YdButton variant="destructive" size="sm" @click="handleDelete('用户文档.pdf')">
      删除文件
    </YdButton>
  </div>
</template>
```

:::

### 变体 — 自定义按钮组

:::demo actions 完全覆盖默认按钮，支持多个自定义按钮和 handler 回调。

```vue
<script setup>
import { useDialog } from '@ydsz-core/ydsz-ui'

async function handleSaveDoc(docName) {
  const result = await useDialog({
    title: '保存文档',
    description: `文档「${docName}」有未保存的更改，请选择一个操作：`,
    actions: [
      {
        label: '保存',
        variant: 'default',
        handler: () => {
          console.log('执行保存')
          // await api.saveDoc(docName)
        },
      },
      {
        label: '不保存',
        variant: 'ghost',
        handler: () => {
          console.log('放弃更改')
        },
      },
      {
        label: '取消',
        variant: 'outline',
        // 无 handler = 直接关闭
      },
    ],
  })
}
</script>

<template>
  <div class="space-y-2">
    <YdButton size="sm" @click="handleSaveDoc('项目方案.docx')">
      关闭文档
    </YdButton>
  </div>
</template>
```

:::

### 真实业务场景 — 异步等待表单提交

:::demo 使用 component 属性嵌入表单组件，handler 中执行异步操作（如 API 调用），返回 false 时不关闭对话框，提交成功后关闭。

```vue
<script setup>
import { ref, h } from 'vue'
import { useDialog } from '@ydsz-core/ydsz-ui'

const formRef = ref(null)

// 创建一个简单的表单组件（内联 render 函数）
const UserForm = {
  props: ['initialName'],
  emits: ['update:valid'],
  setup(props, { emit }) {
    const name = ref(props.initialName || '')
    const email = ref('')

    function validate() {
      return !!(name.value && email.value.includes('@'))
    }

    return () => h('div', { class: 'space-y-3' }, [
      h('input', {
        class: 'w-full h-9 rounded border px-3 text-sm',
        placeholder: '姓名',
        value: name.value,
        onInput: (e) => { name.value = e.target.value; emit('update:valid', validate()) },
      }),
      h('input', {
        class: 'w-full h-9 rounded border px-3 text-sm',
        placeholder: '邮箱',
        value: email.value,
        onInput: (e) => { email.value = e.target.value; emit('update:valid', validate()) },
      }),
    ])
  },
}

async function handleCreateUser() {
  const isFormValid = ref(false)

  const ok = await useDialog({
    title: '新建用户',
    component: UserForm,
    componentProps: { initialName: '' },
    width: '24rem',
    confirmText: '创建',
    cancelText: '取消',
    closeOnEsc: true,
  })

  if (ok) {
    console.log('执行创建用户 API 调用')
    // await api.createUser(formData)
  }
}

// 场景2：异步任务中显示加载中的对话框
async function handleBatchExport() {
  const dialog = useDialog({
    title: '正在导出数据',
    description: '请稍候，正在生成 Excel 文件...',
    closeOnClickOutside: false,
    closeOnEsc: false,
    actions: [
      { label: '取消导出', variant: 'outline' },
    ],
  })

  // 模拟异步导出
  await new Promise(r => setTimeout(r, 2000))

  dialog.close()

  // 导出完成后再弹确认
  await useDialog({
    title: '导出完成',
    description: '文件已生成，是否立即下载？',
    confirmText: '下载',
    cancelText: '稍后',
  })
}

// 场景3：危险操作确认
async function handleBatchDelete(count) {
  const ok = await useDialog({
    title: '批量删除确认',
    description: `即将删除 ${count} 条记录，此操作不可恢复！建议在删除前先导出备份。`,
    confirmText: '确认批量删除',
    cancelText: '取消',
    actions: [
      { label: '确认删除', variant: 'destructive', handler: () => console.log('执行批量删除') },
      { label: '导出后删除', variant: 'default', handler: () => console.log('先导出再删除') },
      { label: '取消', variant: 'outline' },
    ],
  })
}
</script>

<template>
  <div class="flex gap-2">
    <YdButton size="sm" @click="handleCreateUser">新建用户</YdButton>
    <YdButton size="sm" variant="outline" @click="handleBatchExport">导出数据</YdButton>
    <YdButton size="sm" variant="destructive" @click="handleBatchDelete(25)">批量删除</YdButton>
  </div>
</template>
```

:::
