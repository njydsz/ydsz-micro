/**
 * ydsz-ui 组件名册 —— auto-import resolver 与 Nuxt 模块共用的唯一真源。
 *
 * <p>这里列出的是包根（src/index.ts → 各目录 barrel）真实透出的组件名，
 * 与 barrels 的一致性由 component-names.test.ts 在单测中校验：
 * 新增或删除组件出口而未同步名册时，该用例会直接失败。
 *
 * <p>@deprecated 标记的组件保留为兼容别名，新代码请使用推荐的替代组件：
 * <ul>
 *   <li>YdEmpty → 使用 YdEmptyState（预设场景 + 操作按钮）</li>
 *   <li>YdOrgChart → 使用 YdOrganizationChart（composable API，PrimeVue 兼容）</li>
 *   <li>YdLink → 暂未在业务中启用，可作为轻量链接使用</li>
 * </ul>
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/component-names.ts
 * @author ydsz-team
 * @since 5.7.0
 */

/** 可通过 unplugin-vue-components / Nuxt 自动注册的组件名 */
export const YDSZ_UI_COMPONENT_NAMES: readonly string[] = [
  'YdAccordion', 'YdAccordionContent', 'YdAccordionItem', 'YdAccordionTrigger', 'YdAdvancedFilterBar',
  'YdAffix', 'YdAlert', 'YdAlertBanner', 'YdAlertDialog', 'YdAlertDialogAction',
  'YdAlertDialogCancel', 'YdAlertDialogContent', 'YdAlertDialogDescription', 'YdAlertDialogTitle', 'YdAlertDialogTrigger',
  'YdAnchor', 'YdAnchorLink', 'YdAutoComplete', 'YdAvatar', 'YdAvatarBase',
  'YdAvatarFallback', 'YdAvatarFallbackBase', 'YdAvatarGroup', 'YdAvatarImage', 'YdAvatarImageBase',
  'YdAvatarSmart', 'YdBackTop', 'YdBadge', 'YdBreadcrumb', 'YdBreadcrumbEllipsis',
  'YdBreadcrumbItem', 'YdBreadcrumbLink', 'YdBreadcrumbList', 'YdBreadcrumbPage', 'YdBreadcrumbPro',
  'YdBreadcrumbSeparator', 'YdBreadcrumbView', 'YdBulkActions', 'YdButton', 'YdButtonGroup',
  'YdButtonSmart', 'YdCalendar', 'YdCalendarPanel', 'YdCard', 'YdCardContent',
  'YdCardDescription', 'YdCardFooter', 'YdCardGrid', 'YdCardHeader', 'YdCardList',
  'YdCardTitle', 'YdCarousel', 'YdCascader', 'YdCheckButtonGroup', 'YdCheckbox',
  'YdCheckboxBase', 'YdCheckboxSmart', 'YdCol', 'YdCollapse', 'YdCollapseItem',
  'YdColorPicker', 'YdCommandMenu', 'YdConfigProvider', 'YdConfirmDialog', 'YdConfirmPopup',
  'YdContextHelp', 'YdContextMenu', 'YdContextMenuCheckboxItem', 'YdContextMenuContent', 'YdContextMenuGroup',
  'YdContextMenuItem', 'YdContextMenuLabel', 'YdContextMenuRadioGroup', 'YdContextMenuRadioItem', 'YdContextMenuSeparator',
  'YdContextMenuShortcut', 'YdContextMenuSub', 'YdContextMenuSubContent', 'YdContextMenuSubTrigger', 'YdContextMenuTrigger',
  'YdCountTag', 'YdCountToAnimator', 'YdCountdown', 'YdDashboardGrid', 'YdDataTable',
  'YdColumnChooser', 'YdDataTableCell', 'YdDataTableHeadCell', 'YdDataView', 'YdDatePicker', 'YdDescriptions',
  'YdDescriptionsItem', 'YdDialog', 'YdDialogClose', 'YdDialogContent', 'YdDialogDescription',
  'YdDialogFooter', 'YdDialogHeader', 'YdDialogScrollContent', 'YdDialogTitle', 'YdDialogTrigger',
  'YdDiffViewer', 'YdDivider', 'YdDomainFilterPanel', 'YdDrawer', 'YdDrawerContainer',
  'YdDropdown', 'YdDropdownMenu', 'YdDropdownMenuBase', 'YdDropdownMenuCheckboxItem', 'YdDropdownMenuContent',
  'YdDropdownMenuContentBase', 'YdDropdownMenuGroup', 'YdDropdownMenuGroupBase', 'YdDropdownMenuItem', 'YdDropdownMenuItemBase',
  'YdDropdownMenuLabel', 'YdDropdownMenuLabelBase', 'YdDropdownMenuRadioGroup', 'YdDropdownMenuRadioItem', 'YdDropdownMenuSeparator',
  'YdDropdownMenuSeparatorBase', 'YdDropdownMenuShortcut', 'YdDropdownMenuShortcutBase', 'YdDropdownMenuSmart', 'YdDropdownMenuSub',
  'YdDropdownMenuSubBase', 'YdDropdownMenuSubContent', 'YdDropdownMenuSubContentBase', 'YdDropdownMenuSubTrigger', 'YdDropdownMenuSubTriggerBase',
  'YdDropdownMenuTrigger', 'YdDropdownMenuTriggerBase', 'YdDropdownRadioMenu', 'YdEllipsis',
  // @deprecated 使用 YdEmptyState 替代
  'YdEmpty',
  'YdEmptyState', 'YdEntityCard', 'YdExpandableArrow', 'YdFieldset', 'YdFileUpload',
  'YdFloatButton', 'YdFloatLabel', 'YdForm', 'YdFormControl', 'YdFormDescription',
  'YdFormItem', 'YdFormLabel', 'YdFormMessage', 'YdFullScreen', 'YdGlobalSearchPanel',
  'YdHelpTooltip', 'YdHoverCard', 'YdHoverCardContent', 'YdHoverCardSmart', 'YdHoverCardTrigger',
  'YdIcon', 'YdIconButton', 'YdIconPicker', 'YdImage', 'YdImageEditor',
  'YdImagePreviewGroup', 'YdInput', 'YdInputAddon', 'YdInputGroup', 'YdInputMask',
  'YdInputNumber', 'YdInputOtp', 'YdInputPassword', 'YdInputTags', 'YdLabel',
  // @experimental 暂未在业务中广泛使用
  'YdLink', 'YdList', 'YdLoading', 'YdLogo', 'YdMegaMenu',
  'YdMention', 'YdMenu', 'YdMessage', 'YdMiniChart', 'YdMonthPanel',
  'YdNotification', 'YdNotificationContainer', 'YdNumberField', 'YdNumberFieldContent', 'YdNumberFieldDecrement', 'YdNumberFieldIncrement',
  'YdNumberFieldInput', 'YdOption', 'YdOrderList',
  // @deprecated 使用 YdOrganizationChart 替代
  'YdOrgChart', 'YdOrganizationChart',
  'YdPageHeader', 'YdPagination', 'YdPaginationEllipsis', 'YdPaginationFirst', 'YdPaginationLast',
  'YdPaginationNext', 'YdPaginationPrev', 'YdParagraph', 'YdPickList', 'YdPinInput',
  'YdPinInputGroup', 'YdPinInputInput', 'YdPinInputSeparator', 'YdPinInputSmart', 'YdPopconfirm',
  'YdPopover', 'YdPopoverBase', 'YdPopoverContent', 'YdPopoverContentBase', 'YdPopoverSmart',
  'YdPopoverTrigger', 'YdPopoverTriggerBase', 'YdProTable', 'YdProgress', 'YdProgressCircle',
  'YdProgressDashboard', 'YdQrCode', 'YdQrCodePro', 'YdQuarterPanel', 'YdQuickCreateButton',
  'YdRadioGroup', 'YdRadioGroupItem', 'YdRangePicker', 'YdRate', 'YdRenderContent',
  'YdResizableHandle', 'YdResizablePanel', 'YdResizablePanelGroup', 'YdResult', 'YdRow',
  'YdScrollArea', 'YdScrollBar', 'YdScrollbar', 'YdSegmented', 'YdSelect',
  'YdSelectBase', 'YdSelectContent', 'YdSelectContentBase', 'YdSelectGroup', 'YdSelectGroupBase',
  'YdSelectItem', 'YdSelectItemBase', 'YdSelectItemText', 'YdSelectItemTextBase', 'YdSelectLabel',
  'YdSelectLabelBase', 'YdSelectScrollDownButton', 'YdSelectScrollUpButton', 'YdSelectSeparator', 'YdSelectSeparatorBase',
  'YdSelectSmart', 'YdSelectTrigger', 'YdSelectTriggerBase', 'YdSelectValue', 'YdSelectValueBase',
  'YdSeparator', 'YdSettingsFloatButton', 'YdSheet', 'YdSheetClose', 'YdSheetContent',
  'YdSheetDescription', 'YdSheetFooter', 'YdSheetHeader', 'YdSheetTitle', 'YdSheetTrigger',
  'YdSidebar', 'YdSkeleton', 'YdSkeletonCard', 'YdSkeletonDetail', 'YdSkeletonGroup',
  'YdSkeletonList', 'YdSlider', 'YdSpace', 'YdSpin', 'YdSpineText',
  'YdSpinner', 'YdSplitButton', 'YdSplitter', 'YdStatCard', 'YdStatistic',
  'YdStatusBadge', 'YdStepPanel', 'YdStepper', 'YdSteps', 'YdSwitch',
  'YdTabPane', 'YdTable', 'YdTableBody', 'YdTableCaption', 'YdTableCell',
  'YdTableColumn', 'YdTableColumnGroup', 'YdTableEmpty', 'YdTableFooter', 'YdTableHead',
  'YdTableHeader', 'YdTableRow', 'YdTabs', 'YdTabsContent', 'YdTabsList',
  'YdTabsTrigger', 'YdTag', 'YdTagCheckable', 'YdText', 'YdTextarea',
  'YdThemeEditor', 'YdThemeScope', 'YdTimePicker', 'YdTimeline', 'YdTimelineItem',
  'YdTimelinePro', 'YdTitle', 'YdToast', 'YdToastContainer', 'YdToggle',
  'YdToggleGroup', 'YdToggleGroupItem', 'YdToolbar', 'YdTooltip', 'YdTooltipBase',
  'YdTooltipContent', 'YdTooltipContentBase', 'YdTooltipProvider', 'YdTooltipProviderBase', 'YdTooltipSmart',
  'YdTooltipTrigger', 'YdTooltipTriggerBase', 'YdTour', 'YdTourHint', 'YdTourStep',
  'YdTransfer', 'YdTree', 'YdTreeSelect', 'YdTreeTable', 'YdTypography',
  'YdUpload', 'YdVCascader', 'YdVTree', 'YdVTreeSearch', 'YdVirtualList',
  'YdVirtualTable', 'YdWatermark', 'YdYearPanel',
];
