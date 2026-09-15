# 前端业务模块路由与 API 调用定义扫描报告

> 扫描时间：2025-07-17  
> 工作区根目录：`D:\Code\open\ydsz-micro`  
> 扫描范围：`apps/` 下 9 个前端子应用

---

## 通用说明

- **路由前缀**：所有子应用均使用动态路由（`import.meta.glob('./modules/**/*.ts')`），路由定义在各应用的 `src/router/routes/modules/` 目录下。
- **路由基础**：所有应用共享相同的 `core.ts` 结构，包含根路由 `/`（自动重定向至 `preferences.app.defaultHomePath`）和全局 404 兜底 `/:path(.*)*`。
- **API 调用**：所有应用统一使用 `requestClient`（来自 `@ydsz/shared-auth`），其方法 `get/post/put/delete/patch` 对应 HTTP 方法。URL 以反引号包裹在调用参数首位。
- **`.generated-archived/`**：部分 API 目录下有 `.generated-archived/` 归档目录，含旧版自动生成代码，调用方式与当前活跃文件一致，API 清单中不重复列出。
- **`core/` 目录**：各应用 `api/core/` 下为公共模块（auth / menu / user / notification / preference 等），属通用基础 API，不在各应用 API 清单中逐一展开。
- **`sdk/` 目录**：含 OpenAPI 契约文件（`openapi.json`、`schema.d.ts`、`types-export.ts`），非手工 API 定义，不逐一展开。

---

## frontend-modules/agent-web

> 智能引擎前端 — 对应后端服务 `ydsz-agent`

### 路由清单

| 路径 path | 名称 name | 组件 component |
|---|---|---|
| `/agent/list` | AgentManagement | `#/views/agent/index.vue` |
| `/agent/definition` | DefinitionManagement | `#/views/definition/index.vue` |
| `/agent/chat` | AgentChatConsole | `#/views/agent-chat/index.vue` |
| `/rag/list` | RagManagement | `#/views/rag/index.vue` |
| `/dag/list` | DagManagement | `#/views/dag/index.vue` |
| `/approval/list` | ApprovalManagement | `#/views/approval/index.vue` |
| `/tool/list` | ToolManagement | `#/views/tool/index.vue` |
| `/prompt/list` | PromptManagement | `#/views/prompt/index.vue` |
| `/observability/overview` | ObservabilityManagement | `#/views/observability/index.vue` |
| `/debug/traces` | DebugManagement | `#/views/debug/index.vue` |
| `/runtime/sessions` | RuntimeManagement | `#/views/runtime/index.vue` |
| `/memory/list` | MemoryManagement | `#/views/memory/index.vue` |
| `/team-run/list` | TeamRunManagement | `#/views/team-run/index.vue` |
| `/trigger/list` | TriggerManagement | `#/views/trigger/index.vue` |
| `/insight/list` | InsightReportManagement | `#/views/insight/index.vue` |

### API 清单

| 函数名 | 方法 | URL | 用途 |
|---|---|---|---|
| `execute` | POST | `/api/agent/execute` | Agent 执行 |
| `executeStream` | POST | `/api/agent/execute/stream` | Agent 流式执行 |
| `chat` | POST | `/api/agent/chat` | Agent 对话 |
| `chatStream` | POST | `/api/agent/chat/stream` | 流式对话 |
| `batchChat` | POST | `/api/agent/chat/batch` | 批量对话 |
| `history` | GET | `/api/agent/history` | 对话历史 |
| `clearHistory` | DELETE | `/api/agent/history` | 清空历史 |
| `list` | GET | `/api/agent/definitions` | Agent 定义列表 |
| `getById` | GET | `/api/agent/definitions/{id}` | 按 ID 获取定义 |
| `getByCode` | GET | `/api/agent/definitions/code/{code}` | 按编码获取定义 |
| `create` (definition) | POST | `/api/agent/definitions` | 创建定义 |
| `update` (definition) | PUT | `/api/agent/definitions` | 更新定义 |
| `deleteApi` | DELETE | `/api/agent/definitions/{id}` | 删除定义 |
| `models` | GET | `/api/agent/models` | 可用模型列表 |
| `tools` | GET | `/api/agent/tools` | 可用工具列表 |
| `ingest` | POST | `/api/agent/rag/ingest` | RAG 文档摄入 |
| `search` | POST | `/api/agent/rag/search` | RAG 搜索 |
| `deleteDocument` | DELETE | `/api/agent/rag/documents/{documentId}` | 删除 RAG 文档 |
| `stats` | GET | `/api/agent/rag/stats` | RAG 统计 |
| `evaluate` | POST | `/api/agent/prompt/evaluate` | Prompt 评估 |
| `compare` | POST | `/api/agent/prompt/compare` | Prompt 比较 |
| `listTraces` | GET | `/api/agent/debug/traces` | Trace 列表 |
| `getTrace` | GET | `/api/agent/debug/trace/{traceId}` | Trace 详情 |
| `replayTrace` | POST | `/api/agent/debug/trace/{traceId}/replay` | Replay Trace |
| `listPending` | GET | `/api/agent/approvals/pending` | 待审批列表 |
| `getApproval` | GET | `/api/agent/approvals/{id}` | 审批单详情 |
| `approve` | POST | `/api/agent/approvals/{id}/approve` | 审批通过 |
| `reject` | POST | `/api/agent/approvals/{id}/reject` | 审批驳回 |
| `getOverview` | GET | `/api/agent/observability/overview` | 可观测性总览 |
| `getModelUsage` | GET | `/api/agent/observability/model-usage` | 模型用量 |
| `listActive` | GET | `/api/agent/runtime/sessions/active` | 活跃会话 |
| `listRecent` | GET | `/api/agent/runtime/sessions/recent` | 近期会话 |
| `getSession` | GET | `/api/agent/runtime/sessions/{executionId}` | 会话详情 |
| `getOverview` (runtime) | GET | `/api/agent/runtime/overview` | 运行时总览 |
| `killSession` | DELETE | `/api/agent/runtime/sessions/{executionId}` | 终止会话 |
| `getMemory` | GET | `/api/agent/memory/{conversationId}` | 对话记忆 |
| `saveMemory` | POST | `/api/agent/memory/{conversationId}` | 写入记忆 |
| `clearMemory` | DELETE | `/api/agent/memory/{conversationId}` | 清除记忆 |
| `getMemoryCount` | GET | `/api/agent/memory/{conversationId}/count` | 记忆条数 |
| `consolidateMemory` | POST | `/api/agent/memory/{conversationId}/consolidate` | 记忆整合 |
| `createTeamRun` | POST | `/api/agent/teamruns` | 创建 TeamRun |
| `createTrigger` | POST | `/api/agent/triggers` | 创建触发器 |
| `updateTrigger` | PUT | `/api/agent/triggers/{triggerId}` | 更新触发器 |
| `enableTrigger` | POST | `/api/agent/triggers/{triggerId}/enable` | 启用触发器 |
| `disableTrigger` | POST | `/api/agent/triggers/{triggerId}/disable` | 禁用触发器 |
| `deleteTrigger` | DELETE | `/api/agent/triggers/{triggerId}` | 删除触发器 |
| `getTrigger` | GET | `/api/agent/triggers/{triggerId}` | 触发器详情 |
| `listTriggers` | GET | `/api/agent/triggers` | 触发器列表 |
| `generateReport` | POST | `/api/agent/insight/report` | 生成洞察报告 |
| `getReport` | GET | `/api/agent/insight/report/{reportId}` | 获取报告 |
| `exportHtml` | GET | `/api/agent/insight/report/{reportId}/html` | 导出 HTML 报告 |
| `listRecentReports` | GET | `/api/agent/insight/reports` | 最近报告 |
| `deleteReport` | DELETE | `/api/agent/insight/report/{reportId}` | 删除报告 |
| `dagExecute` | POST | `/api/agent/dag/execute` | DAG 执行 |
| `getCheckpoint` | GET | `/api/agent/dag/checkpoint/{executionId}` | 获取检查点 |
| `dagValidate` | POST | `/api/agent/dag/validate` | DAG 校验 |

### 页面目录

```
src/views/
├── agent/              # Agent 列表
├── agent-chat/         # 对话调试台
├── approval/           # 人工审批
├── dag/                # DAG 编排
├── debug/              # 链路调试
├── definition/         # Agent 定义
├── fallback/           # 404 兜底
├── insight/            # 洞察报告
├── memory/             # 对话记忆
├── observability/      # Trace 监控
├── prompt/             # Prompt 模板
├── rag/                # 知识库管理
├── runtime/            # 会话监控
├── team-run/           # 多 Agent 协作
├── tool/               # 工具管理
└── trigger/            # 触发器管理
```

---

## frontend-modules/cronjob-web

> 任务引擎前端 — 对应后端服务 `ydsz-cronjob`

### 路由清单

