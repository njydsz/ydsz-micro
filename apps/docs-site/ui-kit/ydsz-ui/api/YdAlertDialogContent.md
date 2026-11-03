# YdAlertDialogContent

确认对话框的内容容器：负责 Portal 挂载、遮罩、进出场动画与 opened / closed / close 事件。 modal（默认 true）决定遮罩是否渲染，也决定是否锁滚动；

> 源文件：`comm\@core\ui-kit\ydsz-ui\src\components\alert-dialog\YdAlertDialogContent.vue`

## Props

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `centered` | `boolean` | 否 | - | - |
| `class` | `ClassType` | 否 | - | - |
| `modal` | `boolean` | 否 | - | - |
| `open` | `boolean` | 否 | - | - |
| `overlayBlur` | `number` | 否 | - | - |
| `zIndex` | `number` | 否 | - | - |

## Expose

| 方法/属性 | 类型 | 说明 |
|-----------|------|------|
| `getContentRef` | `() => contentRef.value,` | - |
