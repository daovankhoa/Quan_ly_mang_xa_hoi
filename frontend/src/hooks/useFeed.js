import { useCallback, useEffect, useRef, useState } from 'react'
import { getFeed } from '../services/postApi'
import { getErrorMessage } from '../services/api'

const PAGE_SIZE = 10

export function useFeed() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState('')

  const cursorRef = useRef(null)
  const loadingRef = useRef(false) // chặn gọi trùng (kể cả khi StrictMode chạy effect 2 lần)

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setError('')
    try {
      const data = await getFeed({ cursor: cursorRef.current, limit: PAGE_SIZE })
      cursorRef.current = data.nextCursor
      setHasMore(data.hasMore)
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p._id))
        return [...prev, ...data.posts.filter((p) => !seen.has(p._id))]
      })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [])

  // Tải trang đầu khi vào trang
  useEffect(() => {
    loadMore()
  }, [loadMore])

  const prependPost = useCallback((post) => setPosts((prev) => [post, ...prev]), [])
  const updatePost = useCallback(
    (id, patch) => setPosts((prev) => prev.map((p) => (p._id === id ? { ...p, ...patch } : p))),
    []
  )
  const removePost = useCallback((id) => setPosts((prev) => prev.filter((p) => p._id !== id)), [])

  return { posts, loading, hasMore, error, loadMore, prependPost, updatePost, removePost }
}