# 文件引擎 (ydsz-nextwiki)

> **端口**：9003 | **模块**：`ydsz-nextwiki` | **定位**：网盘知识库

## 核心定位

YDSZ 文件引擎是平台的统一文件存储与知识管理系统，支持文件秒传、版本管理、在线预览编辑（WOPI 协议）、安全扫描、OCR 文字识别以及 AI 摘要生成。

## 关键差异化能力

| 能力 | 说明 |
|------|------|
| **秒传** | 基于文件哈希的去重机制，相同文件秒级完成上传，节省带宽和存储 |
| **20 版本保留** | 每次文件更新保留最近 20 个历史版本，支持版本对比和回滚 |
| **WOPI 协议** | 支持 WOPI 在线预览/编辑，集成 Office Online / OnlyOffice |
| **ClamAV 病毒扫描** | 文件实时防病毒引擎，拦截恶意文件上传 |
| **OCR 文字识别** | 图片/PDF OCR 文字提取，支持多语言 |
| **AI 摘要生成** | 对接智能引擎，自动生成文档/表格摘要 |
| **分享链接** | 支持密码保护、有效期、下载次数限制的分享链接 |

## 核心代码模块

```
ydsz-nextwiki/
├── ydzs-nextwiki-api/          # FeignClient 接口（FileFeignClient / ShareFeignClient）
├── ydzs-nextwiki-domain/       # Entity / DTO / Repository 接口 / DomainService
│   ├── entity/                 # WikiFile, WikiVersion, WikiShare, WikiNode
│   ├── repository/             # FileRepository, VersionRepository, NodeRepository
│   ├── domain-service/         # 秒传判定、版本管理、安全扫描调度
│   └── converter/              # MapStruct Entity↔VO 转换器
├── ydzs-nextwiki-infra/        # Mapper / Repository 实现 / MinIO/OSS 适配
└── ydzs-nextwiki-server/       # Controller / 安全扫描 Worker / 定时清理
```

## 核心 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/nextwiki/file/upload` | POST | 文件上传（支持秒传） |
| `/nextwiki/file/download` | GET | 文件下载 |
| `/nextwiki/file/version/page` | GET | 文件版本列表 |
| `/nextwiki/file/rollback` | POST | 回滚到指定版本 |
| `/nextwiki/share/create` | POST | 创建分享链接 |
| `/nextwiki/share/verify` | POST | 验证分享密码 |
| `/nextwiki/ocr/recognize` | POST | OCR 文字识别 |
| `/nextwiki/summary/generate` | POST | AI 摘要生成 |

## 数据库表前缀

`ydsz_wiki_`（YDIZ-NAME-002，wiki 模块独立前缀）

## 文件存储适配

通过 `ydsz-common-file` 的 `IFileStorageProvider` 统一接口支持：

- MinIO（开源 S3 兼容）
- 阿里云 OSS
- 腾讯云 COS
- Amazon S3

## 依赖关系

- **被依赖**：智能引擎（文件内容摘要）、流程引擎（附件管理）
- **依赖**：ydsz-common-file、ydsz-common-excel、ydsz-common-netty（大文件分片）
