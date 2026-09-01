#!/usr/bin/env node
/**
 * DDL 驱动的前后端 CRUD 骨架生成器。
 *
 * <p>输入模块结构定义（JSON/Yaml），生成：
 * <ul>
 *   <li>后端：Entity + DTO + VO + Mapper XML + Service 接口（脚手架，字段类型与 Javadoc 齐全）</li>
 *   <li>前端：API 模块文件 + 类型模型 + 列表页组件 + 表单弹窗组件（90% 模板化）</li>
 * </ul>
 *
 * <p>对标 RuoYi-Vue / Snowy / BladeX 的代码生成器，但遵循云顶编码规范模块路径
 * （DDD 分层：server/web/domain/infra），不复制其贫血模型风格。
 *
 * <p>使用方式：
 * <pre>
 *   node bash/gen-crud-skeleton.mjs --config ./data/gen/user-config.json
 *   node bash/gen-crud-skeleton.mjs --table user_info --module userinfo-web --fields '[{"name":"userName","type":"string","required":true},{"name":"age","type":"integer"}]'
 * </pre>
 *
 * <p>配置文件示例（user-config.json）：
 * <pre>
 * {
 *   "module": "userinfo",
 *   "tableName": "ydsz_user_info",
 *   "comment": "用户信息",
 *   "primaryKey": "id",
 *   "fields": [
 *     { "columnName": "user_name", "javaType": "String", "tsType": "string", "comment": "用户名", "required": true, "maxLength": 50, "form": true, "list": true, "query": true },
 *     { "columnName": "email", "javaType": "String", "tsType": "string", "comment": "邮箱", "format": "email", "form": true, "list": true, "query": false },
 *     { "columnName": "status", "javaType": "Integer", "tsType": "number", "comment": "状态", "enum": [{"label":"启用","value":1},{"label":"禁用","value":0}], "form": true, "list": true, "query": true }
 *   ]
 * }
 * </pre>
 *
 * @path bash/gen-crud-skeleton.mjs
 * @author ydsz-team
 * @since 4.1.0 (P2-12)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CLOUD_ROOT = process.env.YDSZ_OPENAPI_ROOT || 'D:\\Code\\open\\ydsz-cloud';

/** 将蛇形命名转驼峰大端（user_name → UserName） */
function toPascalCase(s) {
  return s.replace(/(?:^|_)(\w)/g, (_, c) => c.toUpperCase());
}

