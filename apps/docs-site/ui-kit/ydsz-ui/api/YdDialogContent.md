# YdDialogContent

> 源文件：`comm\@core\ui-kit\ydsz-ui\src\components\dialog\YdDialogContent.vue`

## Props

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `animationType` | `'scale' | 'slide'` | 否 | - | - |
| `appendTo` | `HTMLElement | string` | 否 | - | - |
| `class` | `ClassType` | 否 | - | - |
| `closeClass` | `ClassType` | 否 | - | - |
| `closeOnOverlayClick` | `boolean` | 否 | - | 点击遮罩是否关闭弹窗；置 false 后点击遮罩不关闭 |
| `closeOnEsc` | `boolean` | 否 | - | ESC 键是否关闭弹窗；置 false 后 ESC 不关闭 |
| `closeDisabled` | `boolean` | 否 | - | - |
| `modal` | `boolean` | 否 | - | - |
| `open` | `boolean` | 否 | - | - |
| `overlayBlur` | `number` | 否 | - | - |
| `showClose` | `boolean` | 否 | - | 是否展示右上角关闭按钮 |
| `zIndex` | `number` | 否 | - | - |

## Expose

| 方法/属性 | 类型 | 说明 |
|-----------|------|------|
| `getContentRef` | `() => contentRef.value,` | - |
