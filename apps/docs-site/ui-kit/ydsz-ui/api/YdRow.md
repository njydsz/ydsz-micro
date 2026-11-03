# YdRow

> 源文件：`comm\@core\ui-kit\ydsz-ui\src\components\layout\YdRow.vue`

## Props

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `gutter` | `number | number[]` | 否 | - | 栅格间隙（像素）—— 同时设置横向和纵向 gutter |
| `xGutter` | `number` | 否 | - | 水平间隙（像素） |
| `yGutter` | `number` | 否 | - | 垂直间隙（像素） |
| `type` | `'flex' | 'grid'` | 否 | - | 布局模式 |
| `justify` | `'start' | 'end' | 'center' | 'space-around' | 'space-between'` | 否 | - | flex 模式下主轴对齐方式 |
| `align` | `'top' | 'middle' | 'bottom'` | 否 | - | flex 模式下交叉轴对齐方式 |
| `cols` | `number` | 否 | - | 最大列数（默认 24） |
| `class` | `HTMLAttributes['class']` | 否 | - | 自定义 class |
