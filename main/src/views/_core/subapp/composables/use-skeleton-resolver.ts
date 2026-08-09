/**
 * 骨架屏解析 composable
 *
 * 从 SubAppContainer 拆出：根据子应用 manifest.routes 与路由 meta 解析骨架屏组件。
 *
 * 优先级（v3.3）：
 *   1. manifest.routes 中按子路径前缀匹配（build 模式可用）
 *   2. route.meta.skeletonType（注册表配置）
 *   3. 'default'
 *
 * @path main/src/views/_core/subapp/composables/use-skeleton-resolver.ts
 * @author ydsz-team
 * @since 4.1.0
 */
import type { Component } from "vue";

import type { SkeletonType } from "../skeletons/skeleton-registry";

import { computed, type ComputedRef, type Ref } from "vue";
import type { RouteLocationNormalizedLoaded } from "vue-router";

import { getAppInstance } from "@ydsz/micro-kernel";

import { getSkeletonComponent } from "../skeletons/skeleton-registry";

/**
 * 根据当前路由子路径从子应用 manifest.routes 匹配骨架屏类型。
 *
 * @param activeAppName - 当前激活的子应用名
 * @param route - 当前路由实例
 */
function resolveSkeletonTypeFromManifest(
  activeAppName: Ref<null | string>,
  route: RouteLocationNormalizedLoaded,
): null | SkeletonType {
  if (!activeAppName.value) return null;
  const instance = getAppInstance(activeAppName.value);
  const routes = instance?.manifest?.routes;
  if (!routes || routes.length === 0) return null;

  // 计算相对于子应用 basename 的子路径
  // activeRule 可能为 string | RegExp | 函数，仅字符串前缀规则参与路径裁剪
  const activeRule = instance?.config.activeRule;
  const fullPath = route.path;
  const subPath =
    typeof activeRule === "string" && fullPath.startsWith(activeRule)
      ? fullPath.slice(activeRule.length)
      : fullPath;

  for (const r of routes) {
    if (!r.skeletonType) continue;
    if (subPath.startsWith(r.path)) {
      return r.skeletonType as SkeletonType;
    }
  }
  return null;
}

/**
 * 创建骨架屏组件解析器。
 * 依赖 route.path（computed 自动追踪），路由变化时自动重算。
 */
export function useSkeletonResolver(
  activeAppName: Ref<null | string>,
  route: RouteLocationNormalizedLoaded,
): ComputedRef<Component> {
  return computed<Component>(() => {
    // v3.3: 优先取自子应用 manifest.routes（自描述）
    const fromManifest = resolveSkeletonTypeFromManifest(activeAppName, route);
    if (fromManifest) {
      return getSkeletonComponent(fromManifest);
    }
    // 回退到 route.meta.skeletonType（注册表配置）
    const skeletonType =
      (route.meta?.skeletonType as SkeletonType) || "default";
    return getSkeletonComponent(skeletonType);
  });
}
