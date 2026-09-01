/**
 * nextwiki 路由模块
 *
 * @path apps\nextwiki-web\src\router\routes\modules\nextwiki.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: { icon: 'lucide:folder', order: 1, title: '文件管理' },
    name: 'FileMgmt',
    path: '/file',
    children: [
      {
        name: 'FileManagement',
        path: 'list',
        component: () => import('#/views/file/index.vue'),
        meta: { icon: 'lucide:hard-drive', title: '文件列表' },
      },
      {
        name: 'CommentManagement',
        path: 'comment',
        component: () => import('#/views/comment/index.vue'),
        meta: { icon: 'lucide:message-circle', title: '文件评论' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:search', order: 2, title: '全文搜索' },
    name: 'SearchMgmt',
    path: '/search',
    children: [
      {
        name: 'FullTextSearch',
        path: 'index',
        component: () => import('#/views/search/index.vue'),
        meta: { icon: 'lucide:search', title: '全文搜索' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:cloud', order: 3, title: '空间管理' },
    name: 'SpaceMgmt',
    path: '/space',
    children: [
      {
        name: 'SpaceManagement',
        path: 'list',
        component: () => import('#/views/space/index.vue'),
        meta: { icon: 'lucide:cloud', title: '空间列表' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:share-2', order: 4, title: '分享管理' },
    name: 'ShareMgmt',
    path: '/share',
    children: [
      {
        name: 'ShareManagement',
        path: 'list',
        component: () => import('#/views/share/index.vue'),
        meta: { icon: 'lucide:share-2', title: '分享列表' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:tag', order: 5, title: '标签管理' },
    name: 'TagMgmt',
    path: '/tag',
    children: [
      {
        name: 'TagManagement',
        path: 'list',
        component: () => import('#/views/tag/index.vue'),
        meta: { icon: 'lucide:tag', title: '标签列表' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:database', order: 6, title: '存储管理' },
    name: 'StorageMgmt',
    path: '/storage',
    children: [
      {
        name: 'QuotaManagement',
        path: 'quota',
        component: () => import('#/views/quota/index.vue'),
        meta: { icon: 'lucide:hard-drive', title: '存储配额' },
      },
    ],
  },
];

/** Nextwiki 知识库路由配置（子应用内部路由表） */
export default routes;