| 路径 path | 名称 name | 组件 component |
|---|---|---|
| `/job/list` | JobManagement | `#/views/job/index.vue` |
| `/job/group` | JobGroupManagement | `#/views/job-group/index.vue` |
| `/dag/list` | JobDagManagement | `#/views/job-dag/index.vue` |
| `/dag/instance` | JobDagInstanceManagement | `#/views/job-dag-instance/index.vue` |
| `/log/dashboard` | CronjobDashboard | `#/views/dashboard/index.vue` |
| `/log/list` | JobLogManagement | `#/views/job-log/index.vue` |
| `/log/stream` | JobLogStreamManagement | `#/views/job-log-stream/index.vue` |
| `/alert/list` | AlertManagement | `#/views/alert/index.vue` |
| `/cronjob/history` | JobHistoryManagement | `#/views/job-history/index.vue` |
| `/cronjob/audit` | AuditLogManagement | `#/views/audit-log/index.vue` |
| `/cronjob/shard` | JobTaskManagement | `#/views/job-task/index.vue` |
| `/cronjob/upcoming` | ScheduleUpcoming | `#/views/schedule-upcoming/index.vue` |
| `/schedule-calendar/index` | ScheduleCalendar | `#/views/schedule-calendar/index.vue` |
| `/connector/list` | ConnectorManagement | `#/views/connector/index.vue` |
| `/cluster/migrate` | ClusterMigration | `#/views/cluster/index.vue` |
| `/ops/topology` | CronjobTopology | `#/views/topology/index.vue` |
| `/ops/diagnosis` | CronjobJobDiagnosis | `#/views/job-diagnosis/index.vue` |
| `/system/health` | HealthDashboard | `#/views/health/index.vue` |
| `/system/queue` | JobQueueMonitor | `#/views/queue/index.vue` |
| `/system/stats` | JobStatsReport | `#/views/stats/index.vue` |

### API 清单

| 函数名 | 方法 | URL | 用途 |
|---|---|---|---|
| `create` (job) | POST | `/api/cronjob` | 创建任务 |
| `update` (job) | PUT | `/api/cronjob` | 更新任务 |
| `validateCron` | GET | `/api/cronjob/cron/validate` | 校验 Cron 表达式 |
| `batchDelete` | POST | `/api/cronjob/batch/delete` | 批量删除 |
| `deleteApi` (job) | DELETE | `/api/cronjob/{id}` | 删除任务 |
| `pause` | POST | `/api/cronjob/{id}/pause` | 暂停任务 |
| `resume` | POST | `/api/cronjob/{id}/resume` | 恢复任务 |
| `trigger` (job) | POST | `/api/cronjob/{id}/trigger` | 手动触发 |
| `batchPause` | POST | `/api/cronjob/batch/pause` | 批量暂停 |
| `batchResume` | POST | `/api/cronjob/batch/resume` | 批量恢复 |
| `batchTrigger` | POST | `/api/cronjob/batch/trigger` | 批量触发 |
| `batchUpdateGroup` | POST | `/api/cronjob/batch/updateGroup` | 批量更新分组 |
| `batchUpdateCron` | POST | `/api/cronjob/batch/updateCron` | 批量更新 Cron |
| `getById` (job) | GET | `/api/cronjob/{id}` | 任务详情 |
| `page` (job) | GET | `/api/cronjob/page` | 任务分页列表 |
| `pageLog` | GET | `/api/cronjob/log/page` | 执行日志分页 |
| `reload` | POST | `/api/cronjob/reload` | 重载任务 |
| `page` (audit) | GET | `/api/cronjob/audit/page` | 审计日志分页 |
| `createRule` | POST | `/api/cronjob/alert/rule` | 创建告警规则 |
| `updateRule` | PUT | `/api/cronjob/alert/rule/{id}` | 更新告警规则 |
| `deleteRule` | DELETE | `/api/cronjob/alert/rule/{id}` | 删除告警规则 |
| `getRuleById` | GET | `/api/cronjob/alert/rule/{id}` | 规则详情 |
| `listRules` | GET | `/api/cronjob/alert/rules` | 告警规则列表 |
| `toggleRule` | PUT | `/api/cronjob/alert/rule/{id}/toggle` | 切换规则状态 |
| `queryAlertLogs` | GET | `/api/cronjob/alert/logs/{jobId}` | 告警日志 |
| `createDag` | POST | `/api/cronjob/dag` | 创建 DAG |
| `updateDag` | PUT | `/api/cronjob/dag/{dagId}` | 更新 DAG |
| `deleteDag` | DELETE | `/api/cronjob/dag/{dagId}` | 删除 DAG |
| `enableDag` | PUT | `/api/cronjob/dag/{dagId}/enable` | 启用 DAG |
| `disableDag` | PUT | `/api/cronjob/dag/{dagId}/disable` | 禁用 DAG |
| `getDagById` | GET | `/api/cronjob/dag/{dagId}` | DAG 详情 |
| `getDagByKey` | GET | `/api/cronjob/dag/key/{dagKey}` | 按 Key 获取 DAG |
| `listEnabledDags` | GET | `/api/cronjob/dag/enabled` | 启用中的 DAG |
| `triggerDag` | POST | `/api/cronjob/dag/trigger` | 触发 DAG |
| `validateDag` | POST | `/api/cronjob/dag/validate` | 校验 DAG |
| `listDagVersions` | GET | `/api/cronjob/dag/{dagId}/versions` | DAG 版本列表 |
| `rollbackDag` | POST | `/api/cronjob/dag/{dagId}/rollback` | DAG 回滚 |
| `getInstance` | GET | `/api/cronjob/dag/instance/{instanceId}` | 运行实例详情 |
| `listInstancesByDag` | GET | `/api/cronjob/dag/instance/dag/{dagId}` | 按 DAG 查实例 |
| `listInstancesByStatus` | GET | `/api/cronjob/dag/instance/status/{status}` | 按状态查实例 |
| `getNodeInstances` | GET | `/api/cronjob/dag/instance/{instanceId}/nodes` | 节点实例列表 |
| `getInstanceVisualization` | GET | `/api/cronjob/dag/instance/{instanceId}/visualization` | 可视化数据 |
| `getInstanceMermaid` | GET | `/api/cronjob/dag/instance/{instanceId}/mermaid` | Mermaid 图 |
| `pauseInstance` | PUT | `/api/cronjob/dag/instance/{instanceId}/pause` | 暂停实例 |
| `resumeInstance` | PUT | `/api/cronjob/dag/instance/{instanceId}/resume` | 恢复实例 |
| `cancelInstance` | PUT | `/api/cronjob/dag/instance/{instanceId}/cancel` | 取消实例 |
| `updateInstanceContext` | PUT | `/api/cronjob/dag/instance/{instanceId}/context` | 更新实例上下文 |
| `dagDesignerSave` | POST | `/api/cronjob/dag/save` | DAG 设计器保存 |
| `dagInstancePause` | POST | `/api/cronjob/dag/instance/{instanceId}/pause` | 实例暂停（POST） |
| `dagInstanceResume` | POST | `/api/cronjob/dag/instance/{instanceId}/resume` | 实例恢复（POST） |
| `dagInstanceCancel` | POST | `/api/cronjob/dag/instance/{instanceId}/cancel` | 实例取消（POST） |
| `dagRetryNode` | POST | `/api/cronjob/dag/instance/{instanceId}/retryNode` | 重试节点 |
| `getOverview` | GET | `/api/cronjob/dashboard/overview` | 运行看板 |
| `getHealth` | GET | `/api/cronjob/dashboard/health` | 健康状态 |
| `getGlobalTopology` | GET | `/api/cronjob/topology/global` | 全局拓扑 |
| `getJobEventStream` | GET | `/api/cronjob/events/job/{jobId}` | 任务事件流 |
| `pageEvents` | GET | `/api/cronjob/events/page` | 事件分页 |
| `saveGlue` | POST | `/api/cronjob/glue/save` | 保存 Glue 代码 |
| `getGlueLatest` | GET | `/api/cronjob/glue/latest` | 最新 Glue |
| `getGlueVersions` | GET | `/api/cronjob/glue/versions` | Glue 版本 |
| `rollbackGlue` | POST | `/api/cronjob/glue/rollback` | Glue 回滚 |
| `testGlue` | POST | `/api/cronjob/glue/test` | Glue 测试 |
| `getGlueTemplate` | GET | `/api/cronjob/glue/template` | Glue 模板 |
| `getGlueDiff` | GET | `/api/cronjob/glue/diff` | Glue 差异 |
| `validateGlue` | POST | `/api/cronjob/glue/validate` | Glue 校验 |
| `migrate` | POST | `/api/cronjob/cluster/migrate` | 集群迁移 |
| `listClusters` | GET | `/api/cronjob/cluster/list` | 集群列表 |
| `enabled` (cluster) | GET | `/api/cronjob/cluster/enabled` | 迁移是否开启 |
| `internalRegister` | POST | `/api/cronjob/internal/migrate/register` | 内部注册迁移 |
| `internalUnregister` | POST | `/api/cronjob/internal/migrate/unregister` | 内部注销迁移 |
| `internalTrigger` | POST | `/api/internal/cronjob/{id}/trigger` | 内部触发 |
| `triggerWithLock` | POST | `/api/internal/cronjob/{id}/trigger` | 带锁触发 |
| `getJobInfo` | GET | `/api/internal/cronjob/{id}` | 内部任务信息 |
| `pauseJob` | POST | `/api/internal/cronjob/{id}/pause` | 内部暂停 |
| `resumeJob` | POST | `/api/internal/cronjob/{id}/resume` | 内部恢复 |
| `connectorTypes` | GET | `/api/cronjob/connector/types` | 连接器类型 |
| `testConnection` | POST | `/api/cronjob/connector/test` | 测试连接 |
| `listRemoteTasks` | POST | `/api/cronjob/connector/remote-tasks` | 远程任务列表 |
| `importTasks` | POST | `/api/cronjob/connector/import` | 导入任务 |
| `exportTasks` | POST | `/api/cronjob/connector/export` | 导出任务 |
| `page` (jobGroup) | — | （jobGroup.ts 导出 CRUD） | 任务分组管理 |
| `pageHistory` / `pageStats` / `pageQueue` | — | （history/stats/queue 模块） | 历史/统计/队列 |

