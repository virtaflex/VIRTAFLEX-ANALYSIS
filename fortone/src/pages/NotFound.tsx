import { useRef } from 'react';
import { Split } from '../components/Text.tsx';
import { Button } from '../components/Button.tsx';
import { flavorImg, useDocumentMeta } from '../lib/util.ts';
import { introTimeline, useScrollFx } from '../lib/motion.ts';

export default function NotFound() {
  useDocumentMeta('Page not found');
  const ref = useRef<HTMLDivElement>(null);
  useScrollFx(ref, () => introTimeline(ref.current!));
  return (
    <div ref={ref}>
      <section className="phero notfound">
        <div className="container phero__inner">
          <img className="notfound__img" src={flavorImg('strawberry', 480)} alt="" width={480} height={600} data-intro-fade />
          <Split as="h1" className="display" lines={['This page', 'melted.']} accent={[2]} intro />
          <div data-intro-fade>
            <Button to="/">Back to the swirl</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
