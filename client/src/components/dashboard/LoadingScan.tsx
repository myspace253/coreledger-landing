import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STATUS_MESSAGES = [
  'Connecting to on-chain data…',
  'Mapping holder distribution…',
  'Cross-referencing smart money…',
  'Reading developer activity…',
  'Scoring risk factors…',
  'Synthesizing report…',
]

export default function LoadingScan() {
  const [statusIndex, setStatusIndex] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_MESSAGES.length)
    }, 1100)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20">
      <div className="relative h-24 w-24">
        {/* outer pulse rings */}
        {[0, 0.5, 1].map((delay) => (
          <motion.span
            key={delay}
            className="absolute inset-0 rounded-full border border-[var(--color-accum)]/40"
            animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay, ease: 'easeOut' }}
          />
        ))}
        {/* radar sweep */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg, transparent 260deg, rgba(255,180,84,0.55) 300deg, rgba(255,180,84,0.9) 360deg)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
        />
        {/* inner disc */}
        <div className="absolute inset-[6px] rounded-full border border-[var(--color-line)] bg-[var(--color-base)]" />
        {/* center dot */}
        <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-signal)]" />
      </div>

      <div className="h-5 font-mono text-xs text-[var(--color-muted)]">
        <AnimatePresence mode="wait">
          <motion.span
            key={statusIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
          >
            {STATUS_MESSAGES[statusIndex]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  )
}
