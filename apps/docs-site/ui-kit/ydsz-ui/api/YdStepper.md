# YdStepper

========== 步骤条头部 ==========

> 源文件：`comm\@core\ui-kit\ydsz-ui\src\components\stepper\YdStepper.vue`

## Props

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `size` | `StepperSize` | 否 | - | 尺寸 |
| `steps` | `StepItem[]` | 是 | - | 步骤定义列表 |
| `defaultStep` | `number` | 否 | - | 初始激活步骤索引 |
| `variant` | `StepperVariant` | 否 | - | 外观样式：'default'（标准）| 'dot' 点状 |
| `orientation` | `StepperOrientation` | 否 | - | 方向 |
| `finishIcon` | `string | Component` | 否 | - | 完成图标 |