### 页面目录

```
src/views/
├── alert/              # 告警规则
├── audit-log/          # 审计日志
├── cluster/            # 集群迁移
├── dashboard/          # 运行看板
├── health/             # 健康仪表盘
├── job/                # 任务列表
├── job-dag/            # DAG 列表
├── job-dag-instance/   # 运行实例
├── job-diagnosis/      # 任务诊断
├── job-group/          # 任务分组
├── job-history/        # 任务历史
├── job-log/            # 执行日志
├── job-log-stream/     # 实时日志
├── job-task/           # 任务分片
├── queue/              # 执行队列
├── schedule-calendar/  # 调度日历
├── schedule-upcoming/  # 调度日历（近期）
├── stats/              # 统计数据
├── topology/           # 拓扑可视化
└── 子目录: alert/ audit-log/ cluster/ 等
```

---

## frontend-modules/generator-web

> 代码生成器前端 — 对应后端服务 `ydsz-generator`

### 路由清单

| 路径 path | 名称 name | 组件 component |
|---|---|---|
| `/table-meta/list` | TableMetaManagement | `#/views/table-meta/index.vue` |
| `/code-gen/index` | CodeGenManagement | `#/views/code-gen/index.vue` |
| `/datasource/list` | DatasourceManagement | `#/views/datasource/index.vue` |
| `/template/list` | TemplateManagement | `#/views/template/index.vue` |
| `/history/list` | HistoryManagement | `#/views/history/index.vue` |
| `/import-export/index` | ImportExportManagement | `#/views/import-export/index.vue` |
| `/reverse/index` | ReverseManagement | `#/views/reverse/index.vue` |

### API 清单

| 函数名 | 方法 | URL | 用途 |
|---|---|---|---|
| `preview` | GET | `/api/generator/code/preview` | 预览生成代码 |
| `downloadPreviewZip` | GET | `/api/generator/code/preview/zip` | 下载预览 ZIP |
| `generate` | POST | `/api/generator/code/generate` | 单表生成 |
| `generateAll` | POST | `/api/generator/code/generate/all` | 全量生成 |
| `listTables` | GET | `/api/generator/tables` | 表元数据列表 |
| `refreshTables` | POST | `/api/generator/tables/refresh` | 刷新表元数据 |
| `getColumns` | GET | `/api/generator/tables/columns` | 字段元数据 |
| `refreshColumns` | POST | `/api/generator/tables/columns/refresh` | 刷新字段元数据 |
| `listDatasources` | GET | `/api/generator/datasources` | 数据源列表 |
| `getDefaultDatasource` | GET | `/api/generator/datasources/default` | 默认数据源 |
| `testConnection` | POST | `/api/generator/datasources/test` | 测试连接 |
| `createDatasource` | POST | `/api/generator/datasources` | 创建数据源 |
| `updateDatasource` | POST | `/api/generator/datasources/update` | 更新数据源 |
| `deleteDatasource` | DELETE | `/api/generator/datasources/{id}` | 删除数据源 |
| `listGroups` | GET | `/api/generator/groups` | 模板分组列表 |
| `getActiveGroup` | GET | `/api/generator/groups/active` | 当前激活分组 |
| `activateGroup` | POST | `/api/generator/groups/{id}/activate` | 激活分组 |
| `createGroup` | POST | `/api/generator/groups` | 创建分组 |
| `deleteGroup` | DELETE | `/api/generator/groups/{id}` | 删除分组 |
| `listTemplates` | GET | `/api/generator/templates` | 模板列表 |
| `getTemplate` | GET | `/api/generator/templates/{id}` | 模板详情 |
| `updateTemplate` | POST | `/api/generator/templates/update` | 更新模板 |
| `searchTemplates` | GET | `/api/generator/templates/search` | 搜索模板 |
| `listRecentHistory` | GET | `/api/generator/history` | 生成历史列表 |
| `getHistoryById` | GET | `/api/generator/history/{id}` | 历史详情 |
| `listHistoryFiles` | GET | `/api/generator/history/{id}/files` | 历史文件列表 |
| `rollbackHistory` | POST | `/api/generator/history/{id}/rollback` | 历史回滚 |
| `deleteHistory` | DELETE | `/api/generator/history/{id}` | 删除历史 |
| `analyzeReverse` | POST | `/api/generator/reverse/analyze` | 反向分析（单表） |
| `analyzeBatchReverse` | POST | `/api/generator/reverse/analyze-batch` | 反向分析（批量） |
| `exportTemplates` | GET | `/api/generator/import-export/export` | 导出模板 |
| `importTemplates` | POST | `/api/generator/import-export/import` | 导入模板 |

### 页面目录

```
src/views/
├── code-gen/           # 代码生成
├── datasource/         # 数据源管理
├── fallback/           # 404 兜底
├── history/            # 生成历史
├── import-export/      # 导入导出
├── reverse/            # 反向生成
├── table-meta/         # 表元数据
└── template/           # 模板管理
```

---

## frontend-modules/literule-web

> 规则引擎前端 — 对应后端服务 `ydsz-literule`

### 路由清单

| 路径 path | 名称 name | 组件 component |
|---|---|---|
| `/rule/list` | RuleManagement | `#/views/rule/index.vue` |
| `/rule/dashboard` | RuleDashboard | `#/views/dashboard/index.vue` |
| `/rule/dsl` | DslManagement | `#/views/dsl/index.vue` |
| `/rule/variable` | VariableManagement | `#/views/variable/index.vue` |
| `/rule/decision-table` | DecisionTableManagement | `#/views/decision-table/index.vue` |
| `/rule/pack` | RulePackManagement | `#/views/rule-pack/index.vue` |
| `/rule/lifecycle` | RuleLifecycleManagement | `#/views/rule-lifecycle/index.vue` |
| `/advanced/cep` | CepManagement | `#/views/cep/index.vue` |
| `/advanced/breakpoint` | BreakpointManagement | `#/views/breakpoint/index.vue` |
| `/advanced/template` | RuleTemplateManagement | `#/views/rule-template/index.vue` |
| `/advanced/conflict` | RuleConflictManagement | `#/views/rule-conflict/index.vue` |
| `/advanced/dependency` | RuleDependencyManagement | `#/views/rule-dependency/index.vue` |
| `/audit/log` | AuditLogManagement | `#/views/audit-log/index.vue` |
| `/audit/trace` | RuleTraceManagement | `#/views/rule-trace/index.vue` |

### API 清单

| 函数名 | 方法 | URL | 用途 |
|---|---|---|---|
| `list` (rule) | GET | `/api/literule/rules` | 规则分页列表 |
| `get` | GET | `/api/literule/rules/{ruleCode}` | 规则详情 |
| `save` (rule) | POST | `/api/literule/rules` | 保存规则 |
| `toggle` | PUT | `/api/literule/rules/{ruleCode}/toggle` | 启用/禁用 |
| `listVersions` | GET | `/api/literule/rules/{ruleCode}/versions` | 版本列表 |
| `versionDiff` | GET | `/api/literule/rules/{ruleCode}/version-diff` | 版本差异 |
| `rollback` (rule) | POST | `/api/literule/rules/{ruleCode}/rollback` | 规则回滚 |
| `dryRun` | POST | `/api/literule/rules/dry-run` | 规则试运行 |
| `validate` (rule) | GET | `/api/literule/rules/validate` | 规则校验 |
| `evaluate` | POST | `/api/literule/rules/evaluate` | 规则求值 |
| `traceExpression` | POST | `/api/literule/rules/expr-trace` | 表达式追踪 |
| `validateExpression` | POST | `/api/literule/rules/validate-expression` | 校验单表达式 |
| `validateBatch` | POST | `/api/literule/rules/validate-batch` | 批量校验表达式 |
| `abTest` | POST | `/api/literule/rules/{ruleCode}/ab-test` | AB 测试 |
| `stats` | GET | `/api/literule/rules/stats` | 引擎统计 |
| `deleteRule` | DELETE | `/api/literule/rules/{ruleCode}` | 删除规则 |
| `batchToggle` | POST | `/api/literule/rules/batch-toggle` | 批量启禁 |
| `batchPriority` | POST | `/api/literule/rules/batch-priority` | 批量优先级 |
| `batchCategory` | POST | `/api/literule/rules/batch-category` | 批量分类 |
| `categoryTree` | GET | `/api/literule/rules/category-tree` | 分类树 |
| `listByCategoryPath` | GET | `/api/literule/rules/by-category-path` | 按路径查规则 |
| `listByOwner` | GET | `/api/literule/rules/by-owner` | 按属主查规则 |
| `setOwner` | PUT | `/api/literule/rules/{ruleCode}/owner` | 设置属主 |
| `setCategoryPath` | PUT | `/api/literule/rules/{ruleCode}/category-path` | 设置分类路径 |
| `getAbPolicy` | GET | `/api/literule/rules/{ruleCode}/ab-policy` | 获取 AB 策略 |
| `updateAbPolicy` | PUT | `/api/literule/rules/{ruleCode}/ab-policy` | 更新 AB 策略 |
| `listRollbackHistory` | GET | `/api/literule/rules/{ruleCode}/ab-rollbacks` | AB 回滚历史 |
| `evaluateAb` | POST | `/api/literule/rules/{ruleCode}/ab-evaluate` | AB 评估 |
| `manualRollback` | POST | `/api/literule/rules/{ruleCode}/ab-rollback` | AB 手动回滚 |
| `listPatterns` | GET | `/api/literule/cep/patterns` | CEP 模式列表 |
| `registerPattern` | POST | `/api/literule/cep/patterns` | 注册模式 |
| `unregisterPattern` | DELETE | `/api/literule/cep/patterns/{patternId}` | 注销模式 |
| `feedEvent` | POST | `/api/literule/cep/events` | 单事件输入 |
| `feedEvents` | POST | `/api/literule/cep/events/batch` | 批量事件输入 |
| `recentHits` | GET | `/api/literule/cep/hits` | 近期命中 |
| `stats` (cep) | GET | `/api/literule/cep/stats` | CEP 统计 |
| `recent` (audit) | GET | `/api/literule/audit/recent` | 最近审计 |
| `byRuleCode` | GET | `/api/literule/audit/by-rule/{ruleCode}` | 按规则查审计 |
| `byOperator` | GET | `/api/literule/audit/by-operator` | 按操作人查审计 |
| `byAction` | GET | `/api/literule/audit/by-action` | 按动作查审计 |
| `byTimeRange` | GET | `/api/literule/audit/by-time-range` | 按时间查审计 |
| `detectConflicts` | GET | `/api/literule/rules/conflicts` | 冲突检测 |
| `overview` (dashboard) | GET | `/api/literule/dashboard/overview` | 看板总览 |
| `trends` | GET | `/api/literule/dashboard/trends` | 趋势数据 |
| `distribution` | GET | `/api/literule/dashboard/distribution` | 分布数据 |
| `topRules` | GET | `/api/literule/dashboard/top-rules` | Top 规则 |
| `realtime` | GET | `/api/literule/dashboard/realtime` | 实时数据 |
| `slowRules` | GET | `/api/literule/dashboard/slow-rules` | 慢规则 |
| `internalDryRun` | POST | `/api/internal/literule/rules/dry-run` | 内部试运行 |
| `internalEvaluate` | POST | `/api/internal/literule/rules/evaluate` | 内部求值 |
| 其余 `ruleDecisionTable` / `ruleDebug` / `ruleDependency` / `ruleDsl` / `ruleDslImportExport` / `ruleGraph` / `ruleImportExport` / `ruleLifecycle` / `rulePack` / `ruleTemplate` / `ruleTrace` / `ruleVariableAdmin` | — | 各模块对应 `/api/literule/...` | 决策表/调试/依赖/DSL/导入导出/拓扑/生命周期/规则包/模板/追踪/变量 |

