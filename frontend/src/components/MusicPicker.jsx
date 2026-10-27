import { useEffect, useRef, useState } from 'react'

const MOOD_LABELS = {
  happy: 'Vui vẻ',
  calm: 'Bình yên',
  romantic: 'Lãng mạn',
  energetic: 'Sôi động',
  nostalgic: 'Hoài niệm',
  melancholic: 'Man mác',
  epic: 'Hùng vĩ',
  playful: 'Tinh nghịch',
  dreamy: 'Mơ màng',
  mysterious: 'Bí ẩn',
}

const formatDuration = (seconds) => {
  if (!seconds) return ''
  const total = Math.round(seconds)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

// Khung gợi ý nhạc: hiện tối đa 3 bài AI chọn, cho nghe thử (mỗi lần chỉ phát một bài) và chọn bài.
export default function MusicPicker({ loading, tracks, reason, selectedId, onSelect, onRetry, onClose }) {
  const audioRef = useRef(null)
  const [playingId, setPlayingId] = useState(null)
  const [audioError, setAudioError] = useState('')

  // Đóng khung hoặc chọn xong thì component bị huỷ -> dừng nhạc
  useEffect(() => {
    const audio = audioRef.current
    return () => audio?.pause()
  }, [])

  const stop = () => {
    audioRef.current?.pause()
    setPlayingId(null)
  }

  const togglePlay = async (track) => {
    const audio = audioRef.current
    if (!audio) return
    setAudioError('')

    if (playingId === track._id) {
      stop()
      return
    }

    audio.src = track.audioUrl
    setPlayingId(track._id)
    try {
      await audio.play()
    } catch (err) {
      if (err.name === 'AbortError') return // vừa bấm sang bài khác, lần phát này bị thay thế
      setPlayingId(null)
      setAudioError('Không phát được bài này. Hãy thử bài khác.')
    }
  }

  const handleRetry = () => {
    stop()
    setAudioError('')
    onRetry()
  }

  return (
    <div className="music-picker">
      <div className="music-picker-head">
        <strong>🎵 Nhạc gợi ý cho bạn</strong>
        <button type="button" className="music-picker-close" aria-label="Đóng gợi ý nhạc" onClick={onClose}>
          ×
        </button>
      </div>

      <audio ref={audioRef} preload="none" onEnded={() => setPlayingId(null)} onError={() => {
        if (audioRef.current?.getAttribute('src')) {
          setPlayingId(null)
          setAudioError('Không phát được bài này. Hãy thử bài khác.')
        }
      }} />

      {loading ? (
        <div className="music-picker-note">
          <span className="music-spinner" aria-hidden="true" /> AI đang lắng nghe cảm xúc của bài đăng...
        </div>
      ) : tracks.length === 0 ? (
        <div className="music-picker-note">Kho nhạc chưa có bài nào phù hợp.</div>
      ) : (
        <>
          {reason && <p className="music-picker-reason">{reason}</p>}
          <ul className="music-list">
            {tracks.map((track) => {
              const isPlaying = playingId === track._id
              const isSelected = selectedId === track._id
              return (
                <li key={track._id} className={`music-item${isSelected ? ' is-selected' : ''}`}>
                  <button
                    type="button"
                    className="music-play"
                    aria-label={isPlaying ? `Tạm dừng ${track.title}` : `Nghe thử ${track.title}`}
                    onClick={() => togglePlay(track)}
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                  <div className="music-info">
                    <strong>{track.title}</strong>
                    <span>
                      {track.artist}
                      {track.duration ? ` · ${formatDuration(track.duration)}` : ''}
                    </span>
                    {track.moods?.length > 0 && (
                      <span className="music-tags">
                        {track.moods.slice(0, 2).map((m) => MOOD_LABELS[m] || m).join(' · ')}
                      </span>
                    )}
                    {track.attribution && <span className="music-attribution">{track.attribution}</span>}
                  </div>
                  <button
                    type="button"
                    className={isSelected ? 'btn-ghost music-select is-selected' : 'btn-primary music-select'}
                    onClick={() => onSelect(track)}
                  >
                    {isSelected ? '✓ Đã chọn' : 'Chọn'}
                  </button>
                </li>
              )
            })}
          </ul>
          {audioError && <div className="alert alert-error music-alert">{audioError}</div>}
          <button type="button" className="link-btn music-retry" onClick={handleRetry}>
             Gợi ý lại
          </button>
        </>
      )}
    </div>
  )
}
