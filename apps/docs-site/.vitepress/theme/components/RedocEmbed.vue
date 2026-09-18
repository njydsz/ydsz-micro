<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';

interface Props {
  specUrl: string;
  theme?: 'light' | 'dark';
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
});

const containerRef = ref<HTMLDivElement | null>(null);
let observer: MutationObserver | null = null;

function loadRedoc(): void {
  if (typeof window === 'undefined' || !containerRef.value) {
    return;
  }

  void import('redoc/bundles/redoc.standalone.js').then((Redoc) => {
    if (containerRef.value) {
      void Redoc.init(props.specUrl, {
        scrollYOffset: 60,
        theme: {
          colors: {
            primary: { main: '#1a6dff' },
          },
          typography: {
            fontFamily: '-apple-system, "Segoe UI", Roboto, sans-serif',
            fontSize: '14px',
          },
        },
      }, containerRef.value);
    }
  });
}

onMounted(() => {
  loadRedoc();
});

watch(() => props.specUrl, () => {
  if (containerRef.value) {
    containerRef.value.innerHTML = '';
    loadRedoc();
  }
});

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
});
</script>

<template>
  <div class="redoc-container">
    <div ref="containerRef" class="redoc-root" />
  </div>
</template>

<style scoped>
.redoc-container {
  width: 100%;
}

.redoc-root {
  min-height: 600px;
}
</style>
