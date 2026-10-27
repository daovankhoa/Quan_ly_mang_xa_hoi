import { memo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { deletePost, likePost, unlikePost } from '../services/postApi'
import { getErrorMessage } from '../services/api'
import { fullDate, timeAgo } from '../utils/timeAgo'
import Avatar from './Avatar'
import ImageGrid from './ImageGrid'
import Lightbox from './Lightbox'

const COLLAPSE_AT = 300 

function PostCard({ post, onUpdate, onRemove }) {
  const { user } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const isOwner = user?._id === post.author?._id
  const isLong = post.content.length > COLLAPSE_AT
  const text = isLong && !expanded ? `${post.content.slice(0, COLLAPSE_AT)}…` : post.content

  const toggleLike = async () => {
    if (busy) return
    const wasLiked = post.likedByMe
    setBusy(true)
    setError('')
    
    onUpdate(post._id, {
      likedByMe: !wasLiked,
      likesCount: Math.max(post.likesCount + (wasLiked ? -1 : 1), 0),
    })
    try {
      const data = await (wasLiked ? unlikePost(post._id) : likePost(post._id))
      onUpdate(post._id, { likedByMe: data.likedByMe, likesCount: data.likesCount })
    } catch (err) {
      onUpdate(post._id, { likedByMe: wasLiked, likesCount: post.likesCount })
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Bạn chắc chắn muốn xoá bài viết này?')) return
    try {
      await deletePost(post._id)
      onRemove(post._id)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <article className="card post">
      <header className="post-header">
        <Avatar user={post.author} size={40} />
        <div className="post-meta">
          <strong>{post.author?.displayName}</strong>
          <time dateTime={post.createdAt} title={fullDate(post.createdAt)}>
            @{post.author?.username} · {timeAgo(post.createdAt)}
          </time>
        </div>
        {isOwner && (
          <button className="post-delete" title="Xoá bài viết" aria-label="Xoá bài viết" onClick={handleDelete}>
            🗑
          </button>
        )}
      </header>

      {post.content && (
        <p className="post-content">
          {text}
          {isLong && (
            <button className="link-btn" onClick={() => setExpanded((v) => !v)}>
              {expanded ? ' Thu gọn' : ' Xem thêm'}
            </button>
          )}
        </p>
      )}

      <ImageGrid images={post.images} onOpen={setLightboxIndex} />

      {post.likesCount > 0 && (
        <div className="post-stats">👍 {post.likesCount.toLocaleString('vi-VN')}</div>
      )}

      {error && <div className="alert alert-error post-alert">{error}</div>}

      <footer className="post-actions">
        <button className={`action-btn ${post.likedByMe ? 'liked' : ''}`} onClick={toggleLike}>
          👍 {post.likedByMe ? 'Đã thích' : 'Thích'}
        </button>
      </footer>

      {lightboxIndex !== null && (
        <Lightbox
          images={post.images}
          index={lightboxIndex}
          onChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </article>
  )
}

export default memo(PostCard)