import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BrowserRouter, HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { Cursor, Preloader } from './components/Chrome.tsx';
import { gsap, reducedMotion, ScrollTrigger, scrollToTop, setIntroDelay, startSmoothScroll } from './lib/motion.ts';
import Home from './pages/Home.tsx';
import Flavours from './pages/Flavours.tsx';
import Story from './pages/Story.tsx';
import Visit from './pages/Visit.tsx';
import Contact from './pages/Contact.tsx';
import NotFound from './pages/NotFound.tsx';

/**
 * Keeps the old page on screen while a two-layer curtain sweeps up,
 * swaps routes underneath it, then lifts the curtain off the new page.
 */
function TransitionRoutes() {
  const location = useLocation();
  const [shown, setShown] = useState(location);
  const curtain = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  useEffect(() => {
    if (location.pathname === shown.pathname) {
      if (location.search !== shown.search || location.hash !== shown.hash) setShown(location);
      return;
    }
    const el = curtain.current;
    if (!el || reducedMotion() || busy.current) {
      setIntroDelay(0.1);
      setShown(location);
      return;
    }
    busy.current = true;
    setIntroDelay(0.55);
    const layers = el.querySelectorAll('.curtain__layer');
    gsap
      .timeline({ onComplete: () => void (busy.current = false) })
      .set(el, { autoAlpha: 1 })
      .fromTo(layers, { yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: 'expo.inOut', stagger: 0.08 })
      .add(() => setShown(location))
      .to(layers, { yPercent: -100, duration: 0.8, ease: 'expo.inOut', stagger: -0.08 }, '+=0.12')
      .set(el, { autoAlpha: 0 });
  }, [location, shown]);

  useLayoutEffect(() => {
    scrollToTop();
    ScrollTrigger.refresh();
  }, [shown.pathname]);

  return (
    <>
      <Routes location={shown}>
        <Route path="/" element={<Home />} />
        <Route path="/flavours" element={<Flavours />} />
        <Route path="/story" element={<Story />} />
        <Route path="/visit" element={<Visit />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <div className="curtain" ref={curtain} aria-hidden="true">
        <div className="curtain__layer curtain__layer--blush" />
        <div className="curtain__layer curtain__layer--dark">
          <span className="curtain__word">Fortone</span>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const Router = import.meta.env.VITE_ROUTER === 'hash' ? HashRouter : BrowserRouter;
  useEffect(() => startSmoothScroll(), []);
  return (
    <Router>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Preloader />
      <Cursor />
      <Header />
      <main id="main">
        <TransitionRoutes />
      </main>
      <Footer />
      <div className="grain" aria-hidden="true" />
    </Router>
  );
}
