/**
 * 图标组件工厂：把 Iconify 图标名固化成可直接使用的 Vue 组件。
 *
 * 存在的理由：直接写 <Icon icon="xxx" /> 要求每个使用点都引入 Icon 并重复传参，
 * 工厂函数把 icon 收进闭包，模板侧即可零配置使用；产出的组件带稳定 name，
 * 便于 devtools 定位与快照测试比对。
 *
 * 注意组件在调用时即时创建，同一图标多次调用会产生多份组件定义，
 * 高频使用处应把结果缓存为模块级常量。
 *
 * @path comm\@core\base\icons\src\create-icon.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineComponent, h } from 'vue';

import { Icon } from '@iconify/vue';

function createIconifyIcon(icon: string) {
  return defineComponent({
    name: `Icon-${icon}`,
    setup(props, { attrs }) {
      return () => h(Icon, { icon, ...props, ...attrs });
    },
  });
}

export { createIconifyIcon };

