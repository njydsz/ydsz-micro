# YdTagCheckable

可选标签 —— 支持 v-model:checked 双向绑定。 用法：

> 源文件：`comm\@core\ui-kit\ydsz-ui\src\components\tag\YdTagCheckable.vue`

## Props

| 属性      | 类型                      | 必填      | 默认值    | 说明         |
| --------- | ------------------------- | --------- | --------- | ------------ |
| `checked` | `boolean`                 | 否        | -         | 是否选中     |
| `variant` | `'default'                | 'primary' | 'success' | 'warning'    | 'destructive' | 'info'` | 否  | -   | 标签变体样式 |
| `class`   | `HTMLAttributes['class']` | 否        | -         | 自定义 class |

## Emits

| 事件             | 参数             | 说明 |
| ---------------- | ---------------- | ---- |
| `update:checked` | `value: boolean` | -    |
| `change`         | `value: boolean` | -    |
