import { useRef, useState, type FormEvent } from 'react';
import { Split } from '../components/Text.tsx';
import { Button } from '../components/Button.tsx';
import { site, whatsappLink } from '../config/site.ts';
import { flavorImg, useDocumentMeta } from '../lib/util.ts';
import { introTimeline, useScrollFx } from '../lib/motion.ts';

const topics = ['Just saying hi', 'Events & catering', 'Corporate gifting', 'Partnerships', 'Feedback'];

export default function Contact() {
  useDocumentMeta('Contact', 'Get in touch with Fortone Ice Cream — events, catering, corporate gifting, partnerships or just to say hi.');
  const ref = useRef<HTMLDivElement>(null);
  useScrollFx(ref, () => introTimeline(ref.current!));
  const [topic, setTopic] = useState(topics[0]);
  const [sent, setSent] = useState(false);
  const channel = site.contact.whatsapp ? 'WhatsApp' : site.contact.email ? 'email' : '';

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const text = `Hi Fortone! (${topic})\n\n${d.get('message')}\n\n— ${d.get('name')}${d.get('phone') ? `, ${d.get('phone')}` : ''}`;
    const url = whatsappLink(text) || (site.contact.email && `mailto:${site.contact.email}?subject=${encodeURIComponent(`Website: ${topic}`)}&body=${encodeURIComponent(text)}`);
    if (!url) return;
    window.open(url, '_blank', 'noopener');
    setSent(true);
  };

  return (
    <div ref={ref}>
      <section className="phero phero--contact">
        <div className="container phero__inner">
          <p className="eyebrow eyebrow--light" data-intro-fade>
            Contact
          </p>
          <Split as="h1" className="display" lines={['Let’s make', 'something sweet.']} accent={[3]} intro />
        </div>
      </section>

      <section className="section contact">
        <div className="container contact__grid">
          <aside className="contact__aside">
            <img src={flavorImg('caramel', 900)} alt="" width={900} height={1125} data-parallax="0.15" loading="lazy" />
            <div className="contact__direct" data-reveal>
              {site.contact.phone && (
                <a href={`tel:${site.contact.phone}`}>
                  <small>Call</small>
                  {site.contact.phone}
                </a>
              )}
              {site.contact.email && (
                <a href={`mailto:${site.contact.email}`}>
                  <small>Email</small>
                  {site.contact.email}
                </a>
              )}
              <a href={site.locations[0].mapsUrl} target="_blank" rel="noreferrer">
                <small>Visit</small>
                {site.locations[0].name} ↗
              </a>
            </div>
          </aside>

          <form className="form" onSubmit={submit} data-reveal>
            <fieldset className="form__topics">
              <legend>What’s it about?</legend>
              <div className="chips chips--select">
                {topics.map((t) => (
                  <label key={t} className={topic === t ? 'is-active' : ''} data-cursor="hide">
                    <input type="radio" name="topic" value={t} checked={topic === t} onChange={() => setTopic(t)} />
                    {t}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="form__row">
              <label className="field">
                <input name="name" required autoComplete="name" placeholder=" " />
                <span>Your name</span>
              </label>
              <label className="field">
                <input name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder=" " />
                <span>Phone (optional)</span>
              </label>
            </div>
            <label className="field">
              <textarea name="message" required rows={5} placeholder=" " />
              <span>Tell us everything — dates, guests, flavours…</span>
            </label>
            <div className="form__foot">
              <Button type="submit" disabled={!channel}>
                {channel ? `Send via ${channel}` : 'Send message'}
              </Button>
              <p className="form__note" aria-live="polite">
                {sent ? 'Your message is ready — just hit send in the window that opened.' : channel ? `Opens ${channel} with your message filled in.` : 'Online messages open soon — visit us in store meanwhile.'}
              </p>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
