import { memo, useCallback, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { createComment, deleteComment, getReplies } from '../services/commentApi'
import { getErrorMessage } from '../services/api'
import { fullDate, timeAgo } from '../utils/timeAgo'
import Avatar from './Avatar'
import CommentInput from './CommentInput'

// Một dòng bình luận (dùng cho cả bình luận gốc lẫn trả lời)
function CommentRow({ comment, canDelete, isMine, hasReplies, onReply, onDelete, size }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    const lines = [isMine ? 'Xoá bình luận này?' : 'Xoá bình luận này khỏi bài viết của bạn?']
    if (hasReplies) lines.push('Tất cả phản hồi bên dưới cũng sẽ bị xoá.')
    if (!window.confirm(lines.join('\n'))) return
    setDeleting(true)
    try {
      await onDelete()
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div className={`cmt-row ${deleting ? 'is-deleting' : ''}`}>
      <Avatar user={comment.author} size={size} />
      <div className="cmt-main">
        <div className="cmt-bubble">
          <strong className="cmt-name">{comment.author?.displayName || 'Người dùng đã xoá'}</strong>
          <p className="cmt-text">
            {comment.replyTo && <span className="cmt-mention">{comment.replyTo.displayName} </span>}
            {comment.content}
          </p>
        </div>
        <div className="cmt-meta">
          <time dateTime={comment.createdAt} title={fullDate(comment.createdAt)}>
            {timeAgo(comment.createdAt)}
          </time>
          <button type="button" className="cmt-link" onClick={onReply}>
            Trả lời
          </button>
          {canDelete && (
            <button type="button" className="cmt-link cmt-link-danger" disabled={deleting} onClick={handleDelete}>
              Xoá
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Gộp, bỏ trùng, sắp cũ nhất trước
const mergeReplies = (a, b) => {
  const map = new Map()
  for (const r of [...a, ...b]) map.set(r._id, r)
  return [...map.values()].sort((x, y) => (x._id < y._id ? -1 : 1))
}

function CommentItem({ comment, postId, postAuthorId, onPatch, onDeleted, onCountChange }) {
  const { user } = useAuth()

  const [replies, setReplies] = useState([])
  const [repliesHasMore, setRepliesHasMore] = useState(comment.repliesCount > 0)
  const [repliesLoading, setRepliesLoading] = useState(false)
  const [replyTarget, setReplyTarget] = useState(null) // { id, name } đang được trả lời
  const [error, setError] = useState('')
  const cursorRef = useRef(null)

  const canDeleteComment = (c) =>
    !!user &&
    (user._id === c.author?._id || user._id === postAuthorId || user.role === 'admin')

  const loadReplies = async () => {
    if (repliesLoading) return
    setRepliesLoading(true)
    setError('')
    try {
      const data = await getReplies(comment._id, { cursor: cursorRef.current, limit: 5 })
      cursorRef.current = data.nextCursor
      setRepliesHasMore(data.hasMore)
      setReplies((prev) => mergeReplies(prev, data.replies))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setRepliesLoading(false)
    }
  }

  const openReply = useCallback((target) => setReplyTarget(target), [])

  const submitReply = async (text) => {
    const data = await createComment(postId, { content: text, parentId: replyTarget.id })
    setReplies((prev) => mergeReplies(prev, [data.comment]))
    onPatch(comment._id, (c) => ({ repliesCount: (c.repliesCount || 0) + 1 }))
    onCountChange(1)
    setReplyTarget(null)
  }

  const deleteRoot = async () => {
    try {
      const data = await deleteComment(comment._id)
      onDeleted(comment._id, data.removed)
    } catch (err) {
      setError(getErrorMessage(err))
      throw err
    }
  }

  const deleteReply = async (reply) => {
    try {
      await deleteComment(reply._id)
      setReplies((prev) => prev.filter((r) => r._id !== reply._id))
      onPatch(comment._id, (c) => ({ repliesCount: Math.max((c.repliesCount || 0) - 1, 0) }))
      onCountChange(-1)
    } catch (err) {
      setError(getErrorMessage(err))
      throw err
    }
  }

  const remaining = Math.max(comment.repliesCount - replies.length, 0)

  return (
    <div className="cmt-thread">
      <CommentRow
        comment={comment}
        size={36}
        isMine={user?._id === comment.author?._id}
        canDelete={canDeleteComment(comment)}
        hasReplies={comment.repliesCount > 0}
        onReply={() => openReply({ id: comment._id, name: comment.author?.displayName })}
        onDelete={deleteRoot}
      />

      {(replies.length > 0 || (repliesHasMore && remaining > 0) || replyTarget) && (
        <div className="cmt-replies">
          {replies.map((reply) => (
            <CommentRow
              key={reply._id}
              comment={reply}
              size={28}
              isMine={user?._id === reply.author?._id}
              canDelete={canDeleteComment(reply)}
              hasReplies={false}
              onReply={() => openReply({ id: reply._id, name: reply.author?.displayName })}
              onDelete={() => deleteReply(reply)}
            />
          ))}

          {repliesHasMore && remaining > 0 && (
            <button type="button" className="cmt-more" disabled={repliesLoading} onClick={loadReplies}>
              {repliesLoading
                ? 'Đang tải...'
                : replies.length === 0
                  ? `Xem ${remaining} phản hồi`
                  : `Xem thêm ${remaining} phản hồi`}
            </button>
          )}

          {replyTarget && (
            <CommentInput
              user={user}
              size={28}
              autoFocus
              placeholder={`Trả lời ${replyTarget.name || ''}...`}
              onSubmit={submitReply}
              onCancel={() => setReplyTarget(null)}
            />
          )}
        </div>
      )}

      {error && <div className="cmt-error">{error}</div>}
    </div>
  )
}

export default memo(CommentItem)