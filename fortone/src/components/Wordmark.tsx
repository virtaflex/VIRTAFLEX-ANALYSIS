/** Placeholder wordmark (swirl glyph + Fraunces italic). Swap for the official logo SVG when available. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`wordmark ${className}`}>
      <svg viewBox="0 0 40 48" aria-hidden="true" className="wordmark__glyph">
        <path d="M9 22c0-8 5-15 11-17 1 3-1 5 1 6 6 1 10 5 10 11" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M13 17c2-3 6-4 9-2" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity=".6" />
        <path d="M7 24h26L20 46z" fill="var(--gold-400)" />
      </svg>
      <span className="wordmark__text">Fortone</span>
    </span>
  );
}
