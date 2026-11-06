# YdUploadItem

text 模式

> 源文件：`comm\@core\ui-kit\ydsz-ui\src\components\upload\YdUploadItem.vue`

## Props

| 属性        | 类型         | 必填            | 默认值 | 说明                                    |
| ----------- | ------------ | --------------- | ------ | --------------------------------------- |
| `file`      | `UploadFile` | 是              | -      | 文件对象                                |
| `progress`  | `number`     | 否              | -      | 上传进度（0-100），覆盖 file.percentage |
| `showRetry` | `boolean`    | 否              | -      | 是否显示重试按钮                        |
| `listType`  | `'text'      | 'picture-card'` | 否     | -                                       | 呈现模式：text | picture-card |

## Emits

| 事件     | 参数               | 说明 |
| -------- | ------------------ | ---- |
| `remove` | `file: UploadFile` | -    |
| `retry`  | `file: UploadFile` | -    |
