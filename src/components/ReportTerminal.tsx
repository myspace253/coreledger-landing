import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const REPORT_LINES = [
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

export default function ReportTerminal() {
  const [visibleChars, setVisibleChars] = useState<number[]>(REPORT_LINES.map(() => 0))
  const [lineIndex, setLineIndex] = useState(0)
  const [address] = useState('0x71C7...9e2A')
  const timer = useRef<number | null>(null)

  useEffect(() => {
    timer.current = window.setInterval(() => {
      setVisibleChars((prev) => {
        const next = [...prev]
        const full = REPORT_LINES[lineIndex]?.value.length ?? 0
        if (lineIndex < REPORT_LINES.length && next[lineIndex] < full) {
          next[lineIndex] += 1
        } else if (lineIndex < REPORT_LINES.length - 1) {
          setTimeout(() => setLineIndex((i) => Math.min(i + 1, REPORT_LINES.length - 1)), 120)
        } else {
          // restart the loop after a pause
          setTimeout(() => {
            setLineIndex(0)
            setVisibleChars(REPORT_LINES.map(() => 0))
          }, 2600)
        }
        return next
      })
    }, 28)

    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [lineIndex])

  return (
    <div className="crt-scan rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/90 backdrop-blur-sm shadow-[0_0_60px_-15px_rgba(255,180,84,0.15)]">
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-risk)]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-signal)]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-accum)]/70" />
        <span className="ml-2 font-mono text-xs text-[var(--color-muted)]">
          intelligence-report.stream
        </span>
      </div>
      <div className="p-5 font-mono text-[13px] leading-relaxed sm:p-6 sm:text-sm">
        <div className="mb-4 flex items-center gap-2 text-[var(--color-muted)]">
          <span className="text-[var(--color-accum)]">&gt;</span>
          <span>analyze</span>
          <span className="text-[var(--color-ink)]">{address}</span>
          <motion.span
            className="inline-block h-3.5 w-1.5 bg-[var(--color-signal)]"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        </div>
        <div className="space-y-2">
          {REPORT_LINES.map((line, i) => {
            const shown = line.value.slice(0, visibleChars[i])
            const isActive = shown.length > 0
            return (
              <div key={line.label} className={`flex gap-3 ${isActive ? 'opacity-100' : 'opacity-25'}`}>
                <span className="w-28 shrink-0 text-[var(--color-muted)]">{line.label}</span>
                <span className={toneColor[line.tone]}>{shown}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
