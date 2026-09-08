/**
 * 系统管理路由模块 — 定义组织架构相关路由（部门、岗位、公司、菜单、角色、用户、国际化、安全集成、会话、审计）
 *
 * @path apps\userinfo-web\src\router\routes\modules\system.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:users',
      order: 1,
      title: '组织管理',
    },
    name: 'Organization',
    path: '/organization',
    children: [
      {
        name: 'UserManagement',
        path: 'user',
        component: () => import('#/views/system/user/index.vue'),
        meta: {
          icon: 'lucide:user',
          title: '用户管理',
        },
      },
      {
        name: 'DeptManagement',
        path: 'dept',
        component: () => import('#/views/system/dept/index.vue'),
        meta: {
          icon: 'lucide:building-2',
          title: '部门管理',
        },
      },
      {
        name: 'RoleManagement',
        path: 'role',
        component: () => import('#/views/system/role/index.vue'),
        meta: {
          icon: 'lucide:shield-check',
          title: '角色管理',
        },
      },
      {
        name: 'PostManagement',
        path: 'post',
        component: () => import('#/views/system/post/index.vue'),
        meta: {
          icon: 'lucide:briefcase',
          title: '岗位管理',
        },
      },
      {
        name: 'CompanyManagement',
        path: 'company',
        component: () => import('#/views/system/company/index.vue'),
        meta: {
          icon: 'lucide:factory',
          title: '公司管理',
        },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:settings-2',
      order: 2,
      title: '系统配置',
    },
    name: 'SystemConfig',
    path: '/system-config',
    children: [
      {
        name: 'MenuManagement',
        path: 'menu',
        component: () => import('#/views/system/menu/index.vue'),
        meta: {
          icon: 'lucide:menu',
          title: '菜单管理',
        },
      },
      {
        name: 'LanguageManagement',
        path: 'language',
        component: () => import('#/views/system/language/index.vue'),
        meta: {
          icon: 'lucide:languages',
          title: '语言管理',
        },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:shield',
      order: 3,
      title: '安全集成',
    },
    name: 'SecurityIntegration',
    path: '/security',
    children: [
      {
        name: 'OAuth2Management',
        path: 'oauth2',
        component: () => import('#/views/oauth2/index.vue'),
        meta: {
          icon: 'lucide:key',
          title: 'OAuth2应用',
        },
      },
      {
        name: 'SamlIdpManagement',
        path: 'saml-idp',
        component: () => import('#/views/saml-idp/index.vue'),
        meta: {
          icon: 'lucide:building-2',
          title: 'SAML配置',
        },
      },
      {
        name: 'WebAuthnManagement',
        path: 'webauthn',
        component: () => import('#/views/webauthn/index.vue'),
        meta: {
          icon: 'lucide:fingerprint',
          title: 'Passkey',
        },
      },
      {
        name: 'SocialClientManagement',
        path: 'social-client',
        component: () => import('#/views/social-client/index.vue'),
        meta: {
          icon: 'lucide:message-circle',
          title: '社交登录',
        },
      },
      {
        name: 'ApiKeyManagement',
        path: 'apikey',
        component: () => import('#/views/system/api-key/index.vue'),
        meta: {
          icon: 'lucide:key-round',
          title: 'API Key',
        },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:monitor',
      order: 4,
      title: '安全审计',
    },
    name: 'SecurityAudit',
    path: '/security-audit',
    children: [
      {
        name: 'SessionManagement',
        path: 'session',
        component: () => import('#/views/system/session/index.vue'),
        meta: {
          icon: 'lucide:monitor',
          title: '在线用户',
        },
      },
      {
        name: 'LoginLogManagement',
        path: 'login-log',
        component: () => import('#/views/system/login-log/index.vue'),
        meta: {
          icon: 'lucide:log-in',
          title: '登录日志',
        },
      },
      {
        name: 'AuditLogManagement',
        path: 'audit',
        component: () => import('#/views/system/audit/index.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: '审计日志',
        },
      },
      {
        name: 'SecurityDashboard',
        path: 'security-dashboard',
        component: () => import('#/views/system/security-dashboard/index.vue'),
        meta: {
          icon: 'lucide:shield-alert',
          title: '安全仪表盘',
        },
      },
    ],
  },
];

/** Userinfo 用户管理路由配置（子应用内部路由表） */
export default routes;
