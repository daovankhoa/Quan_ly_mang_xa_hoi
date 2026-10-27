export default function PostSkeleton() {
  return (
    <div className="card post skeleton" aria-hidden="true">
      <div className="post-header">
        <div className="sk sk-avatar" />
        <div className="sk-lines">
          <div className="sk sk-line" style={{ width: '40%' }} />
          <div className="sk sk-line" style={{ width: '25%' }} />
        </div>
      </div>
      <div className="sk sk-line" style={{ width: '90%', marginTop: 14 }} />
      <div className="sk sk-line" style={{ width: '65%' }} />
      <div className="sk sk-image" />
    </div>
  )
}