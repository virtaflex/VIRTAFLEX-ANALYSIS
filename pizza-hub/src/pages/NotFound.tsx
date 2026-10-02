import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../lib/useDocumentMeta.ts';

export default function NotFound() {
  useDocumentMeta('Page not found');
  return (
    <section className="page-hero" style={{ minHeight: '70vh' }}>
      <div className="container">
        <p className="eyebrow">404</p>
        <h1>
          This slice <span className="text-gold">is gone.</span>
        </h1>
        <p className="lead">The page you’re looking for doesn’t exist. The pizza does, though.</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
          <Link to="/menu" className="btn btn-primary btn-lg">
            See the menu
          </Link>
          <Link to="/" className="btn btn-ghost btn-lg">
            Home
          </Link>
        </div>
      </div>
    </section>
  );
}
