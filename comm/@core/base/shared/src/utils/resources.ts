/**
 * 动态外部资源加载器，支持按需注入脚本到文档头部。
 *
 * @path comm\@core\base\shared\src\utils\resources.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/**
 * 将指定 URL 的外部脚本以 `<script>` 标签注入到 `<head>`，同一 URL 仅加载一次。
 *
 * @param src - 脚本文件 URL
 * @returns 加载完成的 Promise，失败时 reject
 */
function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      // 如果已经加载过，直接 resolve
      return resolve();
    }
    const script = document.createElement('script');
    script.src = src;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () =>
      reject(new Error(`Failed to load script: ${src}`)),
    );
    document.head.append(script);
  });
}

export { loadScript };