### 页面目录

```
src/views/
├── audit-log/          # 审计日志
├── breakpoint/         # 断点调试
├── cep/                # CEP 复杂事件
├── dashboard/          # 规则看板
├── decision-table/     # 决策表
├── dsl/                # DSL 编辑器（含 DslEditor 组件）
├── fallback/           # 404 兜底
├── rule/               # 规则列表（含 RuleChainDesigner 组件）
├── rule-conflict/      # 冲突检测
├── rule-dependency/    # 依赖拓扑
├── rule-lifecycle/     # 审批中心
├── rule-pack/          # 规则包
├── rule-template/      # 规则模板
├── rule-trace/         # 执行追踪
└── variable/           # 规则变量
```

---

## frontend-modules/message-web

> 消息引擎前端 — 对应后端服务 `ydsz-message`

### 路由清单

| 路径 path | 名称 name | 组件 component |
|---|---|---|
| `/message/list` | MessageManagement | `#/views/message/index.vue` |
| `/message/batch` | BatchManagement | `#/views/batch/index.vue` |
| `/message/dead-letter` | DeadLetterManagement | `#/views/dead-letter/index.vue` |
| `/message/aggregate` | AggregateManagement | `#/views/aggregate/index.vue` |
| `/message/archive` | MessageArchiveManagement | `#/views/archive/index.vue` |
| `/message/unsubscribe-records` | UnsubscribeRecordManagement | `#/views/unsubscribe-records/index.vue` |
| `/template/list` | TemplateManagement | `#/views/template/index.vue` |
| `/notification/list` | NotificationManagement | `#/views/notification/index.vue` |
| `/route/rules` | RouteRuleManagement | `#/views/route-rule/index.vue` |
| `/analytics/stats` | MessageStatsManagement | `#/views/stats/index.vue` |
| `/analytics/trace` | MessageTraceManagement | `#/views/trace/index.vue` |
| `/preference/list` | PreferenceManagement | `#/views/preference/index.vue` |
| `/subscription/list` | SubscriptionManagement | `#/views/subscription/index.vue` |
| `/advanced/channel-binding` | UserChannelBindingManagement | `#/views/user-channel-binding/index.vue` |
| `/advanced/feedback` | FeedbackManagement | `#/views/feedback/index.vue` |
| `/advanced/canary` | CanaryManagement | `#/views/canary/index.vue` |
| `/ops/retry-preview` | RetryPreviewManagement | `#/views/retry-preview/index.vue` |
| `/ops/cache` | OpsCacheManagement | `#/views/ops/index.vue` |
| `/ops/recall` | RecallManagement | `#/views/recall/index.vue` |
| `/ops/read-receipt` | ReadReceiptManagement | `#/views/read-receipt/index.vue` |
| `/reactive/monitor` | ReactiveNotificationManagement | `#/views/reactive/index.vue` |

### API 清单

| 函数名 | 方法 | URL | 用途 |
|---|---|---|---|
| `send` | POST | `/api/message/send` | 发送消息 |
| `pageLog` | GET | `/api/message/log/page` | 消息日志分页 |
| `cancelScheduled` | POST | `/api/message/cancelScheduled` | 取消定时消息 |
| `batchProgress` | GET | `/api/message/batch/{batchId}/progress` | 批量发送进度 |
| `sendBatch` | POST | `/api/message/batch/send` | 提交批量 |
| `getBatchProgress` | GET | `/api/message/batch/progress/{batchId}` | 批量进度 |
| `subscribeProgress` | GET | `/api/message/batch/progress/{batchId}/sse` | SSE 进度订阅 |
| `page` (deadLetter) | GET | `/api/message/dead-letter/page` | 死信队列分页 |
| `resend` | POST | `/api/message/dead-letter/{logId}/resend` | 死信重发 |
| `page` (aggregate) | GET | `/api/message/aggregate/page` | 聚合批次分页 |
| `flushByGroup` | POST | `/api/message/aggregate/flush` | 按组刷新 |
| `flushDue` | POST | `/api/message/aggregate/flushDue` | 刷新到期 |
| `sendNotification` | POST | `/api/message/notifications/send` | 发送站内通知 |
| `inbox` | GET | `/api/message/notifications/inbox` | 站内信收件箱 |
| `countUnread` | GET | `/api/message/notifications/unreadCount` | 未读数 |
| `markRead` | POST | `/api/message/notifications/{id}/read` | 标记已读 |
| `markAllRead` | POST | `/api/message/notifications/readAll` | 全部已读 |
| `deleteNotifications` | DELETE | `/api/message/notifications` | 删除通知 |
| `recallNotification` | POST | `/api/message/notifications/{id}/recall` | 撤回通知 |
| `push` | POST | `/api/message/notifications/push` | 推送 |
| `broadcast` | POST | `/api/message/notifications/broadcast` | 广播 |
| `pushRealtime` | POST | `/api/message/notifications/push-realtime` | 实时推送 |
| `create` (template) | POST | `/api/message/template` | 创建模板 |
| `update` (template) | PUT | `/api/message/template/{id}` | 更新模板 |
| `deleteApi` (template) | DELETE | `/api/message/template/{id}` | 删除模板 |
| `getById` (template) | GET | `/api/message/template/{id}` | 模板详情 |
| `page` (template) | GET | `/api/message/template/page` | 模板分页 |
| `audit` | POST | `/api/message/template/{id}/audit` | 模板审核 |
| `searchArchives` | GET | `/api/message/archive/search` | 归档搜索 |
| `createRouteRule` | POST | `/api/message/route-rule` | 创建路由规则 |
| `updateRouteRule` | PUT | `/api/message/route-rule/{id}` | 更新路由规则 |
| `deleteRouteRule` | DELETE | `/api/message/route-rule/{id}` | 删除路由规则 |
| `getRouteRuleById` | GET | `/api/message/route-rule/{id}` | 规则详情 |
| `pageRouteRule` | GET | `/api/message/route-rule/page` | 规则分页 |
| `listEnabled` | GET | `/api/message/route-rule/enabled` | 启用中规则 |
| `pageFeedback` | GET | `/api/message/feedback/page` | 反馈分页 |
| `getAverageRating` | GET | `/api/message/feedback/rating` | 平均评分 |
| `submitFeedback` | POST | `/api/message/feedback` | 提交反馈 |
| `shouldReduceFrequency` | GET | `/api/message/feedback/shouldReduceFreq` | 是否应降频 |
| `createExperiment` | POST | `/api/message/canary/experiment` | 创建灰度实验 |
| `assignBucket` | GET | `/api/message/canary/assign` | 分配灰度桶 |
| `upsertPreference` | POST | `/api/message/preference` | 偏好 upsert |
| `listPreferences` | GET | `/api/message/preference/{userId}` | 用户偏好列表 |
| `getPreference` | GET | `/api/message/preference/{userId}/{channel}/{bizType}` | 精确偏好 |
| `deletePreference` | DELETE | `/api/message/preference/{id}` | 删除偏好 |
| `upsertSubscription` | POST | `/api/message/subscription` | 订阅 upsert |
| `listSubscriptions` | GET | `/api/message/subscription/{userId}` | 用户订阅 |
| `listByTopic` | GET | `/api/message/subscription/{topicCode}/{channel}` | 按主题查 |
| `unsubscribe` | POST | `/api/message/subscription/unsubscribe` | 取消订阅 |
| `overview` (stats) | GET | `/api/message/stats/overview` | 统计总览 |
| `channelStats` | GET | `/api/message/stats/channel` | 渠道统计 |
| `receiptStats` | GET | `/api/message/stats/receipt` | 回执统计 |
| `funnelStats` | GET | `/api/message/stats/funnel` | 漏斗统计 |
| `costStats` | GET | `/api/message/stats/cost` | 成本统计 |
| `getTrace` | GET | `/api/message/trace/msg/{msgId}` | 消息轨迹 |
| `previewRetrySchedule` | GET | `/api/message/retry/preview` | 重试预览 |
| `previewAllPresets` | GET | `/api/message/retry/preview/all` | 全部预设预览 |
| `listPresets` | GET | `/api/message/retry/presets` | 重试预设列表 |
| `getTemplateCacheStats` | GET | `/api/message/ops/template-cache/stats` | 模板缓存统计 |
| `evictTemplateCache` | DELETE | `/api/message/ops/template-cache` | 淘汰缓存 |
| `clearTemplateCache` | DELETE | `/api/message/ops/template-cache/all` | 清空缓存 |
| `getBloomFilterStats` | GET | `/api/message/ops/bloomfilter/stats` | BloomFilter 统计 |
| `getReadReceipt` | GET | `/api/message/read-receipt/s/{shortCode}` | 已读回执 |
| `sendInternal` | POST | `/api/internal/message/send` | 内部发送 |
| `streamEvents` | GET | `/api/message/reactive/stream` | 响应式推送流 |
| `publishReactive` | POST | `/api/message/reactive/publish` | 响应式发布 |
| `getReactiveHealth` | GET | `/api/message/reactive/health` | 响应式健康检查 |
| 以下来自 `templatePreview.ts`、`templateVersion.ts`、`userChannelBinding.ts`、`recall.ts`、`readStatus.ts`、`receipt.ts`、`unsubscribe.ts` 等模块 | — | 消息模板预览/版本管理/渠道绑定/召回/已读状态/回执/退订 相关 CRUD | 对应各业务子模块 |

