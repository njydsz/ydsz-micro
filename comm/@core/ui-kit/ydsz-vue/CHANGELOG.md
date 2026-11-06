# Changelog — @ydsz-core/ydsz-vue

本项目所有重要变更将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循
[Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 变更

- **P0-1 包发布形态**：新增
  `build.config.ts`（mkdist 逐文件转译），默认 export 从源码改为 dist 构建产物 (`dist/index.mjs`)，新增
  `development` 条件保留源码入口

## [1.0.0] - 2026-09-17

### 新增

- 从 radix-vue@1.9.17 fork 并内化为 `@ydsz-core/ydsz-vue`
- 38 个 Headless 原语组件族（Accordion / AlertDialog / Avatar / Checkbox /
  Collapsible / ContextMenu / Dialog / DropdownMenu / HoverCard / Label / Menu /
  NumberField / Pagination / PinInput / Popover / Popper / Presence / Primitive
  / Progress / RadioGroup / RovingFocus / ScrollArea / Select / Separator /
  Slider / Splitter / Switch / Tabs / Teleport / Toggle / ToggleGroup / Tooltip
  / Tree / Viewport / VisuallyHidden / DismissableLayer / FocusGuards /
  FocusScope / ConfigProvider）
- 共享工具层（createContext / useForwardProps / useForwardPropsEmits /
  useBodyScrollLock / useFormControl / useDirection / useId / useStateMachine /
  useTypeahead / useArrowNavigation / trapFocus / Slot 等）
