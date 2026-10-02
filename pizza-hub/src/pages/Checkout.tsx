import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Banknote, ChevronDown, Clock, CreditCard, Loader2, Lock, MapPin, Store } from 'lucide-react';
import { site } from '../config/site.ts';
import { apiBase, onlinePaymentAvailable, orderMode } from '../config/runtime.ts';
import { useCart } from '../state/cart.tsx';
import { useUI } from '../state/ui.tsx';
import { formatMoney, formatRange } from '../lib/format.ts';
import { validateCustomer, ValidationError, type CustomerDetails, type FieldErrors, type PaymentMethod } from '../lib/order.ts';
import { placeOrder } from '../lib/orderService.ts';
import { useDocumentMeta } from '../lib/useDocumentMeta.ts';
import { CartSummary } from '../components/CartSummary.tsx';
import { CartLineItem } from '../components/CartLineItem.tsx';
import { OrderTypeToggle } from '../components/OrderTypeToggle.tsx';
import { DemoModeNotice, SamplePricesNotice } from '../components/Notices.tsx';
import './Checkout.css';

const CUSTOMER_KEY = 'pizzahub:customer:v1';

function loadCustomer(): CustomerDetails {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || '{}');
    return { name: '', phone: '', street: '', building: '', floor: '', apartment: '', ...saved, notes: '' };
  } catch {
    return { name: '', phone: '' };
  }
}

