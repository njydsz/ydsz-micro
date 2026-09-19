# 编码规范总览

<script setup>
import StatsDashboard from '../.vitepress/theme/components/StatsDashboard.vue';
</script>

YDSZ 编码规范覆盖前后端全部代码产出，由 Checkstyle + ESLint + ArchUnit + vue-tsc 四层门禁强制执行。

<StatsDashboard />

## 规范层级

| 级别 | 标识 | 含义 | 门禁行为 |
|------|------|------|----------|
| **P0 阻断级** | 🔴 | AI 编码绝对禁止违反 | PR 自动拒绝（门禁失败） |
| **P1 严格级** | 🟠 | 违反需人工确认 | CI warning + review 必须确认 |
| **P2 建议级** | 🟢 | 最佳实践，可灵活采纳 | 仅提示，不阻断 |

## 规则库统计

| 维度 | 数量 |
|------|------|
| **规则总数** | 64 |
| **P0 阻断级** | 39 |
| **P1 严格级** | 19 |
| **P2 建议级** | 3 |

## 规范来源

规范正文：`D:\Code\open\ydsz-cloud\docs\云顶编码规范.md`

AI 规则源：`D:\Code\open\ydsz-cloud\docs\ai-rules\shared-rules.yaml`

本地生效规则：`D:\Code\open\ydsz-cloud\.meituan-catpaw\5728405356\rules\catpaw-always.md`

## 索引

- [P0 阻断级规则](./p0-critical) — 39 条强制遵守规则
- [P1 严格级规则](./p1-strict) — 19 条需确认规则
- [P2 建议级规则](./p2-guideline) — 3 条参考建议
