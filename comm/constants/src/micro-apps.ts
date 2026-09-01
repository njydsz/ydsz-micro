/**
 * 微应用注册表 — 单一事实源（运行时）。
 *
 * 所有应用清单信息集中在此定义，包括名称、端口、路由前缀、菜单、
 * 生产入口等，消除多处硬编码需要手工同步的问题。
 *
 * 消费方：
 * - main-web 运行时（路由生成 / 微前端注册 / tabbar 映射）
 * - bash/gen-registry.mjs（registry.json 生成，正则读取本文件）
 * - bash/gen-nginx-conf.mjs（nginx 子应用路由配置生成，正则读取本文件）
 *
 * 新增子应用时仅需在此数组追加一条记录（v4.4.1 A3：自 conf/vite-config
 * 迁入 comm/constants，消除构建配置包被运行时 import 的分层倒置）。
 *
 * @path comm/constants/src/micro-apps.ts
 * @author ydsz-team
 * @since 4.4.1
 */

/**
 * 子应用默认骨架屏类型。
 *
 * 与主应用 main/src/views/_core/subapp/skeletons/skeleton-registry.ts 的 SkeletonType 对齐。
 * 此处单独定义类型而非从主应用导入，避免 comm/constants 反向依赖 main 包。
 */
export type MicroAppSkeletonType = 'dashboard' | 'default' | 'detail' | 'form' | 'list';

/**
 * 沙箱类型（与 micro-runtime SandboxType 对齐的单源声明，
 * 避免运行时注册表反向依赖 micro-runtime）。
 */
export type MicroAppSandboxType = 'iframe' | 'proxy' | 'snapshot';

/** 单个微应用的完整注册信息 */
export interface MicroAppEntry {
  /** 子应用唯一标识（如 'workflow-web'），与 pnpm workspace 包名后缀一致 */
  name: string;
  /** Monorepo 内包名（如 @ydsz/workflow-web） */
  packageName: string;
  /** 路由前缀（如 '/YDSZ-user'），也作为 micro-kernel activeRule */
  activeRule: string;
  /** 菜单默认重定向路径（如 '/YDSZ-user/users'） */
  redirect: string;
  /** 菜单标题 */
  title: string;
  /** 菜单图标（lucide 图标名） */
  icon: string;
  /** 菜单排序权重（越小越靠前） */
  order: number;
  /** 开发服务器端口 */
  devPort: number;
  /** 生产环境部署子路径（未配置时回退 `/YDSZ-${name}/`） */
  prodPath?: string;
  /**
   * 子应用默认骨架屏类型（可选）。
   *
   * 用于子应用首次加载 / 切换时的过渡骨架屏。
   * 子应用 manifest.routes 可按路由前缀进一步细化，未匹配时回退到此值，
   * 再回退到 'default'。
   */
  skeletonType?: MicroAppSkeletonType;
  /**
   * 沙箱类型（可选）。
   *
   * - 未配置（undefined）：默认 'snapshot' 快照沙箱
   * - 'snapshot'：快照沙箱，性能最佳，仅防意外污染 window
   * - 'proxy'：Proxy fakeWindow 数据隔离，子应用通过 mountProps.fakeWindow 读写隔离数据
   * - 'iframe'：iframe 强隔离（CSS + DOM + window），适用于全局样式冲突的子应用
   *
   * 业务侧按子应用实际隔离需求配置，大多数同源子应用用 'snapshot' 即可。
   */
  sandbox?: MicroAppSandboxType;
}

/**
 * 微应用注册表。
 *
 * 8 个微应用分别对应后端 8 个业务微服务（网关/公共模块不对应前端应用），
 * 顺序与菜单显示一致。变更流程：修改此处 → 重启基座 dev server → 验证菜单与路由。
 */
export const MICRO_APPS: readonly MicroAppEntry[] = [
  {
    name: 'userinfo-web',
    packageName: '@ydsz/userinfo-web',
    activeRule: '/YDSZ-user',
    redirect: '/YDSZ-user/users',
    title: '用户中心',
    icon: 'lucide:users',
    order: 100,
    devPort: 5601,
    skeletonType: 'list',
  },
  {
    name: 'system-web',
    packageName: '@ydsz/system-web',
    activeRule: '/YDSZ-sys',
    redirect: '/YDSZ-sys/configs',
    title: '系统管理',
    icon: 'lucide:settings',
    order: 101,
    devPort: 5602,
    skeletonType: 'form',
  },
  {
    name: 'message-web',
    packageName: '@ydsz/message-web',
    activeRule: '/YDSZ-msg',
    redirect: '/YDSZ-msg/messages',
    title: '消息中心',
    icon: 'lucide:message-square',
    order: 103,
    devPort: 5604,
    skeletonType: 'list',
  },
  {
    name: 'cronjob-web',
    packageName: '@ydsz/cronjob-web',
    activeRule: '/YDSZ-cron',
    // B2-FIX: 与 cronjob-web 实际路由（/job/list）对齐，此前 /jobs 激活后首跳 404
    redirect: '/YDSZ-cron/job/list',
    title: '定时任务',
    icon: 'lucide:clock',
    order: 104,
    devPort: 5605,
    skeletonType: 'list',
  },
  {
    name: 'workflow-web',
    packageName: '@ydsz/workflow-web',
    activeRule: '/YDSZ-flow',
    redirect: '/YDSZ-flow/templates',
    title: '工作流引擎',
    icon: 'lucide:workflow',
    order: 105,
    devPort: 5606,
    skeletonType: 'list',
  },
  {
    name: 'nextwiki-web',
    packageName: '@ydsz/nextwiki-web',
    activeRule: '/YDSZ-wiki',
    redirect: '/YDSZ-wiki/files',
    title: '网盘知识库',
    icon: 'lucide:folder-open',
    order: 106,
    devPort: 5607,
    skeletonType: 'list',
  },
  {
    name: 'literule-web',
    packageName: '@ydsz/literule-web',
    activeRule: '/YDSZ-rule',
    redirect: '/YDSZ-rule/rules',
    title: '规则引擎',
    icon: 'lucide:git-branch',
    order: 107,
    devPort: 5608,
    skeletonType: 'list',
  },
  {
    name: 'agent-web',
    packageName: '@ydsz/agent-web',
    activeRule: '/YDSZ-ai',
    redirect: '/ydsz-ai/chat',
    title: 'AI 助手',
    icon: 'lucide:bot',
    order: 108,
    devPort: 5610,
    skeletonType: 'default',
  },
];

/**
 * 获取子应用生产环境部署子路径（如 '/YDSZ-userinfo-web/'）。
 *
 * 优先使用注册表中显式声明的 `prodPath`，未声明时回退到 `/YDSZ-${name}/`。
 * 基座 bootstrap、nginx.conf 生成、Docker 部署均应消费此函数，确保三端一致。
 *
 * @param app 子应用注册信息
 * @since 1.0.0
 */
export function getProdEntry(app: MicroAppEntry): string {
  return app.prodPath ?? `/YDSZ-${app.name}/`;
}

/** 路由前缀 → 子应用名 映射（供 use-tabbar-micro-sync 等场景快速查找） */
export const PATH_TO_APP_MAP: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(MICRO_APPS.map((app) => [app.activeRule, app.name])),
);

/** 子应用名 → 注册信息 映射 */
export const APP_BY_NAME: Readonly<Record<string, MicroAppEntry>> = Object.freeze(
  Object.fromEntries(MICRO_APPS.map((app) => [app.name, app])),
);
