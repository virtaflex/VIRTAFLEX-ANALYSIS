import { Fragment, type ElementType } from 'react';

interface SplitProps {
  as?: ElementType;
  lines: string[];
  className?: string;
  /** play with the page intro instead of on scroll */
  intro?: boolean;
  /** indexes of words (across all lines) to set in italic accent */
  accent?: number[];
}

/** Heading split into masked words so they can rise into place. Screen readers get the plain text. */
export function Split({ as: Tag = 'h2', lines, className = '', intro, accent = [] }: SplitProps) {
  let n = 0;
  return (
    <Tag className={className} data-split="" {...(intro ? { 'data-intro': '' } : {})} aria-label={lines.join(' ')}>
      {lines.map((line, i) => (
        <span className="line" key={i} aria-hidden="true">
          {line.split(' ').map((w, j) => {
            const idx = n++;
            // the space sits between the masked words so it never collapses
            return (
              <Fragment key={j}>
                {j > 0 && ' '}
                <span className={`word${accent.includes(idx) ? ' accent' : ''}`}>
                  <span>{w}</span>
                </span>
              </Fragment>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}

/** Paragraph whose words light up as it scrolls through the viewport. */
export function ScrubText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <p className={className} data-scrub-words="">
      {text.split(' ').map((w, i) => (
        <span className="sw" key={i}>
          {w}{' '}
        </span>
      ))}
    </p>
  );
}
