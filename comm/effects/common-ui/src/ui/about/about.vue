<!--
 * about Vue 组件
 *
 * @path comm\effects\common-ui\src\ui\about\about.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { AboutProps, DescriptionItem } from './about';

import { computed, h } from 'vue';

import {
  YDSZ_DOC_URL,
  YDSZ_GITHUB_URL,
  YDSZ_PREVIEW_URL,
} from '@ydsz/constants';
import { $t } from '@ydsz/locales';

import { YdRenderContent } from '@ydsz-core/ydsz-ui';

import { Page } from '../../components';

type Props = AboutProps;

defineOptions({
  name: 'AboutUI',
});

withDefaults(defineProps<Props>(), {
  description: undefined,
  name: 'YDSZ Admin',
  title: undefined,
});

declare global {
  const __YDSZ_ADMIN_METADATA__: {
    authorEmail: string;
    authorName: string;
    authorUrl: string;
    buildTime: string;
    dependencies: Record<string, string>;
    description: string;
    devDependencies: Record<string, string>;
    homepage: string;
    license: string;
    repositoryUrl: string;
    version: string;
  };
}

const renderLink = (href: string, text: string) =>
  h(
    'a',
    { href, target: '_blank', class: 'yd-link' },
    { default: () => text },
  );

const {
  authorEmail,
  authorName,
  authorUrl,
  buildTime,
  dependencies = {},
  devDependencies = {},
  homepage,
  license,
  version,
  // vite inject-metadata 插件注入的全局变量
} = __YDSZ_ADMIN_METADATA__ || {};

// computed 而非一次性数组：文案随语种切换要重算，直接建数组会把首次渲染的语种焊死
const ydszDescriptionItems = computed<DescriptionItem[]>(() => [
  {
    content: version,
    title: $t('ui.about.version'),
  },
  {
    content: license,
    title: $t('ui.about.license'),
  },
  {
    content: buildTime,
    title: $t('ui.about.buildTime'),
  },
  {
    content: renderLink(homepage, $t('ui.commonAction.view')),
    title: $t('ui.about.homepage'),
  },
  {
    content: renderLink(YDSZ_DOC_URL, $t('ui.commonAction.view')),
    title: $t('ui.about.docs'),
  },
  {
    content: renderLink(YDSZ_PREVIEW_URL, $t('ui.commonAction.view')),
    title: $t('ui.about.preview'),
  },
  {
    content: renderLink(YDSZ_GITHUB_URL, $t('ui.commonAction.view')),
    title: 'Github',
  },
  {
    content: h('div', [
      renderLink(authorUrl, `${authorName}  `),
      renderLink(`mailto:${authorEmail}`, authorEmail),
    ]),
    title: $t('ui.about.author'),
  },
]);

const dependenciesItems = Object.keys(dependencies).map((key) => ({
  content: dependencies[key],
  title: key,
}));

const devDependenciesItems = Object.keys(devDependencies).map((key) => ({
  content: devDependencies[key],
  title: key,
}));
</script>

<template>
  <Page :title="title ?? $t('ui.about.title')">
    <template #description>
      <p class="text-foreground mt-3 text-sm leading-6">
        <a :href="YDSZ_GITHUB_URL" class="yd-link" target="_blank">
          {{ name }}
        </a>
        {{ description ?? $t('ui.about.description') }}
      </p>
    </template>
    <div class="card-box p-5">
      <div>
        <h5 class="text-foreground text-lg">{{ $t('ui.about.basicInfo') }}</h5>
      </div>
      <div class="mt-4">
        <dl class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <template v-for="item in ydszDescriptionItems" :key="item.title">
            <div class="border-border border-t px-4 py-6 sm:col-span-1 sm:px-0">
              <dt class="text-foreground text-sm font-medium leading-6">
                {{ item.title }}
              </dt>
              <dd class="text-foreground mt-1 text-sm leading-6 sm:mt-2">
                <YdRenderContent :content="item.content" />
              </dd>
            </div>
          </template>
        </dl>
      </div>
    </div>

    <div class="card-box mt-6 p-5">
      <div>
        <h5 class="text-foreground text-lg">{{ $t('ui.about.prodDeps') }}</h5>
      </div>
      <div class="mt-4">
        <dl class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <template v-for="item in dependenciesItems" :key="item.title">
            <div class="border-border border-t px-4 py-3 sm:col-span-1 sm:px-0">
              <dt class="text-foreground text-sm">
                {{ item.title }}
              </dt>
              <dd class="text-foreground/80 mt-1 text-sm sm:mt-2">
                <YdRenderContent :content="item.content" />
              </dd>
            </div>
          </template>
        </dl>
      </div>
    </div>
    <div class="card-box mt-6 p-5">
      <div>
        <h5 class="text-foreground text-lg">{{ $t('ui.about.devDeps') }}</h5>
      </div>
      <div class="mt-4">
        <dl class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <template v-for="item in devDependenciesItems" :key="item.title">
            <div class="border-border border-t px-4 py-3 sm:col-span-1 sm:px-0">
              <dt class="text-foreground text-sm">
                {{ item.title }}
              </dt>
              <dd class="text-foreground/80 mt-1 text-sm sm:mt-2">
                <YdRenderContent :content="item.content" />
              </dd>
            </div>
          </template>
        </dl>
      </div>
    </div>
  </Page>
</template>
