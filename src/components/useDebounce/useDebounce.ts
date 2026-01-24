export default function useDebounce<T extends (...args: any[]) => any>(fn: T, delay = 500) {
  let timer: number | undefined
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = window.setTimeout(() => fn(...args), delay)
  }
}