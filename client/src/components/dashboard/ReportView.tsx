import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Check,
  CircleSlash,
  Copy,
  Download,
  ExternalLink,
  FlaskConical,
  GitFork,
  Github,
  Link2,
  type LucideIcon,
  MessageCircle,
  ShieldCheck,
  Star,
  ThumbsDown,
  ThumbsUp,
  TrendingDown,
  TrendingUp,
  Twitter,
  Users,
} from 'lucide-react'
import type { DataQuality, ResearchReport } from '../../lib/api'
import { copyReportToClipboard, downloadReportAsJson, downloadReportAsMarkdown } from '../../lib/reportExport'
import RiskGauge from './RiskGauge'
import Sparkline from './Sparkline'

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

const QUALITY_META: Record<DataQuality, { label: string; icon: LucideIcon; color: string }> = {
  live: { label: 'Live data', icon: ShieldCheck, color: 'var(--color-accum)' },
  simulated: { label: 'Simulated', icon: FlaskConical, color: 'var(--color-signal)' },
  unavailable: { label: 'Unavailable', icon: CircleSlash, color: 'var(--color-muted)' },
}

function DataQualityBadge({ quality }: { quality: DataQuality }) {
  const meta = QUALITY_META[quality]
  const Icon = meta.icon
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider"
      style={{ borderColor: `${meta.color}55`, color: meta.color, background: `${meta.color}14` }}
    >
      <Icon size={11} strokeWidth={2.25} />
      {meta.label}
    </span>
  )
}

function fmtUsd(value: number | null): string {
  if (value === null) return '—'
  if (value >= 1) return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  return `$${value.toLocaleString('en-US', { maximumSignificantDigits: 4 })}`
}

function fmtCompact(value: number | null): string {
  if (value === null) return '—'
  return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value)
}