### 页面目录

```
src/views/
├── aggregate/           # 聚合批次
├── archive/             # 归档搜索
├── batch/               # 批量发送
├── canary/              # 灰度实验
├── dead-letter/         # 死信队列
├── fallback/            # 404 兜底
├── feedback/            # 反馈管理
├── message/             # 消息列表
├── notification/        # 站内通知
├── ops/                 # 缓存管理（运维）
├── preference/          # 消息偏好
├── read-receipt/        # 已读回执
├── recall/              # 消息召回
├── reactive/            # 响应式监控
├── retry-preview/       # 重试预览
├── route-rule/          # 路由规则
├── stats/               # 统计看板
├── subscription/        # 订阅列表
├── template/            # 消息模板
├── trace/               # 消息轨迹
├── unsubscribe-records/ # 退订记录
└── user-channel-binding/ # 渠道绑定
```

---

## frontend-modules/nextwiki-web

> 文件引擎前端 — 对应后端服务 `ydsz-nextwiki`

### 路由清单

| 路径 path | 名称 name | 组件 component |
|---|---|---|
| `/file/list` | FileManagement | `#/views/file/index.vue` |
| `/file/comment` | CommentManagement | `#/views/comment/index.vue` |
| `/file/favorites` | FavoriteManagement | `#/views/favorites/index.vue` |
| `/file/recent` | RecentManagement | `#/views/recent/index.vue` |
| `/search/index` | FullTextSearch | `#/views/search/index.vue` |
| `/space/list` | SpaceManagement | `#/views/space/index.vue` |
| `/space/templates` | SpaceTemplateMgmt | `#/views/space/template-manage.vue` |
| `/share/list` | ShareManagement | `#/views/share/index.vue` |
| `/tag/list` | TagManagement | `#/views/tag/index.vue` |
| `/storage/quota` | QuotaManagement | `#/views/quota/index.vue` |
| `/trash/list` | TrashManagement | `#/views/trash/index.vue` |
| `/analysis/index` | StorageAnalysis | `#/views/analysis/index.vue` |
| `/analysis/ai-assist` | AiAssist | `#/views/ai-assist/index.vue` |

### API 清单

| 函数名 | 方法 | URL | 用途 |
|---|---|---|---|
| `upload` | POST | `/api/nextwiki/files/upload` | 上传文件 |
| `createFolder` | POST | `/api/nextwiki/files/folders` | 创建文件夹 |
| `listFiles` | GET | `/api/nextwiki/files/list` | 文件列表 |
| `move` | PUT | `/api/nextwiki/files/{nodeId}/move` | 移动文件 |
| `rename` | PUT | `/api/nextwiki/files/{nodeId}/rename` | 重命名 |
| `deleteApi` | DELETE | `/api/nextwiki/files/{nodeId}` | 删除文件 |
| `copy` | POST | `/api/nextwiki/files/{nodeId}/copy` | 复制文件 |
| `batchSort` | PUT | `/api/nextwiki/files/sort` | 批量排序 |
| `initChunkUpload` | POST | `/api/nextwiki/files/chunk/init` | 初始化分片上传 |
| `uploadChunk` | POST | `/api/nextwiki/files/chunk/{uploadId}/{chunkNumber}` | 上传分片 |
| `completeChunkUpload` | POST | `/api/nextwiki/files/chunk/{uploadId}/complete` | 完成分片上传 |
| `cancelChunkUpload` | DELETE | `/api/nextwiki/files/chunk/{uploadId}` | 取消分片上传 |
| `getUploadedChunks` | GET | `/api/nextwiki/files/chunk/{uploadId}/uploaded-chunks` | 已上传分片查询 |
| `batchDelete` | POST | `/api/nextwiki/files/batch/delete` | 批量删除 |
| `batchMove` | POST | `/api/nextwiki/files/batch/move` | 批量移动 |
| `getVersionHistory` | GET | `/api/nextwiki/files/{nodeId}/versions` | 版本历史 |
| `rollbackVersion` | POST | `/api/nextwiki/files/{nodeId}/versions/{version}/rollback` | 回滚版本 |
| `diffVersions` | GET | `/api/nextwiki/files/{nodeId}/versions/diff` | 版本差异 |
| `asyncBatchDelete` | POST | `/api/nextwiki/files/batch/async-delete` | 异步批量删除 |
| `asyncBatchMove` | POST | `/api/nextwiki/files/batch/async-move` | 异步批量移动 |
| `getBatchTaskStatus` | GET | `/api/nextwiki/files/batch/task/{taskId}` | 异步任务状态 |
| `toggleStar` | PUT | `/api/nextwiki/files/{nodeId}/star` | 收藏/取消 |
| `lockFile` | POST | `/api/nextwiki/files/{nodeId}/lock` | 锁定文件 |
| `unlockFile` | POST | `/api/nextwiki/files/{nodeId}/unlock` | 解锁文件 |
| `listComments` | GET | `/api/nextwiki/comments/file/{fileNodeId}` | 文件评论列表 |
| `addComment` | POST | `/api/nextwiki/comments` | 添加评论 |
| `deleteComment` | DELETE | `/api/nextwiki/comments/{commentId}` | 删除评论 |
| `resolveComment` | POST | `/api/nextwiki/comments/{commentId}/resolve` | 解决评论 |
| `getQuota` | GET | `/api/internal/quota/get-by-tenant` / `/get-by-space` | 存储配额 |
| `setQuota` | — | `/api/internal/quota/...` | 设置配额 |
| `downloadFolder` | POST | `/api/nextwiki/download/folder/{folderId}` | 下载文件夹 |
| `download` | POST | `/api/nextwiki/download/{nodeId}` | 下载文件 |
| `generateSignedUrl` | POST | `/api/nextwiki/download/{nodeId}/signed-url` | 生成签名 URL |
| `downloadBySignedUrl` | GET | `/api/nextwiki/download/signed/{sign}` | 签名下载 |
| `batchUpload` | POST | `/api/nextwiki/import/batch-upload` | 批量上传 |
| `importZip` | POST | `/api/nextwiki/import/zip` | ZIP 导入 |
| `getOverview` (analysis) | GET | `/api/nextwiki/analysis/overview` | 存储分析总览 |
| `statsByType` | GET | `/api/nextwiki/analysis/by-type` | 按类型统计 |
| `topLargeFiles` | GET | `/api/nextwiki/analysis/top-large-files` | 大文件 Top |
| `analyze` | POST | `/api/nextwiki/analysis/summary` | AI 分析 |
| `generateSummary` | POST | `/api/nextwiki/ai/summary` | AI 摘要 |
| `getStatus` (ai) | GET | `/api/nextwiki/ai/status` | AI 服务状态 |
| `getSpace` | GET | `/api/internal/space/get` | 空间信息 |
| `batchGetSpaces` | POST | `/api/internal/space/batch` | 批量获取空间 |
| 其余 `presignedUrl`、`preview`、`search`、`share`、`space`、`spaceTemplate`、`tag`、`trash`、`userFavorite`、`userRecent`、`userSearch`、`wopi` | — | 各模块对应的 `/api/nextwiki/...` | 预签名 URL/预览/搜索/分享/空间/空间模板/标签/回收站/收藏/最近访问/用户搜索/WOPI |

### 页面目录

