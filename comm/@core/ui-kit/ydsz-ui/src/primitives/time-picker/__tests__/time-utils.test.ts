/**
 * @file time-utils.test.ts
 * @description TimePicker 核心算法测试——时间步进 / AM-PM 转换 / 禁用时段 / 格式化。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\time-picker\__tests__\time-utils.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { describe, expect, it } from 'vitest'

describe('TimePicker time-step logic', () => {
  /** 根据步进生成小时列表 */
  function genHours(step: number, use12h: boolean): number[] {
    const max = use12h ? 12 : 23
    const start = use12h ? 1 : 0
    const result: number[] = []
    for (let h = start; h <= max; h += step)
      result.push(h)
    return result
  }

  /** 根据步进生成分钟/秒列表 */
  function genMinutes(step: number): number[] {
    const result: number[] = []
    for (let m = 0; m < 60; m += step)
      result.push(m)
    return result
  }

  /** 格式化 HH:mm:ss */
  function formatTime(h: number, m: number, s: number): string {
    return [h, m, s].map(n => String(n).padStart(2, '0')).join(':')
  }

  it('24h 小时步进 2: [0,2,...,22]', () => {
    const hours = genHours(2, false)
    expect(hours).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22])
  })

  it('12h 小时步进 1: [1,2,...,12]', () => {
    const hours = genHours(1, true)
    expect(hours).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  })

  it('分钟步进 15: [0,15,30,45]', () => {
    const mins = genMinutes(15)
    expect(mins).toEqual([0, 15, 30, 45])
  })

  it('formatTime 正确补零', () => {
    expect(formatTime(9, 5, 0)).toBe('09:05:00')
    expect(formatTime(23, 59, 59)).toBe('23:59:59')
  })

  it('禁用时段过滤', () => {
    const disabledHours = [0, 1, 2, 3]
    const hours = genHours(1, false).filter(h => !disabledHours.includes(h))
    expect(hours[0]).toBe(4)
    expect(hours).not.toContain(0)
  })
})

describe('TimePicker AM/PM conversion', () => {
  /** 12h → 24h 转换 */
  function to24Hour(hour12: number, period: 'AM' | 'PM'): number {
    if (period === 'AM') return hour12 === 12 ? 0 : hour12
    return hour12 === 12 ? 12 : hour12 + 12
  }

  it('AM 12 = 0时', () => {
    expect(to24Hour(12, 'AM')).toBe(0)
  })

  it('AM 9 = 9时', () => {
    expect(to24Hour(9, 'AM')).toBe(9)
  })

  it('PM 12 = 12时', () => {
    expect(to24Hour(12, 'PM')).toBe(12)
  })

  it('PM 3 = 15时', () => {
    expect(to24Hour(3, 'PM')).toBe(15)
  })
})

describe('Value parse', () => {
  /** 解析 HH:mm:ss 字符串 */
  function parseTime(value: string): { hour: number, minute: number, second: number } | null {
    const match = value.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/)
    if (!match) return null
    return {
      hour: Number.parseInt(match[1]!, 10),
      minute: Number.parseInt(match[2]!, 10),
      second: Number.parseInt(match[3] ?? '0', 10),
    }
  }

  it('解析完整 HH:mm:ss', () => {
    expect(parseTime('09:30:45')).toEqual({ hour: 9, minute: 30, second: 45 })
  })

  it('解析 HH:mm（秒默认 0）', () => {
    expect(parseTime('14:00')).toEqual({ hour: 14, minute: 0, second: 0 })
  })

  it('无效格式返回 null', () => {
    expect(parseTime('invalid')).toBeNull()
  })
})
