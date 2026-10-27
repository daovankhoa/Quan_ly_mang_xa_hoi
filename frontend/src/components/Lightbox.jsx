import { useEffect } from 'react'

export default function Lightbox({ images, index, onChange, onClose }) {
  const total = images.length

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onChange((index + 1) % total)
      if (e.key === 'ArrowLeft') onChange((index - 1 + total) % total)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden' // khoá cuộn trang phía sau
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [index, total, onChange, onClose])

  return (
    <div className="lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <button className="lightbox-close" aria-label="Đóng" onClick={onClose}>
        ×
      </button>

      {total > 1 && (
        <button
          className="lightbox-nav lightbox-prev"
          aria-label="Ảnh trước"
          onClick={(e) => {
            e.stopPropagation()
            onChange((index - 1 + total) % total)
          }}
        >
          ‹
        </button>
      )}

      <img src={images[index].url} alt="" onClick={(e) => e.stopPropagation()} />

      {total > 1 && (
        <>
          <button
            className="lightbox-nav lightbox-next"
            aria-label="Ảnh sau"
            onClick={(e) => {
              e.stopPropagation()
              onChange((index + 1) % total)
            }}
          >
            ›
          </button>
          <div className="lightbox-count">
            {index + 1} / {total}
          </div>
        </>
      )}
    </div>
  )
}