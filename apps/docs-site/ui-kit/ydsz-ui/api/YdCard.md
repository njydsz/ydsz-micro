# YdCard

卡片容器：提供统一的圆角、边框、阴影与背景。 纯展示容器，不包装 radix 组件；hoverable 开启时叠加悬停反馈，用于可点击的卡片。

> 源文件：`comm\@core\ui-kit\ydsz-ui\src\components\card\YdCard.vue`

## Props

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `class` | `ClassValue` | 否 | - | - |
| `hoverable` | `boolean` | 否 | - | - |
| `shadow` | `'never' | 'always' | 'hover'` | 否 | - | 阴影变体：never / always / hover（默认 always） |
