import type { Router } from 'vue-router';

import { createSubAppRouterGuard, initRoutes as sharedInitRoutes } from '@ydsz/shared-auth/guards';

import { accessRoutes } from '#/router/routes';

function createRouterGuard(router: Router) {
  createSubAppRouterGuard(router, accessRoutes);
}

function initRoutes(router: Router) {
  sharedInitRoutes(router, accessRoutes);
}

export { createRouterGuard, initRoutes };
