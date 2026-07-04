const STACK = ['']

export default function StackStrip() {
  return (
    <div className="reveal border-y border-[var(--color-line)] bg-[var(--color-surface)]/60 py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 sm:justify-between sm:px-8">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
          
        </span>
        {STACK.map((s) => (
          <span key={s} className="font-mono text-xs text-[var(--color-muted)]">
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}
