# YdToggleGroup

切换按钮组的容器：把 variant / size 通过 provide 下发给组内所有项。 走 provide 而不是逐个 prop 传递，是为了让调用方只在组上写一次尺寸与外观，

> 源文件：`comm\@core\ui-kit\ydsz-ui\src\components\toggle-group\YdToggleGroup.vue`

## Props

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `class` | `ClassValue` | 否 | - | - |
| `size` | `ToggleGroupVariants['size']` | 否 | - | - |
| `variant` | `ToggleGroupVariants['variant']` | 否 | - | - |
