# YdDatePicker

触发器区域

> 源文件：`comm\@core\ui-kit\ydsz-ui\src\components\date-picker\YdDatePicker.vue`

## Props

| 属性          | 类型                   | 必填 | 默认值 | 说明 |
| ------------- | ---------------------- | ---- | ------ | ---- |
| `class`       | `any`                  | 否   | -      | -    |
| `disabled`    | `boolean`              | 否   | -      | -    |
| `modelValue`  | `DatePickerValue`      | 否   | -      | -    |
| `placeholder` | `string`               | 否   | -      | -    |
| `type`        | `DatePickerType`       | 否   | -      | -    |
| `shortcuts`   | `DatePickerShortcut[]` | 否   | -      | -    |

## Emits

| 事件                | 参数                    | 说明       |
| ------------------- | ----------------------- | ---------- |
| `update:modelValue` | `value: DatePickerValue | undefined` | -   |
| `change`            | `value: DatePickerValue | undefined` | -   |
