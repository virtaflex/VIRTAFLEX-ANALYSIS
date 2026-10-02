import { Hero } from '../sections/Hero.tsx';
import { Benefits } from '../sections/Benefits.tsx';
import { MenuPreview } from '../sections/MenuPreview.tsx';
import { Promotions } from '../sections/Promotions.tsx';
import { Signature } from '../sections/Signature.tsx';
import { Talabat } from '../sections/Talabat.tsx';
import { About } from '../sections/About.tsx';
import { FreshDough } from '../sections/FreshDough.tsx';
import { Social } from '../sections/Social.tsx';
import { useDocumentMeta } from '../lib/useDocumentMeta.ts';

export default function Home() {
  useDocumentMeta();
  return (
    <>
      <Hero />
      <Benefits />
      <MenuPreview />
      <Promotions />
      <Signature />
      <Talabat />
      <About />
      <FreshDough />
      <Social />
    </>
  );
}
