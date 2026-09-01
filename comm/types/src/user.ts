/**
 * 用户信息类型定义 — 继承基础用户信息并扩展访问令牌与首页路径。
 *
 * @path comm\types\src\user.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { BasicUserInfo } from '@YDSZ-core/typings';

/** 用户信息（包含认证令牌与个性化首页路径） */
interface UserInfo extends BasicUserInfo {
  /**
   * 用户描述
   */
  desc: string;
  /**
   * 首页地址
   */
  homePath: string;

  /**
   * accessToken
   */
  token: string;
}

export type { UserInfo };
