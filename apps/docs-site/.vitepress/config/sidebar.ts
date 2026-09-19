interface SidebarItem {
  text: string;
  collapsed?: boolean;
  items: SidebarSubItem[];
}

interface SidebarSubItem {
  text: string;
  link: string;
}

interface SidebarMulti {
  [path: string]: SidebarItem[];
}

function generateSidebar(): SidebarMulti {
  return {
    '/guide': [
      {
        text: '快速开始',
        collapsed: false,
        items: [
          { text: '平台介绍', link: '/guide/' },
          { text: '环境准备', link: '/guide/prerequisites' },
          { text: '快速启动', link: '/guide/quick-start' },
          { text: '部署指南', link: '/guide/deployment' },
          { text: '贡献指南', link: '/guide/contributing' },
        ],
      },
    ],
    '/architecture': [
      {
        text: '架构文档',
        collapsed: false,
        items: [
          { text: '架构总览', link: '/architecture/' },
          { text: '八大引擎拓扑', link: '/architecture/overview' },
          { text: 'DDD 分层设计', link: '/architecture/ddd' },
          { text: '公共模块分级', link: '/architecture/common-layers' },
          { text: '多租户与字典', link: '/architecture/multi-tenant' },
        ],
      },
    ],
    '/engines': [
      {
        text: '八大引擎',
        collapsed: false,
        items: [
          { text: '系统引擎 (System)', link: '/engines/system' },
          { text: '身份引擎 (Userinfo)', link: '/engines/userinfo' },
          { text: '消息引擎 (Message)', link: '/engines/message' },
          { text: '文件引擎 (NextWiki)', link: '/engines/nextwiki' },
          { text: '流程引擎 (Workflow)', link: '/engines/workflow' },
          { text: '任务引擎 (Cronjob)', link: '/engines/cronjob' },
          { text: '规则引擎 (LiteRule)', link: '/engines/literule' },
          { text: '智能引擎 (Agent)', link: '/engines/agent' },
        ],
      },
      {
        text: '跨引擎规范',
        collapsed: true,
        items: [
          { text: 'API 版本控制', link: '/engines/api-versioning' },
          { text: '统一响应格式', link: '/engines/response-format' },
          { text: '错误码规范', link: '/engines/error-codes' },
        ],
      },
    ],
    '/api': [
      {
        text: 'API 参考',
        collapsed: false,
        items: [
          { text: 'API 总览', link: '/api/' },
          { text: '认证与安全', link: '/api/auth' },
        ],
      },
      {
        text: '引擎 API',
        collapsed: false,
        items: [
          { text: '系统引擎 API', link: '/api/system' },
          { text: '身份引擎 API', link: '/api/userinfo' },
          { text: '消息引擎 API', link: '/api/message' },
          { text: '文件引擎 API', link: '/api/nextwiki' },
          { text: '流程引擎 API', link: '/api/workflow' },
          { text: '任务引擎 API', link: '/api/cronjob' },
          { text: '规则引擎 API', link: '/api/literule' },
          { text: '智能引擎 API', link: '/api/agent' },
        ],
      },
    ],
    '/ui-kit': [
      {
        text: 'UI Kit',
        collapsed: false,
        items: [
          { text: '总览', link: '/ui-kit/' },
        ],
      },
      {
        text: 'YDSZ Vue（无头层）',
        collapsed: false,
        items: [
          { text: '概述', link: '/ui-kit/ydsz-vue/' },
          { text: '组件 API 参考', link: '/ui-kit/ydsz-vue/components' },
          { text: 'Composables / 工具函数', link: '/ui-kit/ydsz-vue/utilities' },
        ],
      },
      {
        text: 'YDSZ UI（业务层）',
        collapsed: false,
        items: [
          { text: '概述', link: '/ui-kit/ydsz-ui/' },
          { text: 'Primitives 原子组件 API', link: '/ui-kit/ydsz-ui/primitives' },
          { text: 'Composables 组合式函数', link: '/ui-kit/ydsz-ui/composables' },
          { text: '业务组件 + Headless', link: '/ui-kit/ydsz-ui/components' },
        ],
      },
    ],
    '/standards': [
      {
        text: '编码规范',
        collapsed: false,
        items: [
          { text: '规范总览', link: '/standards/' },
          { text: 'P0 阻断级规则', link: '/standards/p0-critical' },
          { text: 'P1 严格级规则', link: '/standards/p1-strict' },
          { text: 'P2 建议级规则', link: '/standards/p2-guideline' },
        ],
      },
    ],
  };
}

export { generateSidebar };
export type { SidebarItem, SidebarSubItem, SidebarMulti };