function MarketSnapshotSection({ report }: { report: ResearchReport }) {
  const m = report.marketData
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
      <div className="mb-5 flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-data)]">Market snapshot</p>
        <DataQualityBadge quality={report.dataQuality.market} />
      </div>
      {m ? (
        <div>
          {m.sparkline7d && m.sparkline7d.length > 1 && (
            <div className="mb-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)]/50 p-3">
              <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                <span>7-day price trend</span>
                <span style={{ color: (m.priceChangePct7d ?? 0) >= 0 ? 'var(--color-accum)' : 'var(--color-risk)' }}>
                  {m.priceChangePct7d !== null ? `${m.priceChangePct7d >= 0 ? '+' : ''}${m.priceChangePct7d.toFixed(1)}%` : ''}
                </span>
              </div>
              <Sparkline data={m.sparkline7d} positive={(m.priceChangePct7d ?? 0) >= 0} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatTile label="Price" value={fmtUsd(m.currentPriceUsd)} />
            <StatTile label="Market cap" value={m.marketCapUsd !== null ? `$${fmtCompact(m.marketCapUsd)}` : '—'} />
            <StatTile label="Rank" value={m.marketCapRank !== null ? `#${m.marketCapRank}` : '—'} />
            <StatTile label="24h volume" value={m.totalVolume24hUsd !== null ? `$${fmtCompact(m.totalVolume24hUsd)}` : '—'} />
            <StatTile label="Circulating supply" value={fmtCompact(m.circulatingSupply)} />
            <StatTile
              label="ATH change"
              value={m.athChangePct !== null ? `${m.athChangePct.toFixed(1)}%` : '—'}
              accent={m.athChangePct !== null && m.athChangePct < -50 ? 'var(--color-risk)' : undefined}
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">
          No CoinGecko listing matched this query, so live price, market cap, and supply figures aren't available.
          Try a ticker (e.g. "PEPE") or a contract address for a listed token.
        </p>
      )}
    </div>
  )
}

function DeveloperAndSocialSection({ report }: { report: ResearchReport }) {
  const d = report.developerData
  const s = report.socialData

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github size={14} className="text-[var(--color-ink)]" />
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-ink)]">GitHub activity</p>
          </div>
          <DataQualityBadge quality={report.dataQuality.developer} />
        </div>
        {d ? (
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Commits (4wk)" value={fmtCompact(d.commitCount4Weeks)} />
            <StatTile label="Contributors" value={fmtCompact(d.pullRequestContributors)} />
            <div className="flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3">
              <Star size={13} className="text-[var(--color-signal)]" />
              <span className="font-display text-sm text-[var(--color-ink)]">{fmtCompact(d.stars)}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3">
              <GitFork size={13} className="text-[var(--color-data)]" />
              <span className="font-display text-sm text-[var(--color-ink)]">{fmtCompact(d.forks)}</span>
            </div>
            {d.githubUrl && (
              <a
                href={d.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="col-span-2 inline-flex items-center gap-1.5 font-mono text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-signal)]"
              >
                <ExternalLink size={12} /> View repository
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">
            No CoinGecko-linked GitHub repo for this token — showing simulated commit/contributor figures in the
            narrative below instead.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-[var(--color-ink)]" />
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-ink)]">Social &amp; community</p>
          </div>
          <DataQualityBadge quality={report.dataQuality.social} />
        </div>
        {s ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3">
                <Twitter size={13} className="text-[var(--color-data)]" />
                <span className="font-display text-sm text-[var(--color-ink)]">
                  {s.twitterFollowers !== null ? fmtCompact(s.twitterFollowers) : 'n/a'}
                </span>
                {s.twitterDataCaveat && (
                  <span className="ml-auto shrink-0" title={s.twitterDataCaveat}>
                    <AlertTriangle size={12} className="text-[var(--color-signal)]" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3">
                <MessageCircle size={13} className="text-[var(--color-signal)]" />
                <span className="font-display text-sm text-[var(--color-ink)]">{fmtCompact(s.redditSubscribers)}</span>
              </div>
            </div>
            {s.twitterDataCaveat && (
              <p className="flex items-start gap-1.5 font-mono text-[10px] leading-relaxed text-[var(--color-muted)]">
                <AlertTriangle size={11} className="mt-0.5 shrink-0 text-[var(--color-signal)]" />
                {s.twitterDataCaveat}
              </p>
            )}
            {s.sentimentUpPct !== null && (
              <div>
                <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] text-[var(--color-muted)]">
                  <span className="flex items-center gap-1">
                    <ThumbsUp size={11} /> {s.sentimentUpPct}%
                  </span>
                  <span className="flex items-center gap-1">
                    {s.sentimentDownPct ?? 100 - s.sentimentUpPct}% <ThumbsDown size={11} />
                  </span>
                </div>
                <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-risk)]/40">
                  <div className="h-full rounded-full bg-[var(--color-accum)]" style={{ width: `${s.sentimentUpPct}%` }} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">No social/community data available for this token.</p>
        )}
      </div>
    </div>
  )
}

function ReportActions({ report }: { report: ResearchReport }) {
  const [copied, setCopied] = useState<'markdown' | 'link' | null>(null)

  function flash(kind: 'markdown' | 'link') {
    setCopied(kind)
    window.setTimeout(() => setCopied(null), 1800)
  }

  async function handleCopy() {
    const ok = await copyReportToClipboard(report)
    if (ok) flash('markdown')
  }

  async function handleShare() {
    const url = `${window.location.origin}/app?q=${encodeURIComponent(report.tokenQuery)}`
    try {
      await navigator.clipboard.writeText(url)
      flash('link')
    } catch {
      // clipboard unavailable — nothing to fall back to here, fail silently
    }
  }

  const buttonClass =
    'inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-3 py-1.5 font-mono text-[11px] text-[var(--color-muted)] transition-colors hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={handleShare} className={buttonClass} type="button">
        {copied === 'link' ? <Check size={12} /> : <Link2 size={12} />}
        {copied === 'link' ? 'Link copied' : 'Share'}
      </button>
      <button onClick={handleCopy} className={buttonClass} type="button">
        {copied === 'markdown' ? <Check size={12} /> : <Copy size={12} />}
        {copied === 'markdown' ? 'Copied' : 'Copy'}
      </button>
      <button onClick={() => downloadReportAsMarkdown(report)} className={buttonClass} type="button">
        <Download size={12} /> .md
      </button>
      <button onClick={() => downloadReportAsJson(report)} className={buttonClass} type="button">
        <Download size={12} /> .json
      </button>
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
  const price = report.marketData
  const changeUp = (price?.priceChangePct24h ?? 0) >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-8"
    >
      {/* header strip */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {price?.image && (
            <img src={price.image} alt="" className="h-10 w-10 rounded-full border border-[var(--color-line)]" />
          )}
          <div>
            <p className="font-mono text-xs text-[var(--color-muted)]">query</p>
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="font-display text-2xl font-medium text-[var(--color-ink)] sm:text-3xl">
                {price ? `${price.name} · ${price.symbol}` : report.tokenQuery}
              </h1>
              {price?.currentPriceUsd !== null && price && (
                <span className="font-mono text-lg text-[var(--color-ink)]/80">{fmtUsd(price.currentPriceUsd)}</span>
              )}
              {price?.priceChangePct24h !== null && price && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs"
                  style={{
                    color: changeUp ? 'var(--color-accum)' : 'var(--color-risk)',
                    background: changeUp ? 'rgba(79,216,196,0.12)' : 'rgba(255,107,107,0.12)',
                  }}
                >
                  {changeUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {price.priceChangePct24h?.toFixed(2)}% 24h
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full border border-[var(--color-line)] px-3 py-1 font-mono text-[11px] text-[var(--color-muted)]">
            {new Date(report.generatedAt).toLocaleString()}
          </span>
          <ReportActions report={report} />
        </div>
      </div>

      {/* executive summary tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Narrative" value={report.narrative} accent="var(--color-data)" />
        <StatTile label="Category" value={report.category} />
        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
          <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-[var(--color-muted)]">Risk Score</p>
          <RiskGauge score={report.riskScore} size={48} />
        </div>
        <StatTile label="Confidence" value={`${report.confidence}%`} accent="var(--color-accum)" />
        <StatTile label="Market Cycle" value={report.marketCycle} accent="var(--color-signal)" />
        <StatTile label="Recommendation" value={report.recommendation} />
      </div>

      {/* market snapshot */}
      <MarketSnapshotSection report={report} />

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
        <InsightCard title="Whale activity" body={report.whaleActivity} accent="var(--color-accum)" />
        <InsightCard title="Developer activity" body={report.developerActivity} accent="var(--color-data)" />
        <InsightCard title="Holder health" body={report.holderHealth} accent="var(--color-signal)" />
      </div>

      {/* developer + social detail */}
      <DeveloperAndSocialSection report={report} />

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
        {report.dataQuality.onchain === 'simulated' && (
          <span className="rounded-full border border-[var(--color-line)] px-3 py-1 font-mono text-[11px] text-[var(--color-muted)]">
            holder / whale data is simulated
          </span>
        )}
      </div>
    </motion.div>
  )
}
