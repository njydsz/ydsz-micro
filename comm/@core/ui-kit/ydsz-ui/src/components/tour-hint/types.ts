/**
 * TourHint（漫游引导提示）Props / Emits。
 */
export interface TourHintStep {
  target: string  // CSS 选择器
  title: string
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

export interface TourHintProps {
  steps: TourHintStep[]
  modelValue?: boolean
  autoStart?: boolean
  offset?: number
}

export interface TourHintEmits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'finish'): void
  (e: 'skip'): void
}
