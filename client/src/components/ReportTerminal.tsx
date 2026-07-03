import { useEffect, useState } from 'react'

const DEMO_LINES = [
  { label: 'narrative', value: 'AI Infrastructure', tone: 'data' },
  { label: 'risk_score', value: 'LOW · 91% confidence', tone: 'accum' },
  { label: 'whale_activity', value: 'Accumulating (+12% supply, 30d)', tone: 'accum' },
  { label: 'dev_activity', value: 'Very active · 214 commits / 30d', tone: 'accum' },
  { label: 'holder_health', value: 'Concentration risk: moderate', tone: 'signal' },
  { label: 'verdict', value: 'Early accumulation phase', tone: 'signal' },
] as const

const toneColor: Record<string, string> = {
  data: 'text-[#6c8eff]',
  accum: 'text-[#4fd8c4]',
  signal: 'text-[#ffb454]',
}

/**
 * Marketing-only scripted demo of what a report looks like. This never calls
 * the API — the real, functional research tool lives on the /app dashboard.
 */
export default function ReportTerminal({ preview = false }: { preview?: boolean }) {
  const [visible, setVisible] = useState<number[]>(DEMO_LINES.map(() => 0))
  const [line, setLine] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setVisible((prev) => {
        const next = [...prev]
        const full = DEMO_LINES[line]?.value.length ?? 0
        if (line < DEMO_LINES.length && next[line] < full) {
          next[line] += 1
        } else if (line < DEMO_LINES.length - 1) {
          setTimeout(() => setLine((i) => Math.min(i + 1, DEMO_LINES.length - 1)), 120)
        } else {
          setTimeout(() => {
            setLine(0)
            setVisible(DEMO_LINES.map(() => 0))
          }, 2600)
        }
        return next
      })
    }, 28)
    return () => window.clearInterval(interval)
  }, [line])

  return (
    <div className="crt-scan rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/90 backdrop-blur-sm shadow-[0_0_60px_-15px_rgba(255,180,84,0.15)]">
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-risk)]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-signal)]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-accum)]/70" />
        <span className="ml-2 font-mono text-xs text-[var(--color-muted)]">
          intelligence-report.stream
        </span>
        {preview && (
          <span className="ml-auto rounded-full border border-[var(--color-line)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-muted)]">
            preview
          </span>
        )}
      </div>
      <div className="p-5 font-mono text-[13px] leading-relaxed sm:p-6 sm:text-sm">
        <div className="mb-4 flex items-center gap-2 text-[var(--color-muted)]">
          <span className="text-[var(--color-accum)]">&gt;</span>
          <span>analyze</span>
          <span className="text-[var(--color-ink)]">0x71C7…9e2A</span>
        </div>
        <div className="space-y-2">
          {DEMO_LINES.map((l, i) => {
            const shown = l.value.slice(0, visible[i])
            const isActive = shown.length > 0
            return (
              <div key={l.label} className={`flex gap-3 ${isActive ? 'opacity-100' : 'opacity-25'}`}>
                <span className="w-28 shrink-0 text-[var(--color-muted)]">{l.label}</span>
                <span className={toneColor[l.tone]}>{shown}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
