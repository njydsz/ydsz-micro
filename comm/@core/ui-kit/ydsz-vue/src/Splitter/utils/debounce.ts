// `Function` 会丢失入参/返回类型（no-unsafe-function-type），改为显式可调用签名
export default function debounce<T extends (...args: any[]) => any>(
  callback: T,
  durationMs = 10,
) {
  let timeoutId: NodeJS.Timeout | null = null

  const callable = (...args: any) => {
    if (timeoutId !== null)
      clearTimeout(timeoutId)

    timeoutId = setTimeout(() => {
      callback(...args)
    }, durationMs)
  }

  return callable as unknown as T
}
