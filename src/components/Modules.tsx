import { motion } from 'framer-motion'

const MODULES = [
  {
    n: '01',
    title: 'Holder Intelligence',
    body: 'Maps supply across exchanges, treasury, VCs, and whales — then flags whether the distribution is healthy or concentrated.',
  },
  {
    n: '02',
    title: 'Smart Money Tracking',
    body: 'Identifies funds, market makers, and early adopters. Shows who is buying, how much, since when, and their average entry.',
  },
  {
    n: '03',
    title: 'Narrative Engine',
    body: 'Classifies the project by sector — AI, RWA, DePIN, L2 — and benchmarks it against comparable projects in the same narrative.',
  },
  {
    n: '04',
    title: 'Developer Intelligence',
    body: 'Reads commit velocity, release cadence, and contributor activity to tell you if development is real or just cosmetic.',
  },
  {
    n: '05',
    title: 'Social Intelligence',
    body: 'Aggregates X, Discord, Telegram, GitHub, and news to surface sentiment shifts and emerging security concerns.',
  },
  {
    n: '06',
    title: 'Contract Intelligence',
    body: 'Flags mintable, pausable, upgradeable, and honeypot patterns in plain language before you ever sign a transaction.',
  },
  {
    n: '07',
    title: 'AI Risk Engine',
    body: 'Scores contract, liquidity, holder distribution, and community across seven factors into one weighted risk score.',
  },
  {
    n: '08',
    title: 'Portfolio Intelligence',
    body: 'Connect a wallet and see sector concentration, narrative exposure, and diversification gaps in one read.',
  },
] as const

export default function Modules() {
  return (
    <section id="modules" className="mx-auto max-w-6xl px-6 py-28 sm:px-8">
      <div className="reveal mb-16 max-w-2xl">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accum)]">
          Report modules
        </p>
        <h2 className="font-display text-3xl font-medium text-[var(--color-ink)] sm:text-4xl">
          Every tab you'd open manually,
          <br /> reasoned through in one pass.
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.map((m, i) => (
          <motion.div
            key={m.n}
            className="reveal group relative bg-[var(--color-surface)] p-6"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}
          >
            <span className="font-mono text-xs text-[var(--color-muted)]">{m.n}</span>
            <h3 className="mt-3 font-display text-base font-medium text-[var(--color-ink)]">
              {m.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{m.body}</p>
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--color-signal)]/0 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:from-[var(--color-signal)]/[0.04]" />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
