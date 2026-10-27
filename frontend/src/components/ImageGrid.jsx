
const MAX_VISIBLE = 5

export default function ImageGrid({ images, onOpen }) {
  if (!images?.length) return null

  const visible = images.slice(0, MAX_VISIBLE)
  const extra = images.length - MAX_VISIBLE

  if (images.length === 1) {
    const [img] = images
    
    const ratio = img.width && img.height ? Math.min(Math.max(img.width / img.height, 0.6), 2) : 4 / 3
    return (
      <button type="button" className="img-single" onClick={() => onOpen(0)}>
        <img src={img.url} alt="" loading="lazy" decoding="async" style={{ aspectRatio: ratio }} />
      </button>
    )
  }

  return (
    <div className={`img-grid img-grid-${visible.length}`}>
      {visible.map((img, i) => (
        <button key={img.publicId} type="button" className="img-cell" onClick={() => onOpen(i)}>
          <img src={img.url} alt="" loading="lazy" decoding="async" />
          {i === MAX_VISIBLE - 1 && extra > 0 && <span className="img-more">+{extra}</span>}
        </button>
      ))}
    </div>
  )
}