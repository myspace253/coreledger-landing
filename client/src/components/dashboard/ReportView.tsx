import { motion } from 'framer-motion'
import type { ResearchReport } from '../../lib/api'

function scoreColor(score: number) {
  if (score >= 85) return '#4fd8c4'
  if (score >= 70) return '#ffb454'
  return '#ff6b6b'
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
      <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-muted)]">{label}</p>
      <p className="mt-1.5 font-display text-lg font-medium" style={accent ? { color: accent } : undefined}>
        {value}
      </p>
    </div>
  )
}

function InsightCard({ title, body, accent }: { title: string; body: string; accent: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
        <h3 className="font-display text-sm font-medium text-[var(--color-ink)]">{title}</h3>
      </div>
      <p className="text-sm leading-relaxed text-[var(--color-muted)]">{body}</p>
    </div>
  )
}

export default function ReportView({
  report,
  usedFallback,
  fallbackReason,
}: {
  report: ResearchReport
  usedFallback: boolean
  fallbackReason?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-8"
    >
      {/* header strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-[var(--color-muted)]">query</p>
          <h1 className="font-display text-2xl font-medium text-[var(--color-ink)] sm:text-3xl">
            {report.tokenQuery}
          </h1>
        </div>
        <span className="rounded-full border border-[var(--color-line)] px-3 py-1 font-mono text-[11px] text-[var(--color-muted)]">
          {new Date(report.generatedAt).toLocaleString()}
        </span>
      </div>

      {/* executive summary tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Narrative" value={report.narrative} accent="#6c8eff" />
        <StatTile label="Category" value={report.category} />
        <StatTile
          label="Risk Score"
          value={`${report.riskScore}/100`}
          accent={scoreColor(report.riskScore)}
        />
        <StatTile label="Confidence" value={`${report.confidence}%`} accent="#4fd8c4" />
        <StatTile label="Market Cycle" value={report.marketCycle} accent="#ffb454" />
        <StatTile label="Recommendation" value={report.recommendation} />
      </div>

      {/* risk factor bars */}
      {report.riskFactors.length > 0 && (
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-risk)]">
            Risk factors
          </p>
          <div className="space-y-4">
            {report.riskFactors.map((f) => (
              <div key={f.label}>
                <div className="mb-1.5 flex items-baseline justify-between font-mono text-xs">
                  <span className="text-[var(--color-muted)]">{f.label}</span>
                  <span style={{ color: scoreColor(f.score) }}>{f.score}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: scoreColor(f.score) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${f.score}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* insight cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InsightCard title="Whale activity" body={report.whaleActivity} accent="#4fd8c4" />
        <InsightCard title="Developer activity" body={report.developerActivity} accent="#6c8eff" />
        <InsightCard title="Holder health" body={report.holderHealth} accent="#ffb454" />
      </div>

      {/* AI analysis */}
      <div className="crt-scan rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/90 p-6">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-accum)]">
          AI analysis
        </p>
        <p className="font-mono text-[13px] leading-relaxed text-[var(--color-ink)]/90 sm:text-sm">
          {report.aiAnalysis}
        </p>
      </div>

      {/* verdict banner */}
      <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-[var(--color-signal)]/30 bg-[var(--color-signal)]/[0.06] p-6 sm:flex-row sm:items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-signal)]">Verdict</p>
          <p className="mt-1 font-display text-base font-medium text-[var(--color-ink)]">{report.verdict}</p>
        </div>
        {usedFallback && (
          <span className="max-w-md rounded-full border border-[var(--color-risk)]/40 bg-[var(--color-risk)]/[0.08] px-3 py-1 font-mono text-[11px] text-[var(--color-risk)]">
            AI call failed — served offline fallback{fallbackReason ? `: ${fallbackReason}` : ''}
          </span>
        )}
        {report.dataSource === 'mock' && !usedFallback && (
          <span className="rounded-full border border-[var(--color-line)] px-3 py-1 font-mono text-[11px] text-[var(--color-muted)]">
            demo on-chain data
          </span>
        )}
      </div>
    </motion.div>
  )
}
