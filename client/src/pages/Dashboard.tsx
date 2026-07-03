import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { requestResearchReport, ResearchApiError, type ResearchReport } from '../lib/api'
import LoadingScan from '../components/dashboard/LoadingScan'
import ReportView from '../components/dashboard/ReportView'

type Status = 'idle' | 'loading' | 'done' | 'error'

const EXAMPLE_QUERIES = ['0x71C7…9e2A', 'PEPE', 'ARB', 'LINK']

export default function Dashboard() {
  const [searchParams] = useSearchParams()
  const [input, setInput] = useState(searchParams.get('q') ?? '')
  const [status, setStatus] = useState<Status>('idle')
  const [report, setReport] = useState<ResearchReport | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)
  const [fallbackReason, setFallbackReason] = useState<string | undefined>()
  const [errorMsg, setErrorMsg] = useState('')

  async function runResearch(query: string) {
    const trimmed = query.trim()
    if (!trimmed || status === 'loading') return
    setStatus('loading')
    setErrorMsg('')
    try {
      const { report: r, usedFallback: fb, fallbackReason: reason } = await requestResearchReport(trimmed)
      setReport(r)
      setUsedFallback(fb)
      setFallbackReason(reason)
      setStatus('done')
    } catch (err) {
      setErrorMsg(err instanceof ResearchApiError ? err.message : 'Something went wrong.')
      setStatus('error')
    }
  }

  // auto-run if arrived with ?q= from the landing page
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) runResearch(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-[var(--color-base)]">
      <header className="border-b border-[var(--color-line)]/60 bg-[var(--color-base)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 sm:px-8">
          <Link to="/" className="font-display text-sm font-semibold tracking-wide text-[var(--color-ink)]">
            CORELEDGER
          </Link>
          <Link
            to="/"
            className="font-mono text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 sm:px-8 sm:py-16">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            runResearch(input)
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Token address or ticker"
            className="min-w-0 flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 font-mono text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-signal)]"
          />
          <button
            type="submit"
            disabled={status === 'loading' || !input.trim()}
            className="shrink-0 rounded-lg bg-[var(--color-signal)] px-6 py-3 font-display text-sm font-semibold text-[var(--color-base)] transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
          >
            {status === 'loading' ? 'Analyzing…' : 'Generate report'}
          </button>
        </form>

        {status === 'idle' && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-[var(--color-muted)]">Try:</span>
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setInput(q)
                  runResearch(q)
                }}
                className="rounded-full border border-[var(--color-line)] px-3 py-1 font-mono text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="mt-10">
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--color-line)] py-24 text-center"
              >
                <p className="font-display text-lg text-[var(--color-ink)]">Nothing analyzed yet</p>
                <p className="max-w-sm text-sm text-[var(--color-muted)]">
                  Drop in a token address or ticker above to generate a full intelligence report.
                </p>
              </motion.div>
            )}

            {status === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LoadingScan />
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-[var(--color-risk)]/30 bg-[var(--color-risk)]/[0.06] p-6 text-center"
              >
                <p className="font-mono text-sm text-[var(--color-risk)]">{errorMsg}</p>
                <button
                  onClick={() => runResearch(input)}
                  className="mt-4 rounded-lg border border-[var(--color-line)] px-4 py-2 font-mono text-xs text-[var(--color-ink)] transition-colors hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
                >
                  Retry
                </button>
              </motion.div>
            )}

            {status === 'done' && report && (
              <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ReportView report={report} usedFallback={usedFallback} fallbackReason={fallbackReason} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
