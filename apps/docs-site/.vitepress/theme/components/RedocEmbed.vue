<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

interface Props {
  specUrl: string;
}

const props = defineProps<Props>();

const containerRef = ref<HTMLDivElement | null>(null);
const isLoading = ref(true);
const loadError = ref(false);

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(script);
  });
}

async function initRedoc(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    isLoading.value = true;

    if (!(window as unknown as Record<string, unknown>).Redoc) {
      await loadScript('https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js');
    }

    const Redoc = (window as unknown as Record<string, { init: unknown }>).Redoc;
    if (Redoc && typeof Redoc.init === 'function' && containerRef.value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Redoc as any).init(props.specUrl, {
        scrollYOffset: 60,
      }, containerRef.value);
      isLoading.value = false;
    }
  } catch {
    loadError.value = true;
    isLoading.value = false;
  }
}

onMounted(() => {
  void initRedoc();
});

onBeforeUnmount(() => {
  if (containerRef.value) {
    containerRef.value.innerHTML = '';
  }
});
</script>

<template>
  <div class="redoc-wrapper">
    <div v-if="isLoading" class="redoc-loading">加载 API 文档中…</div>
    <div v-if="loadError" class="redoc-error">API 文档加载失败，请检查网络连接</div>
    <div ref="containerRef" class="redoc-container" />
  </div>
</template>

<style scoped>
.redoc-wrapper {
  margin: 16px 0;
}

.redoc-loading,
.redoc-error {
  padding: 24px;
  text-align: center;
  font-size: 14px;
  color: var(--ydsz-text-secondary);
  border: 1px dashed var(--ydsz-border);
  border-radius: 8px;
}

.redoc-error {
  color: var(--ydsz-danger);
  border-color: #fcc;
  background: #fef5f5;
}

.redoc-container {
  min-height: 400px;
  border: 1px solid var(--ydsz-border);
  border-radius: 8px;
  overflow: hidden;
}
</style>