```
src/views/
├── ai-assist/          # AI 助手
├── analysis/           # 存储分析
├── comment/            # 文件评论
├── fallback/           # 404 兜底
├── favorites/          # 收藏夹
├── file/               # 文件列表
│   └── components/
│       ├── FileVersionHistory.vue
│       └── WopiEditor.vue
├── quota/              # 存储配额
├── recent/             # 最近访问
├── search/             # 全文搜索
├── share/              # 分享管理
├── space/              # 空间管理
├── tag/                # 标签列表
└── trash/              # 回收站
```

---

## frontend-modules/system-web

> 系统引擎前端 — 对应后端服务 `ydsz-system`

### 路由清单

| 路径 path | 名称 name | 组件 component |
|---|---|---|
| `/system/config` | ConfigManagement | `#/views/config/index.vue` |
| `/system/dict-type` | DictTypeManagement | `#/views/dict-type/index.vue` |
| `/system/dict-item` | DictItemManagement | `#/views/dict-item/index.vue` |
| `/system/variable` | VariableManagement | `#/views/variable/index.vue` |
| `/system/app` | AppManagement | `#/views/app/index.vue` |
| `/system/api-permission` | ApiPermissionManagement | `#/views/api-permission/index.vue` |
| `/system/config-approval` | ConfigApprovalManagement | `#/views/config-approval/index.vue` |
| `/tenant/list` | TenantManagement | `#/views/tenant/index.vue` |
| `/audit/log` | AuditLogManagement | `#/views/audit/index.vue` |
| `/config-version/list` | ConfigVersionManagement | `#/views/config-version/index.vue` |
| `/monitor/dashboard` | MonitorDashboard | `#/views/monitor/index.vue` |
| `/error-code/viewer` | ErrorCodeViewer | `#/views/error-code/index.vue` |
| `/dev-platform/code-generator` | CodeGenerator | `#/views/dev-platform/index.vue` |
| `/system/preference` | UserPreference | `#/views/preference/index.vue` |

### API 清单

| 函数名 | 方法 | URL | 用途 |
|---|---|---|---|
| `page` (config) | GET | `/api/config/page` | 配置分页 |
| `pageByCursor` | GET | `/api/config/cursor` | 游标分页 |
| `getById` (config) | GET | `/api/config/{id}` | 配置详情 |
| `save` (config) | POST | `/api/config` | 创建配置 |
| `update` (config) | PUT | `/api/config` | 更新配置 |
| `remove` (config) | DELETE | `/api/config/{id}` | 删除配置 |
| `batchSave` | POST | `/api/config/batch` | 批量保存 |
| `getByKey` | GET | `/api/config/key/{configKey}` | 按 Key 查配置 |
| `getConfigsByGroup` | GET | `/api/config/group/{configGroup}` | 按分组查 |
| `listPublicConfigs` | GET | `/api/config/public` | 公共配置 |
| `exportConfigs` | GET | `/api/config/export` | 导出配置 |
| `importConfigs` | POST | `/api/config/import` | 导入配置 |
| `page` (dict type) | GET | `/api/dict/type/page` | 字典类型分页 |
| `getById` (dict type) | GET | `/api/dict/type/{id}` | 字典类型详情 |
| `save` (dict type) | POST | `/api/dict/type` | 新增字典类型 |
| `update` (dict type) | PUT | `/api/dict/type` | 更新字典类型 |
| `deleteDictType` | DELETE | `/api/dict/type/{id}` | 删除字典类型 |
| `getAllDictTypes` | GET | `/api/dict/type/all` | 所有字典类型 |
| `page` (dict item) | — | `/api/dict/item/...` | 字典项 CRUD |
| `getDictVersions` | GET | `/api/dict/version/{typeCode}` | 字典项版本 |
| `pageDictVersions` | GET | `/api/dict/version/page` | 字典项版本分页 |
| `rollbackDictVersion` | POST | `/api/dict/version/{typeCode}/rollback` | 字典版本回滚 |
| `getConfigVersions` | GET | `/api/config/version/{resourceKey}` | 配置版本 |
| `rollbackConfigVersion` | POST | `/api/config/version/{resourceKey}/rollback` | 配置版本回滚 |
| `page` (api-permission) | GET | `/api/permission/api/page` | 接口权限分页 |
| `getApiPermissionById` | GET | `/api/permission/api/{id}` | 接口权限详情 |
| `scan` | POST | `/api/permission/api/scan` | 扫描接口权限 |
| `enableApiPermission` | POST | `/api/permission/api/{id}/enable` | 启用 |
| `disableApiPermission` | POST | `/api/permission/api/{id}/disable` | 禁用 |
| `removeApiPermission` | DELETE | `/api/permission/api/{id}` | 删除 |
| `listPendingApprovals` | GET | `/api/config/approval/pending` | 待审批列表 |
| `listSubmittedApprovals` | GET | `/api/config/approval/submitted` | 已提交列表 |
| `listAllApprovals` | GET | `/api/config/approval/list` | 全部审批 |
| `submitApproval` | POST | `/api/config/approval/submit` | 提交审批 |
| `approveApproval` | POST | `/api/config/approval/{id}/approve` | 审批通过 |
| `rejectApproval` | POST | `/api/config/approval/{id}/reject` | 审批驳回 |
| `withdrawApproval` | POST | `/api/config/approval/{id}/withdraw` | 撤回审批 |
| `getApprovalDetail` | GET | `/api/config/approval/{id}` | 审批详情 |
| `page` (app) | — | `/api/app/...` | 应用注册 CRUD |
| `page` (tenant) | — | `/api/tenant/...` | 租户列表 |
| `page` (auditAdmin) | — | `/api/audit/...` | 审计日志 |
| `page` (tenantPlan) | GET | `/api/tenant-plan/page` | 租户套餐分页 |
| `listTenantPlans` | GET | `/api/tenant-plan/list` | 套餐列表 |
| `getTenantPlanById` | GET | `/api/tenant-plan/{id}` | 套餐详情 |
| `createTenantPlan` | POST | `/api/tenant-plan` | 创建套餐 |
| `updateTenantPlan` | PUT | `/api/tenant-plan` | 更新套餐 |
| `deleteTenantPlan` | DELETE | `/api/tenant-plan/{id}` | 删除套餐 |
| `getPlanMenus` | GET | `/api/tenant-plan/{planId}/menus` | 套餐菜单 |
| `savePlanMenus` | POST | `/api/tenant-plan/menus` | 保存套餐菜单 |
| `getOverview` | GET | `/api/dashboard/overview` | 仪表盘概览 |
| `getWorkspace` | GET | `/api/dashboard/workspace` | 工作区 |
| `init` | GET | `/api/system/init` | 系统初始化 |
| `initDicts` | GET | `/api/system/init/dicts` | 字典初始化 |
| `getMetrics` | GET | `/api/system/metrics/dashboard` | 监控指标 |
| `getConfigValue` | POST | `/api/internal/config/get` | 内部配置获取 |
| `getDictItem` | POST | `/api/internal/dict/item` | 内部字典项查询 |
| `getDictList` | POST | `/api/internal/dict/list` | 内部字典列表 |
| `validateApp` | POST | `/api/internal/app/validate` | 内部应用校验 |
| `getFeatureFlags` | GET | `/api/feature-flags/me` | 特性开关 |
| `secondaryAuth` | POST | `/api/auth/secondary-auth` | 二次认证 |
| `getRepeatSubmitToken` | GET | `/repeat-submit/token` | 防重复提交 Token |

### 页面目录

```
src/views/
├── api-permission/      # 接口权限管理
├── app/                # 应用注册
├── audit/              # 审计日志
├── config/             # 系统配置
├── config-approval/    # 配置审批
├── config-version/     # 配置版本
├── dev-platform/       # 代码生成器（旧版入口）
├── dict-item/          # 字典项
├── dict-type/          # 字典类型
├── error-code/         # 错误码查看器
├── fallback/           # 404 兜底
├── monitor/            # 监控面板
├── preference/         # 个人设置
├── tenant/             # 租户列表
└── variable/           # 系统变量
```

---

## frontend-modules/userinfo-web

> 身份引擎前端 — 对应后端服务 `ydsz-userinfo`

### 路由清单

| 路径 path | 名称 name | 组件 component |
|---|---|---|
| `/organization/user` | UserManagement | `#/views/system/user/index.vue` |
| `/organization/dept` | DeptManagement | `#/views/system/dept/index.vue` |
| `/organization/role` | RoleManagement | `#/views/system/role/index.vue` |
| `/organization/post` | PostManagement | `#/views/system/post/index.vue` |
| `/organization/company` | CompanyManagement | `#/views/system/company/index.vue` |
| `/system-config/menu` | MenuManagement | `#/views/system/menu/index.vue` |
| `/system-config/language` | LanguageManagement | `#/views/system/language/index.vue` |
| `/security/oauth2` | OAuth2Management | `#/views/oauth2/index.vue` |
| `/security/saml-idp` | SamlIdpManagement | `#/views/saml-idp/index.vue` |
| `/security/webauthn` | WebAuthnManagement | `#/views/webauthn/index.vue` |
| `/security/social-client` | SocialClientManagement | `#/views/social-client/index.vue` |
| `/security/apikey` | ApiKeyManagement | `#/views/system/api-key/index.vue` |
| `/security/auth-policy` | AuthPolicyManagement | `#/views/system/auth-policy/index.vue` |
| `/security/security-alert` | SecurityAlertManagement | `#/views/system/security-alert/index.vue` |
| `/security-audit/session` | SessionManagement | `#/views/system/session/index.vue` |
| `/security-audit/login-log` | LoginLogManagement | `#/views/system/login-log/index.vue` |
| `/security-audit/audit` | AuditLogManagement (system) | `#/views/system/audit/index.vue` |
| `/security-audit/security-dashboard` | SecurityDashboard | `#/views/system/security-dashboard/index.vue` |
| `/user/social` | SocialAccount | `#/views/system/social-account/index.vue` |
| `/user/devices` | DeviceSession | `#/views/system/device-session/index.vue` |
| `/user/ldap-sync` | LdapSync | `#/views/system/ldap-sync/index.vue` |
| `/user/sso-metrics` | SsoMetrics | `#/views/system/sso-metrics/index.vue` |
| `/user/profile` | UserProfileManagement | `#/views/system/user-profile/index.vue` |
| `/user/preference` | UserPreferenceManagement | `#/views/system/user-preference/index.vue` |

