/**
 * skeleton-types.ts — 骨架屏标准化配置接口（P3-1 落地）
 *
 * 将当前散落在 loader.ts / kernel.ts / vite-plugin-manifest.ts 中的骨架屏
 * 类型定义统一收敛到本模块，提供：
 * - 标准 SkeletonType 枚举（list/form/detail/dashboard/default）
 * - SkeletonMatchRule 路由匹配规则接口
 * - SkeletonConfig 标准化配置接口
 * - 默认配置工厂函数
 *
 * 用法：
 * ```ts
 * import { DEFAULT_SKELETON_CONFIG, SkeletonType, resolveSkeletonType } from '@ydsz/micro-kernel';
 *
 * // 在 manifest 构建时：
 * const type = resolveSkeletonType('/users/list', manifest.routes);
 * // → 'list'
 * ```
 *
 * @path comm/effects/micro-kernel/src/skeleton-types.ts
 * @author ydsz-team
 * @since 4.2.0
 */

/**
 * 标准骨架屏类型枚举（P3-1 统一定义）。
 *
 * 主应用与子应用均使用此枚举，确保两侧对同一骨架屏类型的理解一致。
 *
 * @example
 * ```ts
 * // manifest.json 中的 routes 声明
 * routes: [
 *   { path: '/users', skeletonType: 'list' },
 *   { path: '/users/:id', skeletonType: 'detail' },
 *   { path: '/form', skeletonType: 'form' },
 * ]
 * ```
 */
export enum SkeletonType {
  /** 仪表盘型骨架屏（数据看板、图表页等） */
  DASHBOARD = "dashboard",
  /** 默认回退骨架屏（通用 loading 样式） */
  DEFAULT = "default",
  /** 详情型骨架屏（只读展示页、profile 等） */
  DETAIL = "detail",
  /** 表单型骨架屏（新增/编辑页、搜索表单等） */
  FORM = "form",
  /** 列表型骨架屏（表格、卡片列表、索引页等） */
  LIST = "list",
}

/**
 * 骨架屏路由匹配规则（P3-1 标准化）。
 *
 * 用于 manifest.json 中的 routes 字段声明。
 *
 * 匹配逻辑（优先级从高到低）：
 * 1. 精确匹配：route.path === currentPath
 * 2. 前缀匹配：currentPath.startsWith(route.path)
 * 3. 正则匹配：new RegExp(route.path).test(currentPath)
 * 4. 回退到 default
 */
export interface SkeletonMatchRule {
  /**
   * 路由前缀或正则字符串（相对于子应用 basename 的子路径）。
   *
   * 示例：
   * - '/users' → 精确匹配 /users，或前缀匹配 /users/123
   * - '^/detail/' → 正则匹配 /detail/*
   */
  path: string;
  /** 命中的骨架屏类型 */
  skeletonType: SkeletonType | string;
}

/**
 * 骨架屏解析配置（P3-1 标准化）。
 *
 * 定义主应用容器在子应用加载阶段如何选择骨架屏类型。
 */
export interface SkeletonConfig {
  /**
   * 路由匹配规则列表。
   *
   * 优先级：数组顺序靠前的规则优先匹配。
   * 长度建议 ≤ 10 条，过多规则影响匹配性能。
   */
  rules: SkeletonMatchRule[];
  /**
   * 默认骨架屏类型（所有规则均未命中时使用）。
   * @default SkeletonType.DEFAULT
   */
  defaultType?: SkeletonType | string;
  /**
   * 是否启用路由级骨架屏（false 则完全禁用骨架屏渲染）。
   * @default true
   */
  enabled?: boolean;
  /**
   * 骨架屏渲染超时（毫秒）。
   *
   * 若子应用在此时间内未完成挂载，骨架屏自动消失，
   * 防止骨架屏长时间残留（幽灵骨架）。
   *
   * @default 10_000
   */
  timeoutMs?: number;
}

/** 默认骨架屏配置 */
export const DEFAULT_SKELETON_CONFIG: Required<SkeletonConfig> = {
  rules: [],
  defaultType: SkeletonType.DEFAULT,
  enabled: true,
  timeoutMs: 10_000,
};

/**
 * 根据当前子路径解析骨架屏类型。
 *
 * @param currentPath - 当前路径（相对于子应用 basename）
 * @param rules - 匹配规则列表
 * @param defaultType - 默认类型
 * @returns 匹配的骨架屏类型
 *
 * @example
 * ```ts
 * const type = resolveSkeletonType('/users/123', [
 *   { path: '^/detail/', skeletonType: 'detail' },
 *   { path: '/users', skeletonType: 'list' },
 * ], 'default');
 * // → 'list'（精确匹配优先）
 * ```
 */
export function resolveSkeletonType(
  currentPath: string,
  rules: SkeletonMatchRule[],
  defaultType: SkeletonType | string = SkeletonType.DEFAULT,
): SkeletonType | string {
  if (!currentPath || !rules || rules.length === 0) {
    return defaultType;
  }

  for (const rule of rules) {
    if (!rule || !rule.path) continue;

    // 1. 精确匹配
    if (rule.path === currentPath) {
      return rule.skeletonType;
    }

    // 2. 正则匹配（以 ^ 开头视为正则）
    if (rule.path.startsWith("^")) {
      try {
        const regex = new RegExp(rule.path);
        if (regex.test(currentPath)) {
          return rule.skeletonType;
        }
      } catch {
        // 无效正则，回退到精确匹配
        if (rule.path === currentPath) {
          return rule.skeletonType;
        }
      }
      continue;
    }

    // 3. 前缀匹配（仅当 path 不以 ^ 开头时）
    if (currentPath.startsWith(rule.path)) {
      return rule.skeletonType;
    }
  }

  return defaultType;
}

/**
 * 合并骨架屏配置（深度合并 rules 数组，后者优先）。
 *
 * @param base - 基础配置（如 DEFAULT_SKELETON_CONFIG）
 * @param override - 覆盖配置（如 manifest.json 中的 routes）
 * @returns 合并后的配置
 */
export function mergeSkeletonConfig(
  base: SkeletonConfig,
  override: Partial<SkeletonConfig> & { routes?: SkeletonMatchRule[] },
): Required<SkeletonConfig> {
  const baseRules = base.rules || [];
  const overrideRules = override.rules || override.routes || [];

  // 后面的规则权重更高（去重：同 path 时 override 覆盖 base）
  const ruleMap = new Map<string, SkeletonMatchRule>();
  for (const rule of baseRules) {
    if (rule?.path) ruleMap.set(rule.path, rule);
  }
  for (const rule of overrideRules) {
    if (rule?.path) ruleMap.set(rule.path, rule);
  }

  return {
    rules: [...ruleMap.values()],
    defaultType:
      override.defaultType ??
      base.defaultType ??
      DEFAULT_SKELETON_CONFIG.defaultType,
    enabled:
      override.enabled ?? base.enabled ?? DEFAULT_SKELETON_CONFIG.enabled,
    timeoutMs:
      override.timeoutMs ?? base.timeoutMs ?? DEFAULT_SKELETON_CONFIG.timeoutMs,
  };
}

/**
 * 检查给定名称是否为合法 SkeletonType 枚举值。
 *
 * @param value - 要检查的值
 * @returns 是否为合法枚举值
 */
export function isStandardSkeletonType(value: string): value is SkeletonType {
  return Object.values(SkeletonType).includes(value as SkeletonType);
}
