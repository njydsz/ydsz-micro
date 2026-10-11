/**
 * ydsz-ui unplugin-vue-components Resolver —— 自动按需导入组件。
 *
 * 用法（vite.config.ts）:
 * ```ts
 * import Components from 'unplugin-vue-components/vite'
 * import { YdszUiResolver } from '@ydsz-core/ydsz-ui/resolver'
 *
 * export default defineConfig({
 *   plugins: [
 *     Components({ resolvers: [YdszUiResolver()] })
 *   ]
 * })
 * ```
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/resolver.ts
 * @author ydsz-team
 * @since 26.10.10
 */

import type { ComponentResolver } from 'unplugin-vue-components/types'

export interface YdszUiResolverOptions {
  /**
   * 式样版本
   * @default 'default'
   */
  style?: 'default'
}

/** ydsz-ui 组件名称前缀 */
const COMPONENT_PREFIX = 'Yd'

/** ydsz-ui 组件全量名册 —— 与 src/index.ts 导出对齐 */
const COMPONENT_NAMES: string[] = [
  'YdAccordion', 'YdAccordionContent', 'YdAccordionItem', 'YdAccordionTrigger',
  'YdAlert', 'YdAlertTitle', 'YdAlertDescription',
  'YdAvatar', 'YdAvatarImage', 'YdAvatarFallback',
  'YdBackTop',
  'YdBadge',
  'YdBreadcrumb', 'YdBreadcrumbItem', 'YdBreadcrumbLink', 'YdBreadcrumbSeparator',
  'YdButton',
  'YdCard', 'YdCardHeader', 'YdCardContent', 'YdCardFooter', 'YdCardTitle', 'YdCardDescription',
  'YdCarousel', 'YdCarouselContent', 'YdCarouselItem', 'YdCarouselPrevious', 'YdCarouselNext',
  'YdCheckbox',
  'YdCheckboxGroup',
  'YdCol',
  'YdCollapsible', 'YdCollapsibleContent', 'YdCollapsibleTrigger',
  'YdColorPicker',
  'YdCombobox', 'YdComboboxInput', 'YdComboboxList', 'YdComboboxOption',
  'YdCommand', 'YdCommandEmpty', 'YdCommandGroup', 'YdCommandInput', 'YdCommandItem', 'YdCommandList',
  'YdConfigProvider',
  'YdContextMenu', 'YdContextMenuTrigger', 'YdContextMenuContent', 'YdContextMenuItem', 'YdContextMenuSeparator',
  'YdCountTag', 'YdCountdown',
  'YdDataTable',
  'YdDatePicker', 'YdDateRangePicker',
  'YdDescriptions', 'YdDescriptionsItem',
  'YdDialog', 'YdDialogTrigger', 'YdDialogContent', 'YdDialogHeader', 'YdDialogFooter', 'YdDialogTitle', 'YdDialogDescription', 'YdDialogClose',
  'YdDivider',
  'YdDrawer', 'YdDrawerTrigger', 'YdDrawerContent', 'YdDrawerHeader', 'YdDrawerFooter', 'YdDrawerTitle', 'YdDrawerDescription', 'YdDrawerClose',
  'YdDropdown', 'YdDropdownMenu', 'YdDropdownMenuTrigger', 'YdDropdownMenuContent', 'YdDropdownMenuItem', 'YdDropdownMenuSeparator',
  'YdEmpty', 'YdEmptyDescription', 'YdEmptyImage',
  'YdEntityCard',
  'YdFloatButton',
  'YdForm', 'YdFormItem', 'YdFormLabel', 'YdFormControl', 'YdFormDescription', 'YdFormMessage',
  'YdHoverCard', 'YdHoverCardTrigger', 'YdHoverCardContent',
  'YdIcon',
  'YdIconPicker',
  'YdImage', 'YdImageViewer',
  'YdInput', 'YdTextarea',
  'YdInputNumber',
  'YdInputPassword',
  'YdLabel',
  'YdLink',
  'YdList', 'YdListItem', 'YdListHeader', 'YdListFooter',
  'YdLogo',
  'YdMention',
  'YdMenu', 'YdMenuTrigger', 'YdMenuContent', 'YdMenuItem', 'YdMenuSeparator', 'YdMenuGroup', 'YdMenuLabel', 'YdMenuShortcut',
  'YdMessageBox',
  'YdNav',
  'YdNumberField', 'YdNumberFieldInput', 'YdNumberFieldIncrement', 'YdNumberFieldDecrement',
  'YdOrganizationChart',
  'YdPageHeader',
  'YdPagination',
  'YdPinInput',
  'YdPopover', 'YdPopoverTrigger', 'YdPopoverContent',
  'YdProgress',
  'YdQrCode',
  'YdRadioGroup', 'YdRadioGroupItem',
  'YdRangePicker',
  'YdRate',
  'YdResizable',
  'YdResult', 'YdResultTitle', 'YdResultSubtitle', 'YdResultExtra', 'YdResultContent', 'YdResultIcon',
  'YdRow',
  'YdScrollArea', 'YdScrollBar',
  'YdSearch',
  'YdSegmented',
  'YdSelect', 'YdSelectTrigger', 'YdSelectValue', 'YdSelectContent', 'YdSelectItem', 'YdSelectLabel', 'YdSelectGroup', 'YdSelectSeparator', 'YdSelectScrollUpButton', 'YdSelectScrollDownButton',
  'YdOption',
  'YdSeparator',
  'YdSettingsFloat',
  'YdSheet', 'YdSheetTrigger', 'YdSheetContent', 'YdSheetHeader', 'YdSheetFooter', 'YdSheetTitle', 'YdSheetDescription', 'YdSheetClose',
  'YdSkeleton',
  'YdSlider', 'YdSliderRange', 'YdSliderThumb', 'YdSliderTrack',
  'YdSpace',
  'YdSpin',
  'YdSplitter', 'YdSplitterPanel',
  'YdStatistic',
  'YdStatusBadge',
  'YdSteps', 'YdStep',
  'YdSwitch',
  'YdTable', 'YdTableBody', 'YdTableCell', 'YdTableHead', 'YdTableHeader', 'YdTableRow', 'YdTableCaption', 'YdTableFooter',
  'YdTabs', 'YdTabsList', 'YdTabsTrigger', 'YdTabsContent', 'YdTabPane',
  'YdTag',
  'YdThemeEditor',
  'YdTimePicker',
  'YdTimeline', 'YdTimelineItem', 'YdTimelineDot', 'YdTimelineContent', 'YdTimelineConnector',
  'YdToggle', 'YdToggleGroup',
  'YdTooltip', 'YdTooltipTrigger', 'YdTooltipContent', 'YdTooltipArrow',
  'YdTour', 'YdTourStep',
  'YdTransfer',
  'YdTree', 'YdTreeItem', 'YdTreeVirtualizer',
  'YdUpload',
  'YdWarning',
  'YdFullscreen',
  'YdWatermark',
  'YdFormDesigner',
  'YdAdvancedFilter',
  'YdQuickCreate',
  'YdDashboard',
  'YdAiBuilder',
  'YdPopconfirm',
]

export function YdszUiResolver(_options: YdszUiResolverOptions = {}): ComponentResolver[] {
  return [
    {
      type: 'component',
      resolve: (componentName: string) => {
        if (componentName.startsWith(COMPONENT_PREFIX)) {
          const matchedName = COMPONENT_NAMES.find(name => name === componentName)
          if (matchedName) {
            return {
              name: matchedName,
              from: '@ydsz-core/ydsz-ui',
            }
          }
        }
        return undefined
      },
    },
    {
      type: 'directive',
      resolve: () => {
        // ydsz-ui 目前无全局自定义指令
        return undefined
      },
    },
  ]
}
