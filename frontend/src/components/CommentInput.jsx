import { useEffect, useRef, useState } from 'react'
import { getErrorMessage } from '../services/api'
import Avatar from './Avatar'

const MAX_LENGTH = 1000

// onSubmit(text) trả về Promise; ném lỗi thì giữ nguyên nội dung để người dùng gửi lại
export default function CommentInput({ user, placeholder, onSubmit, onCancel, autoFocus = false, size = 32 }) {
  const ref = useRef(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])

  const grow = (el) => {
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  const submit = async () => {
    const value = text.trim()
    if (!value || sending) return
    setSending(true)
    setError('')
    try {
      await onSubmit(value)
      setText('')
      if (ref.current) ref.current.style.height = 'auto'
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e) => {
    // isComposing: đang gõ dấu tiếng Việt (Telex/VNI) thì Enter chỉ để chốt chữ, không gửi
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
    if (e.key === 'Escape' && onCancel) onCancel()
  }

  return (
    <div className="cmt-input-wrap">
      <div className="cmt-input">
        <Avatar user={user} size={size} />
        <div className="cmt-input-box">
          <textarea
            ref={ref}
            rows={1}
            value={text}
            maxLength={MAX_LENGTH}
            placeholder={placeholder}
            disabled={sending}
            onChange={(e) => {
              setText(e.target.value)
              grow(e.target)
            }}
            onKeyDown={onKeyDown}
          />
          <button
            type="button"
            className="cmt-send"
            aria-label="Gửi"
            disabled={sending || !text.trim()}
            onClick={submit}
          >
            ➤
          </button>
        </div>
      </div>
      {error && <div className="cmt-error">{error}</div>}
      {onCancel && (
        <div className="cmt-hint">
          Nhấn Esc để <button type="button" className="link-btn" onClick={onCancel}>huỷ</button>
        </div>
      )}
    </div>
  )
}