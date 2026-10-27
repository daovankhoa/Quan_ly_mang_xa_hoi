import { useCallback, useEffect, useRef, useState } from 'react'
import { getComments } from '../services/commentApi'
import { getErrorMessage } from '../services/api'

const PAGE_SIZE = 10


const merge = (a, b) => {
  const map = new Map()
  for (const c of [...a, ...b]) map.set(c._id, c)
  return [...map.values()].sort((x, y) => (x._id < y._id ? 1 : -1))
}

export function useComments(postId) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState('')

  const cursorRef = useRef(null)
  const loadingRef = useRef(false)

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setError('')
    try {
      const data = await getComments(postId, { cursor: cursorRef.current, limit: PAGE_SIZE })
      cursorRef.current = data.nextCursor
      setHasMore(data.hasMore)
      setComments((prev) => merge(prev, data.comments))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    loadMore()
  }, [loadMore])

  const addComment = useCallback((comment) => setComments((prev) => merge(prev, [comment])), [])
  const removeComment = useCallback((id) => setComments((prev) => prev.filter((c) => c._id !== id)), [])
  const patchComment = useCallback(
    (id, patch) =>
      setComments((prev) =>
        prev.map((c) => (c._id === id ? { ...c, ...(typeof patch === 'function' ? patch(c) : patch) } : c))
      ),
    []
  )

  return { comments, loading, hasMore, error, loadMore, addComment, removeComment, patchComment }
}