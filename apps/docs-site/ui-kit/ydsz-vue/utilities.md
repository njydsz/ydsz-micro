# YDSZ Vue — Composables & 工具函数参考

## composables（业务特化）

### useControlledState

受控 / 非受控状态统一封装，自动处理 `v-model` 与内部状态切换。

```typescript
function useControlledState<T>(
  props: { modelValue?: T, model_value?: T },
  emit: (event: 'update:modelValue', value: T) => void,
  options?: UseControlledStateOptions<T>
): ControlledStateHandle<T>
```

**UseControlledStateOptions:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `debounce` | `number` | 防抖等待(ms)，0 = 不防抖 |
| `onBeforeCommit` | `(newValue, oldValue) => boolean \| Promise<boolean>` | 提交前校验，返回 false 阻断 |
| `isDirty` | `(newValue, oldValue) => boolean` | 自定义脏值判定 |

**ControlledStateHandle（返回值）:**

| 字段/方法 | 类型 |
|-----------|------|
| `localValue` | `Ref<T>` |
| `isDirty` | `Ref<boolean>` |
| `commit` | `() => Promise<boolean>` |
| `reset` | `() => void` |
| `sync` | `() => void` |

---

### useDebouncedSearch

带防抖的搜索输入，返回搜索词、结果和加载状态。

```typescript
function useDebouncedSearch<T>(
  fetcher: (query: string) => Promise<T[]>,
  options?: UseDebouncedSearchOptions
): UseDebouncedSearchHandle<T>
```

**UseDebouncedSearchOptions:**

| 字段 | 类型 | 默认值 |
|------|------|--------|
| `debounceMs` | `number` | `300` |
| `minLength` | `number` | `1` |

**UseDebouncedSearchHandle（返回值）:**

| 字段/方法 | 类型 |
|-----------|------|
| `query` | `Ref<string>` |
| `results` | `Ref<T[]>` |
| `isLoading` | `Ref<boolean>` |
| `error` | `Ref<Error \| null>` |
| `search` | `() => void` |
| `reset` | `() => void` |

---

### useTenantAwareSelection

租户感知的选择器多选逻辑，切换租户自动清空已选。

```typescript
function useTenantAwareSelection<T>(
  options: UseTenantAwareOptions
): UseTenantAwareHandle<T>
```

**UseTenantAwareOptions:**

| 字段 | 类型 |
|------|------|
| `tenantKey` | `Ref<string> \| string` |
| `onTenantChange` | `(newVal: string, oldVal: string) => void` |

**UseTenantAwareHandle（返回值）:**

| 字段/方法 | 类型 |
|-----------|------|
| `selected` | `Ref<T[]>` |
| `clearSelection` | `() => void` |
| `setSelected` | `(vals: T[]) => void` |

---

## Primitive & 组件原语

### Primitive 通用原语组件

所有组件的渲染基础，支持动态标签和属性透传。

| 属性 | 类型 | 默认值 | 必填 |
|------|------|--------|------|
| `as` | `AsTag \| Component` | `'div'` | 否 |
| `asChild` | `boolean` | `false` | 否 |

**AsTag 枚举:**
```typescript
type AsTag = 'a' | 'button' | 'div' | 'form' | 'h2' | 'h3' | 'img'
           | 'input' | 'label' | 'li' | 'nav' | 'ol' | 'p' | 'span'
           | 'svg' | 'ul' | 'template' | ({} & string)
```

### Slot 插槽透传

自动合并父级 attrs 到第一个非注释子节点，用于 `asChild="template"` 模式。

### Presence 状态保持

```vue
<Presence :present="isVisible">
  <div>动画内容</div>
</Presence>
```

| 属性 | 类型 | 必填 |
|------|------|------|
| `present` | `boolean` | **是** |
| `forceMount` | `boolean` | 否 |

- **Slots**: `default` `(opts: { present: Ref<boolean> })`
- **Expose**: `present: Ref<boolean>` — 等待动画结束后才变为 false

### VisuallyHidden 视觉隐藏

内容对视觉隐藏但可被屏幕阅读器识别，用于无障碍标签。

---

## shared 工具函数

### 通用工具

