/**
 * cn.ts 工具函数单元测试
 *
 * 覆盖：cn（clsx + tailwind-merge）
 *
 * @path comm\@core\base\shared\src\utils\__tests__\cn.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { cn } from '../cn';

// ---------------------------------------------------------------------------
// cn
// ---------------------------------------------------------------------------

describe('cn', () => {
  it('应合并多个类名字符串', () => {
    const result = cn('flex', 'items-center', 'p-4');
    expect(result).toBe('flex items-center p-4');
    expect(result.split(' ')).toHaveLength(3);
  });

  it('应过滤 falsy 值（null / undefined / false）', () => {
    const result = cn('flex', null, undefined, false, 'p-4');
    expect(result).toBe('flex p-4');
  });

  it('应去除重复的 Tailwind 类名（后者覆盖前者）', () => {
    const result = cn('p-4', 'p-8');
    expect(result).toBe('p-8');
    expect(result.split(' ')).toHaveLength(1);
  });

  it('应处理条件类名的对象与数组输入', () => {
    const isActive = true;
    const isHidden = false;
    const result = cn('base', {
      active: isActive,
      hidden: isHidden,
      'font-bold': true,
    });
    expect(result).toContain('base');
    expect(result).toContain('active');
    expect(result).not.toContain('hidden');
    expect(result).toContain('font-bold');
  });

  it('所有输入均为空时应返回空字符串', () => {
    const result = cn('', null, undefined, false);
    expect(result).toBe('');
    expect(result).toHaveLength(0);
  });

  it('应支持超长类名列表的合并', () => {
    const classes = Array.from({ length: 100 }, (_, i) => `class-${i}`);
    const result = cn(...classes);
    expect(result.split(' ')).toHaveLength(100);
    expect(result).toContain('class-0');
    expect(result).toContain('class-99');
  });
});
