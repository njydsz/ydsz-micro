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
import type { Directive } from 'vue'

import { vRipple } from './directives/v-ripple'
import { vClickOutside } from './directives/v-click-outside'

export interface YdszUiResolverOptions {
  /**
   * 式样版本
   * @default 'default'
   */
  style?: 'default'
  /**
   * 指令名称前缀
   * @default 'v'
   */
  prefix?: string
  /**
   * 是否按需自动导入全局自定义指令（v-ripple、v-click-outside）
   * @default true
   */
  directives?: boolean
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
  'YdEllipsis',
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
  'YdOrderList',
  'YdOrganizationChart',
  'YdOrgChart',
  'YdPageHeader',
  'YdPagination',
  'YdPickList',
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
  'YdSkeletonCard', 'YdSkeletonDetail', 'YdSkeletonGroup', 'YdSkeletonList',
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
  'YdMenu',
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

/** 指令名称 → 指令对象的映射 */
const DIRECTIVE_MAP: Record<string, () => Directive> = {
  ripple: () => vRipple,
  clickoutside: () => vClickOutside,
}

export function YdszUiResolver(options: YdszUiResolverOptions = {}): ComponentResolver[] {
  const enableDirectives = options.directives !== false

  const resolvers: ComponentResolver[] = [
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
  ]

  if (enableDirectives) {
    const prefix = options.prefix ?? 'v'
    resolvers.push({
      type: 'directive',
      resolve: (name: string) => {
        // unplugin-vue-components 传入的名称带 v- 前缀或 V 前缀，如 'v-ripple' 或 'VRipple'
        const stripped = name.startsWith(prefix) ? name.slice(prefix.length)
          : name.startsWith(prefix.toUpperCase()) ? name.slice(prefix.length)
          : name
        const found = DIRECTIVE_MAP[stripped.toLowerCase()]
        if (found) {
          return found()
        }
        return undefined
      },
    })
  }

  return resolvers
}