| 函数 | 签名 | 说明 |
|------|------|------|
| `clamp` | `(value: number, min?: number, max?: number) => number` | 数值夹取到 [min, max] |
| `snapValueToStep` | `(value, min, max, step) => number` | 对齐到 step 最近值 |
| `pick` | `<T, K>(object: T, keys: K[]) => Pick<T, K>` | 从对象挑选指定键 |
| `omit` | `<T, K>(obj: T, ...keys: K[]) => Omit<T, K>` | 从对象移除指定键 |
| `isNullish` | `(value: any) => boolean` | 判断 null 或 undefined |
| `areEqual` | `(arrayA: any[], arrayB: any[]) => boolean` | 浅比较数组相等 |
| `chunk` | `<T>(arr: T[], size: number) => T[][]` | 分组切割 |
| `getActiveElement` | `() => Element \| null` | 获取当前活跃元素（穿透 shadow DOM） |
| `trapFocus` | `(element: HTMLElement) => HTMLElement \| undefined` | Tab focus trapping |
| `onFocusOutside` | `(element, handler) => void` | focus outside 事件监听 |
| `renderSlotFragments` | `(children?: VNode[]) => VNode[]` | 展平 Fragment slot 节点 |
| `isValidVNodeElement` | `(input: any) => boolean` | 判断是否为有效 VNode 元素 |
| `handleAndDispatchCustomEvent` | `<E>(name, handler, detail) => void` | 创建并派发自定义事件 |
| `isBrowser` | `boolean` | 是否浏览器环境（SSR 安全） |

### 状态与上下文

| 函数 | 签名 | 说明 |
|------|------|------|
| `createContext` | `<V>(providerName, contextName?) => [inject, provide]` | 类型安全的 provide/inject 工厂 |
| `useStateMachine` | `<M>(initialState, machine) => { state, dispatch }` | 有限状态机 |
| `useId` | `(deterministicId?, prefix?) => string` | 唯一 ID 生成（SSR Safe） |
| `useDirection` | `(dir?) => ComputedRef<Direction>` | RTL/LTR 方向检测 |

### Props / Emits 转发

| 函数 | 签名 | 说明 |
|------|------|------|
| `useForwardProps` | `<T>(props) => ComputedRef<T>` | 合并默认值 + 已传值 |
| `useForwardPropsEmits` | `<T, N>(props, emit?) => ComputedRef<T & EmitsAsProps>` | 转发 props + emits |
| `useForwardExpose` | `() => { forwardRef, currentRef, currentElement }` | 自动转发组件暴露方法 |
| `useEmitAsProps` | `<N>(emit) => Record<string, any>` | 将 emit 事件转成 onXx props |
| `useForwardRef` | `() => handleRefChange` | 直接将 ref 赋值给 expose |

### 浏览器 / DOM

| 函数 | 签名 | 说明 |
|------|------|------|
| `useBodyScrollLock` | `(initialState?: boolean) => Ref<boolean>` | body 滚动锁定（共享 stack） |
| `useFocusGuards` | `() => void` | 注入 focus guard 元素 |
| `useHideOthers` | `(target) => void` | aria-hidden 隐藏其他元素 |
| `useArrowNavigation` | `(e, current, parent, options?) => HTMLElement \| null` | 键盘方向键导航 |
| `useGraceArea` | `(trigger, container) => { isPointerInTransit, onPointerExit }` | hover 过渡 grace area |
| `useTypeahead` | `(collections?) => { search, handleTypeaheadSearch, resetTypeahead }` | 字符快速导航 |
| `useSelectionBehavior` | `<T>(modelValue, props) => { firstValue, onSelectItem, handleMultipleReplace }` | 多选/单选 selection 行为 |
| `useCollection` | `(key?, name?) => { createCollection, injectCollection }` | 集合项 provide/inject |
| `useSize` | `(element) => { width, height }` | ResizeObserver 元素尺寸 |

### 格式化

| 函数 | 签名 | 说明 |
|------|------|------|
| `useDateFormatter` | `(initialLocale: string) => Formatter` | 基于 Intl 的日期格式化 |
| `useKbd` | `() => Record<KbdKeys, string>` | 键盘符号常量映射（跨平台自动适配） |
| `useTestKbd` | `() => Record<KbdKeys, string>` | 测试用键盘常量（花括号包裹形式） |

### 默认值包装

| 函数 | 签名 | 说明 |
|------|------|------|
| `withDefault` | `<T, C>(originalComponent, options?) => T` | 包装组件并注入默认 props |
| `useFormControl` | `(el) => ComputedRef<boolean>` | 判断元素是否在 form 内 |

---

## 共享类型 (types.ts)

```typescript
type DataOrientation = 'vertical' | 'horizontal'
type Direction = 'ltr' | 'rtl'
type Type = 'single' | 'multiple'    // @deprecated
type SingleOrMultipleType = 'single' | 'multiple'
type StringOrNumber = string | number
type AcceptableValue = string | number | boolean | Record<string, any>

interface SingleOrMultipleProps<V, T> {
  type?: T
  modelValue?: V
  defaultValue?: V
}

type ScrollBodyOption = { padding?: boolean | number | string, margin?: boolean | number | string }
type ArrayOrWrapped<T> = T extends any[] ? T : Array<T>
```
