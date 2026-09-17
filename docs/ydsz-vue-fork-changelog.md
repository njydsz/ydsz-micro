# YDSZ-VUE Fork 与上游 Cherry-Pick 机制

> 编制日期：2026-09-17
> 适用范围：`comm/@core/ui-kit/ydsz-vue` v1.0.0
> 上游基线：radix-vue@1.9.17 / reka-ui v2.x

---

## 一、Fork 策略总览

ydsz-vue 是 YDSZ 团队基于 radix-vue@1.9.17 源码内化的 headless 组件层。与直接跟迁 reka-ui 不同，我们选择 fork-and-own 路线：

| 维度 | 策略 |
|---|---|
| 版本基线 | 锁定 fork 时刻的 radix-vue@1.9.17 全量源码 |
| 源码范围 | 仅纳入 ydsz-ui 60 个文件实际引用的 38 个组件族 + 工具函数 |
| 演进方式 | 按需 cherry-pick reka-ui 版本的修复/重设计，不被迫跟迁 |
| 维护者 | YDSZ 前端架构组，组件库维护者负责评估与合并 |

**核心原则**：上游是"参考源"而非"依赖源"。我们只在我们需要时、按我们节奏吸收上游改动。

---

## 二、目录约定

```
comm/@core/ui-kit/ydsz-vue/
├── src/
│   ├── Accordion/        ← forked from radix-vue@1.9.17/Accordion
│   ├── AlertDialog/      ← forked from radix-vue@1.9.17/AlertDialog
│   ├── ...
│   ├── Tree/             ← forked from radix-vue@1.9.17/Tree
│   ├── Primitive/        ← 保留 Primitive / Slot / AsTag 工具
│   ├── VisuallyHidden/
│   ├── shared/           ← useForwardPropsEmits / useForwardProps / ...
│   ├── Presence/         ← 动画状态机
│   ├── Popper/           ← 定位引擎
│   └── Menu/             ← ContextMenu / DropdownMenu 公共基类
├── LICENSE               ← MIT (保留原 radix-vue 版权声明)
└── package.json
```

每个组件目录内的文件结构保持与上游原始结构一致（含单文件的 .vue 组件、index.ts 聚合出口、`<component>.utils.ts` 辅助函数），便于后续与上游 diff 对齐。

---

## 三、Cherry-Pick 流程

当 reka-ui（上游的新版本名）发布新版本时：

### 3.1 触发评估

upstream-watch 负责人（轮值）在上游 release 7 天内完成评估矩阵：

| 评估项 | 判定标准 | 动作 |
|---|---|---|
| BUG 修复型 | 修复了我们已知的问题或安全漏洞 | **必须 pick**，直接合入 |
| API 重设计 | 改变了 props/slots/emits 命名 | **评估 pick**，需评估对 ydsz-ui 薄封装层的影响 |
| 性能优化 | 渲染性能、包体积改善 | **评估 pick**，跑 benchmark 确认收益 |
| 新增特性 | 新增 props/行为 | **按需 pick**，有业务需求才纳入 |
| 新组件 | 全新的组件族 | **独立决策**，走 RFC 流程 |

### 3.2 Cherry-Pick 操作

1. 创建 `cherry-pick/reka-<版本号>-<issue>` 分支；
2. 在 diff 工具中对照该组件目录的当前代码与上游同路径代码；
3. 仅 migrate 目标改动（不以覆盖式整文件替换）；
4. 确认 ydsz-ui 对应 primitives 文件的 import 与类型不需要联动修改；
5. 跑 ydzs-ui 全部 17 测试 + 18 stories 确认无回归；
6. 在主 changelog 登记。

### 3.3 合并后检查

- [ ] 改动涉及的所有 .vue 文件类型检查通过
- [ ] `useForwardPropsEmits` 签名稳定性（最敏感的破坏点）
- [ ] `data-state` 属性值未变更（下游组件可能通过属性选择器匹配）
- [ ] aria-* 属性未缺失

---

## 四、变更日志

> 从 v1.0.0 起（含原始 fork 基线）

### v1.0.0 — 2026-09-17 · Fork 基线

- **【fork】** 从 radix-vue@1.9.17 内化 38 个组件族 + 12 个工具函数
- **【scope】** 纳入范围：Accordion / AlertDialog / Avatar / Checkbox / Collapsible / ContextMenu / Dialog / DropdownMenu / HoverCard / Label / Menu / NumberField / Pagination / PinInput / Popover / Progress / RadioGroup / ScrollArea / Select / Separator / Slider / Splitter / Switch / Tabs / Toggle / ToggleGroup / Tooltip / Tree + Primitive / VisuallyHidden / Presence / Popper / RovingFocus / FocusScope / FocusGuards / Collection / DismissableLayer / Teleport / Viewport
- **【exclude】** 不纳入：AspectRatio / Calendar / Combobox / ConfigProvider / DateField / DatePicker / DateRangeField / DateRangePicker / Editable / Listbox / Menubar / NavigationMenu / RangeCalendar / Stepper / TagsInput / Toast / Toolbar（ydsz-ui 未引用）
- **【infra】** ydzs-ui 60 文件 + composables 5 个工具函数全部从 `radix-vue` 切至 `@ydsz-core/ydsz-vue`
- **【radix-vue 依赖】** workspace 内已无任何源码对其的直接引用
- **【compile】** vue-tsc 通过（3 个预存在模板错误与本次迁移无关）

---

## 五、风险与回退

| 风险 | 应对 |
|---|---|
| reka-ui 发布重大安全修复 | 高优先级 cherry-pick，48h 内评估完成 |
| 上游Floating UI / vueuse 大版本不兼容 | ydzs-vue 锁定内部依赖版本，独立升级 |
| fork 漂移导致 cherry-pick 冲突加剧 | 每季度对高价值组件做一次全量 diff |

**回退方案**：如需回归 reka-ui，package.json 中 `@ydsz-core/ydsz-vue` → `reka-ui` 一行切换即可，因为 ydzs-ui 从未直接使用 reka-ui 特有 API。

---

## 六、联系与Owner

- upstream-watch 轮值：前端架构组周轮值
- cherry-pick 审批：组件库维护者
- 紧急安全修复：任何团队成员可发起，24h 内必须有人响应