function clockIn(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function Checkout() {
  useDocumentMeta('Checkout');
  const cart = useCart();
  const { openCustomizer } = useUI();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerDetails>(loadCustomer);
  const [payment, setPayment] = useState<PaymentMethod>(site.payments.cash.enabled ? 'cash' : 'online');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const { orderType, totals } = cart;
  const isDelivery = orderType === 'delivery';
  const belowMin = isDelivery && totals.subtotal < site.ordering.minimumDeliveryOrder;

  // Only offer card payment once the order server confirms Paymob is configured.
  const [onlineReady, setOnlineReady] = useState(false);
  useEffect(() => {
    if (!onlinePaymentAvailable) return;
    fetch(`${apiBase}/health`)
      .then((r) => r.json())
      .then((d) => setOnlineReady(Boolean(d.onlinePayments)))
      .catch(() => setOnlineReady(false));
  }, []);
  const canPayOnline = onlinePaymentAvailable && onlineReady;

  useEffect(() => {
    if (payment === 'online' && !canPayOnline) setPayment('cash');
  }, [payment, canPayOnline]);

  const set = (k: keyof CustomerDetails) => (e: { target: { value: string } }) => {
    const value = e.target.value;
    if (k === 'areaId') cart.setArea(value);
    else setCustomer((c) => ({ ...c, [k]: value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  // The delivery area lives in the cart (it drives the delivery fee). Restore a returning customer's area once.
  const { areaId, setArea } = cart;
  useEffect(() => {
    if (!areaId && customer.areaId && site.delivery.areas.some((a) => a.id === customer.areaId)) setArea(customer.areaId);
  }, []);

  if (cart.priced.length === 0) {
    return (
      <div className="checkout-empty page-top container">
        <h1 className="display">Your cart is empty</h1>
        <p className="lead">Add a pizza or two, then come back here to check out.</p>
        <Link to="/menu" className="btn btn-primary btn-lg">
          Browse the menu
        </Link>
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError('');
    const details: CustomerDetails = { ...customer, areaId: isDelivery ? areaId : undefined };
    const errs = validateCustomer(orderType, details);
    setErrors(errs);
    if (Object.keys(errs).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('.has-error input, .has-error select')?.focus());
      return;
    }
    if (belowMin) return;
    setSubmitting(true);
    try {
      try {
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ ...details, notes: undefined }));
      } catch {
        /* ignore */
      }
      const order = await placeOrder({
        orderType,
        paymentMethod: payment,
        customer: details,
        items: cart.lines.map(({ productId, selection, quantity, note }) => ({ productId, selection, quantity, note })),
      });
      cart.clear();
      if (order.paymentUrl) {
        window.location.assign(order.paymentUrl);
        return;
      }
      navigate(`/order/${order.orderNumber}?t=${order.trackingToken}`, { replace: true });
    } catch (err) {
      if (err instanceof ValidationError && err.fields) setErrors(err.fields);
      setFormError((err as Error).message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const eta = site.ordering.prepTime[orderType];

  return (
    <div className="checkout page-top">
      <div className="container">
        <Link to="/menu" className="link-btn checkout-back">
          <ArrowLeft size={16} /> Back to menu
        </Link>
        <h1 className="display checkout-title">Checkout</h1>
        <DemoModeNotice className="checkout-demo" />

        <form ref={formRef} className="checkout-grid" onSubmit={submit} noValidate>
          <div className="checkout-main">
            <Step n={1} title="How do you want it?">
              <OrderTypeToggle value={orderType} onChange={cart.setOrderType} />
              <p className="checkout-eta">
                <Clock size={16} /> {isDelivery ? 'Delivery' : 'Ready for pickup'} in about {formatRange(eta)}
              </p>
            </Step>

            <Step n={2} title="Your details">
              <div className="form-grid">
                <Field label="Full name" error={errors.name} required>
                  <input className="input" autoComplete="name" value={customer.name} onChange={set('name')} placeholder="Your name" />
                </Field>
                <Field label="Mobile number" error={errors.phone} required>
                  <input className="input" type="tel" inputMode="tel" autoComplete="tel" value={customer.phone} onChange={set('phone')} placeholder="01x xxxx xxxx" />
                </Field>
              </div>
            </Step>

            {isDelivery ? (
              <Step n={3} title="Delivery address">
                <div className="form-grid">
                  <Field label="Area" error={errors.areaId} required wide>
                    <select className="select" value={areaId} onChange={set('areaId')}>
                      <option value="">Select your area…</option>
                      {site.delivery.areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} — delivery {formatMoney(a.fee)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Delivery address" error={errors.street} required wide>
                    <input className="input" autoComplete="street-address" value={customer.street ?? ''} onChange={set('street')} placeholder="Street, district, nearby landmark" />
                  </Field>
                  <div className="form-row3">
                    <Field label="Building" error={errors.building} required>
                      <input className="input" value={customer.building ?? ''} onChange={set('building')} placeholder="No." />
                    </Field>
                    <Field label="Floor" error={errors.floor}>
                      <input className="input" inputMode="numeric" value={customer.floor ?? ''} onChange={set('floor')} placeholder="e.g. 3" />
                    </Field>
                    <Field label="Apartment" error={errors.apartment}>
                      <input className="input" value={customer.apartment ?? ''} onChange={set('apartment')} placeholder="e.g. 12" />
                    </Field>
                  </div>
                  <Field label="Delivery notes" error={errors.notes} wide>
                    <textarea className="textarea" rows={2} maxLength={300} value={customer.notes ?? ''} onChange={set('notes')} placeholder="Gate code, call on arrival, etc." />
                  </Field>
                </div>
              </Step>
            ) : (
              <Step n={3} title="Pickup">
                <div className="pickup-card">
                  <span className="pickup-icon">
                    <Store size={24} />
                  </span>
                  <div>
                    <p className="pickup-name">{site.name}</p>
                    <p className="pickup-addr">
                      <MapPin size={15} /> {site.address.street ? `${site.address.street}, ` : ''}
                      {site.address.display}
                    </p>
                    <p className="pickup-time">
                      <Clock size={15} /> Estimated ready: <strong>{clockIn(eta[0])} – {clockIn(eta[1])}</strong>
                    </p>
                    {site.address.mapsUrl && (
                      <a className="link-btn" href={site.address.mapsUrl} target="_blank" rel="noopener noreferrer">
                        Get directions →
                      </a>
                    )}
                  </div>
                </div>
                <Field label="Order notes" error={errors.notes} wide>
                  <textarea className="textarea" rows={2} maxLength={300} value={customer.notes ?? ''} onChange={set('notes')} placeholder="Anything we should know?" />
                </Field>
              </Step>
            )}

            <Step n={4} title="Payment">
              <div className="pay-options" role="radiogroup" aria-label="Payment method">
                {site.payments.cash.enabled && (
                  <PayOption
                    id="cash"
                    checked={payment === 'cash'}
                    onSelect={setPayment}
                    icon={<Banknote size={22} />}
                    title={isDelivery ? 'Cash on delivery' : 'Pay at pickup'}
                    text={isDelivery ? 'Pay the rider when your pizza arrives.' : 'Pay when you collect your order.'}
                  />
                )}
                {site.payments.online.enabled && (
                  <PayOption
                    id="online"
                    checked={payment === 'online'}
                    onSelect={setPayment}
                    disabled={!canPayOnline}
                    icon={<CreditCard size={22} />}
                    title="Pay online"
                    text={canPayOnline ? 'Card or mobile wallet — secure checkout by Paymob.' : 'Card & wallet payments are coming soon.'}
                  />
                )}
              </div>
            </Step>
          </div>

          <aside className="checkout-side">
            <div className="checkout-card">
              <button type="button" className="checkout-card-toggle" aria-expanded={summaryOpen} onClick={() => setSummaryOpen((o) => !o)}>
                <span>
                  Order summary <span className="muted">· {totals.itemCount} item{totals.itemCount === 1 ? '' : 's'}</span>
                </span>
                <ChevronDown size={18} />
              </button>
              <div className={`checkout-lines${summaryOpen ? ' is-open' : ''}`}>
                <ul className="cart-lines">
                  {cart.priced.map((l) => (
                    <CartLineItem key={l.lineId} line={l} onEdit={(lineId, productId) => openCustomizer(productId, lineId)} />
                  ))}
                </ul>
              </div>
              <CartSummary totals={totals} orderType={orderType} areaChosen={Boolean(areaId)} />
              <SamplePricesNotice />
              {belowMin && <p className="field-error">Minimum delivery order is {formatMoney(site.ordering.minimumDeliveryOrder)}.</p>}
              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <button type="submit" className="btn btn-primary btn-lg btn-block place-btn" disabled={submitting || belowMin}>
                {submitting ? (
                  <>
                    <Loader2 size={18} className="spin" /> Placing order…
                  </>
                ) : payment === 'online' ? (
                  <>
                    <Lock size={16} /> Pay {formatMoney(totals.total)}
                  </>
                ) : (
                  <>Place order · {formatMoney(totals.total)}</>
                )}
              </button>
              <p className="checkout-fine">
                {orderMode === 'whatsapp'
                  ? 'Your order will open in WhatsApp so you can send it to us.'
                  : 'By placing your order you agree to be contacted about it by phone or WhatsApp.'}
              </p>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="checkout-step" aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`} className="step-title">
        <span className="step-n">{n}</span> {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, error, required, wide, children }: { label: string; error?: string; required?: boolean; wide?: boolean; children: ReactNode }) {
  return (
    <label className={`field${error ? ' has-error' : ''}${wide ? ' field--wide' : ''}`}>
      <span className="label">
        {label} {required && <span className="req">*</span>}
      </span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

function PayOption({
  id,
  checked,
  onSelect,
  disabled,
  icon,
  title,
  text,
}: {
  id: PaymentMethod;
  checked: boolean;
  onSelect: (m: PaymentMethod) => void;
  disabled?: boolean;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <label className={`pay-option${checked ? ' is-on' : ''}${disabled ? ' is-disabled' : ''}`}>
      <input type="radio" name="payment" value={id} checked={checked} disabled={disabled} onChange={() => onSelect(id)} />
      <span className="pay-icon">{icon}</span>
      <span className="pay-text">
        <span className="pay-title">
          {title} {disabled && <span className="cta-pending">Soon</span>}
        </span>
        <span className="pay-desc">{text}</span>
      </span>
      <span className="cz-dot" aria-hidden="true" />
    </label>
  );
}
