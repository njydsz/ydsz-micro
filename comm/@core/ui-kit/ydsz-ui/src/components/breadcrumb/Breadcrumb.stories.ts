/**
 * YdBreadcrumb 组件 Storybook Stories。
 *
 * P0-3: 补齐 stories —— Breadcrumb（8 文件，此前零覆盖）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\breadcrumb\Breadcrumb.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import YdBreadcrumb from './YdBreadcrumb.vue';
import YdBreadcrumbEllipsis from './YdBreadcrumbEllipsis.vue';
import YdBreadcrumbItem from './YdBreadcrumbItem.vue';
import YdBreadcrumbLink from './YdBreadcrumbLink.vue';
import YdBreadcrumbList from './YdBreadcrumbList.vue';
import YdBreadcrumbPage from './YdBreadcrumbPage.vue';
import YdBreadcrumbSeparator from './YdBreadcrumbSeparator.vue';

const meta: Meta<typeof YdBreadcrumb> = {
  title: 'Primitives/YdBreadcrumb',
  component: YdBreadcrumb,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '面包屑导航，体现当前页面在站点结构中的位置，并提供向上返回的快捷入口。',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** 基础面包屑 */
export const Default: Story = {
  render: () => ({
    components: {
      YdBreadcrumb,
      YdBreadcrumbList,
      YdBreadcrumbItem,
      YdBreadcrumbLink,
      YdBreadcrumbPage,
      YdBreadcrumbSeparator,
    },
    template: `
      <YdBreadcrumb>
        <YdBreadcrumbList>
          <YdBreadcrumbItem>
            <YdBreadcrumbLink href="/">首页</YdBreadcrumbLink>
          </YdBreadcrumbItem>
          <YdBreadcrumbSeparator />
          <YdBreadcrumbItem>
            <YdBreadcrumbLink href="/system">系统管理</YdBreadcrumbLink>
          </YdBreadcrumbItem>
          <YdBreadcrumbSeparator />
          <YdBreadcrumbItem>
            <YdBreadcrumbPage>用户列表</YdBreadcrumbPage>
          </YdBreadcrumbItem>
        </YdBreadcrumbList>
      </YdBreadcrumb>
    `,
  }),
};

/** 带省略号（路径过长时折叠） */
export const WithEllipsis: Story = {
  render: () => ({
    components: {
      YdBreadcrumb,
      YdBreadcrumbList,
      YdBreadcrumbItem,
      YdBreadcrumbLink,
      YdBreadcrumbPage,
      YdBreadcrumbSeparator,
      YdBreadcrumbEllipsis,
    },
    template: `
      <YdBreadcrumb>
        <YdBreadcrumbList>
          <YdBreadcrumbItem>
            <YdBreadcrumbLink href="/">首页</YdBreadcrumbLink>
          </YdBreadcrumbItem>
          <YdBreadcrumbSeparator />
          <YdBreadcrumbItem>
            <YdBreadcrumbEllipsis />
          </YdBreadcrumbItem>
          <YdBreadcrumbSeparator />
          <YdBreadcrumbItem>
            <YdBreadcrumbLink href="/system/user">用户管理</YdBreadcrumbLink>
          </YdBreadcrumbItem>
          <YdBreadcrumbSeparator />
          <YdBreadcrumbItem>
            <YdBreadcrumbPage>张三</YdBreadcrumbPage>
          </YdBreadcrumbItem>
        </YdBreadcrumbList>
      </YdBreadcrumb>
    `,
  }),
};

/** 深层路径 */
export const DeepPath: Story = {
  render: () => ({
    components: {
      YdBreadcrumb,
      YdBreadcrumbList,
      YdBreadcrumbItem,
      YdBreadcrumbLink,
      YdBreadcrumbPage,
      YdBreadcrumbSeparator,
    },
    template: `
      <nav>
        <YdBreadcrumb>
          <YdBreadcrumbList>
            <YdBreadcrumbItem>
              <YdBreadcrumbLink href="/">首页</YdBreadcrumbLink>
            </YdBreadcrumbItem>
            <YdBreadcrumbSeparator />
            <YdBreadcrumbItem>
              <YdBreadcrumbLink href="/agent">智能引擎</YdBreadcrumbLink>
            </YdBreadcrumbItem>
            <YdBreadcrumbSeparator />
            <YdBreadcrumbItem>
              <YdBreadcrumbLink href="/agent/rag">RAG 知识库</YdBreadcrumbLink>
            </YdBreadcrumbItem>
            <YdBreadcrumbSeparator />
            <YdBreadcrumbItem>
              <YdBreadcrumbLink href="/agent/rag/docs">文档列表</YdBreadcrumbLink>
            </YdBreadcrumbItem>
            <YdBreadcrumbSeparator />
            <YdBreadcrumbItem>
              <YdBreadcrumbPage>文档详情</YdBreadcrumbPage>
            </YdBreadcrumbItem>
          </YdBreadcrumbList>
        </YdBreadcrumb>
      </nav>
    `,
  }),
};

/** YdBreadcrumbLink 渲染为 button */
export const LinkAsButton: Story = {
  render: () => ({
    components: {
      YdBreadcrumb,
      YdBreadcrumbList,
      YdBreadcrumbItem,
      YdBreadcrumbLink,
      YdBreadcrumbPage,
      YdBreadcrumbSeparator,
    },
    template: `
      <YdBreadcrumb>
        <YdBreadcrumbList>
          <YdBreadcrumbItem>
            <YdBreadcrumbLink as="button" @click="() => {}">操作</YdBreadcrumbLink>
          </YdBreadcrumbItem>
          <YdBreadcrumbSeparator />
          <YdBreadcrumbItem>
            <YdBreadcrumbPage>当前页</YdBreadcrumbPage>
          </YdBreadcrumbItem>
        </YdBreadcrumbList>
      </YdBreadcrumb>
    `,
  }),
};
