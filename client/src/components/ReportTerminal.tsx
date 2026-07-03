import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { requestResearchReport, ResearchApiError, type ResearchReport } from '../lib/api'

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

function reportToLines(report: ResearchReport) {
  return [
    { label: 'narrative', value: report.narrative, tone: 'data' },
    { label: 'risk_score', value: `${report.riskScore}/100 · ${report.confidence}% confidence`, tone: 'accum' },
    { label: 'whale_activity', value: report.whaleActivity, tone: 'accum' },
    { label: 'dev_activity', value: report.developerActivity, tone: 'accum' },
    { label: 'holder_health', value: report.holderHealth, tone: 'signal' },
    { label: 'verdict', value: report.verdict, tone: 'signal' },
  ] as const
}

type Status = 'idle' | 'loading' | 'done' | 'error'

export default function ReportTerminal() {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [report, setReport] = useState<ResearchReport | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // demo typewriter state (used only while idle, before the user runs a real query)
  const [demoVisible, setDemoVisible] = useState<number[]>(DEMO_LINES.map(() => 0))
  const [demoLine, setDemoLine] = useState(0)

  useEffect(() => {
    if (status !== 'idle') return
    const interval = window.setInterval(() => {
      setDemoVisible((prev) => {
        const next = [...prev]
        const full = DEMO_LINES[demoLine]?.value.length ?? 0
        if (demoLine < DEMO_LINES.length && next[demoLine] < full) {
          next[demoLine] += 1
        } else if (demoLine < DEMO_LINES.length - 1) {
          setTimeout(() => setDemoLine((i) => Math.min(i + 1, DEMO_LINES.length - 1)), 120)
        } else {
          setTimeout(() => {
            setDemoLine(0)
            setDemoVisible(DEMO_LINES.map(() => 0))
          }, 2600)
        }
        return next
      })
    }, 28)
    return () => window.clearInterval(interval)
  }, [demoLine, status])

  async function runResearch() {
    if (!input.trim() || status === 'loading') return
    setStatus('loading')
    setErrorMsg('')
    try {
      const { report: r, usedFallback: fb } = await requestResearchReport(input.trim())
      setReport(r)
      setUsedFallback(fb)
      setStatus('done')
    } catch (err) {
      setErrorMsg(err instanceof ResearchApiError ? err.message : 'Something went wrong.')
      setStatus('error')
    }
  }

  const displayLines = report ? reportToLines(report) : DEMO_LINES

  return (
    <div
      id="terminal"
      className="crt-scan rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/90 backdrop-blur-sm shadow-[0_0_60px_-15px_rgba(255,180,84,0.15)]"
    >
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-risk)]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-signal)]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-accum)]/70" />
        <span className="ml-2 font-mono text-xs text-[var(--color-muted)]">
          intelligence-report.stream
        </span>
      </div>

      <div className="p-5 font-mono text-[13px] leading-relaxed sm:p-6 sm:text-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            runResearch()
          }}
          className="mb-4 flex items-center gap-2"
        >
          <span className="text-[var(--color-accum)]">&gt;</span>
          <span className="text-[var(--color-muted)]">analyze</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="0x… address or ticker"
            className="min-w-0 flex-1 bg-transparent text-[var(--color-ink)] placeholder:text-[var(--color-muted)]/60 outline-none"
          />
          <button
            type="submit"
            disabled={status === 'loading' || !input.trim()}
            className="shrink-0 rounded border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--color-signal)] hover:text-[var(--color-signal)] disabled:opacity-40"
          >
            {status === 'loading' ? 'running…' : 'run'}
          </button>
        </form>

        <AnimatePresence mode="wait">
          {status === 'error' ? (
            <motion.p
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[var(--color-risk)]"
            >
              {errorMsg}
            </motion.p>
          ) : (
            <motion.div key="lines" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {status === 'done' && report
                ? displayLines.map((line) => (
                    <div key={line.label} className="flex gap-3">
                      <span className="w-28 shrink-0 text-[var(--color-muted)]">{line.label}</span>
                      <span className={toneColor[line.tone]}>{line.value}</span>
                    </div>
                  ))
                : displayLines.map((line, i) => {
                    const shown =
                      status === 'idle' ? line.value.slice(0, demoVisible[i]) : status === 'loading' ? '' : line.value
                    const isActive = shown.length > 0
                    return (
                      <div key={line.label} className={`flex gap-3 ${isActive ? 'opacity-100' : 'opacity-25'}`}>
                        <span className="w-28 shrink-0 text-[var(--color-muted)]">{line.label}</span>
                        <span className={toneColor[line.tone]}>{shown}</span>
                      </div>
                    )
                  })}
            </motion.div>
          )}
        </AnimatePresence>

        {status === 'loading' && (
          <div className="mt-3 flex items-center gap-2 text-[var(--color-muted)]">
            <motion.span
              className="inline-block h-3.5 w-1.5 bg-[var(--color-signal)]"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 0.9 }}
            />
            gathering on-chain data and reasoning over it…
          </div>
        )}

        {status === 'done' && report && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 border-t border-[var(--color-line)] pt-4 text-[var(--color-ink)]/90"
          >
            <p className="leading-relaxed">{report.aiAnalysis}</p>
            {usedFallback && (
              <p className="mt-3 text-xs text-[var(--color-signal)]">
                Served from local fallback — no AI provider key configured yet on the server. See
                server/.env.example.
              </p>
            )}
            {report.dataSource === 'mock' && !usedFallback && (
              <p className="mt-3 text-xs text-[var(--color-muted)]">
                Reasoned by the AI over demo on-chain data — wire real providers in
                server/src/services/onchainData.ts for live figures.
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
