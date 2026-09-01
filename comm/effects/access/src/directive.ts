/**
 * Vue 全局权限指令（v-access / v-permission）注册模块。
 *
 * 通过 display:none + 标记属性实现元素级细粒度权限控制，
 * 相比物理移除 DOM 的方式，可在权限变更时恢复显示，无需重新挂载。
 *
 * @example v-access:role="[ROLE_NAME]" 或 v-access:role="ROLE_NAME"
 * @example v-access:code="[ROLE_CODE]" 或 v-access:code="ROLE_CODE"
 * @example v-permission="['sys:dict:add', 'sys:dict:edit']"
 *
 * @path comm\effects\access\src\directive.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { App, Directive, DirectiveBinding } from 'vue';

import { useAccess } from './use-access';

/**
 * 标记被权限指令隐藏的元素，便于 updated 钩子恢复。
 *
 * 不使用 el.remove() 物理移除，而是 display:none + 标记属性，
 * 这样权限变更（如角色切换、权限码刷新）时 updated 钩子可以恢复显示。
 */
const HIDDEN_ATTR = 'data-access-hidden';
/** 记录元素原始的 display 值，恢复时还原，避免破坏布局 */
const DISPLAY_RESTORE_ATTR = 'data-access-original-display';

/** 缓存 useAccess 返回值，避免在指令钩子中重复调用 */
let cachedAccess: ReturnType<typeof useAccess> | null = null;

function getAccess() {
  if (!cachedAccess) {
    cachedAccess = useAccess();
  }
  return cachedAccess;
}

/**
 * 检测当前绑定值是否命中用户权限。
 *
 * @param _el - 被绑定元素（此处未使用，保留参数位置以符合签名）
 * @param binding - 指令绑定对象，包含 value（角色码或权限码数组）与 arg（role/code）
 * @returns 有权限返回 true，否则 false
 */
function checkAccess(
  _el: Element,
  binding: DirectiveBinding<string | string[]>,
): boolean {
  const { accessMode, hasAccessByCodes, hasAccessByRoles } = getAccess();
  const value = binding.value;

  if (!value) return true;

  const authMethod =
    accessMode.value === 'frontend' && binding.arg === 'role'
      ? hasAccessByRoles
      : hasAccessByCodes;

  const values = Array.isArray(value) ? value : [value];
  return authMethod(values);
}

/** 隐藏元素：记录原 display → 设置 display:none → 标记属性 */
function hideElement(el: Element): void {
  const htmlEl = el as HTMLElement;
  if (!htmlEl.hasAttribute(DISPLAY_RESTORE_ATTR)) {
    htmlEl.setAttribute(DISPLAY_RESTORE_ATTR, htmlEl.style.display || '');
  }
  htmlEl.style.display = 'none';
  htmlEl.setAttribute(HIDDEN_ATTR, 'true');
}

/** 恢复元素：还原原 display → 移除标记属性 */
function showElement(el: Element): void {
  const htmlEl = el as HTMLElement;
  const originalDisplay = htmlEl.getAttribute(DISPLAY_RESTORE_ATTR);
  htmlEl.style.display = originalDisplay || '';
  htmlEl.removeAttribute(DISPLAY_RESTORE_ATTR);
  htmlEl.removeAttribute(HIDDEN_ATTR);
}

const mounted = (el: Element, binding: DirectiveBinding<string | string[]>) => {
  if (!checkAccess(el, binding)) {
    hideElement(el);
  }
};

/** 权限变更时重新评估（如角色切换、权限码刷新），支持恢复显示 */
const updated = (el: Element, binding: DirectiveBinding<string | string[]>) => {
  // 元素已被外部逻辑移除时跳过
  if (!document.contains(el)) return;
  const hasAccess = checkAccess(el, binding);
  const wasHidden = el.hasAttribute(HIDDEN_ATTR);

  if (!hasAccess && !wasHidden) {
    // 之前可见，现在无权限 → 隐藏
    hideElement(el);
  } else if (hasAccess && wasHidden) {
    // 之前隐藏，现在有权限 → 恢复显示
    showElement(el);
  }
};

/** v-access 指令：OR 语义权限校验，按 accessMode 自动选择角色或权限码 */
const authDirective: Directive = {
  mounted,
  updated,
};

/**
 * v-permission 指令 —— 基于 API 权限码的按钮级鉴权（AND 语义：全部匹配才放行）。
 *
 * <p>与 v-access:code 的区别：
 * <ul>
 *   <li>v-access:code：OR 语义（数组中任意一项命中即放行），沿用 vben-admin 旧习</li>
 *   <li>v-permission：AND 语义（必须全部命中才放行），对齐后端 @AuthApiPermission 语义</li>
 * </ul>
 *
 * <p>始终按权限码（apiCode）模式校验，忽略 preferences.app.accessMode 与 arg。
 */
function checkPermission(binding: DirectiveBinding<string | string[]>): boolean {
  const value = binding.value;
  if (!value) return true;
  const { hasAccessByCodesAll } = getAccess();
  const values = Array.isArray(value) ? value : [value];
  return hasAccessByCodesAll(values);
}

const permissionDirective: Directive = {
  mounted(el: Element, binding: DirectiveBinding<string | string[]>) {
    if (!checkPermission(binding)) {
      hideElement(el);
    }
  },
  updated(el: Element, binding: DirectiveBinding<string | string[]>) {
    if (!document.contains(el)) return;
    const hasAccess = checkPermission(binding);
    const wasHidden = el.hasAttribute(HIDDEN_ATTR);
    if (!hasAccess && !wasHidden) {
      hideElement(el);
    } else if (hasAccess && wasHidden) {
      showElement(el);
    }
  },
};

/**
 * 同时注册 v-access 和 v-permission 两条全局指令。
 *
 * <p>注册后可在模板中使用：
 * <ul>
 *   <li>{@code v-access:code="'sys:dict:add'"} — OR 语义：拥有 sys:dict:add 即放行</li>
 *   <li>{@code v-permission="['sys:dict:add', 'sys:dict:edit']"} — AND 语义：同时拥有两者才放行</li>
 * </ul>
 *
 * @param app - 需要注册指令的 Vue 应用实例，通常在应用启动阶段调用一次
 */
export function registerAccessDirective(app: App) {
  app.directive('access', authDirective);
  app.directive('permission', permissionDirective);
}
