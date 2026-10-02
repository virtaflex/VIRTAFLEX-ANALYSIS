import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Check, ChefHat, ClipboardCheck, Home, Loader2, Package, Phone, Bike } from 'lucide-react';
import { site } from '../config/site.ts';
import type { OrderStatus } from '../lib/order.ts';
import { loadOrders } from '../lib/orderService.ts';
import { etaClock, useOrder } from '../lib/useOrder.ts';
import { useDocumentMeta } from '../lib/useDocumentMeta.ts';
import { WhatsAppIcon } from '../components/BrandIcons.tsx';
import { DemoModeNotice } from '../components/Notices.tsx';
import './Order.css';

const progress: Record<OrderStatus, number> = {
  awaiting_payment: -1,
  payment_failed: -1,
  cancelled: -1,
  received: 0,
  preparing: 1,
  ready: 2,
  out_for_delivery: 2,
  completed: 3,
};

export default function TrackOrder() {
  const { orderNumber } = useParams();
  if (!orderNumber) return <RecentOrders />;
  return <Tracker orderNumber={orderNumber} />;
}

function Tracker({ orderNumber }: { orderNumber: string }) {
  useDocumentMeta(`Track ${orderNumber}`);
  const [params] = useSearchParams();
  const token = params.get('t');
  const { order, error } = useOrder(orderNumber, token, 20_000);

  if (!order) {
    return (
      <div className="order page-top container">
        <div className="order-card order-card--center">
          {error ? <h1 className="display-sm">{error}</h1> : <p className="order-loading"><Loader2 className="spin" /> Loading…</p>}
          <Link to="/" className="btn btn-ghost">Back to home</Link>
        </div>
      </div>
    );
  }

  const isDelivery = order.orderType === 'delivery';
  const live = order.mode === 'api';
  const step = progress[order.status];
  const steps = [
    { label: 'Order received', Icon: ClipboardCheck },
    { label: 'Preparing', Icon: ChefHat },
    isDelivery ? { label: 'Out for delivery', Icon: Bike } : { label: 'Ready for pickup', Icon: Package },
    { label: isDelivery ? 'Delivered' : 'Picked up', Icon: Check },
  ];

  const headline =
    order.status === 'cancelled'
      ? 'Order cancelled'
      : step < 0
        ? 'Waiting for payment'
        : [live ? 'We’ve got your order' : 'Order placed', 'Your pizza is in the oven', isDelivery ? 'On its way to you' : 'Ready for pickup', 'Enjoy your pizza!'][step];

  return (
    <div className="order page-top">
      <div className="container order-wrap order-wrap--single">
        <div className="order-card">
          <p className="eyebrow">Order {order.orderNumber}</p>
          <h1 className="display order-title">{headline}</h1>
          <p className="lead">
            Estimated {isDelivery ? 'delivery' : 'pickup'}: <strong className="text-gold">{etaClock(order)}</strong>
          </p>
          {order.mode === 'demo' && <DemoModeNotice />}

          {step >= 0 && (
            <ol className="tracker">
              {steps.map(({ label, Icon }, i) => (
                <li key={label} className={`tracker-step${i < step ? ' is-done' : ''}${i === step ? ' is-current' : ''}`}>
                  <span className="tracker-dot">
                    <Icon size={20} />
                  </span>
                  <span className="tracker-label">{label}</span>
                </li>
              ))}
            </ol>
          )}

          {!live && (
            <p className="order-note">
              Live status updates will appear here once online ordering is connected. For any update on your order, contact us directly.
            </p>
          )}
          {live && <p className="order-note">This page refreshes automatically.</p>}

          <div className="order-ctas">
            {site.contact.whatsapp && (
              <a className="btn btn-ghost" href={`https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(`Hi! About my order ${order.orderNumber}`)}`} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon size={18} /> WhatsApp us
              </a>
            )}
            {site.contact.phone && (
              <a className="btn btn-ghost" href={`tel:${site.contact.phone.replace(/\s/g, '')}`}>
                <Phone size={18} /> Call {site.contact.phone}
              </a>
            )}
            <Link to="/" className="btn btn-primary">
              <Home size={18} /> Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentOrders() {
  useDocumentMeta('Track your order');
  const orders = loadOrders();
  return (
    <div className="order page-top">
      <div className="container order-wrap order-wrap--single">
        <div className="order-card">
          <p className="eyebrow">Track order</p>
          <h1 className="display order-title">Your recent orders</h1>
          {orders.length === 0 ? (
            <p className="lead">No orders on this device yet.</p>
          ) : (
            <ul className="recent-orders">
              {orders.map((o) => (
                <li key={o.orderNumber}>
                  <Link to={`/track/${o.orderNumber}?t=${o.trackingToken}`}>
                    <strong>{o.orderNumber}</strong>
                    <span>{new Date(o.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="order-ctas">
            <Link to="/menu" className="btn btn-primary">Order now</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
