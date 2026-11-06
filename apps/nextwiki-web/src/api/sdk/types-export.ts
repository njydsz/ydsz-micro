/**
 * nextwiki 命名类型别名导出
 *
 * <p>由 unified-contract.mjs 自动生成，请勿手动修改。
 * <p>提供 components.schemas 中定义的命名类型别名，消除 models.ts 手动类型定义。
 *
 * @auto-generated
 * @since 4.0.0
 */

import type { components } from './schema';

// 导出命名类型别名，便于业务代码直接使用
export type BatchResultDTO = components['schemas']['BatchResultDTO'];
export type BreadcrumbItem = components['schemas']['BreadcrumbItem'];
export type Bucket = components['schemas']['Bucket'];
export type DiffEntryVO = components['schemas']['DiffEntryVO'];
export type DiffResultVO = components['schemas']['DiffResultVO'];
export type FileCommentVO = components['schemas']['FileCommentVO'];
export type FileNodeVO = components['schemas']['FileNodeVO'];
export type FileVersionVO = components['schemas']['FileVersionVO'];
export type ItemResult = components['schemas']['ItemResult'];
export type SearchAggregation = components['schemas']['SearchAggregation'];
export type SearchHitVO = components['schemas']['SearchHitVO'];
export type SearchRequest = components['schemas']['SearchRequest'];
export type SearchResultVO = components['schemas']['SearchResultVO'];
export type ShareAccessLogVO = components['schemas']['ShareAccessLogVO'];
export type ShareLinkVO = components['schemas']['ShareLinkVO'];
export type ShareRecipientVO = components['schemas']['ShareRecipientVO'];
export type SpaceMemberDTO = components['schemas']['SpaceMemberDTO'];
export type SpaceTemplateDTO = components['schemas']['SpaceTemplateDTO'];
export type SpaceVO = components['schemas']['SpaceVO'];
export type StorageQuotaVO = components['schemas']['StorageQuotaVO'];
export type SummaryResult = components['schemas']['SummaryResult'];
export type TagDTO = components['schemas']['TagDTO'];
export type TagVO = components['schemas']['TagVO'];
export type TrashItemVO = components['schemas']['TrashItemVO'];
export type UserFavoriteVO = components['schemas']['UserFavoriteVO'];
export type UserRecentVO = components['schemas']['UserRecentVO'];

// 常用响应类型别名
export type { PageResponse, YdszResponse } from '../models';
