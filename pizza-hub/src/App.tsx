import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { CartProvider } from './state/cart.tsx';
import { UIProvider } from './state/ui.tsx';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { MobileOrderBar } from './components/MobileOrderBar.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CustomizeModal } from './components/CustomizeModal.tsx';
import { Toast } from './components/Toast.tsx';
import Home from './pages/Home.tsx';
import Menu from './pages/Menu.tsx';

const About = lazy(() => import('./pages/About.tsx'));
const Contact = lazy(() => import('./pages/Contact.tsx'));
const Checkout = lazy(() => import('./pages/Checkout.tsx'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation.tsx'));
const TrackOrder = lazy(() => import('./pages/TrackOrder.tsx'));
const NotFound = lazy(() => import('./pages/NotFound.tsx'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <UIProvider>
          <ScrollToTop />
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <Header />
          <main id="main">
            <Suspense fallback={<div className="page-top" style={{ minHeight: '70vh' }} />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order/:orderNumber" element={<OrderConfirmation />} />
                <Route path="/track" element={<TrackOrder />} />
                <Route path="/track/:orderNumber" element={<TrackOrder />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <MobileOrderBar />
          <CartDrawer />
          <CustomizeModal />
          <Toast />
        </UIProvider>
      </CartProvider>
    </BrowserRouter>
  );
}
