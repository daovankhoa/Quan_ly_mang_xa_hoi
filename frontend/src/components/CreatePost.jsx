import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { createPost } from '../services/postApi'
import { getErrorMessage } from '../services/api'
import Avatar from './Avatar'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB / ảnh
const MAX_IMAGES = 10
const MAX_CONTENT = 2000

export default function CreatePost({ onCreated }) {
  const { user } = useAuth()
  const fileRef = useRef(null)
  const textRef = useRef(null)

  const [content, setContent] = useState('')
  const [items, setItems] = useState([]) // [{ id, file, preview }]
  const [posting, setPosting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  // Giải phóng URL xem trước khi component bị huỷ
  const itemsRef = useRef(items)
  useEffect(() => {
    itemsRef.current = items
  }, [items])
  useEffect(() => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.preview)), [])

  const autoGrow = (el) => {
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files || [])
    e.target.value = '' // cho phép chọn lại cùng một file
    if (!picked.length) return

    let nextError = ''
    const valid = []
    for (const file of picked) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        nextError = 'Chỉ chấp nhận ảnh JPG, PNG hoặc WebP'
      } else if (file.size > MAX_SIZE) {
        nextError = 'Mỗi ảnh không được vượt quá 5MB'
      } else {
        valid.push(file)
      }
    }

    const room = MAX_IMAGES - items.length
    if (valid.length > room) nextError = `Chỉ được đăng tối đa ${MAX_IMAGES} ảnh mỗi bài`

    setError(nextError)
    const added = valid.slice(0, Math.max(room, 0)).map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      preview: URL.createObjectURL(file),
    }))
    setItems((prev) => [...prev, ...added])
  }

  const removeItem = (id) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id)
      if (target) URL.revokeObjectURL(target.preview)
      return prev.filter((i) => i.id !== id)
    })
  }

  const canSubmit = !posting && (content.trim() || items.length > 0)

  const handleSubmit = async () => {
    if (!canSubmit) return
    setPosting(true)
    setError('')
    setProgress(0)
    try {
      const data = await createPost(
        { content: content.trim(), files: items.map((i) => i.file) },
        (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100))
      )
      onCreated(data.post)
      items.forEach((i) => URL.revokeObjectURL(i.preview))
      setItems([])
      setContent('')
      if (textRef.current) textRef.current.style.height = 'auto'
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setPosting(false)
    }
  }

  return (
    <section className="card composer">
      <div className="composer-row">
        <Avatar user={user} size={40} />
        <textarea
          ref={textRef}
          value={content}
          rows={2}
          maxLength={MAX_CONTENT}
          placeholder={`${user?.displayName || 'Bạn'} ơi, bạn đang nghĩ gì thế?`}
          disabled={posting}
          onChange={(e) => {
            setContent(e.target.value)
            autoGrow(e.target)
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="composer-previews">
          {items.map((item) => (
            <div key={item.id} className="preview-item">
              <img src={item.preview} alt="" />
              {!posting && (
                <button
                  type="button"
                  className="preview-remove"
                  aria-label="Bỏ ảnh này"
                  onClick={() => removeItem(item.id)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <div className="alert alert-error composer-alert">{error}</div>}

      {posting && (
        <div className="progress" aria-label="Đang tải lên">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="composer-footer">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={handleFiles}
        />
        <button
          type="button"
          className="btn-ghost"
          disabled={posting || items.length >= MAX_IMAGES}
          onClick={() => fileRef.current?.click()}
        >
          🖼️ Ảnh{items.length > 0 && ` (${items.length}/${MAX_IMAGES})`}
        </button>

        <button
          type="button"
          className="btn-primary composer-submit"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {posting ? 'Đang đăng...' : 'Đăng'}
        </button>
      </div>
    </section>
  )
}