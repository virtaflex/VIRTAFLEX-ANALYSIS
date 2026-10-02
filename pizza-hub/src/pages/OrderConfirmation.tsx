import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Bike, Clock, CreditCard, Home, Loader2, MapPin, Store } from 'lucide-react';
import { site } from '../config/site.ts';
import { formatMoney } from '../lib/format.ts';
import { formatAddress } from '../lib/order.ts';
import { retryPayment } from '../lib/orderService.ts';
import { etaClock, useOrder } from '../lib/useOrder.ts';
import { useDocumentMeta } from '../lib/useDocumentMeta.ts';
import { DemoModeNotice } from '../components/Notices.tsx';
import { WhatsAppIcon } from '../components/BrandIcons.tsx';
import './Order.css';

export default function OrderConfirmation() {
  useDocumentMeta('Order');
  const { orderNumber = '' } = useParams();
  const [params] = useSearchParams();
  const token = params.get('t');
  const { order, error } = useOrder(orderNumber, token, 30_000);
  const [sentOnWhatsApp, setSentOnWhatsApp] = useState(false);
  const [payError, setPayError] = useState('');
  const [paying, setPaying] = useState(false);

  if (!order) {
    return (
      <div className="order page-top container">
        <div className="order-card order-card--center">
          {error ? (
            <>
              <h1 className="display-sm">We couldn’t find this order</h1>
              <p className="lead">{error}. If you placed an order, the restaurant has it — feel free to contact us.</p>
            </>
          ) : (
            <p className="order-loading">
              <Loader2 className="spin" /> Loading your order…
            </p>
          )}
          <Link to="/" className="btn btn-ghost">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const isDelivery = order.orderType === 'delivery';
  const awaitingPayment = order.status === 'awaiting_payment';
  const paymentFailed = order.status === 'payment_failed';
  const needsWhatsApp = order.mode === 'whatsapp' && !sentOnWhatsApp;

  const heading = awaitingPayment
    ? 'Confirming your payment…'
    : paymentFailed
      ? 'Payment not completed'
      : needsWhatsApp
        ? 'One last step'
        : order.status === 'cancelled'
          ? 'Order cancelled'
          : 'Order confirmed 🍕';

  const pay = async () => {
    if (!token) return;
    setPaying(true);
    setPayError('');
    try {
      window.location.assign(await retryPayment(order.orderNumber, token));
    } catch (e) {
      setPayError((e as Error).message);
      setPaying(false);
    }
  };

  const trackHref = `/track/${order.orderNumber}${token ? `?t=${token}` : ''}`;

  return (
    <div className="order page-top">
      <div className="container order-wrap">
        <div className="order-card">
          <div className={`order-badge${paymentFailed ? ' is-bad' : ''}`} aria-hidden="true">
            {awaitingPayment ? <Loader2 className="spin" size={34} /> : paymentFailed ? <AlertTriangle size={34} /> : <span>🍕</span>}
          </div>
          <p className="eyebrow">Order {order.orderNumber}</p>
          <h1 className="display order-title">{heading}</h1>

          {order.mode === 'demo' && <DemoModeNotice />}

          {needsWhatsApp && order.whatsappUrl && (
            <div className="order-callout">
              <p>Tap below to send your order to {site.name} on WhatsApp. We’ll confirm it right away.</p>
              <a className="btn btn-primary btn-lg btn-block" href={order.whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => setSentOnWhatsApp(true)}>
                <WhatsAppIcon size={20} /> Send order on WhatsApp
              </a>
            </div>
          )}
          {order.mode === 'whatsapp' && sentOnWhatsApp && <p className="lead">Thanks! We’ll confirm your order on WhatsApp shortly.</p>}

          {awaitingPayment && <p className="lead">We’re waiting for the payment confirmation from Paymob. This usually takes a few seconds.</p>}
          {paymentFailed && (
            <div className="order-callout">
              <p>Your card payment didn’t go through, so the order isn’t confirmed yet. You can try again{site.contact.phone ? ` or call us on ${site.contact.phone}` : ''}.</p>
              <button type="button" className="btn btn-primary btn-lg btn-block" onClick={pay} disabled={paying}>
                {paying ? <Loader2 className="spin" size={18} /> : <CreditCard size={18} />} Try payment again
              </button>
              {payError && <p className="field-error">{payError}</p>}
            </div>
          )}

          <dl className="order-facts">
            <div>
              <dt>
                <Clock size={16} /> {isDelivery ? 'Estimated delivery' : 'Estimated pickup'}
              </dt>
              <dd>{etaClock(order)}</dd>
            </div>
            <div>
              <dt>{isDelivery ? <Bike size={16} /> : <Store size={16} />} Method</dt>
              <dd>{isDelivery ? 'Delivery' : 'Pickup'}</dd>
            </div>
            <div className="order-facts-wide">
              <dt>
                <MapPin size={16} /> {isDelivery ? 'Deliver to' : 'Pick up at'}
              </dt>
              <dd>{isDelivery ? formatAddress(order.customer) : `${site.name}, ${site.address.street ? `${site.address.street}, ` : ''}${site.address.display}`}</dd>
            </div>
            <div>
              <dt>
                <CreditCard size={16} /> Payment
              </dt>
              <dd>
                {order.paymentMethod === 'cash' ? (isDelivery ? 'Cash on delivery' : 'Pay at pickup') : order.paymentStatus === 'paid' ? 'Paid online' : 'Online'}
              </dd>
            </div>
          </dl>

          <div className="order-ctas">
            {!awaitingPayment && !paymentFailed && (
              <Link to={trackHref} className="btn btn-primary btn-lg">
                Track order <ArrowRight size={18} className="arrow" />
              </Link>
            )}
            <Link to="/" className="btn btn-ghost btn-lg">
              <Home size={18} /> Back to home
            </Link>
          </div>
        </div>

        <aside className="order-card order-summary">
          <h2 className="order-summary-title">Order summary</h2>
          <ul className="order-lines">
            {order.lines.map((l, i) => (
              <li key={i}>
                <div className="order-line-top">
                  <span>
                    <strong>{l.quantity}×</strong> {l.name}
                    {l.size && <span className="muted"> · {l.size}</span>}
                  </span>
                  <span>{formatMoney(l.lineTotal)}</span>
                </div>
                {l.details.length > 0 && <p className="order-line-details">{l.details.join(' · ')}</p>}
                {l.note && <p className="order-line-details">“{l.note}”</p>}
              </li>
            ))}
          </ul>
          <dl className="summary">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney(order.totals.subtotal)}</dd>
            </div>
            <div>
              <dt>Delivery fee</dt>
              <dd>{isDelivery ? (order.totals.deliveryFee ? formatMoney(order.totals.deliveryFee) : 'Free') : 'Pickup'}</dd>
            </div>
            <div className="summary-total">
              <dt>Total</dt>
              <dd>{formatMoney(order.totals.total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
