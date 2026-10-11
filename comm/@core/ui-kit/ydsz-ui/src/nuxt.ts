/**
 * ydsz-ui Nuxt 3 模块
 *
 * 用法（nuxt.config.ts）:
 * ```ts
 * export default defineNuxtConfig({
 *   modules: ['@ydsz-core/ydsz-ui/nuxt'],
 *   ydszUi: {
 *     autoRegister: true,
 *     prefix: 'Yd',
 *   },
 * })
 * ```
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\nuxt.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineNuxtModule, addPlugin, addComponent } from '@nuxt/kit'
import { name, version } from './package.json'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface ModuleOptions {
  /** 是否自动注册所有 ydsz-ui 组件（默认 true） */
  autoRegister?: boolean
  /** 前缀（默认 'Yd'） */
  prefix?: string
}

/**
 * ydsz-ui 全量组件名册 —— 与 src/resolver.ts 的 COMPONENT_NAMES 对齐
 * 当 autoRegister 为 true 时，使用 addComponent 逐一注册为全局组件。
 */
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
  'YdInputGroup', 'YdInputAddon',
  'YdInputMask',
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
  'YdProgress', 'YdProgressCircle', 'YdProgressDashboard',
  'YdQrCode', 'YdQrCodePro',
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
  'YdStepper', 'YdStepPanel',
  'YdSwitch',
  'YdTable', 'YdTableBody', 'YdTableCell', 'YdTableHead', 'YdTableHeader', 'YdTableRow', 'YdTableCaption', 'YdTableFooter',
  'YdTabs', 'YdTabsList', 'YdTabsTrigger', 'YdTabsContent', 'YdTabPane',
  'YdTag', 'YdTagCheckable',
  'YdThemeEditor',
  'YdTimelinePro',
  'YdBreadcrumbPro',
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

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    compatibility: { nuxt: '^3.0.0' },
    configKey: 'ydszUi',
  },
  defaults: {
    autoRegister: true,
    prefix: 'Yd',
  },
  setup(options, nuxt) {
    // 注册全局运行时插件（Ripple / ClickOutside 等指令）
    addPlugin({
      src: resolve(__dirname, 'runtime/use-directives.ts'),
      mode: 'client',
    })

    // 全量组件自动注册
    if (options.autoRegister) {
      const prefix = options.prefix || 'Yd'

      for (const componentName of COMPONENT_NAMES) {
        const fileName = componentName.slice(prefix.length)
        addComponent({
          name: componentName,
          export: componentName,
          filePath: `@ydsz-core/ydsz-ui`,
        })
      }
    }
  },
})
