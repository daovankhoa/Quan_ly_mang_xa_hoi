const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' })

const UNITS = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]

export const timeAgo = (date) => {
  const seconds = Math.round((new Date(date).getTime() - Date.now()) / 1000)
  if (Math.abs(seconds) < 60) return 'Vừa xong'
  for (const [unit, secs] of UNITS) {
    if (Math.abs(seconds) >= secs) return rtf.format(Math.round(seconds / secs), unit)
  }
  return 'Vừa xong'
}

export const fullDate = (date) =>
  new Date(date).toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'short' })