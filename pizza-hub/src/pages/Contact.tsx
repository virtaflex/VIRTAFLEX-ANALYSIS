import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Navigation, Phone } from 'lucide-react';
import { site } from '../config/site.ts';
import { formatTime } from '../lib/format.ts';
import { useDocumentMeta } from '../lib/useDocumentMeta.ts';
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from '../components/BrandIcons.tsx';
import { Reveal } from '../components/Reveal.tsx';
import './Contact.css';

export default function Contact() {
  useDocumentMeta('Contact', 'Find Pizza Hub in Obour City, Egypt. Order online for takeaway or delivery.');
  const { contact, address, hours, links } = site;
  const channels = [
    contact.phone && { href: `tel:${contact.phone.replace(/\s/g, '')}`, label: 'Call us', value: contact.phone, Icon: Phone },
    contact.whatsapp && { href: `https://wa.me/${contact.whatsapp}`, label: 'WhatsApp', value: 'Chat with us', Icon: WhatsAppIcon },
    links.instagram && { href: links.instagram, label: 'Instagram', value: 'Follow us', Icon: InstagramIcon },
    links.facebook && { href: links.facebook, label: 'Facebook', value: 'Follow us', Icon: FacebookIcon },
    links.tiktok && { href: links.tiktok, label: 'TikTok', value: 'Watch us', Icon: TikTokIcon },
  ].filter(Boolean) as { href: string; label: string; value: string; Icon: typeof Phone }[];

  return (
    <>
      <header className="page-hero">
        <div className="container">
          <p className="eyebrow">Contact</p>
          <h1>
            Come hungry. <span className="text-gold">Leave happy.</span>
          </h1>
          <p className="lead">Takeaway and delivery in Obour City. The fastest way to get your pizza is to order online.</p>
        </div>
      </header>

      <section className="section contact">
        <div className="container contact-grid">
          <Reveal className="contact-card contact-card--loc">
            <span className="contact-icon">
              <MapPin size={24} />
            </span>
            <h2>Find us</h2>
            <p className="contact-big">
              {address.street && (
                <>
                  {address.street}
                  <br />
                </>
              )}
              {address.display}
            </p>
            {address.mapsUrl && (
              <a href={address.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                <Navigation size={16} /> Get directions
              </a>
            )}
            {address.mapEmbedUrl && (
              <iframe className="contact-map" src={address.mapEmbedUrl} title={`Map showing ${site.name}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            )}
          </Reveal>

          <Reveal className="contact-card" delay={80}>
            <span className="contact-icon">
              <Phone size={24} />
            </span>
            <h2>Get in touch</h2>
            {channels.length ? (
              <ul className="contact-channels">
                {channels.map(({ href, label, value, Icon }) => (
                  <li key={label}>
                    <a href={href} target={href.startsWith('tel:') ? undefined : '_blank'} rel="noopener noreferrer">
                      <Icon size={20} />
                      <span>
                        <strong>{label}</strong>
                        <span>{value}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="contact-muted">Phone and WhatsApp details are coming soon. In the meantime, order online and we’ll take it from there.</p>
            )}
          </Reveal>

          <Reveal className="contact-card" delay={160}>
            <span className="contact-icon">
              <Clock size={24} />
            </span>
            <h2>Opening hours</h2>
            {hours.length ? (
              <ul className="contact-hours">
                {hours.map((h) => (
                  <li key={h.days}>
                    <span>{h.days}</span>
                    <strong>
                      {formatTime(h.opens)} – {formatTime(h.closes)}
                    </strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="contact-muted">Opening hours will be announced soon.</p>
            )}
            <Link to="/menu" className="btn btn-primary">
              Order online <ArrowRight size={16} className="arrow" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