### API 清单

| 函数名 | 方法 | URL | 用途 |
|---|---|---|---|
| `login` | POST | `/api/auth/login` | 登录 |
| `logout` | POST | `/api/auth/logout` | 登出 |
| `refresh` | POST | `/api/auth/refresh` | 刷新 Token |
| `getUserInfo` | GET | `/api/auth/userinfo` | 当前用户信息 |
| `getAccessCodes` | GET | `/api/auth/codes` | 当前用户权限码 |
| `sendMfaCode` | POST | `/api/auth/mfa/send-code` | 发送 MFA 验证码 |
| `sendMfaEmailCode` | POST | `/api/auth/mfa/send-email-code` | 发送 MFA 邮件码 |
| `listActiveSessions` | GET | `/api/auth/sessions` | 活跃会话列表 |
| `kickOutSession` | DELETE | `/api/auth/sessions/{token}` | 踢出会话 |
| `kickOutOtherSessions` | DELETE | `/api/auth/sessions` | 踢出其他会话 |
| `generateDeviceCode` | POST | `/api/auth/sso/device-code` | 设备码生成 |
| `exchangeDeviceCode` | POST | `/api/auth/sso/device-exchange` | 设备码交换 |
| `secondaryAuth` | POST | `/api/auth/secondary-auth` | 二次认证 |
| `getWebAuthnChallenge` | GET | `/api/auth/secondary-auth/webauthn/challenge` | WebAuthn 挑战 |
| `webAuthnSecondaryAuth` | POST | `/api/auth/secondary-auth/webauthn` | WebAuthn 认证 |
| `list` (user) | — | `/api/user/...` | 用户 CRUD |
| `page` (role) | — | `/api/role/...` | 角色 CRUD |
| `list` (department) | GET | `/api/dept/list` | 部门列表 |
| `tree` (department) | GET | `/api/dept/tree` | 部门树 |
| `getById` (department) | GET | `/api/dept/{id}` | 部门详情 |
| `save` (department) | POST | `/api/dept` | 新增部门 |
| `update` (department) | PUT | `/api/dept` | 更新部门 |
| `remove` (department) | DELETE | `/api/dept/{id}` | 删除部门 |
| `list` (company) | GET | `/api/company/list` | 公司列表 |
| `tree` (company) | GET | `/api/company/tree` | 公司树 |
| `getById` (company) | GET | `/api/company/{id}` | 公司详情 |
| `save` (company) | POST | `/api/company` | 新增公司 |
| `update` (company) | PUT | `/api/company` | 更新公司 |
| `remove` (company) | DELETE | `/api/company/{id}` | 删除公司 |
| `list` (post) | — | `/api/post/...` | 岗位 CRUD |
| `list` (menu) | — | `/api/menu/...` | 菜单管理 |
| `list` (language) | — | `/api/language/...` | 语言管理 |
| `page` (loginLog) | — | `/api/login-log/...` | 登录日志 |
| `page` (audit) | — | `/api/audit-log/...` | 审计日志 |
| `banUser` / `unbanUser` / `getBanInfo` | POST/GET | `/api/admin/users/{userId}/ban...` | 用户封禁 |
| `getUserSessions` | GET | `/api/admin/users/{userId}/sessions` | 用户会话 |
| `forceLogout` | DELETE | `/api/admin/users/{userId}/sessions/{accessToken}` | 强制登出 |
| `getAllActiveSessions` | GET | `/api/admin/sessions` | 全部活跃会话 |
| `getSessionStatistics` | GET | `/api/admin/sessions/statistics` | 会话统计 |
| `generateKey` / `pageKeys` / `revokeKeys` / `updateEnabled` | — | `/api/apikey` | API Key 管理 |
| `pageAuthPolicy` / `getAuthPolicyById` / `createAuthPolicy` / `updateAuthPolicy` / `deleteAuthPolicy` | — | `/api/auth-policy/...` | 认证策略 |
| `pageOAuth2Applications` / `saveOAuth2Application` / … | — | `/api/oauth2/...` | OAuth2 应用 |
| 以下来自 `oidc`、`saml`、`samlIdpConfig`、`scim`、`securityAlert`、`securityDashboard`、`selfService`、`socialAccount`、`socialClientConfig`、`ssoMetrics`、`tenantSwitch`、`tokenExchange`、`userAccount`、`userinfoSearch`、`userPreference`、`userProfile`、`webAuthn`、`ldapSync`、`cas`、`authEventSse`、`deviceAuthorization`、`deviceSession` 等模块 | — | 各模块对应 `/api/...` | OIDC/SAML/SCIM/安全告警/安全仪表盘/自助服务/社交账号/SSO/Token 交换/WebAuthn/LDAP 同步/CAS/设备授权等 |

### 页面目录

```
src/views/
├── fallback/            # 404 兜底
├── oauth2/             # OAuth2 应用
├── saml-idp/           # SAML 配置
├── social-client/      # 社交登录
├── system/
│   ├── api-key/        # API Key
│   ├── audit/          # 审计日志
│   ├── auth-policy/    # 认证策略
│   ├── company/        # 公司管理
│   ├── dept/           # 部门管理
│   ├── device-session/ # 我的设备
│   ├── language/       # 语言管理
│   ├── ldap-sync/      # LDAP 同步
│   ├── login-log/      # 登录日志
│   ├── menu/           # 菜单管理（含 IconPicker 组件）
│   ├── post/           # 岗位管理
│   ├── role/           # 角色管理
│   ├── security-alert/ # 安全告警
│   ├── security-dashboard/ # 安全仪表盘
│   ├── session/        # 在线用户
│   ├── social-account/ # 社交账号绑定
│   ├── sso-metrics/    # SSO 监控
│   ├── user/           # 用户管理
│   ├── user-preference/ # 偏好设置
│   └── user-profile/   # 个人中心
└── webauthn/           # Passkey
```

---

## frontend-modules/workflow-web

> 流程引擎前端 — 对应后端服务 `ydsz-workflow`

### 路由清单

| 路径 path | 名称 name | 组件 component |
|---|---|---|
| `/template/list` | TemplateManagement | `#/views/template/index.vue` |
| `/template/category` | CategoryManagement | `#/views/category/index.vue` |
| `/flow/instance` | InstanceManagement | `#/views/instance/index.vue` |
| `/flow/task` | TaskManagement | `#/views/task/index.vue` |
| `/design/editor` | DesignerEditor | `#/views/designer/index.vue` |
| `/design/form` | FormDesigner | `#/views/form-designer/index.vue` |
| `/monitor/overview` | MonitorOverview | `#/views/monitor/index.vue` |
| `/monitor/simulation` | SimulationManagement | `#/views/simulation/index.vue` |
| `/approval/delegate` | DelegateManagement | `#/views/delegate/index.vue` |
| `/approval/quick-comment` | QuickCommentManagement | `#/views/quick-comment/index.vue` |
| `/approval/advanced` | AdvancedApprovalManagement | `#/views/advanced/index.vue` |
| `/integration/message-event` | MessageEventManagement | `#/views/message-event/index.vue` |

### API 清单

