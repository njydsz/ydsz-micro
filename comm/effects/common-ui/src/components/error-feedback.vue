<!--
 * 错误反馈组件 — 集成 Sentry 用户反馈弹窗
 *
 * 在错误页面（500/未捕获异常）中展示，允许用户附加描述后提交反馈到 Sentry。
 * 配合 Sentry 的 `beforeSend` 钩子，用户反馈会与错误事件关联便于问题追踪。
 *
 * @path comm/effects/common-ui/src/components/error-feedback.vue
 * @author remi-team
 * @since 4.0.0
-->
<script lang="ts" setup>
import { computed, ref } from "vue";

import {
  AlertTriangle,
  CheckCircle2,
  MessageCircle,
  Send,
  X,
} from "@remi/icons";
import { isSentryInitialized } from "@remi/monitor/sentry";

import { REMIButton } from "@remi-core/shadcn-ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@remi-core/shadcn-ui/ui/dialog";
import { Textarea } from "@remi-core/shadcn-ui/ui/textarea";

/**
 * 组件属性
 */
const props = withDefaults(
  defineProps<{
    /** 错误 ID（Sentry 生成的 traceId），用于关联反馈与错误事件 */
    errorId?: string;
    /** 错误消息摘要，帮助用户在反馈时确认是哪类错误 */
    errorMessage?: string;
    /** 反馈提交成功后的回调 */
    onSubmitSuccess?: () => void;
  }>(),
  {
    errorId: "",
    errorMessage: "",
    onSubmitSuccess: () => {},
  },
);

const isOpen = ref(false);
const feedback = ref("");
const email = ref("");
const submitStatus = ref<"error" | "idle" | "submitting" | "success">("idle");
const submitError = ref("");

/** 是否已启用 Sentry 集成 */
const sentryEnabled = computed(() => isSentryInitialized());

/** 文案辅助函数 - 避免在模板中硬编码 i18n keys（实际项目中应由 i18n 提供） */
const t = (key: string): string => {
  const messages: Record<string, string> = {
    "feedback.title": "报告问题",
    "feedback.description":
      "您遇到了一个问题，是否愿意帮助我们改进？您的反馈将发送给开发团队。",
    "feedback.emailPlaceholder": "您的邮箱（可选，方便我们联系您）",
    "feedback.placeholder": "请描述您遇到的问题或操作步骤...",
    "feedback.submit": "提交反馈",
    "feedback.cancel": "取消",
    "feedback.success": "反馈已提交，感谢您的帮助！",
    "feedback.error": "提交失败，请稍后重试",
    "feedback.unknownError": "发生未知错误",
    "feedback.includeErrorInfo": "附带错误信息",
    "feedback.charLimit": "字数限制",
  };
  return messages[key] || key;
};

/**
 * 打开反馈弹窗
 */
function open(): void {
  isOpen.value = true;
  submitStatus.value = "idle";
  submitError.value = "";
}

/**
 * 关闭反馈弹窗
 */
function close(): void {
  isOpen.value = false;
}

/**
 * 提交反馈到 Sentry
 *
 * 使用 Sentry 的 captureUserFeedback API 将用户反馈与错误事件关联。
 * 如果 Sentry 未初始化，则仅记录到控制台（fallback）。
 */
