import type { ReactNode } from 'react';

interface Props {
  href: string | undefined;
  className?: string;
  children: ReactNode;
  /** Shown instead when the link isn't configured yet */
  pendingLabel?: string;
  ariaLabel?: string;
}

/** An outbound link that renders as a disabled "coming soon" button until its URL is configured. */
export function ExternalCta({ href, className = '', children, pendingLabel = 'Coming soon', ariaLabel }: Props) {
  if (!href) {
    return (
      <span className={className} aria-disabled="true" title={pendingLabel}>
        {children}
        <span className="cta-pending">{pendingLabel}</span>
      </span>
    );
  }
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel}>
      {children}
    </a>
  );
}
