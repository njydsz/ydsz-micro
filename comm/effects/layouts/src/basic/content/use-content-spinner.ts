/**
 * 路由切换期间的内容区加载遮罩控制。
 *
 * 挂在路由守卫上而非各页面内，是为了让「切路由就显示 loading」这一行为
 * 有唯一实现：新增页面无需关心 loading，也不会出现部分页面漏加导致
 * 切换时白屏无反馈。
 *
 * 关键设计：**最小显示时长 500ms**。若实际加载只要 50ms，不加这个下限
 * 遮罩会一闪而过，视觉上比不显示更糟（闪烁）；加上后即使瞬时完成也保持
 * 500ms，用户感知为稳定过渡。这也是 `onEnd` 里需要补一个延时定时器的原因。
 *
 * @path comm\effects\layouts\src\basic\content\use-content-spinner.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { preferences } from '@ydsz/preferences';

function useContentSpinner() {
  const spinning = ref(false);
  const startTime = ref(0);
  const router = useRouter();
  const minShowTime = 500; // 最小显示时间
  const enableLoading = computed(() => preferences.transition.loading);

  // 结束加载动画
  const onEnd = () => {
    if (!enableLoading.value) {
      return;
    }
    const processTime = performance.now() - startTime.value;
    // 补足到最小显示时长：加载太快时立即关闭会造成遮罩闪烁，
    // 观感上比不显示更差，因此宁可多停留一会儿
    if (processTime < minShowTime) {
      setTimeout(() => {
        spinning.value = false;
      }, minShowTime - processTime);
    } else {
      spinning.value = false;
    }
  };

  // 路由前置守卫
  router.beforeEach((to) => {
    if (to.meta.loaded || !enableLoading.value || to.meta.iframeSrc) {
      return true;
    }
    startTime.value = performance.now();
    spinning.value = true;
    return true;
  });

  // 路由后置守卫
  router.afterEach((to) => {
    if (to.meta.loaded || !enableLoading.value || to.meta.iframeSrc) {
      return true;
    }
    onEnd();
    return true;
  });

  return { spinning };
}

export { useContentSpinner };
