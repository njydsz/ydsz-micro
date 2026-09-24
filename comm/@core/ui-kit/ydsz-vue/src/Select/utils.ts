import { isNullish } from '../shared/index.ts'

export const OPEN_KEYS = [' ', 'Enter', 'ArrowUp', 'ArrowDown']
export const SELECTION_KEYS = [' ', 'Enter']
export const CONTENT_MARGIN = 10

export function shouldShowPlaceholder(value?: string) {
  return value === '' || isNullish(value)
}
