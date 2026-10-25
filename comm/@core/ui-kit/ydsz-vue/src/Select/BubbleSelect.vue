<script setup lang="ts">
import { ref, toRefs } from 'vue'
import { VisuallyHidden } from '../VisuallyHidden/index.ts'

interface BubbleSelectProps {
  autocomplete?: string
  autofocus?: boolean
  disabled?: boolean
  form?: string
  multiple?: boolean
  name?: string
  required?: boolean
  size?: number
  value?: any
}

const props = defineProps<BubbleSelectProps>()
// 透传的 $attrs 可能包含表单适配器注入的 `options` 数组等组件级参数，
// 落到原生 <select> 上会触发无效 DOM prop 警告，故禁止自动继承。
defineOptions({ inheritAttrs: false })
const { value } = toRefs(props)
const selectElement = ref<HTMLElement>()

// This would bubble "change" event to form, with the target as Select element.
// We temporary disable this as not sure if it will be needed for Vue
// watch(value, () => {
//   const selectProto = window.HTMLSelectElement.prototype;
//   const descriptor = Object.getOwnPropertyDescriptor(
//     selectProto,
//     "value"
//   ) as PropertyDescriptor;
//   const setValue = descriptor.set;
//   if (prevValue.value !== value.value && setValue) {
//     const event = new Event("change", { bubbles: true });
//     setValue.call(selectElement.value, value.value);
//     selectElement.value?.dispatchEvent(event);
//   }
// });

/**
 * We purposefully use a `select` here to support form autofill as much
 * as possible.
 *
 * We purposefully do not add the `value` attribute here to allow the value
 * to be set programmatically and bubble to any parent form `onChange` event.
 *
 * We use `VisuallyHidden` rather than `display: "none"` because Safari autofill
 * won't work otherwise.
 *
 * `aria-hidden` + `tabindex="-1"`：这个 select 只是值与自动填充的镜像，可访问名由
 * SelectTrigger 承担；不隐藏会把它留在无障碍树与 Tab 序列里（axe `select-name` 违规）。
 */
</script>

<template>
  <VisuallyHidden as-child>
    <select
      ref="selectElement"
      v-bind="props"
      v-model="value"
      aria-hidden="true"
      tabindex="-1"
      :default-value="value"
    >
      <slot />
    </select>
  </VisuallyHidden>
</template>