| 函数名 | 方法 | URL | 用途 |
|---|---|---|---|
| `deploy` | POST | `/api/workflow/engine/definition/deploy` | 流程部署 |
| `batchDeployFromZip` | POST | `/api/workflow/engine/definition/batchDeployZip` | ZIP 批量部署 |
| `publish` | POST | `/api/workflow/engine/definition/{id}/publish` | 发布流程 |
| `deprecate` | POST | `/api/workflow/engine/definition/{id}/deprecate` | 废弃流程 |
| `getByCode` | GET | `/api/workflow/engine/definition/code/{code}` | 按编码查询 |
| `page` (definition) | GET | `/api/workflow/engine/definition/page` | 流程分页 |
| `getDefinitionById` | GET | `/api/workflow/engine/definition/{id}` | 流程详情 |
| `getDefinitionPreview` | GET | `/api/workflow/engine/definition/{id}/preview` | 预览流程详情 |
| `switchVersion` | POST | `/api/workflow/engine/definition/{code}/switchVersion` | 切换版本 |
| `enable` | POST | `/api/workflow/engine/definition/{id}/enable` | 启用 |
| `disable` | POST | `/api/workflow/engine/definition/{id}/disable` | 禁用 |
| `listVersions` | GET | `/api/workflow/engine/definition/{id}/versions` | 版本列表 |
| `diffVersions` | GET | `/api/workflow/engine/definition/{id}/diff` | 版本差异 |
| `rollbackDefinition` | POST | `/api/workflow/engine/definition/rollback` | 流程回滚 |
| `updateNodeCoordinate` | POST | `/api/workflow/engine/definition/{id}/node/{nodeCode}/coordinate` | 节点坐标更新 |
| `updateDefinition` | PUT | `/api/workflow/engine/definition/{id}` | 流程定义更新 |
| `exportDefinition` | GET | `/api/workflow/engine/definition/{id}/export` | 导出定义 |
| `pageCc` | POST | `/api/workflow/engine/cc/page` | 抄送分页 |
| `getCcUnreadCount` | GET | `/api/workflow/engine/cc/unreadCount` | 抄送未读数 |
| `ccMarkRead` | POST | `/api/workflow/engine/cc/{id}/read` | 抄送已读 |
| `ccMarkAllRead` | POST | `/api/workflow/engine/cc/readAll` | 全部已读 |
| `addComment` | POST | `/api/workflow/comment` | 添加评论 |
| `listByInstance` | GET | `/api/workflow/comment/instance/{instanceId}` | 实例评论 |
| `listRootComments` | GET | `/api/workflow/comment/root/{instanceId}` | 根评论 |
| `listReplies` | GET | `/api/workflow/comment/replies/{parentCommentId}` | 回复列表 |
| `deleteComment` | DELETE | `/api/workflow/comment/{commentId}` | 删除评论 |
| `listQuickComments` | GET | `/api/workflow/comment/quick` | 快捷评语 |
| `createQuickComment` | POST | `/api/workflow/comment/quick` | 创建快捷评语 |
| `updateQuickComment` | PUT | `/api/workflow/comment/quick` | 更新快捷评语 |
| `deleteQuickComment` | DELETE | `/api/workflow/comment/quick/{id}` | 删除快捷评语 |
| `incrementUseCount` | POST | `/api/workflow/comment/quick/{id}/use` | 使用计数 |
| `page` (instance) | — | `/api/workflow/engine/instance/...` | 流程实例 |
| `page` (task) | — | `/api/workflow/engine/task/...` | 流程任务 |
| `page` (template) | — | `/api/workflow/engine/template/...` | 流程模板 |
| `listCategories` | GET | `/api/workflow/categories` | 分类列表 |
| `getCategoryTree` | GET | `/api/workflow/categories/tree` | 分类树 |
| `saveCategory` | POST | `/api/workflow/categories` | 新增分类 |
| `updateCategory` | PUT | `/api/workflow/categories` | 更新分类 |
| `removeCategory` | DELETE | `/api/workflow/categories/{id}` | 删除分类 |
| `listByTask` (attachment) | GET | `/api/workflow/engine/attachment/task/{taskId}` | 任务附件 |
| `listByInstance` (attachment) | GET | `/api/workflow/engine/attachment/instance/{instanceId}` | 实例附件 |
| `deleteAttachment` | DELETE | `/api/workflow/engine/attachment/{attachmentId}` | 删除附件 |
| `previewAttachment` | GET | `/api/workflow/engine/attachment/{attachmentId}/preview` | 附件预览 |
| `createDelegateAuth` | POST | `/api/workflow/engine/delegateAuth/create` | 创建授权委托 |
| `revokeDelegateAuth` | POST | `/api/workflow/engine/delegateAuth/{id}/revoke` | 撤回委托 |
| `updateDelegateAuthStatus` | POST | `/api/workflow/engine/delegateAuth/{id}/status` | 委托状态 |
| `listMyDelegateAuths` | GET | `/api/workflow/engine/delegateAuth/mine` | 我的委托 |
| `listAsDelegate` | GET | `/api/workflow/engine/delegateAuth/asDelegate` | 作为委托人 |
| `getEmbeddedPanel` | GET | `/api/workflow/embedded/panel` | 嵌入审批面板 |
| `doEmbeddedAction` | POST | `/api/workflow/embedded/action` | 嵌入审批操作 |
| `doEmbeddedTypedAction` | POST | `/api/workflow/embedded/{businessType}/{businessId}/action` | 按类型审批 |
| `getOverview` (analytics) | GET | `/api/workflow/analytics/overview` | 分析总览 |
| `approverEfficiency` | GET | `/api/workflow/analytics/approverEfficiency` | 审批人效率 |
| `flowEfficiency` | GET | `/api/workflow/analytics/flowEfficiency` | 流程效率 |
| `nodeDuration` | GET | `/api/workflow/analytics/nodeDuration` | 节点耗时 |
| `approvalTrend` | GET | `/api/workflow/analytics/approvalTrend` | 审批趋势 |
| `getArchiveConfig` | GET | `/api/workflow/analytics/history/config` | 归档配置 |
| `archiveHistory` | POST | `/api/workflow/analytics/history/archive` | 归档历史 |
| `purgeHistory` | POST | `/api/workflow/analytics/history/purge` | 清理历史 |
| `listSupportedLocales` | GET | `/api/workflow/analytics/i18n/locales` | 支持语言 |
| `listEnumDescriptions` | GET | `/api/workflow/analytics/i18n/enum/{enumType}` | 枚举描述 |
| `getEnumDescription` | GET | `/api/workflow/analytics/i18n/enum/{enumType}/{enumName}` | 单枚举描述 |
| `weeklyReport` | GET | `/api/workflow/advanced/report/weekly` | 周报 |
| `monthlyReport` | GET | `/api/workflow/advanced/report/monthly` | 月报 |
| `sendWeekly` | POST | `/api/workflow/advanced/report/weekly/send` | 发送周报 |
| `sendMonthly` | POST | `/api/workflow/advanced/report/monthly/send` | 发送月报 |
| `mergeGroup` | POST | `/api/workflow/advanced/merge` | 创建合议组 |
| `getMergeGroup` | GET | `/api/workflow/advanced/merge/{mergeGroupId}` | 合议组详情 |
| `mergePass` | POST | `/api/workflow/advanced/merge/{mergeGroupId}/pass` | 合议通过 |
| `mergeReject` | POST | `/api/workflow/advanced/merge/{mergeGroupId}/reject` | 合议驳回 |
| `listMergeable` | GET | `/api/workflow/advanced/mergeable` | 可合议列表 |
| `updateVotePassRate` | POST | `/api/workflow/advanced/countersign/{taskId}/votePassRate` | 更新通过率 |
| `updateApproveCount` | POST | `/api/workflow/advanced/countersign/{taskId}/approveCount` | 更新审批数 |
| `hasApproved` | GET | `/api/workflow/advanced/dedup/{instanceId}/check/{userId}` | 重复检查 |
| `listApprovedUsers` | GET | `/api/workflow/advanced/dedup/{instanceId}/approvedUsers` | 已审批用户 |
| `getUrgeCooldown` | GET | `/api/workflow/advanced/urge/cooldown/{instanceId}` | 催办冷却 |
| `autoForward` | POST | `/api/workflow/advanced/offlineForward/auto` | 自动转交 |
| `manualForward` | POST | `/api/workflow/advanced/offlineForward/manual` | 手动转交 |
| `getSimulationResult` | — | `/api/workflow/engine/simulation/...` | 流程仿真 |
| `getMessageEvents` | — | `/api/workflow/engine/message-event/...` | 消息事件发布 |
| `startProcess` | POST | `/api/internal/engine/instance/start` | 启动流程 |
| `getByBusiness` | GET | `/api/internal/engine/instance/byBusiness` | 按业务查实例 |
| `terminate` | POST | `/api/internal/engine/instance/{id}/terminate` | 终止实例 |

### 页面目录

```
src/views/
├── advanced/            # 高级审批
├── category/            # 流程分类
├── delegate/            # 委派管理
├── designer/            # 流程设计器
│   └── components/
│       ├── DesignerCanvas.vue
│       ├── DesignerPalette.vue
│       ├── DesignerPropertyPanel.vue
│       ├── DesignerToolbar.vue
│       └── expression/
│           └── ExpressionEditor.vue
├── fallback/            # 404 兜底
├── form-designer/       # 表单设计器
├── instance/            # 流程实例
├── message-event/       # 消息事件发布
├── monitor/             # 监控概览
├── quick-comment/       # 快捷评语
├── simulation/          # 流程仿真
├── task/                # 待办任务
└── template/            # 流程模板
```

---

## 附录：跨应用共享模块

### api/core/（身份认证公共 API）

| 文件 | 用途 |
|---|---|
| `core/auth.ts` | 登录 / 登出 / 刷新 Token / 二次认证 |
| `core/menu.ts` | 菜单查询 |
| `core/user.ts` | 当前用户信息 |
| `core/notification.ts` | 系统通知（仅 system-web 中存在） |
| `core/preference.ts` | 个人偏好设置（仅 system-web 中存在） |

### 路由公共结构

所有应用的路由入口文件 `src/router/index.ts` 结构一致：
- 使用 `createRouter`，支持 hash / history 模式切换（通过 `VITE_ROUTER_HISTORY` 环境变量）
- 默认首页重定向：`preferences.app.defaultHomePath`
- 注册 `guard` 与 `accessRoutes`（动态权限路由）

### URL 前缀约定

| 后端服务 | URL 前缀 |
|---|---|
| Agent 智能引擎 | `/api/agent/*` |
| Cronjob 任务引擎 | `/api/cronjob/*` |
| Generator 生成器 | `/api/generator/*` |
| Literule 规则引擎 | `/api/literule/*` |
| Message 消息引擎 | `/api/message/*` |
| Nextwiki 文件引擎 | `/api/nextwiki/*` |
| System 系统引擎 | `/api/config/*` `/api/dict/*` `/api/tenant/*` 等 |
| Userinfo 身份引擎 | `/api/auth/*` `/api/dept/*` `/api/user/*` 等 |
| Workflow 流程引擎 | `/api/workflow/engine/*` |

内部服务间调用前缀：`/api/internal/...`
