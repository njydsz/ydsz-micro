# YDSZ UI — 组件 API 参考

> 本目录由 `bash/gen-component-docs.mts` 自动生成，请勿手动编辑。
> 共 71 个组件。

## 组件索引

| 组件 | 说明 |
|------|------|
| [OrgNode](./OrgNode.md) | 节点卡片 |
| [SidebarMenuItem](./SidebarMenuItem.md) | Icon |
| [ThemeProvider](./ThemeProvider.md) | - |
| [YdAdvancedFilterBar](./YdAdvancedFilterBar.md) | 搜索框 |
| [YdAlertDialogContent](./YdAlertDialogContent.md) | 确认对话框的内容容器：负责 Portal 挂载、遮罩、进出场动画与 opened / closed / close 事件。 modal（默认 true）决定遮罩是否渲染，也决定是否锁滚动； |
| [YdAvatar](./YdAvatar.md) | 头像容器：按 shape / size 两个维度从 cva 变体中取类名，默认圆形小号。 尺寸与圆角全部由 avatarVariant 统一产出，外部若要覆盖必须走 cn()， |
| [YdBadge](./YdBadge.md) | 状态标签：按语义 variant 取 cva 变体类名，用于标注状态、计数与分类。 刻意不提供 size 维度 —— 标签需要跟随所在文本的行高， |
| [YdBreadcrumb](./YdBreadcrumb.md) | - |
| [YdBreadcrumbEllipsis](./YdBreadcrumbEllipsis.md) | 面包屑的折叠占位：层级过深时代表被省略的中间层。 整体标记 aria-hidden 与 role=presentation，因为省略号本身不携带信息； |
| [YdBreadcrumbItem](./YdBreadcrumbItem.md) | 面包屑中的一级：渲染为 li，保证外层 YdBreadcrumbList 的有序列表语义成立。 注意分隔符（YdBreadcrumbSeparator）本身也是一个 li， |
| [YdBreadcrumbList](./YdBreadcrumbList.md) | 面包屑的层级列表：渲染为 ol 而非 ul，因为面包屑的先后顺序代表层级由浅到深。 允许换行（flex-wrap + break-words）是必要的 —— |
| [YdBreadcrumbPage](./YdBreadcrumbPage.md) | 面包屑的当前页：渲染为 span 并标记 aria-current="page"，不是链接。 使用弱化主色而非高亮色，让视觉焦点落在其祖先层级上； |
| [YdBreadcrumbPro](./YdBreadcrumbPro.md) | - |
| [YdBreadcrumbSeparator](./YdBreadcrumbSeparator.md) | 面包屑的分隔符：渲染为 li 并标记 aria-hidden，默认图标为 ChevronRight。 对辅助技术隐藏是因为分隔符纯属视觉装饰，若参与播报， |
| [YdButtonGroup](./YdButtonGroup.md) | 按钮组容器：为一组按钮提供统一的间距与圆角衔接。 相邻按钮共享边框（除首尾外去掉内侧圆角与重复边线），使一组操作在视觉上连成整体； |
| [YdCalendarPanel](./YdCalendarPanel.md) | 星期标题行 |
| [YdCard](./YdCard.md) | 卡片容器：提供统一的圆角、边框、阴影与背景。 纯展示容器，不包装 radix 组件；hoverable 开启时叠加悬停反馈，用于可点击的卡片。 |
| [YdCardContent](./YdCardContent.md) | 卡片内容区：承载正文的容器。 上内边距置 0（p-6 pt-0）是因为它通常紧跟在 YdCardHeader 之后， |
| [YdCardDescription](./YdCardDescription.md) | 卡片描述文本：弱化显示的辅助说明。 使用 p 标签而非 div：描述属于正文内容，需要正确的段落语义， |
| [YdCardFooter](./YdCardFooter.md) | 卡片底部区：承载操作按钮的容器。 与 YdCardContent 同样是 p-6 pt-0，让底部操作与正文保持同一水平内边距； |
| [YdCardGrid](./YdCardGrid.md) | 加载态：栅格骨架 |
| [YdCardHeader](./YdCardHeader.md) | 卡片头部区：容纳标题与描述的纵向排布容器。 用 flex 纵向布局加固定间距，让标题与描述的间距不依赖具体元素的 margin， |
| [YdCardTitle](./YdCardTitle.md) | 卡片标题：以 h3 渲染的区块标题。 固定为 h3 而非可配置层级：卡片通常嵌在已有 h2 的页面区块内，固定层级可避免 |
| [YdCol](./YdCol.md) | 栅格列组件 —— 与 YdRow 配对使用。 API 对齐 Element Plus ElCol： |
| [YdConfigProvider](./YdConfigProvider.md) | - |
| [YdContextHelp](./YdContextHelp.md) | 横条风格 |
| [YdContextMenuShortcut](./YdContextMenuShortcut.md) | 右键菜单快捷键提示：右对齐展示组合键文案。 只做展示，不绑定键盘事件 —— 实际快捷键需由调用方自行注册， |
| [YdContextMenuSubTrigger](./YdContextMenuSubTrigger.md) | 子菜单触发器：渲染带展开指示的菜单项，悬停或右方向键展开子菜单。 展开与收起的延迟由 radix 处理，避免鼠标斜向移动时误收起子菜单。 |
| [YdDatePicker](./YdDatePicker.md) | 触发器区域 |
| [YdDescriptions](./YdDescriptions.md) | 描述列表组件：以网格布局展示多个「标签 — 文本」字段对， 用于详情页、审计记录等场景的结构化信息展示。 |
| [YdDescriptionsItem](./YdDescriptionsItem.md) | 描述列表字段项：承载「标签 — 文本」一对信息，由 YdDescriptions 容器编排网格位置。 与 EP ElDescriptionsItem 的契约对齐： |
| [YdDialogContent](./YdDialogContent.md) | - |
| [YdDialogHeader](./YdDialogHeader.md) | 对话框头部区：排布标题与描述。 窄屏居中、宽屏左对齐：移动端标题居中更符合阅读习惯，宽屏左对齐与正文基线一致。 |
| [YdDomainFilterPanel](./YdDomainFilterPanel.md) | 头部：标题 + 计数 |
| [YdDropdown](./YdDropdown.md) | 下拉菜单便利性封装 —— 配置式 options 用法。 用法一（配置式，快速声明）： |
| [YdDropdownMenuSeparator](./YdDropdownMenuSeparator.md) | 下拉菜单分隔线：在菜单项之间绘制视觉分组线。 纯装饰元素，对辅助技术不可见；语义分组请用 YdDropdownMenuGroup 表达。 |
| [YdDropdownMenuShortcut](./YdDropdownMenuShortcut.md) | 下拉菜单快捷键提示：右对齐展示组合键文案。 只做展示、不绑定键盘事件；实际快捷键需由调用方自行注册。 |
| [YdEmptyState](./YdEmptyState.md) | 图标区 |
| [YdEntityCard](./YdEntityCard.md) | 多选框（右上角绝对定位） |
| [YdExpandableArrow](./YdExpandableArrow.md) | 可展开箭头：点击切换展开态并旋转指示箭头，用于展开/收起区域。 用 div + role="button" 而非 button 元素，是为了能自由承载任意行内内容而不 |
| [YdFormDescription](./YdFormDescription.md) | 字段说明文字：渲染为 p 并带上由 useFormField 生成的 formDescriptionId。 这个 id 是 aria-describedby 的拼图之一，组件本身不负责关联， |
| [YdFormItem](./YdFormItem.md) | 单个字段的上下文提供者：生成唯一 id 并通过 FORM_ITEM_INJECTION_KEY 向下注入。 用 useId() 而不是自己递增计数器，是为了在 SSR 下服务端与客户端得到一致的 id， |
| [YdGlobalSearchPanel](./YdGlobalSearchPanel.md) | 搜索输入 |
| [YdIcon](./YdIcon.md) | 通用图标渲染器：按传入值的类型自动选择渲染方式。 同一组件兼容四种输入——Vue 组件直接渲染、http(s) 链接渲染为 img、 |
| [YdInput](./YdInput.md) | 有 prefix/suffix 时使用包裹容器 |
| [YdInputMask](./YdInputMask.md) | - |
| [YdMenu](./YdMenu.md) | 导航菜单便利性封装 —— 配置式 options 用法。 用法： |
| [YdMonthPanel](./YdMonthPanel.md) | - |
| [YdNumberFieldContent](./YdNumberFieldContent.md) | 数字输入框的定位容器：为绝对定位的增减按钮提供 relative 参照系，并按按钮存在与否调整输入框内边距。 内边距用 has-[[data-slot=decrement]] / has-[[data-slot=increment]] 选择器判定， |
| [YdOrganizationChart](./YdOrganizationChart.md) | 根节点 |
| [YdQrCodePro](./YdQrCodePro.md) | 二维码主体 + Logo 覆盖层 |
| [YdQuarterPanel](./YdQuarterPanel.md) | - |
| [YdQuickCreateButton](./YdQuickCreateButton.md) | 菜单项（从下往上展开） |
| [YdResizableHandle](./YdResizableHandle.md) | 可拖拽的分栏手柄：转发 radix SplitterResizeHandle 的 props 与 emits。 命中区域比可见线条宽得多（after 伪元素左右各扩 1px 之外的宽度）， |
| [YdRow](./YdRow.md) | - |
| [YdSettingsFloatButton](./YdSettingsFloatButton.md) | 操作菜单（从下往上展开） |
| [YdSpineText](./YdSpineText.md) | - |
| [YdStepPanel](./YdStepPanel.md) | - |
| [YdStepper](./YdStepper.md) | ========== 步骤条头部 ========== |
| [YdSteps](./YdSteps.md) | - |
| [YdTabPane](./YdTabPane.md) | 便利性 wrapper：渲染为 YdTabsTrigger，label 和 name 只声明一次。推荐与 YdTabsContent 配对使用。 |
| [YdTagCheckable](./YdTagCheckable.md) | 可选标签 —— 支持 v-model:checked 双向绑定。 用法： |
| [YdTextarea](./YdTextarea.md) | 字符计数 |
| [YdTimelinePro](./YdTimelinePro.md) | 时间轴 Pro——带 alternate / ghost 增强模式。 alternate 模式下，内容项自动在时间轴左右交替排列。 |
| [YdToggle](./YdToggle.md) | 切换按钮：在 radix YdToggle 之上套用 toggleVariants 的 variant / size 变体。 size 与 variant 要从 props 中单独摘出再转发， |
| [YdToggleGroup](./YdToggleGroup.md) | 切换按钮组的容器：把 variant / size 通过 provide 下发给组内所有项。 走 provide 而不是逐个 prop 传递，是为了让调用方只在组上写一次尺寸与外观， |
| [YdToggleGroupItem](./YdToggleGroupItem.md) | 切换按钮组中的一项：从 toggleGroup 上下文取 variant / size，自身 props 优先。 变体取值先从 inject 的上下文中取、再与本地 props 合并， |
| [YdTransfer](./YdTransfer.md) | 左侧：可选列表 |
| [YdUpload](./YdUpload.md) | text 模式：拖拽区域 |
| [YdUploadItem](./YdUploadItem.md) | text 模式 |
| [YdYearPanel](./YdYearPanel.md) | 十年导航 |
