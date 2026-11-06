# YdDescriptions

描述列表组件：以网格布局展示多个「标签 — 文本」字段对， 用于详情页、审计记录等场景的结构化信息展示。

> 源文件：`comm\@core\ui-kit\ydsz-ui\src\components\descriptions\YdDescriptions.vue`

## Props

| 属性     | 类型               | 必填 | 默认值 | 说明                              |
| -------- | ------------------ | ---- | ------ | --------------------------------- |
| `class`  | `ClassValue`       | 否   | -      | -                                 |
| `column` | `number`           | 否   | -      | 每行展示的字段数，默认 3          |
| `size`   | `DescriptionsSize` | 否   | -      | 尺寸变体：default / small / large |
| `border` | `boolean`          | 否   | -      | 是否显示边框与分割线              |
| `title`  | `string`           | 否   | -      | 标题（可选）                      |
