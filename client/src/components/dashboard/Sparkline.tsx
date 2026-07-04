/**
 * Deliberately not using a charting library for a single sparkline — a
 * hand-rolled SVG polyline is a few lines, has zero bundle cost, and is all
 * this needs. Reach for recharts/d3 if this ever grows into a full
 * interactive chart with axes/tooltips.
 */
export default function Sparkline({
  data,
  width = 240,
  height = 56,
  positive,
}: {
  data: number[]
  width?: number
  height?: number
  positive: boolean
}) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)

  const points = data
    .map((value, i) => {
      const x = i * stepX
      const y = height - ((value - min) / range) * height
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  const color = positive ? 'var(--color-accum)' : 'var(--color-risk)'
  const areaPoints = `0,${height} ${points} ${width},${height}`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      role="img"
      aria-label={`7-day price trend, ${positive ? 'up' : 'down'} overall`}
    >
      <polygon points={areaPoints} fill={color} opacity={0.12} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