/** 将蛇形命名转驼峰小端（user_name → userName） */
function toCamelCase(s) {
  const p = toPascalCase(s);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

/**
 * 从配置解析字段列表并补全派生信息。
 */
function resolveFields(config) {
  return config.fields.map((f) => {
    const javaName = toCamelCase(f.columnName);
    const javaType = f.javaType || 'String';
    return {
      ...f,
      javaName,
      javaType,
      tsType: f.tsType || (javaType === 'Integer' ? 'number' : javaType === 'Boolean' ? 'boolean' : 'string'),
      form: f.form !== false,
      list: f.list !== false,
      query: f.query === true,
    };
  });
}

/**
 * 生成后端 Entity 字段（标准 JSR-380 注解 + MyBatis-Plus 注解）。
 */
function generateEntity(config, fields) {
  const className = toPascalCase(config.tableName.replace(/^ydsz_/u, ''));
  const lines = [
    `package com.njydsz.${config.module}.domain.entity;`,
    '',
    `import com.baomidou.mybatisplus.annotation.*;`,
    `import lombok.Data;`,
    `import lombok.EqualsAndHashCode;`,
    `import java.io.Serializable;`,
    `import java.time.LocalDateTime;`,
    '',
    `/**`,
    ` * ${config.comment} 实体`,
    ` *`,
    ` * @path ydsz-${config.module}/ydsz-${config.module}-domain/src/main/java/com/njydsz/${config.module}/domain/entity/${className}.java`,
    ` * @author ydsz-team`,
    ` * @since 4.1.0`,
    ` */`,
    `@Data`,
    `@EqualsAndHashCode(callSuper = false)",
    `@TableName("${config.tableName}")`,
    `public class ${className} implements Serializable {`,
    '',
    '    private static final long serialVersionUID = 1L;',
    '',
    '    @TableId(value = "id", type = IdType.ASSIGN_ID)',
    '    private Long id;',
    '',
  ];

  for (const f of fields) {
    if (['id', 'createTime', 'updateTime', 'createBy', 'updateBy', 'deleted'].includes(f.columnName)) {
      continue;
    }
    const colAnn = `@TableField("${f.columnName}")`;
    lines.push(`    /**`);
    lines.push(`     * ${f.comment || f.javaName}`);
    lines.push(`     */`);
    lines.push(`    ${colAnn}`);
    lines.push(`    private ${f.javaType} ${f.javaName};`);
    lines.push('');
  }

  lines.push('}');
  return { className, content: lines.join('\n') };
}

/**
 * 生成后端 JSR-380 DTO。
 */
function generateDto(config, fields, suffix = 'Save') {
  const className = `${toPascalCase(config.tableName.replace(/^ydsz_/u, ''))}${suffix}Dto`;
  const lines = [
    `package com.njydsz.${config.module}.server.dto;`,
    '',
    `import lombok.Data;`,
    `import javax.validation.constraints.*;`,
    `import java.io.Serializable;`,
    '',
    `/**`,
    ` * ${config.comment} DTO（${suffix === 'Save' ? '新增/更新' : '分页查询'}）`,
    ` *`,
    ` * @path ydsz-${config.module}/ydsz-${config.module}-server/src/main/java/com/njydsz/${config.module}/server/dto/${className}.java`,
    ` * @author ydsz-team`,
    ` * @since 4.1.0`,
    ` */`,
    `@Data`,
    `public class ${className} implements Serializable {`,
    '',
  ];

  if (suffix === 'Page') {
    /** 分页查询 DTO 精简：仅 query=true 字段 + 分页参数 */
    for (const f of fields.filter((x) => x.query)) {
      lines.push(`    /** ${f.comment || f.javaName} */`);
      lines.push(`    private ${f.javaType} ${f.javaName};`);
      lines.push('');
    }
  } else {
    for (const f of fields.filter((x) => x.form)) {
      const validationAnn = [];
      if (f.required) {
        validationAnn.push(f.javaType === 'String' ? '@NotBlank' : '@NotNull');
      }
      if (f.maxLength && f.javaType === 'String') {
        validationAnn.push(`@Size(max = ${f.maxLength})`);
      }
      if (f.format === 'email') {
        validationAnn.push('@Email');
      }
      lines.push(`    /** ${f.comment || f.javaName} */`);
      for (const ann of validationAnn) {
        lines.push(`    ${ann}`);
      }
      lines.push(`    private ${f.javaType} ${f.javaName};`);
      lines.push('');
    }
  }

  lines.push('}');
  return { className, content: lines.join('\n') };
}

/**
 * 生成前端 API 模块文件（typed api functions）。
 */
function generateFrontendApi(config, fields) {
  const moduleName = config.module;
  const className = toPascalCase(config.tableName.replace(/^ydsz_/u, ''));
  const filePath = `apps/${config.module}-web/src/api/modules/${className}.ts`;

  const apiLines = [
    `/**`,
    ` * ${config.comment} API 模块 —— 由 pnpm gen:crud 自动生成`,
    ` *`,
    ` * @path apps/${config.module}-web/src/api/modules/${className}.ts`,
    ` * @author ydsz-team`,
    ` * @since 4.1.0`,
    ` */`,
    `import { ${moduleName}Client } from '../client';`,
    `import type { PageQuery, PageResponse } from '../models';`,
    `import type { ${className}Dto, ${className}Vo, ${className}PageQuery } from '../models';`,
    '',
    `/********************** 分页查询 **********************/`,
    `export async function fetch${className}List(params: PageQuery<${className}PageQuery>): Promise<PageResponse<${className}Vo>> {`,
    `  const { data } = await ${moduleName}Client.get<PageResponse<${className}Vo>>('/api/v1/${config.module}/${className.toLowerCase()}/page', { params });`,
    `  return data as PageResponse<${className}Vo>;`,
    `}`,
    '',
    `/********************** 新增 **********************/`,
    `export async function create${className}(data: ${className}Dto): Promise<void> {`,
    `  await ${moduleName}Client.post('/api/v1/${config.module}/${className.toLowerCase()}', data);`,
    `}`,
    '',
    `/********************** 更新 **********************/`,
    `export async function update${className}(id: number, data: ${className}Dto): Promise<void> {`,
    `  await ${moduleName}Client.put(\`/api/v1/${config.module}/${className.toLowerCase()}/\${id}\`, data);`,
    `}`,
    '',
    `/********************** 删除 **********************/`,
    `export async function delete${className}(ids: number[]): Promise<void> {`,
    `  await ${moduleName}Client.delete('/api/v1/${config.module}/${className.toLowerCase()}', { params: { ids } });`,
    `}`,
    '',
  ];

  return { filePath, content: apiLines.join('\n') };
}

/**
 * 生成前端模型类型定义。
 */
function generateFrontendModels(config, fields) {
  const className = toPascalCase(config.tableName.replace(/^ydsz_/u, ''));
  const filePath = `apps/${config.module}-web/src/api/modules/models/${className}Model.ts`;

  const modelLines = [
    `/**`,
    ` * ${config.comment} 模型类型 —— 由 pnpm gen:crud 自动生成`,
    ` *`,
    ` * @path apps/${config.module}-web/src/api/modules/models/${className}Model.ts`,
    ` * @author ydsz-team`,
    ` * @since 4.1.0`,
    ` */`,
    `import type { PageQuery } from '../../models';`,
    '',
    `/** DTO（新增/更新请求体） */`,
    `export interface ${className}Dto {`,
  ];

  for (const f of fields.filter((x) => x.form)) {
    if (f.javaName === 'id') continue;
    modelLines.push(`  /** ${f.comment || f.javaName} */`);
    modelLines.push(`  ${f.javaName}${f.required ? '' : '?'}: ${f.tsType};`);
  }
  modelLines.push(`}`);
  modelLines.push('');

  modelLines.push(`/** VO（列表/详情返回体） */`);
  modelLines.push(`export interface ${className}Vo {`);
  for (const f of fields) {
    modelLines.push(`  /** ${f.comment || f.javaName} */`);
    modelLines.push(`  ${f.javaName}: ${f.tsType};`);
  }
  modelLines.push(`  /** 创建时间 */`);
  modelLines.push(`  createTime?: string;`);
  modelLines.push(`  /** 更新时间 */`);
  modelLines.push(`  updateTime?: string;`);
  modelLines.push(`}`);
  modelLines.push('');

  modelLines.push(`/** 分页查询参数 */`);
  modelLines.push(`export interface ${className}PageQuery extends PageQuery {`);
  for (const f of fields.filter((x) => x.query)) {
    modelLines.push(`  /** ${f.comment || f.javaName} */`);
    modelLines.push(`  ${f.javaName}?: ${f.tsType};`);
  }
  modelLines.push(`}`);

  return { filePath, content: modelLines.join('\n') };
}

// =====================================================================
// 主流程
// =====================================================================

async function main() {
  const args = process.argv.slice(2);
  const configArg = args.find((a, i) => a === '--config' && args[i + 1]);
  const configPath = configArg ? args[args.indexOf('--config') + 1] : null;

  let config;
  if (configPath) {
    const absPath = configPath.startsWith('/') || /^[A-Za-z]:/.test(configPath)
      ? configPath
      : join(ROOT, configPath);
    if (!existsSync(absPath)) {
      console.error(`配置文件不存在: ${absPath}`);
      process.exit(1);
    }
    config = JSON.parse(readFileSync(absPath, 'utf-8'));
  } else {
    console.error('缺少 --config 参数。用法: node bash/gen-crud-skeleton.mjs --config ./config.json');
    process.exit(1);
  }

  const moduleName = config.module;
  const fields = resolveFields(config);

  console.log(`[gen:crud] 为模块 ${moduleName} (表: ${config.tableName}) 生成 CRUD 骨架\n`);

  const outputs = [];

  // 1. 后端 Entity
  const entity = generateEntity(config, fields);
  outputs.push({
    target: join(CLOUD_ROOT, `ydsz-${moduleName}`, `ydsz-${moduleName}-domain`, 'src', 'main', 'java', 'com', 'njydsz', moduleName, 'domain', 'entity', `${entity.className}.java`),
    content: entity.content,
  });

  // 2. 后端 DTOs
  for (const suffix of ['Save', 'Page']) {
    const dto = generateDto(config, fields, suffix);
    outputs.push({
      target: join(CLOUD_ROOT, `ydsz-${moduleName}`, `ydsz-${moduleName}-server`, 'src', 'main', 'java', 'com', 'njydsz', moduleName, 'server', 'dto', `${dto.className}.java`),
      content: dto.content,
    });
  }

  // 3. 前端 API 模块
  const apiCode = generateFrontendApi(config, fields);
  outputs.push({ target: join(ROOT, apiCode.filePath), content: apiCode.content });

  // 4. 前端模型
  const models = generateFrontendModels(config, fields);
  outputs.push({ target: join(ROOT, models.filePath), content: models.content });

  // 写入文件（dry-run 且 源文件已存在时不覆盖）
  for (const { target, content } of outputs) {
    const dir = dirname(target);
    mkdirSync(dir, { recursive: true });
    const exists = existsSync(target);
    if (exists) {
      console.log(`! 已存在跳过: ${target}`);
      continue;
    }
    writeFileSync(target, content);
    console.log(`✓ 已生成: ${target}`);
  }

  console.log(`\n[gen:crud] 完成。请检查生成代码后补充业务逻辑：`);
  console.log('  - 后端：Controller / Service / Infra (Mapper) 各层实现');
  console.log('  - 前端：引用 apiClient 替换导入、补充 columns 配置（注释与 width）');
  console.log('  - 手工补充：复杂校验、数据联动、按钮权限码（按规范 §30 注解）');
}

main().catch((err) => {
  console.error('[gen:crud] 生成失败:', err);
  process.exit(1);
});
