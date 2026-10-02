/** Simple line versions of social brand marks (lucide doesn't ship brand icons). */
interface P {
  size?: number;
  className?: string;
}
const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export const InstagramIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.6" cy="6.4" r="0.6" fill="currentColor" />
  </svg>
);

export const FacebookIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M17 2.5h-2.8A4.7 4.7 0 0 0 9.5 7.2V10H7v3.7h2.5v7.8h3.8v-7.8h2.8l.7-3.7h-3.5V7.6c0-.6.5-1.1 1.1-1.1H17z" />
  </svg>
);

export const TikTokIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M14.5 2.5v12.2a3.9 3.9 0 1 1-3.9-3.9" />
    <path d="M14.5 2.5c.4 2.9 2.4 4.8 5.5 5.1" />
  </svg>
);

export const WhatsAppIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3.5 20.5l1.3-4.3A8.7 8.7 0 1 1 8 19.4z" />
    <path d="M9 8.6c0 3.3 3 6.4 6.4 6.4l1-1.6-2.1-1-.9.9c-1-.4-2-1.4-2.4-2.4l.9-.9-1-2.1z" fill="currentColor" strokeWidth="1" />
  </svg>
);
