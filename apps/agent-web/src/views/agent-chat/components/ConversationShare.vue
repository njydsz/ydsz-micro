<!--
 * 对话发布/分享组件
 *
 * <p>用于将当前对话发布为分享链接，支持有效期设置与访问权限控制。
 *
 * @path apps/agent-web/src/views/agentChat/components/ConversationShare.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { $t } from '@ydsz/locales';
/**
 * 对话发布/分享
 * <p>支持设置分享标题、有效期、访问权限（公开/仅团队），生成分享链接供复制。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import {
  YdDatePicker,
  YdForm,
  YdFormItem,
  YdInput,
  YdRadioGroupItem,
  YdRadioGroup,
  YdButton,
  YdDialog,
  YdDialogContent,
  YdDialogFooter,
  YdDialogHeader,
  YdDialogTitle,
} from '@ydsz-core/ydsz-ui';
import { reactive, ref } from 'vue';

import { showToast } from '@ydsz/notification';

defineOptions({ name: 'ConversationShare' });

/** 弹窗可见性 */
const visible = ref(false);

/** 发布状态 */
const publishing = ref(false);

/** 已生成的分享链接 */
const shareUrl = ref('');

/** 分享配置 */
const shareConfig = reactive({
  title: '',
  permission: 'TEAM',
  expireAt: null as string | Date | null,
});

/** 当前会话 ID */
const currentConversationId = ref('');

/** 打开弹窗 */
function open(conversationId: string): void {
  currentConversationId.value = conversationId;
  shareConfig.title = '';
  shareConfig.permission = 'TEAM';
  shareConfig.expireAt = null;
  shareUrl.value = '';
  visible.value = true;
}

/** 关闭弹窗 */
function close(): void {
  visible.value = false;
}

/** 权限文本 */
const permissionLabel: Record<string, string> = {
  PUBLIC: $t('page.conversationShare.publicAccess'),
  TEAM: $t('page.conversationShare.teamOnly'),
};

/** 执行发布 */
async function handlePublish(): Promise<void> {
  if (!currentConversationId.value) {
    showToast.warning('请先建立会话后再发布');
    return;
  }
  if (!shareConfig.title.trim()) {
    showToast.warning($t('validation.required.shareTitle'));
    return;
  }
  publishing.value = true;
  try {
    // TODO: 调用后端发布接口；当前按约定格式生成本地预览链接
    const token = `cs_${Date.now().toString(36)}`;
    shareUrl.value =
      `${window.location.origin}/agent/share/${token}` +
      `?cid=${encodeURIComponent(currentConversationId.value)}&perm=${shareConfig.permission}`;
    showToast.success($t('operation.publish.success'));
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    publishing.value = false;
  }
}

/** 复制分享链接 */
async function copyShareUrl(): Promise<void> {
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    showToast.success('链接已复制到剪贴板');
  } catch {
    showToast.error('复制失败，请手动复制');
  }
}

defineExpose({ open, close });
</script>

<template>
  <YdDialog v-model:open="visible">
    <YdDialogContent class="sm:max-w-[520px]">
      <YdDialogHeader>
        <YdDialogTitle>{{ $t('page.conversationShare.title') }}</YdDialogTitle>
      </YdDialogHeader>

      <div v-if="!shareUrl" class="space-y-4">
        <p class="text-muted-foreground text-sm">
          {{ $t('page.conversationShare.description', { conversationId: currentConversationId || $t('page.conversationShare.unnamedConversation') }) }}
        </p>
        <YdForm label-width="90px">
          <YdFormItem :label="$t('page.conversationShare.shareTitle')" required>
            <YdInput v-model="shareConfig.title" :placeholder="$t('validation.required.shareTitle')" />
          </YdFormItem>
          <YdFormItem :label="$t('page.conversationShare.accessPermission')">
            <YdRadioGroup v-model="shareConfig.permission">
              <YdRadioGroupItem value="PUBLIC">{{ permissionLabel.PUBLIC }}</YdRadioGroupItem>
              <YdRadioGroupItem value="TEAM">{{ permissionLabel.TEAM }}</YdRadioGroupItem>
            </YdRadioGroup>
          </YdFormItem>
          <YdFormItem :label="$t('page.conversationShare.validUntil')">
            <YdDatePicker
              v-model="shareConfig.expireAt"
              type="datetime"
              :placeholder="$t('page.conversationShare.expiryPlaceholder')"
              class="w-full"
            />
          </YdFormItem>
        </YdForm>
      </div>

      <!-- 发布成功 -->
      <div v-else class="space-y-3 text-center">
        <div
          class="rounded bg-green-50 p-5 text-sm text-green-600 dark:bg-green-950 dark:text-green-400"
        >
          {{
            $t('page.conversationShare.publishSuccess', {
              permission: permissionLabel[shareConfig.permission] ?? shareConfig.permission,
            })
          }}
        </div>
        <YdInput v-model="shareUrl" readonly />
        <p class="text-muted-foreground text-xs">
          {{ $t('page.conversationShare.titleLabel') }}: {{ shareConfig.title }}
        </p>
      </div>

      <YdDialogFooter>
        <template v-if="!shareUrl">
          <YdButton variant="outline" @click="close">
            {{ $t('page.conversationShare.cancel') }}
          </YdButton>
          <YdButton :disabled="publishing" @click="handlePublish">
            {{ $t('page.conversationShare.publish') }}
          </YdButton>
        </template>
        <template v-else>
          <YdButton @click="copyShareUrl">{{ $t('page.conversationShare.copyLink') }}</YdButton>
          <YdButton variant="outline" @click="close">
            {{ $t('page.conversationShare.done') }}
          </YdButton>
        </template>
      </YdDialogFooter>
    </YdDialogContent>
  </YdDialog>
</template>
