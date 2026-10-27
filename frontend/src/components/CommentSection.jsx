import { useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useComments } from '../hooks/useComments'
import { createComment } from '../services/commentApi'
import CommentInput from './CommentInput'
import CommentItem from './CommentItem'

export default function CommentSection({ post, onCountChange }) {
  const { user } = useAuth()
  const { comments, loading, hasMore, error, loadMore, addComment, removeComment, patchComment } =
    useComments(post._id)

  const handleCreate = async (text) => {
    const data = await createComment(post._id, { content: text })
    addComment(data.comment)
    onCountChange(1)
  }

  // removed = số bình luận thực sự bị xoá (bình luận gốc + các trả lời của nó)
  const handleDeleted = useCallback(
    (id, removed) => {
      removeComment(id)
      onCountChange(-removed)
    },
    [removeComment, onCountChange]
  )

  return (
    <section className="cmt-section">
      <CommentInput user={user} placeholder="Viết bình luận..." onSubmit={handleCreate} />

      <div className="cmt-list">
        {comments.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            postId={post._id}
            postAuthorId={post.author?._id}
            onPatch={patchComment}
            onDeleted={handleDeleted}
            onCountChange={onCountChange}
          />
        ))}
      </div>

      {loading && <p className="cmt-status">Đang tải bình luận...</p>}

      {error && (
        <div className="cmt-error">
          {error}{' '}
          <button type="button" className="link-btn" onClick={loadMore}>
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && hasMore && (
        <button type="button" className="cmt-more" onClick={loadMore}>
          Xem thêm bình luận
        </button>
      )}

      {!loading && !error && comments.length === 0 && (
        <p className="cmt-status">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
      )}
    </section>
  )
}