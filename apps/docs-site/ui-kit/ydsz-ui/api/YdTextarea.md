# YdTextarea

字符计数

> 源文件：`comm\@core\ui-kit\ydsz-ui\src\components\textarea\YdTextarea.vue`

## Props

| 属性           | 类型             | 必填            | 默认值 | 说明             |
| -------------- | ---------------- | --------------- | ------ | ---------------- |
| `class`        | `ClassValue`     | 否              | -      | -                |
| `defaultValue` | `number          | string`         | 否     | -                | -                                                  |
| `modelValue`   | `number          | string`         | 否     | -                | -                                                  |
| `autosize`     | `boolean         | AutosizeConfig` | 否     | -                | 自动增高：true 开启默认配置，或传入 AutosizeConfig |
| `resize`       | `TextareaResize` | 否              | -      | 拉伸控制         |
| `placeholder`  | `string`         | 否              | -      | 占位符           |
| `maxlength`    | `number`         | 否              | -      | 最大字符数       |
| `isShowCount`  | `boolean`        | 否              | -      | 是否显示字数统计 |
| `disabled`     | `boolean`        | 否              | -      | 禁用             |
| `readonly`     | `boolean`        | 否              | -      | 只读             |

## Emits

| 事件                | 参数             | 说明    |
| ------------------- | ---------------- | ------- |
| `update:modelValue` | `payload: number | string` | -   |
