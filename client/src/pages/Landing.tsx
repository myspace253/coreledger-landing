import { lazy, Suspense, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import SmoothScroll from '../components/SmoothScroll'
import ReportTerminal from '../components/ReportTerminal'
import Modules from '../components/Modules'
import RiskPanel from '../components/RiskPanel'
import StackStrip from '../components/StackStrip'
import Footer from '../components/Footer'

// three.js is a heavy dependency and NodeSphere is purely decorative (a
// spinning hero visual below the fold of interactivity) — code-split it out
// of the initial bundle rather than paying for it on every page load.
const NodeSphere = lazy(() => import('../components/NodeSphere'))

gsap.registerPlugin(ScrollTrigger)

function useRevealOnScroll() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          }
        )
      })
    })
    return () => ctx.revert()
  }, [])
}

function Nav() {
  const navigate = useNavigate()
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--color-line)]/60 bg-[var(--color-base)]/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8">
        <span className="font-display text-sm font-semibold tracking-wide text-[var(--color-ink)]">
          CORELEDGER
        </span>
        <nav className="hidden gap-8 font-mono text-xs text-[var(--color-muted)] sm:flex">
          <a href="#modules" className="transition-colors hover:text-[var(--color-ink)]">Modules</a>
          <a href="#risk" className="transition-colors hover:text-[var(--color-ink)]">Risk Engine</a>
        </nav>
        <button
          onClick={() => navigate('/app')}
          className="rounded-md border border-[var(--color-line)] px-4 py-1.5 font-mono text-xs text-[var(--color-ink)] transition-colors hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
        >
          Launch app
        </button>
      </div>
    </header>
  )
}

function Hero() {
  const navigate = useNavigate()
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-24 pt-40 sm:px-8 sm:pt-48">
      <div className="pointer-events-none absolute right-[-10%] top-0 h-[560px] w-[560px] opacity-70 sm:right-0">
        <Suspense fallback={null}>
          <NodeSphere />
        </Suspense>
      </div>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accum)]"
      >
        AI research platform for crypto assets
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="max-w-2xl font-display text-4xl font-medium leading-[1.08] text-[var(--color-ink)] sm:text-6xl"
      >
        Every open tab, one
        <span className="text-glow text-[var(--color-signal)]"> intelligence report.</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mt-6 max-w-md text-base leading-relaxed text-[var(--color-muted)]"
      >
        Drop in a token address. In under 30 seconds, get the holder map, smart-money flow,
        narrative positioning, and risk score that used to take a research desk an afternoon.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.35 }}
        className="relative mt-14 max-w-xl"
      >
        <ReportTerminal preview />
        <button
          onClick={() => navigate('/app')}
          className="mt-4 font-mono text-xs text-[var(--color-accum)] transition-colors hover:text-[var(--color-signal)]"
        >
          Run a real report in the full app →
        </button>
      </motion.div>
    </section>
  )
}

export default function Landing() {
  useRevealOnScroll()

  return (
    <SmoothScroll>
      <div className="relative min-h-screen bg-[var(--color-base)]">
        <Nav />
        <Hero />
        <StackStrip />
        <Modules />
        <RiskPanel />
        <Footer />
      </div>
    </SmoothScroll>
  )
}
