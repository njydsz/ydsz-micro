# YdTabPane

便利性 wrapper：渲染为 YdTabsTrigger，label 和 name 只声明一次。推荐与 YdTabsContent 配对使用。

> 源文件：`comm\@core\ui-kit\ydsz-ui\src\components\tabs\YdTabPane.vue`

## Props

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `label` | `string` | 是 | - | 标签页显示文本 |
| `name` | `string` | 是 | - | 标签页唯一标识（与 YdTabsContent 的 value 配对） |
| `disabled` | `boolean` | 否 | - | 是否禁用 |
