import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const FACTORS = [
  { label: 'Smart Contract', score: 96 },
  { label: 'Liquidity', score: 90 },
  { label: 'Developer Activity', score: 95 },
  { label: 'Community', score: 91 },
  { label: 'Tokenomics', score: 83 },
  { label: 'Holder Distribution', score: 72 },
  { label: 'Whale Risk', score: 68 },
]

function scoreColor(score: number) {
  if (score >= 85) return '#4fd8c4'
  if (score >= 70) return '#ffb454'
  return '#ff6b6b'
}

export default function RiskPanel() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const bars = gsap.utils.toArray<HTMLElement>('.risk-bar-fill')
      bars.forEach((bar) => {
        const target = bar.dataset.score
        gsap.fromTo(
          bar,
          { width: '0%' },
          {
            width: `${target}%`,
            duration: 1.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: bar,
              start: 'top 88%',
              once: true,
            },
          }
        )
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  return (
    <section id="risk" className="mx-auto max-w-6xl px-6 py-28 sm:px-8">
      <div ref={rootRef} className="grid grid-cols-1 gap-12 lg:grid-cols-5 lg:gap-16">
        <div className="reveal lg:col-span-2">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-risk)]">
            AI risk engine
          </p>
          <h2 className="font-display text-3xl font-medium text-[var(--color-ink)] sm:text-4xl">
            One score, seven factors,
            <br /> zero manual spreadsheets.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--color-muted)]">
            Every factor below is scored independently and rolled into a single overall rating —
            with the reasoning behind each number, not just the number itself.
          </p>
          <div className="mt-8 inline-flex items-baseline gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-4">
            <span className="font-display text-4xl font-semibold text-[var(--color-accum)]">87</span>
            <span className="font-mono text-xs text-[var(--color-muted)]">/ 100 overall</span>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-3">
          {FACTORS.map((f) => (
            <div key={f.label}>
              <div className="mb-1.5 flex items-baseline justify-between font-mono text-xs">
                <span className="text-[var(--color-muted)]">{f.label}</span>
                <span style={{ color: scoreColor(f.score) }}>{f.score}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                <div
                  className="risk-bar-fill h-full rounded-full"
                  data-score={f.score}
                  style={{ width: 0, background: scoreColor(f.score) }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
