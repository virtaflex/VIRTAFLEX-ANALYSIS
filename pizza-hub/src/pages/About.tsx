import { About as AboutSection } from '../sections/About.tsx';
import { FreshDough } from '../sections/FreshDough.tsx';
import { Signature } from '../sections/Signature.tsx';
import { Social } from '../sections/Social.tsx';
import { useDocumentMeta } from '../lib/useDocumentMeta.ts';

export default function About() {
  useDocumentMeta('About', 'Pizza Hub is an Egyptian-style pizza takeaway in Obour City — fresh dough, quality ingredients, generous toppings and fast preparation.');
  return (
    <>
      <header className="page-hero">
        <div className="container">
          <p className="eyebrow">About us</p>
          <h1>
            Good pizza. <span className="text-gold">Fast.</span>
          </h1>
          <p className="lead">Fresh dough, real ingredients and a kitchen built for speed — right here in Obour.</p>
        </div>
      </header>
      <AboutSection />
      <FreshDough />
      <Signature />
      <Social />
    </>
  );
}
