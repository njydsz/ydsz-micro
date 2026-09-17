/**
 * Tailwind 与 clsx 联合的 className 合并工具，自动处理样式冲突与去重。
 *
 * @path comm\@core\base\shared\src\utils\cn.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { ClassValue } from 'clsx';

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并并去重 Tailwind CSS 类名，后传入的样式优先级更高。
 *
 * @param inputs - 待合并的类名数组
 * @returns 去重合并后的类名字符串
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { cn };
