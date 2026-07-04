function scoreColor(score: number): string {
  if (score >= 85) return '#4fd8c4'
  if (score >= 70) return '#ffb454'
  return '#ff6b6b'
}

/**
 * A compact radial gauge for the single most important number in the
 * report. Deliberately hand-rolled SVG (a stroked circle with a dash-offset
 * trick) rather than a charting library — it's one shape, and this keeps
 * the bundle cost at zero.
 */
export default function RiskGauge({ score, size = 56 }: { score: number; size?: number }) {
  const clamped = Math.max(0, Math.min(100, score))
  const strokeWidth = 5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)
  const color = scoreColor(clamped)

  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label={`Risk score ${clamped} out of 100`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-line)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div>
        <p className="font-display text-lg font-medium leading-none" style={{ color }}>
          {clamped}
        </p>
        <p className="mt-0.5 font-mono text-[10px] text-[var(--color-muted)]">/ 100</p>
      </div>
    </div>
  )
}
