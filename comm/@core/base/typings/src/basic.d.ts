/**
 * 基础业务类型定义：下拉选项、用户信息等通用数据结构。
 *
 * @path comm\@core\base\typings\src\basic.d.ts
 * @author ydsz-team
 * @since 1.0.0
 */
interface BasicOption {
  label: string;
  value: string;
}

type SelectOption = BasicOption;

type TabOption = BasicOption;

interface BasicUserInfo {
  /**
   * 头像
   */
  avatar: string;
  /**
   * 用户昵称
   */
  realName: string;
  /**
   * 用户角色
   */
  roles?: string[];
  /**
   * 租户 ID（多租户场景下标识所属租户，单租户模式可不传）
   */
  tenantId?: string;
  /**
   * 用户id
   */
  userId: string;
  /**
   * 用户名
   */
  username: string;
}

type ClassType = Array<object | string> | object | string;

export type { BasicOption, BasicUserInfo, ClassType, SelectOption, TabOption };
