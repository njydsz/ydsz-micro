/**
 * 将项目 CSS 变量映射为各 UI 框架设计令牌的主题适配层。
 *
 * 支持 Antd、Naive UI 两套框架的主题同步，
 * 运行时监听 preferences.theme 变化自动更新，无需手动刷新。
 *
 * @path comm\effects\hooks\src\use-design-tokens.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { reactive, watch } from 'vue';

import { preferences } from '@ydsz/preferences';
import { convertToRgb } from '@ydsz/utils';

/**
 * 用于适配各个框架的设计系统
 */

/**
 * 把项目 CSS 变量映射为 Ant Design 的 token，实现主题联动。
 *
 * @remarks
 * 调用即同步一次，后续通过 watch preferences.theme 自动更新。
 * 返回的 tokens 对象为 reactive，可在模板中直接绑定。
 *
 * 依赖 `document.documentElement`，仅限浏览器端使用。
 *
 * @returns `tokens` —— Ant Design 主题 token 集合（响应式）
 */
export function useAntdDesignTokens() {
  const rootStyles = getComputedStyle(document.documentElement);

  const tokens = reactive({
    borderRadius: '' as string,
    colorBgBase: '',
    colorBgContainer: '',
    colorBgElevated: '',
    colorBgLayout: '',
    colorBgMask: '',
    colorBorder: '',
    colorBorderSecondary: '',
    colorError: '',
    colorInfo: '',
    colorPrimary: '',
    colorSuccess: '',
    colorTextBase: '',
    colorWarning: '',
    zIndexPopupBase: 2000, // 调整基础弹层层级，避免下拉等组件被弹窗或者最大化状态下的表格遮挡
  });

  const getCssVariableValue = (variable: string, isColor: boolean = true) => {
    const value = rootStyles.getPropertyValue(variable);
    return isColor ? `hsl(${value})` : value;
  };

  watch(
    () => preferences.theme,
    () => {
      tokens.colorPrimary = getCssVariableValue('--primary');

      tokens.colorInfo = getCssVariableValue('--primary');

      tokens.colorError = getCssVariableValue('--destructive');

      tokens.colorWarning = getCssVariableValue('--warning');

      tokens.colorSuccess = getCssVariableValue('--success');

      tokens.colorTextBase = getCssVariableValue('--foreground');

      getCssVariableValue('--primary-foreground');

      tokens.colorBorderSecondary = tokens.colorBorder =
        getCssVariableValue('--border');

      tokens.colorBgElevated = getCssVariableValue('--popover');

      tokens.colorBgContainer = getCssVariableValue('--card');

      tokens.colorBgBase = getCssVariableValue('--background');

      const radius = Number.parseFloat(getCssVariableValue('--radius', false));
      // 1rem = 16px
      tokens.borderRadius = radius * 16;

      tokens.colorBgLayout = getCssVariableValue('--background-deep');
      tokens.colorBgMask = getCssVariableValue('--overlay');
    },
    { immediate: true },
  );

  return {
    tokens,
  };
}

/**
 * 把项目 CSS 变量映射为 Naive UI 的 `commonTokens`，实现主题联动。
 *
 * @remarks
 * 入参：无。
 *
 * 返回值：`{ commonTokens }`，可直接作为 `NConfigProvider` 的 `theme-overrides.common` 传入。
 * 该对象是 `reactive` 的，主题切换后引用不变、内部字段自动更新，无需重新赋值。
 *
 * 副作用与生命周期：
 * - 调用时立即（`immediate: true`）读取一次 CSS 变量并填充 tokens；
 * - 侦听 `preferences.theme` 变化重新计算，**未显式停止侦听**，
 *   因此建议在组件 `setup` 中调用（作用域销毁时自动回收），避免在模块顶层反复调用造成侦听器堆积；
 * - 依赖 `document.documentElement`，只能在浏览器端调用，SSR 环境会直接报错；
 * - `getComputedStyle` 的结果在调用时取得一次，若运行时替换整份主题样式表，需要重新调用本函数。
 *
 * 取值约定：项目 CSS 变量存的是不带 `hsl()` 包裹的裸值，这里统一补上 `hsl()`
 * 再由 `convertToRgb` 转成 Naive UI 可识别的 rgb 字符串；圆角 `--radius` 属于非颜色值，原样返回带单位的字符串。
 *
 * @returns `commonTokens` —— Naive UI 通用主题变量集合（响应式）
 */
export function useNaiveDesignTokens() {
  const rootStyles = getComputedStyle(document.documentElement);

  const commonTokens = reactive({
    baseColor: '',
    bodyColor: '',
    borderColor: '',
    borderRadius: '',
    cardColor: '',
    dividerColor: '',
    errorColor: '',
    errorColorHover: '',
    errorColorPressed: '',
    errorColorSuppl: '',
    invertedColor: '',
    modalColor: '',
    popoverColor: '',
    primaryColor: '',
    primaryColorHover: '',
    primaryColorPressed: '',
    primaryColorSuppl: '',
    successColor: '',
    successColorHover: '',
    successColorPressed: '',
    successColorSuppl: '',
    tableColor: '',
    textColorBase: '',
    warningColor: '',
    warningColorHover: '',
    warningColorPressed: '',
    warningColorSuppl: '',
  });

  const getCssVariableValue = (variable: string, isColor: boolean = true) => {
    const value = rootStyles.getPropertyValue(variable);
    return isColor ? convertToRgb(`hsl(${value})`) : value;
  };

  watch(
    () => preferences.theme,
    () => {
      commonTokens.primaryColor = getCssVariableValue('--primary');
      commonTokens.primaryColorHover = getCssVariableValue('--primary-600');
      commonTokens.primaryColorPressed = getCssVariableValue('--primary-700');
      commonTokens.primaryColorSuppl = getCssVariableValue('--primary-800');

      commonTokens.errorColor = getCssVariableValue('--destructive');
      commonTokens.errorColorHover = getCssVariableValue('--destructive-600');
      commonTokens.errorColorPressed = getCssVariableValue('--destructive-700');
      commonTokens.errorColorSuppl = getCssVariableValue('--destructive-800');

      commonTokens.warningColor = getCssVariableValue('--warning');
      commonTokens.warningColorHover = getCssVariableValue('--warning-600');
      commonTokens.warningColorPressed = getCssVariableValue('--warning-700');
      commonTokens.warningColorSuppl = getCssVariableValue('--warning-800');

      commonTokens.successColor = getCssVariableValue('--success');
      commonTokens.successColorHover = getCssVariableValue('--success-600');
      commonTokens.successColorPressed = getCssVariableValue('--success-700');
      commonTokens.successColorSuppl = getCssVariableValue('--success-800');

      commonTokens.textColorBase = getCssVariableValue('--foreground');

      commonTokens.baseColor = getCssVariableValue('--primary-foreground');

      commonTokens.dividerColor = commonTokens.borderColor =
        getCssVariableValue('--border');

      commonTokens.modalColor = commonTokens.popoverColor =
        getCssVariableValue('--popover');

      commonTokens.tableColor = commonTokens.cardColor =
        getCssVariableValue('--card');

      commonTokens.bodyColor = getCssVariableValue('--background');
      commonTokens.invertedColor = getCssVariableValue('--background-deep');

      commonTokens.borderRadius = getCssVariableValue('--radius', false);
    },
    { immediate: true },
  );
  return {
    commonTokens,
  };
}
