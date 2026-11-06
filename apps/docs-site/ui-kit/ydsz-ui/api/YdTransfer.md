# YdTransfer

左侧：可选列表

> 源文件：`comm\@core\ui-kit\ydsz-ui\src\components\transfer\YdTransfer.vue`

## Props

| 属性               | 类型             | 必填 | 默认值 | 说明                  |
| ------------------ | ---------------- | ---- | ------ | --------------------- |
| `class`            | `any`            | 否   | -      | 自定义类名            |
| `disabled`         | `boolean`        | 否   | -      | 是否禁用全部交互      |
| `dataSource`       | `TransferItem[]` | 是   | -      | 数据源                |
| `notFoundContent`  | `string`         | 否   | -      | 无数据时左侧提示文案  |
| `placeholder`      | `string`         | 否   | -      | 搜索占位符            |
| `selectedTitle`    | `string`         | 否   | -      | 右侧标题              |
| `title`            | `string`         | 否   | -      | 左侧标题              |
| `value`            | `string[]`       | 否   | -      | 已选 key 集合（受控） |
| `virtualThreshold` | `number`         | 否   | -      | -                     |
