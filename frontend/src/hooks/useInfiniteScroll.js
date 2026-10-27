import { useEffect, useRef } from 'react'

// Trả về ref gắn vào một phần tử "mốc" đặt ở cuối danh sách.
// Khi mốc sắp lọt vào màn hình (còn cách ~500px) thì gọi onReach để tải thêm.
export function useInfiniteScroll(onReach, { enabled = true, rootMargin = '500px' } = {}) {
  const sentinelRef = useRef(null)
  const callbackRef = useRef(onReach)

  useEffect(() => {
    callbackRef.current = onReach
  }, [onReach])

  useEffect(() => {
    const el = sentinelRef.current
    if (!enabled || !el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) callbackRef.current()
      },
      { rootMargin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [enabled, rootMargin])

  return sentinelRef
}