---
layout: home
hero:
  name: YDSZ-UI
  text: 现代化 Vue 3 组件库
  tagline: 基于 Radix Vue · Tailwind CSS · class-variance-authority 构建的企业级微应用组件体系
  image:
    src: /logo.svg
    alt: YDSZ-UI Logo
  actions:
    - theme: brand
      text: 快速开始
      link: /components/button
    - theme: alt
      text: 组件总览
      link: /components/components

features:
  - icon: 🧬
    title: 微内核驱动
    details: 基于 micro-kernel 架构设计，组件库作为独立子包发布，支持微前端场景下的跨应用共享与按需加载。
  - icon: 🎨
    title: 零样式侵入
    details: 核心逻辑基于 Radix Vue 的无障碍原语，UI 层通过 cva + Tailwind CSS 实现，视觉效果完全可配置、可覆盖。
  - icon: 🔧
    title: 类型安全
    details: 全 TypeScript 编写，Props 类型从 cva 配置自动推导，新增变体无需手动同步类型定义。
  - icon: ♿
    title: 无障碍优先
    details: 继承 Radix Vue 完整的键盘导航与 ARIA 语义，每个组件都经过 axe-core 自动化测试验证。
  - icon: 📦
    title: 90+ 组件
    details: 覆盖基础表单、数据展示、导航、反馈、布局等全场景，按 primitive / composite / business 三层架构分层组织。
  - icon: 🚀
    title: 虚拟化就绪
    details: Table 内置虚拟滚动支持，轻松应对万级数据渲染；Select 提供虚拟化下拉面板选项。
---

<div style="text-align: center; padding: 2rem 0 1rem;">

## 设计理念

YDSZ-UI 秉持「**无障碍为底线，组合式设计为核心，类型驱动为保证**」的设计理念，为微应用集群提供统一的 UI 基础设施。

### 组件总数

当前版本提供 **90+** 个开箱即用的组件，涵盖以下分类：

| 分类 | 组件数量 | 示例 |
|------|---------|------|
| 基础层 (Primitives) | 90+ | Button, Input, Select, Table, Dialog... |
| 复合层 (Composite) | 15+ | Form, DatePicker, TreeSelect, Upload... |
| 业务层 (Business) | 8+ | PageHeader, Breadcrumb, ConfigProvider... |

### 三层架构

```
┌──────────────────────────────────────────┐
│         业务层 (Business)                  │
│   PageHeader │ ConfigProvider │ Theme      │
├──────────────────────────────────────────┤
│         复合层 (Composite)                 │
│   Form │ DatePicker │ Upload │ Transfer    │
├──────────────────────────────────────────┤
│         基础层 (Primitives)                │
│   Button │ Input │ Select │ Table │ ...   │
├──────────────────────────────────────────┤
│         依赖基座                           │
│   Radix Vue │ Tailwind CSS │ Vue 3        │
└──────────────────────────────────────────┘
```

</div>
