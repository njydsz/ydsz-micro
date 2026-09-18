interface NavItem {
  text: string;
  link?: string;
  activeMatch?: string;
  items?: NavItem[];
}

function generateNav(): NavItem[] {
  return [
    {
      text: '快速开始',
      link: '/guide/',
      activeMatch: '/guide/',
    },
    {
      text: '架构文档',
      link: '/architecture/',
      activeMatch: '/architecture/',
    },
    {
      text: '引擎专页',
      items: [
        { text: '系统引擎', link: '/engines/system' },
        { text: '身份引擎', link: '/engines/userinfo' },
        { text: '消息引擎', link: '/engines/message' },
        { text: '文件引擎', link: '/engines/nextwiki' },
        { text: '流程引擎', link: '/engines/workflow' },
        { text: '任务引擎', link: '/engines/cronjob' },
        { text: '规则引擎', link: '/engines/literule' },
        { text: '智能引擎', link: '/engines/agent' },
      ],
    },
    {
      text: 'API 参考',
      link: '/api/',
      activeMatch: '/api/',
    },
    {
      text: '编码规范',
      link: '/standards/',
      activeMatch: '/standards/',
    },
    {
      text: '关于',
      items: [
        { text: '架构设计', link: '/architecture/overview' },
        { text: '贡献指南', link: '/guide/contributing' },
      ],
    },
  ];
}

export { generateNav };
export type { NavItem };
