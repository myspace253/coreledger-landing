export default function Footer() {
  function goToTerminal(prefill?: boolean) {
    const el = document.getElementById('terminal')
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const input = el?.querySelector('input')
    if (input && prefill) {
      const footerInput = document.getElementById('footer-query') as HTMLInputElement | null
      if (footerInput?.value) {
        input.value = footerInput.value
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }
    input?.focus()
  }

  return (
    <footer className="mx-auto max-w-6xl px-6 py-28 sm:px-8">
      <div className="reveal rounded-2xl border border-[var(--color-line)] bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-base)] p-10 text-center sm:p-16">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-signal)]">
          Coreledger
        </p>
        <h2 className="mx-auto max-w-xl font-display text-3xl font-medium text-[var(--color-ink)] sm:text-4xl">
          Paste an address. Read the report before your coffee cools.
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            goToTerminal(true)
          }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <input
            id="footer-query"
            type="text"
            placeholder="Token address or ticker"
            className="w-full max-w-xs rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3 font-mono text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-signal)]"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-[var(--color-signal)] px-6 py-3 font-display text-sm font-semibold text-[var(--color-base)] transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-signal)] sm:w-auto"
          >
            Generate report
          </button>
        </form>
      </div>
      <p className="mt-10 text-center font-mono text-xs text-[var(--color-muted)]">
        Coreledger is a research aid, not financial advice. Verify on-chain before acting.
      </p>
    </footer>
  )
}
