/**
 * ydsz-generator 后端契约模型（前端）。
 *
 * <p>对应后端 domain 层 Entity / VO / Query 类型，为前端 API 与视图提供类型安全。
 *
 * @path apps/generator-web/src/api/models.ts
 * @author ydsz-team
 * @since 1.0.0
 */

// ═══════════════════════════════════════════════════════════
// 枚举
// ═══════════════════════════════════════════════════════════

/**
 * 文件冲突策略枚举。
 *
 * <p>当生成代码时目标文件已存在，采用哪种策略处理。
 */
export type ConflictStrategy = 'SKIP' | 'OVERRIDE' | 'MERGE';

/**
 * 数据库方言枚举。
 */
export type DbDialect = 'MYSQL' | 'POSTGRESQL' | 'ORACLE' | 'SQLSERVER';

/**
 * 生成任务状态枚举。
 */
export type GenStatus = 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'FAILED';

/**
 * 模板文件类型枚举。
 */
export type TemplateFileType = 'BACKEND' | 'FRONTEND';

// ═══════════════════════════════════════════════════════════
// 实体类型
// ═══════════════════════════════════════════════════════════

/**
 * 数据源配置实体（对应后端 GenDatasource）。
 */
export interface GenDatasource {
  /** 主键 ID */
  id?: number;
  /** 数据源名称 */
  name: string;
  /** JDBC URL */
  jdbcUrl: string;
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 数据库方言 */
  dialect: DbDialect | string;
  /** 是否默认数据源 */
  defaultFlag?: boolean;
  /** 描述 */
  description?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
}

/**
 * 数据源响应 VO（不含敏感字段 password）。
 */
export interface GenDatasourceRespVO {
  id?: number;
  name: string;
  jdbcUrl: string;
  username: string;
  dialect: string;
  defaultFlag?: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 表元数据实体（对应后端 GenTableMeta）。
 */
export interface GenTableMeta {
  id?: number;
  datasourceId?: number;
  tableName: string;
  comment?: string;
  aliasName?: string;
  moduleName?: string;
  cachedAt?: string;
}

/**
 * 列元数据实体（对应后端 GenColumnMeta）。
 */
export interface GenColumnMeta {
  id?: number;
  tableMetaId?: number;
  columnName: string;
  dataType?: string;
  columnSize?: number;
  nullable?: boolean;
  pk?: boolean;
  comment?: string;
  overrideJavaType?: string;
  overrideFieldName?: string;
  dtoSkipped?: boolean;
  voSkipped?: boolean;
  querySkipped?: boolean;
  extraConfig?: string;
}

/**
 * 模板分组实体（对应后端 GenTemplateGroup）。
 */
export interface GenTemplateGroup {
  id?: number;
  name: string;
  description?: string;
  isSystem?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 模板实体（对应后端 GenTemplate）。
 */
export interface GenTemplate {
  id?: number;
  groupId?: number;
  fileName: string;
  description?: string;
  content?: string;
  isFolder?: boolean;
  parentPath?: string;
  version?: number;
  hash?: string;
  isActive?: boolean;
  fileType?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 代码生成任务/历史实体（对应后端 GenHistory）。
 */
export interface GenHistory {
  id?: number;
  moduleName?: string;
  datasourceId?: number;
  templateGroupId?: number;
  tableCount?: number;
  fileCount?: number;
  status?: string;
  triggeredBy?: string;
  startedAt?: string;
  finishedAt?: string;
  errorMessage?: string;
  genParams?: string;
}

/**
 * 代码生成任务文件明细（对应后端 GenHistoryFile）。
 */
export interface GenHistoryFile {
  id?: number;
  historyId?: number;
  filePath: string;
  originalBackupPath?: string;
  fileHash?: string;
  action?: string;
}

// ═══════════════════════════════════════════════════════════
// VO 类型
// ═══════════════════════════════════════════════════════════

/**
 * 代码预览 VO（对应后端 CodePreviewVO）。
 */
export interface CodePreviewVO {
  fileName: string;
  filePath: string;
  content: string;
  conflict: boolean;
}

/**
 * 代码生成结果 VO（对应后端 GenResultVO）。
 */
export interface GenResultVO {
  historyId?: number;
  fileCount?: number;
  successCount?: number;
  skipCount?: number;
  failCount?: number;
}

// ═══════════════════════════════════════════════════════════
// Query 类型
// ═══════════════════════════════════════════════════════════

/**
 * 代码正式生成请求 Query（对应后端 GenCodeGenerateQuery）。
 */
export interface GenCodeGenerateQuery {
  /** 数据源 ID */
  datasourceId: number;
  /** 模板分组 ID */
  templateGroupId: number;
  /** 表名 */
  tableName: string;
  /** 输出目录 */
  outputDir: string;
  /** 冲突策略（SKIP/OVERRIDE/MERGE），可空，默认 SKIP */
  conflictStrategy?: ConflictStrategy;
  /** 触发人 */
  triggeredBy?: string;
}
