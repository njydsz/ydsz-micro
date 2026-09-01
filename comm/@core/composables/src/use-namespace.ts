/**
 * BEM 类名生成工具：按 `namespace-block__element--modifier` 规则拼装类名。
 *
 * 组件库所有类名统一经此生成，保证命名空间一致（默认 YDSZ），业务侧的样式覆盖
 * 才能稳定命中而不依赖内部实现细节。
 * 状态类固定以 `is-` 前缀与结构类区分，便于按前缀批量增删状态而不误伤结构类名。
 *
 * @path comm\@core\composables\src\use-namespace.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { DEFAULT_NAMESPACE } from '@YDSZ-core/shared/constants';

/**
 * @see copy https://github.com/element-plus/element-plus/blob/dev/comm/hooks/use-namespace/index.ts
 */

const statePrefix = 'is-';

const _bem = (
  namespace: string,
  block: string,
  blockSuffix: string,
  element: string,
  modifier: string,
) => {
  let cls = `${namespace}-${block}`;
  if (blockSuffix) {
    cls += `-${blockSuffix}`;
  }
  if (element) {
    cls += `__${element}`;
  }
  if (modifier) {
    cls += `--${modifier}`;
  }
  return cls;
};

const is: {
  (name: string): string;

  (name: string, state: boolean | undefined): string;
} = (name: string, ...args: [] | [boolean | undefined]) => {
  const state = args.length > 0 ? args[0] : true;
  return name && state ? `${statePrefix}${name}` : '';
};

const useNamespace = (block: string) => {
  const namespace = DEFAULT_NAMESPACE;
  const b = (blockSuffix = '') => _bem(namespace, block, blockSuffix, '', '');
  const e = (element?: string) => (element ? _bem(namespace, block, '', element, '') : '');
  const m = (modifier?: string) => (modifier ? _bem(namespace, block, '', '', modifier) : '');
  const be = (blockSuffix?: string, element?: string) =>
    blockSuffix && element ? _bem(namespace, block, blockSuffix, element, '') : '';
  const em = (element?: string, modifier?: string) =>
    element && modifier ? _bem(namespace, block, '', element, modifier) : '';
  const bm = (blockSuffix?: string, modifier?: string) =>
    blockSuffix && modifier ? _bem(namespace, block, blockSuffix, '', modifier) : '';
  const bem = (blockSuffix?: string, element?: string, modifier?: string) =>
    blockSuffix && element && modifier
      ? _bem(namespace, block, blockSuffix, element, modifier)
      : '';

  // for css var
  // --el-xxx: value;
  const cssVar = (object: Record<string, string>) => {
    const styles: Record<string, string> = {};
    for (const key in object) {
      if (object[key]) {
        styles[`--${namespace}-${key}`] = object[key];
      }
    }
    return styles;
  };
  // with block
  const cssVarBlock = (object: Record<string, string>) => {
    const styles: Record<string, string> = {};
    for (const key in object) {
      if (object[key]) {
        styles[`--${namespace}-${block}-${key}`] = object[key];
      }
    }
    return styles;
  };

  const cssVarName = (name: string) => `--${namespace}-${name}`;
  const cssVarBlockName = (name: string) => `--${namespace}-${block}-${name}`;

  return {
    b,
    be,
    bem,
    bm,
    // css
    cssVar,
    cssVarBlock,
    cssVarBlockName,
    cssVarName,
    e,
    em,
    is,
    m,
    namespace,
  };
};

type UseNamespaceReturn = ReturnType<typeof useNamespace>;

export type { UseNamespaceReturn };
export { useNamespace };

