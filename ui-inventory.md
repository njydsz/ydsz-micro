# YDSZ Vue UI 组件库现状盘点

## 一、当前 UI 组件分布

### Layer 1: comm/@core/ui-kit/（核心 UI 层，7 个包）

| 包名 | 组件数 | 命名风格 | 组件清单 |
|------|--------|----------|----------|
| `@ydsz-core/shadcn-ui` | 46 业务 + 34 原子 | Yd 前缀（刚统一） | YdButton, YdAvatar, YdDialog, Button(Dialog 原子)... |
| `@ydsz-core/form-ui` | 1 核心 + 类型 | YDSZ 前缀 | YDSZForm, YDSZFormProps, setupYDSZForm |
| `@ydsz-core/popup-ui` | 3 核心 | YDSZ 前缀+无前缀混用 | YDSZModal, YDSZDrawer, Alert |
| `@ydsz-core/menu-ui` | 3 核心 | 无前缀 | Menu, MenuBadge, NormalMenu |
| `@ydsz-core/tabs-ui` | 1 核心 | 无前缀 | TabsView |
| `@ydsz-core/layout-ui` | 1 核心 | YDSZ 前缀 | YDSZAdminLayout |
| `@ydsz-core/tiptap` | 1 核心 | YDSZ 前缀 | YDSZTiptapEditor |

### Layer 2: comm/effects/（业务效果层）

| 包名 | 关键组件 | 命名风格 |
|------|----------|----------|
| `common-ui` | ErrorBoundary, ErrorFeedback, NetworkStatus, Skeleton, EmptyState... | 无前缀 |
| `shared-business` | DictSelect, DictTag, UserAvatar, VirtualSelect, StatusBadge... | 无前缀 |
| `layouts` | AdminLayout, Header, Sidebar... | 无前缀 |

## 二、核心问题

1. **命名混乱**：YDSZ、Yd、无前缀三种风格共存
2. **分布散乱**：组件散落在 7+ 个包中，无统一出口
3. **品牌缺失**：对外没有统一的 "Ydsz Vue UI" 品牌形象
4. ** ui/ 原子组件无前缀**：shadcn 社区约定 Button/Dialog 等无前缀，但与业务组件命名风格不一致

## 三、统一方案

### 方案 B（推荐）：统一出口 + 渐进式迁移

```
@ydsz/vue-ui (对外品牌)
    └── @ydsz-core/ui (统一入口新包)
            ├── @ydsz-core/shadcn-ui  (原子 + 业务组件，Yd 前缀)
            ├── @ydsz-core/form-ui    (→ YdForm)
            ├── @ydsz-core/popup-ui   (→ YdModal, YdDrawer)
            ├── @ydsz-core/menu-ui    (→ YdMenu)
            ├── @ydsz-core/tabs-ui    (→ YdTabs)
            ├── @ydsz-core/layout-ui  (→ YdAdminLayout)
            └── @ydsz-core/tiptap     (→ YdTiptapEditor)
```

**步骤**：
1. 创建 `@ydsz-core/ui` 统一入口包
2. 逐个包将组件导出名统一为 Yd 前缀
3. `@ydsz-core/ui` re-export 所有组件
4. 对外发布时打 `@ydsz/vue-ui` tag
5. 现有代码保持兼容（旧导入路径仍然工作）

**优势**：
- 兼容旧代码，渐进式迁移不破坏现有业务
- 保持模块化编译（tree-shaking 友好）
- 统一对外形象：一套文档、一套版本号
- 三年内可逐步收敛物理包结构

### 方案 C（最低成本）：仅统一命名，不动包结构

直接在各包内将组件名统一为 Yd 前缀，不创建统一入口。

---
*Generated: 2026-09-17*
