/**
 * userinfo 命名类型别名导出
 *
 * <p>由 unified-contract.mjs 自动生成，请勿手动修改。
 * <p>提供 components.schemas 中定义的命名类型别名，消除 models.ts 手动类型定义。
 *
 * @auto-generated
 * @since 4.0.0
 */

import type { components } from './schema';

// 导出命名类型别名，便于业务代码直接使用
export type AccountUnlockDTO = components['schemas']['AccountUnlockDTO'];
export type AssignPermissionsDTO = components['schemas']['AssignPermissionsDTO'];
export type AssignRolesDTO = components['schemas']['AssignRolesDTO'];
export type AuthPolicyDTO = components['schemas']['AuthPolicyDTO'];
export type AuthPolicyPageQuery = components['schemas']['AuthPolicyPageQuery'];
export type BatchUserStatusDTO = components['schemas']['BatchUserStatusDTO'];
export type ChangePasswordDTO = components['schemas']['ChangePasswordDTO'];
export type CompanyDTO = components['schemas']['CompanyDTO'];
export type DepartmentDTO = components['schemas']['DepartmentDTO'];
export type ForgotPasswordDTO = components['schemas']['ForgotPasswordDTO'];
export type LanguageDTO = components['schemas']['LanguageDTO'];
export type LanguagePageQuery = components['schemas']['LanguagePageQuery'];
export type LoginDTO = components['schemas']['LoginDTO'];
export type MenuDTO = components['schemas']['MenuDTO'];
export type MfaOperationDTO = components['schemas']['MfaOperationDTO'];
export type OAuth2TokenRequest = components['schemas']['OAuth2TokenRequest'];
export type PostDTO = components['schemas']['PostDTO'];
export type RefreshRequest = components['schemas']['RefreshRequest'];
export type ResetPasswordDTO = components['schemas']['ResetPasswordDTO'];
export type RoleDTO = components['schemas']['RoleDTO'];
export type RolePageQuery = components['schemas']['RolePageQuery'];
export type SamlIdpDTO = components['schemas']['SamlIdpDTO'];
export type SamlIdpPageQuery = components['schemas']['SamlIdpPageQuery'];
export type ScimEmail = components['schemas']['ScimEmail'];
export type ScimMeta = components['schemas']['ScimMeta'];
export type ScimName = components['schemas']['ScimName'];
export type ScimPatchOp = components['schemas']['ScimPatchOp'];
export type ScimPhone = components['schemas']['ScimPhone'];
export type ScimUser = components['schemas']['ScimUser'];
export type SecondaryAuthRequest = components['schemas']['SecondaryAuthRequest'];
export type SecurityAlertPageQuery = components['schemas']['SecurityAlertPageQuery'];
export type SelfRegisterDTO = components['schemas']['SelfRegisterDTO'];
export type SendVerifyCodeDTO = components['schemas']['SendVerifyCodeDTO'];
export type SensitiveVerifyDTO = components['schemas']['SensitiveVerifyDTO'];
export type SocialClientDTO = components['schemas']['SocialClientDTO'];
export type SocialClientPageQuery = components['schemas']['SocialClientPageQuery'];
export type UserAccountDTO = components['schemas']['UserAccountDTO'];
export type UserAccountPageQuery = components['schemas']['UserAccountPageQuery'];
export type UserBanRequestDTO = components['schemas']['UserBanRequestDTO'];
export type UserProfileUpdateDTO = components['schemas']['UserProfileUpdateDTO'];
export type UserSearchQuery = components['schemas']['UserSearchQuery'];

// 常用响应类型别名
export type { PageResponse, YdszResponse } from '../models';
