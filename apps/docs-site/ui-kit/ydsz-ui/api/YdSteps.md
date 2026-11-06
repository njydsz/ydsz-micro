# YdSteps

> 源文件：`comm\@core\ui-kit\ydsz-ui\src\components\steps\YdSteps.vue`

## Props

| 属性             | 类型          | 必填        | 默认值 | 说明                 |
| ---------------- | ------------- | ----------- | ------ | -------------------- |
| `class`          | `any`         | 否          | -      | 自定义类名           |
| `current`        | `number`      | 否          | -      | 当前激活步骤索引     |
| `labelPlacement` | `'horizontal' | 'vertical'` | 否     | -                    | 标签位置：vertical 垂直显示在右侧 / horizontal 显示在下方 |
| `steps`          | `StepItem[]`  | 是          | -      | 步骤定义列表         |
| `dot`            | `boolean`     | 否          | -      | 点状步骤样式         |
| `finishIcon`     | `string`      | 否          | -      | 完成步骤的自定义图标 |
