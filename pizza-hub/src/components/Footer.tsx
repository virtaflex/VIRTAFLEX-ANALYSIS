import { Link } from 'react-router-dom';
import { MapPin, Phone } from 'lucide-react';
import { Logo } from './Logo.tsx';
import { site } from '../config/site.ts';
import { navItems } from './Header.tsx';
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from './BrandIcons.tsx';
import { formatTime } from '../lib/format.ts';
import './Footer.css';

export function Footer() {
  const { contact, links, address, hours } = site;
  const contactItems = [
    contact.phone && { href: `tel:${contact.phone.replace(/\s/g, '')}`, label: contact.phone, Icon: Phone },
    contact.whatsapp && { href: `https://wa.me/${contact.whatsapp}`, label: 'WhatsApp', Icon: WhatsAppIcon },
    links.instagram && { href: links.instagram, label: 'Instagram', Icon: InstagramIcon },
    links.facebook && { href: links.facebook, label: 'Facebook', Icon: FacebookIcon },
    links.tiktok && { href: links.tiktok, label: 'TikTok', Icon: TikTokIcon },
  ].filter(Boolean) as { href: string; label: string; Icon: typeof Phone }[];

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Logo height={84} />
            <p className="footer-tagline">{site.tagline.toUpperCase()}</p>
          </div>

          <nav aria-label="Footer" className="footer-col">
            <h2 className="footer-title">Explore</h2>
            {navItems.map((n) => (
              <Link key={n.to} to={n.to}>
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="footer-col">
            <h2 className="footer-title">Ordering</h2>
            <Link to="/menu">Order Online</Link>
            {links.talabat && (
              <a href={links.talabat} target="_blank" rel="noopener noreferrer">
                Talabat
              </a>
            )}
            {hours.length > 0 && (
              <ul className="footer-hours">
                {hours.map((h) => (
                  <li key={h.days}>
                    <span>{h.days}</span> {formatTime(h.opens)} – {formatTime(h.closes)}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="footer-col">
            <h2 className="footer-title">Find us</h2>
            {address.mapsUrl ? (
              <a href={address.mapsUrl} target="_blank" rel="noopener noreferrer" className="footer-loc">
                <MapPin size={18} /> {address.street ? `${address.street}, ` : ''}
                {address.display}
              </a>
            ) : (
              <p className="footer-loc">
                <MapPin size={18} /> {address.display}
              </p>
            )}
            {contactItems.length > 0 && (
              <div className="footer-contact">
                {contactItems.map(({ href, label, Icon }) => (
                  <a key={label} href={href} target={href.startsWith('tel:') ? undefined : '_blank'} rel="noopener noreferrer">
                    <Icon size={18} /> {label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p className="footer-loc-sm">{address.display}</p>
        </div>
      </div>
    </footer>
  );
}
