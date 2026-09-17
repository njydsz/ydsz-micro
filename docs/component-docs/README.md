# YDSZ-UI 组件文档站

基于 VitePress 构建的 YDSZ-UI 组件库文档站，提供组件 API 参考、使用示例和设计指南。

## 本地启动

```bash
# 在 Monorepo 根目录下执行
pnpm --filter @ydsz-docs/component-docs run dev
```

文档站默认运行在 `http://localhost:5173`，修改文件后自动热更新。

## 常用命令

```bash
# 启动开发服务器
pnpm --filter @ydsz-docs/component-docs run dev

# 构建生产版本
pnpm --filter @ydsz-docs/component-docs run build

# 预览生产构建
pnpm --filter @ydsz-docs/component-docs run preview
```

## 目录结构

```
component-docs/
├── package.json                          # vitepress 依赖声明
├── README.md                             # 本文档
└── docs/
    ├── index.md                          # 文档站首页（设计理念 + 三层架构）
    ├── .vitepress/
    │   ├── config.mts                    # VitePress 配置（nav / sidebar / 主题色）
    │   └── theme/
    │       ├── index.ts                  # 主题扩展入口（注入全局样式）
    │       └── styles.css                # 全局 CSS 变量与工具样式
    └── components/
        ├── components.md                 # 组件总览索引（90+ 组件分类列表）
        ├── button.md                     # Button 文档（API + 示例 + Props 表格）
        ├── input.md                      # Input 文档
        ├── select.md                     # Select 文档
        └── table.md                      # Table 文档
```

## 文档规范

每个组件文档遵循统一结构：

1. **设计要点** —— 组件核心设计理念与关键实现决策
2. **引入** —— 正确的 import 路径
3. **代码示例** —— 按场景分组的 Vue SFC 代码块（可直接复制使用）
4. **API 表格** —— Props / Events / Slots / 暴露方法的完整参考
5. **附加说明** —— 样式细节、变体对比、使用注意事项等

## 添加新组件文档

1. 在 `docs/components/` 下创建 `<name>.md`
2. 在 `docs/components/components.md` 的组件总览表中添加索引条目
3. 在 `docs/.vitepress/config.mts` 的 sidebar 中添加导航项
4. 确保 API Props 表格与 `@ydsz-core/ui-kit/ydsz-ui/src/primitives/<name>/` 中的实际定义一致

## 注意事项

- 本骨架使用代码块示例展示组件用法（不做 Vitepress + Vue live demo 集成），降低维护成本
- API Props 表格内容应直接对照 `ydsz-ui` 源码中的 TypeScript interface，确保类型精确性
- 品牌色变量定义在 `docs/.vitepress/theme/styles.css` 中，文档站与组件库共享同一套设计令牌
