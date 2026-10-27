import { useFeed } from '../hooks/useFeed'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import Navbar from '../components/Navbar'
import CreatePost from '../components/CreatePost'
import PostCard from '../components/PostCard'
import PostSkeleton from '../components/PostSkeleton'

export default function HomePage() {
  const { posts, loading, hasMore, error, loadMore, prependPost, updatePost, removePost } = useFeed()

  // Dừng quan sát khi đang tải, hết bài, hoặc đang lỗi (tránh gọi lại liên tục khi lỗi mạng)
  const sentinelRef = useInfiniteScroll(loadMore, { enabled: hasMore && !loading && !error })

  const isFirstLoad = loading && posts.length === 0

  return (
    <>
      <Navbar />
      <main className="feed">
        <CreatePost onCreated={prependPost} />

        {isFirstLoad && (
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        )}

        {posts.map((post) => (
          <PostCard key={post._id} post={post} onUpdate={updatePost} onRemove={removePost} />
        ))}

        {loading && posts.length > 0 && <PostSkeleton />}

        {error && (
          <div className="card feed-note">
            <div className="alert alert-error">{error}</div>
            <button className="btn-primary" style={{ maxWidth: 160 }} onClick={loadMore}>
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="card feed-note">
            <p>Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ nhé! ✨</p>
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <p className="feed-end">Bạn đã xem hết bài viết 🎉</p>
        )}

        {/* mốc ở cuối danh sách: lọt vào màn hình thì tải trang tiếp */}
        <div ref={sentinelRef} className="feed-sentinel" />
      </main>
    </>
  )
}