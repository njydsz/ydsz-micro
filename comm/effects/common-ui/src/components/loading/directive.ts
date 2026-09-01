/**
 * `v-loading` / `v-spinning` 两个遮罩指令的实现。
 *
 * 为什么用指令而不是组件：遮罩的诉求是「给任意已有元素盖一层 loading」，
 * 用组件需要业务方在模板里额外包一层并自己维护 v-if；指令则直接在宿主元素上
 * 叠加，不侵入 DOM 结构，也不要求宿主是组件。
 *
 * 实现要点：
 * - 用 `h()` + `render()` 手动把遮罩组件挂载到宿主元素，因此指令与具体组件解耦，
 *   两个指令分别对应 YDSZLoading（全屏/区域遮罩）与 YDSZSpinner（行内小图标）；
 * - 实例句柄存在元素的 Symbol 属性上，`unmounted` 时 `render(null, el)` 卸载，
 *   避免指令卸载后组件残留；
 * - 宿主元素会被加上 `spinner-parent--relative`，因为遮罩是绝对定位，
 *   宿主若非定位上下文，遮罩会溢出到最近的定位祖先。
 *
 * @path comm\effects\common-ui\src\components\loading\directive.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { App, Directive, DirectiveBinding } from 'vue';

import { h, render } from 'vue';

import { YDSZLoading, YDSZSpinner } from '@YDSZ-core/shadcn-ui';
import { isString } from '@YDSZ-core/shared/utils';

import { createLogger } from '@YDSZ-core/shared/utils';
const logger = createLogger('directive');
const LOADING_INSTANCE_KEY = Symbol('loading');
const SPINNER_INSTANCE_KEY = Symbol('spinner');

const CLASS_NAME_RELATIVE = 'spinner-parent--relative';

const loadingDirective: Directive = {
  mounted(el, binding) {
    const instance = h(YDSZLoading, getOptions(binding));
    render(instance, el);

    el.classList.add(CLASS_NAME_RELATIVE);
    el[LOADING_INSTANCE_KEY] = instance;
  },
  unmounted(el) {
    const instance = el[LOADING_INSTANCE_KEY];
    if (instance) {
      el.classList.remove(CLASS_NAME_RELATIVE);
      render(null, el);
      el[LOADING_INSTANCE_KEY] = null;
    }
  },

  updated(el, binding) {
    const instance = el[LOADING_INSTANCE_KEY];
    const options = getOptions(binding);
    if (options && instance?.component) {
      try {
        Object.keys(options).forEach((key) => {
          instance.component.props[key] = options[key];
        });
        instance.component.update();
      } catch (error) {
        logger.error('更新 loading 组件失败:', error);
      }
    }
  },
};

function getOptions(binding: DirectiveBinding) {
  if (binding.value === undefined) {
    return { spinning: true };
  } else if (typeof binding.value === 'boolean') {
    return { spinning: binding.value };
  } else {
    return { ...binding.value };
  }
}

const spinningDirective: Directive = {
  mounted(el, binding) {
    const instance = h(YDSZSpinner, getOptions(binding));
    render(instance, el);

    el.classList.add(CLASS_NAME_RELATIVE);
    el[SPINNER_INSTANCE_KEY] = instance;
  },
  unmounted(el) {
    const instance = el[SPINNER_INSTANCE_KEY];
    if (instance) {
      el.classList.remove(CLASS_NAME_RELATIVE);
      render(null, el);
      el[SPINNER_INSTANCE_KEY] = null;
    }
  },

  updated(el, binding) {
    const instance = el[SPINNER_INSTANCE_KEY];
    const options = getOptions(binding);
    if (options && instance?.component) {
      try {
        Object.keys(options).forEach((key) => {
          instance.component.props[key] = options[key];
        });
        instance.component.update();
      } catch (error) {
        logger.error('更新 spinner 组件失败:', error);
      }
    }
  },
};

type loadingDirectiveParams = {
  /** 是否注册loading指令。如果提供一个string，则将指令注册为指定的名称 */
  loading?: boolean | string;
  /** 是否注册spinning指令。如果提供一个string，则将指令注册为指定的名称 */
  spinning?: boolean | string;
};

/**
 * 注册loading指令
 * @param app
 * @param params
 */
export function registerLoadingDirective(
  app: App,
  params?: loadingDirectiveParams,
) {
  // 注入一个样式供指令使用，确保容器是相对定位
  const style = document.createElement('style');
  style.id = CLASS_NAME_RELATIVE;
  style.innerHTML = `
    .${CLASS_NAME_RELATIVE} {
      position: relative !important;
    }
  `;
  document.head.append(style);
  if (params?.loading !== false) {
    app.directive(
      isString(params?.loading) ? params.loading : 'loading',
      loadingDirective,
    );
  }
  if (params?.spinning !== false) {
    app.directive(
      isString(params?.spinning) ? params.spinning : 'spinning',
      spinningDirective,
    );
  }
}