async function submitFeedback(): Promise<void> {
  if (!feedback.value.trim()) {
    submitError.value = "请填写反馈内容";
    return;
  }

  submitStatus.value = "submitting";

  try {
    const sentrySpecifier = "@sentry/vue";
    const sentry = await import(/* @vite-ignore */ sentrySpecifier);

    // 构造 Sentry 用户反馈
    const userFeedback = {
      event_id: props.errorId || sentry.lastEventId() || undefined,
      email: email.value.trim() || "anonymous",
      name: email.value.trim() || "Anonymous User",
      comments: feedback.value.trim(),
    };

    // 发送到 Sentry
    sentry.captureUserFeedback(userFeedback);

    submitStatus.value = "success";
    props.onSubmitSuccess?.();

    // 成功提交后短暂延迟自动关闭
    setTimeout(() => {
      close();
      feedback.value = "";
      email.value = "";
      submitStatus.value = "idle";
    }, 2000);
  } catch (error) {
    submitStatus.value = "error";
    submitError.value = error instanceof Error ? error.message : String(error);
    console.error("[ErrorFeedback] Failed to submit:", error);

    // 降级：即使 Sentry 发送失败，也记录用户反馈到本地
    try {
      const feedbackLog = {
        timestamp: new Date().toISOString(),
        errorId: props.errorId,
        errorMessage: props.errorMessage,
        userFeedback: feedback.value.trim(),
        email: email.value.trim(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };
      console.warn("[ErrorFeedback] Fallback log:", feedbackLog);
    } catch {
      // 静默
    }
  }
}

defineExpose({ open, close });
</script>

<template>
  <div class="error-feedback">
    <!-- 触发按钮 -->
    <REMIButton
      v-if="sentryEnabled"
      size="lg"
      variant="outline"
      class="gap-2"
      :aria-label="t('feedback.title')"
      @click="open"
    >
      <MessageCircle class="size-4" aria-hidden="true" />
      {{ t("feedback.title") }}
    </REMIButton>

    <!-- 反馈弹窗 -->
    <Dialog :open="isOpen" @update:open="(val: boolean) => (isOpen = val)">
      <DialogTrigger as-child>
        <!-- 占位，由外部通过 ref 调用 open() -->
      </DialogTrigger>
      <DialogContent
        class="sm:max-w-[500px]"
        role="dialog"
        aria-modal="true"
        :aria-label="t('feedback.title')"
      >
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <AlertTriangle class="size-5 text-amber-500" aria-hidden="true" />
            {{ t("feedback.title") }}
          </DialogTitle>
          <DialogDescription>
            {{ t("feedback.description") }}
          </DialogDescription>
        </DialogHeader>

        <!-- 错误信息摘要 -->
        <div
          v-if="submitError || props.errorMessage"
          class="rounded-md bg-destructive/10 p-3 text-sm"
          role="alert"
          aria-live="polite"
        >
          <p class="font-medium text-destructive">
            {{ t("feedback.includeErrorInfo") }}：
          </p>
          <p class="mt-1 break-all text-xs text-muted-foreground">
            {{ props.errorMessage || submitError }}
          </p>
        </div>

        <!-- 表单区域 -->
        <div v-if="submitStatus !== 'success'" class="grid gap-4 py-4">
          <!-- 邮箱输入 -->
          <div class="grid gap-2">
            <label for="feedback-email" class="text-sm font-medium">
              {{ t("feedback.emailPlaceholder") }}
            </label>
            <input
              id="feedback-email"
              v-model="email"
              type="email"
              placeholder="your@email.com"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :disabled="submitStatus === 'submitting'"
              autocomplete="email"
            />
          </div>

          <!-- 反馈内容 -->
          <div class="grid gap-2">
            <div class="flex items-center justify-between">
              <label for="feedback-content" class="text-sm font-medium">
                {{ t("feedback.placeholder") }}
              </label>
              <span class="text-xs text-muted-foreground">
                {{ feedback.length }}/500
              </span>
            </div>
            <Textarea
              id="feedback-content"
              v-model="feedback"
              :placeholder="t('feedback.placeholder')"
              class="min-h-[120px] resize-none"
              maxlength="500"
              :disabled="submitStatus === 'submitting'"
            />
            <p
              v-if="submitError && submitStatus === 'error'"
              class="text-xs text-destructive"
            >
              {{ submitError }}
            </p>
          </div>
        </div>

        <!-- 成功状态 -->
        <div
          v-else
          class="flex flex-col items-center gap-3 py-8"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 class="size-12 text-green-500" aria-hidden="true" />
          <p class="text-lg font-medium text-green-600">
            {{ t("feedback.success") }}
          </p>
        </div>

        <DialogFooter v-if="submitStatus !== 'success'">
          <REMIButton
            variant="outline"
            @click="close"
            :disabled="submitStatus === 'submitting'"
          >
            {{ t("feedback.cancel") }}
          </REMIButton>
          <REMIButton
            @click="submitFeedback"
            :disabled="submitStatus === 'submitting' || !feedback.trim()"
            class="gap-2"
          >
            <Send
              v-if="submitStatus !== 'submitting'"
              class="size-4"
              aria-hidden="true"
            />
            <span
              v-else
              class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            ></span>
            {{ t("feedback.submit") }}
          </REMIButton>
        </DialogFooter>

        <!-- 关闭按钮 -->
        <button
          class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Close"
          @click="close"
        >
          <X class="size-4" />
        </button>
      </DialogContent>
    </Dialog>
  </div>
</template>
