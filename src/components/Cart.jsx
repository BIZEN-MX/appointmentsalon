import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import { X, Trash2, Plus, Minus, ShoppingBag, CreditCard, ArrowLeft, Building2, Store } from 'lucide-react';

// Generate a fake OXXO reference number
const generateOxxoRef = () => {
  const prefix = '8696';
  const nums = Array.from({ length: 14 }, () => Math.floor(Math.random() * 10)).join('');
  return prefix + nums;
};

// Generate a fake CLABE for SPEI
const generateClabe = () => {
  return Array.from({ length: 18 }, () => Math.floor(Math.random() * 10)).join('');
};

// Format current date + 3 days for expiry
const expiryDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
};

// Cart Steps
const STEP_CART     = 'cart';
const STEP_SHIPPING = 'shipping';
const STEP_PAYMENT  = 'payment';
const STEP_CARD     = 'card';
const STEP_PROCESS  = 'process';
const STEP_SUCCESS  = 'success';
const STEP_OXXO     = 'oxxo';
const STEP_SPEI     = 'spei';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart, isCartOpen, setIsCartOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(STEP_CART);
  const [shippingMethod, setShippingMethod] = useState('pickup');
  const [paymentMethod, setPaymentMethod] = useState(null); // 'card' | 'oxxo' | 'spei'

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [cardError, setCardError] = useState('');

  // Generated references
  const [oxxoRef] = useState(generateOxxoRef());
  const [clabe] = useState(generateClabe());

  const shippingCost = shippingMethod === 'delivery' ? 119 : 0;
  const grandTotal = cartTotal + shippingCost;

  // ── Checkout logic ────────────────────────────────────────────────
  const saveOrder = async (method, status = 'pendiente_pago') => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setIsCartOpen(false); navigate('/auth'); return false; }

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: session.user.id,
          total_amount: grandTotal,
          shipping_method: shippingMethod,
          shipping_cost: shippingCost,
          status,
          payment_method: method,
        }])
        .select().single();

      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;
      return true;
    } catch (err) {
      alert('Error procesando pedido: ' + err.message);
      return false;
    }
  };

  const handleCardPay = async (e) => {
    e.preventDefault();
    setCardError('');
    // Basic simulation validations
    if (cardNumber.replace(/\s/g, '').length < 16) { setCardError('Número de tarjeta inválido.'); return; }
    if (cardExpiry.length < 5) { setCardError('Fecha de expiración inválida.'); return; }
    if (cardCVV.length < 3) { setCardError('CVV inválido.'); return; }

    setStep(STEP_PROCESS);
    // Simulate processing delay
    await new Promise(r => setTimeout(r, 2500));
    const ok = await saveOrder('card', 'pagado');
    if (ok) { clearCart(); setStep(STEP_SUCCESS); }
    else setStep(STEP_CARD);
  };

  const handleNextStep = async () => {
    // Check auth before leaving the cart step or proceeding to payment
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setIsCartOpen(false);
      navigate('/auth', { state: { from: location.pathname, message: 'Inicia sesión para completar tu compra' } });
      return;
    }

    if (step === STEP_CART) {
      setStep(STEP_SHIPPING);
    } else if (step === STEP_SHIPPING) {
      setStep(STEP_PAYMENT);
    }
  };

  const handleOxxoPay = async () => {
    const ok = await saveOrder('oxxo', 'pendiente_pago');
    if (ok) { clearCart(); setStep(STEP_OXXO); }
  };

  const handleSpeiPay = async () => {
    const ok = await saveOrder('spei', 'pendiente_pago');
    if (ok) { clearCart(); setStep(STEP_SPEI); }
  };

  const handleClose = () => {
    setIsCartOpen(false);
    // Reset for next time after a short delay
    setTimeout(() => {
      setStep(STEP_CART);
      setPaymentMethod(null);
      setCardNumber(''); setCardName(''); setCardExpiry(''); setCardCVV(''); setCardError('');
    }, 400);
  };

  // ── Format card number with spaces ───────────────────────────────
  const formatCard = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  if (!isCartOpen) return null;

  // ── Title per step ────────────────────────────────────────────────
  const titles = {
    [STEP_CART]: 'Tu Carrito',
    [STEP_SHIPPING]: 'Método de Entrega',
    [STEP_PAYMENT]: 'Método de Pago',
    [STEP_CARD]: 'Pago con Tarjeta',
    [STEP_PROCESS]: 'Procesando...',
    [STEP_SUCCESS]: '¡Pago Exitoso!',
    [STEP_OXXO]: 'Pago en OXXO',
    [STEP_SPEI]: 'Transferencia SPEI',
  };

  const canGoBack = [STEP_SHIPPING, STEP_PAYMENT, STEP_CARD].includes(step);
  const backStep  = { [STEP_SHIPPING]: STEP_CART, [STEP_PAYMENT]: STEP_SHIPPING, [STEP_CARD]: STEP_PAYMENT };

  return (
    <>
      <div className="cart-overlay fade-in" onClick={handleClose} />
      <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>

        {/* ── Header ── */}
        <div className="cart-header">
          <div className="cart-title">
            {canGoBack && (
              <button className="close-cart" style={{ marginRight: '0.5rem' }} onClick={() => setStep(backStep[step])}>
                <ArrowLeft size={20} />
              </button>
            )}
            <ShoppingBag size={20} />
            <h3>{titles[step]}</h3>
          </div>
          <button className="close-cart" onClick={handleClose}><X size={24} /></button>
        </div>

        {/* ── Body ── */}
        <div className="cart-body">

          {/* STEP: Cart */}
          {step === STEP_CART && (
            cart.length === 0 ? (
              <div className="empty-cart fade-in">
                <ShoppingBag size={64} className="empty-icon" />
                <h3>El carrito está vacío</h3>
                <p>¿No has visto nuestros productos premium?</p>
                <button className="btn-secondary" onClick={() => { handleClose(); navigate('/marketplace'); }}>
                  Ir al Marketplace
                </button>
              </div>
            ) : (
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.id} className="cart-item-card fade-in">
                    <div className="cart-item-img"><img src={item.image_url} alt={item.name} /></div>
                    <div className="cart-item-info">
                      <div className="cart-item-top">
                        <h4>{item.name}</h4>
                        <span className="cart-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      <p className="cart-item-cat">{item.category}</p>
                      <div className="cart-item-actions">
                        <div className="qty-controls">
                          <button onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                        </div>
                        <button className="remove-item" onClick={() => removeFromCart(item.id)}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* STEP: Shipping */}
          {step === STEP_SHIPPING && (
            <div className="mp-step-content fade-in">
              <div className="shipping-options">
                <button className={`shipping-option-btn ${shippingMethod === 'pickup' ? 'active' : ''}`} onClick={() => setShippingMethod('pickup')}>
                  <Store size={22} className="shipping-icon" />
                  <div className="shipping-option-info">
                    <span className="option-name">Recoger en tienda</span>
                    <span className="option-desc">Calle Premium 123, Polanco · Gratis</span>
                  </div>
                  <span className="option-price">Gratis</span>
                </button>
                <button className={`shipping-option-btn ${shippingMethod === 'delivery' ? 'active' : ''}`} onClick={() => setShippingMethod('delivery')}>
                  <Building2 size={22} className="shipping-icon" />
                  <div className="shipping-option-info">
                    <span className="option-name">Envío a domicilio</span>
                    <span className="option-desc">Entrega en 2-4 días hábiles</span>
                  </div>
                  <span className="option-price">$119</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP: Payment method */}
          {step === STEP_PAYMENT && (
            <div className="mp-step-content fade-in">
              <div className="mp-banner">
                <img src="/mercadopago.png" alt="Mercado Pago" className="mp-logo" />
                <span>Pago 100% seguro</span>
              </div>
              <div className="shipping-options">
                <button className={`shipping-option-btn ${paymentMethod === 'card' ? 'active' : ''}`} onClick={() => { setPaymentMethod('card'); setStep(STEP_CARD); }}>
                  <img src="/visamastercard.png" alt="Visa/Mastercard" className="pm-img" />
                  <div className="shipping-option-info">
                    <span className="option-name">Tarjeta de crédito / débito</span>
                    <span className="option-desc">Visa, Mastercard, American Express</span>
                  </div>
                </button>
                <button className={`shipping-option-btn ${paymentMethod === 'oxxo' ? 'active' : ''}`} onClick={() => { setPaymentMethod('oxxo'); handleOxxoPay(); }}>
                  <img src="/oxxo.png" alt="OXXO" className="pm-img" />
                  <div className="shipping-option-info">
                    <span className="option-name">Efectivo en OXXO</span>
                    <span className="option-desc">Genera tu ficha y paga en cualquier OXXO</span>
                  </div>
                </button>
                <button className={`shipping-option-btn ${paymentMethod === 'spei' ? 'active' : ''}`} onClick={() => { setPaymentMethod('spei'); handleSpeiPay(); }}>
                  <img src="/spei.png" alt="SPEI" className="pm-img" />
                  <div className="shipping-option-info">
                    <span className="option-name">Transferencia SPEI</span>
                    <span className="option-desc">Paga desde tu banco en minutos</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP: Card form */}
          {step === STEP_CARD && (
            <div className="mp-step-content fade-in">
              <div className="mp-banner">
                <img src="/mercadopago.png" alt="Mercado Pago" className="mp-logo" />
                <span>Pago 100% seguro</span>
              </div>
              <form className="card-form" onSubmit={handleCardPay}>
                <div className="card-form-group">
                  <label>Número de tarjeta</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={e => setCardNumber(formatCard(e.target.value))}
                    maxLength={19}
                    required
                  />
                </div>
                <div className="card-form-group">
                  <label>Nombre en la tarjeta</label>
                  <input
                    type="text"
                    placeholder="JUAN PÉREZ RAMÍREZ"
                    value={cardName}
                    onChange={e => setCardName(e.target.value.toUpperCase())}
                    required
                  />
                </div>
                <div className="card-form-row">
                  <div className="card-form-group">
                    <label>Vencimiento</label>
                    <input
                      type="text"
                      placeholder="MM/AA"
                      value={cardExpiry}
                      onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                      required
                    />
                  </div>
                  <div className="card-form-group">
                    <label>CVV</label>
                    <input
                      type="password"
                      placeholder="•••"
                      value={cardCVV}
                      onChange={e => setCardCVV(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      required
                    />
                  </div>
                </div>
                {cardError && <p className="card-error">{cardError}</p>}
                <button type="submit" className="checkout-btn btn-primary" style={{ marginTop: '1rem' }}>
                  PAGAR ${grandTotal.toFixed(2)} MXN <CreditCard size={18} />
                </button>
                <p className="mp-secure-note">🔒 Tus datos están encriptados y protegidos por Mercado Pago.</p>
              </form>
            </div>
          )}

          {/* STEP: Processing */}
          {step === STEP_PROCESS && (
            <div className="empty-cart fade-in">
              <div className="mp-processing-ring" />
              <h3>Procesando tu pago</h3>
              <p>Estamos verificando tu tarjeta de forma segura…</p>
            </div>
          )}

          {/* STEP: Success (card) */}
          {step === STEP_SUCCESS && (
            <div className="cart-success fade-in">
              <div className="mp-success-circle">✅</div>
              <h3>¡Pago Aprobado!</h3>
              <p>Tu pedido está confirmado y en preparación.</p>
              <p className="order-shipping-summary">
                {shippingMethod === 'delivery' ? '🚚 Lo recibirás en 2-4 días hábiles.' : '🏪 Pasa pronto por tu pedido a nuestra sucursal.'}
              </p>
              <button className="btn-secondary" style={{ marginTop: '1rem' }} onClick={handleClose}>Cerrar</button>
            </div>
          )}

          {/* STEP: OXXO reference */}
          {step === STEP_OXXO && (
            <div className="mp-reference-screen fade-in">
              <div className="mp-ref-header oxxo">
                <span className="pm-emoji" style={{ fontSize: '2.5rem' }}>🏪</span>
                <h3>Ficha de Pago OXXO</h3>
                <p>Muestra este código en cualquier OXXO del país</p>
              </div>
              <div className="mp-ref-amount">
                <span>Total a pagar</span>
                <strong>${grandTotal.toFixed(2)} MXN</strong>
              </div>
              <div className="mp-barcode-wrap">
                <div className="mp-barcode-lines">
                  {Array.from({ length: 48 }, (_, i) => (
                    <div key={i} className="barcode-bar" style={{ height: i % 5 === 0 ? '60px' : '48px', width: i % 3 === 0 ? '3px' : '2px' }} />
                  ))}
                </div>
                <p className="mp-barcode-num">{oxxoRef}</p>
              </div>
              <p className="mp-ref-expiry">⏰ Válido hasta: <strong>{expiryDate()}</strong></p>
              <p className="mp-ref-note">Tu pedido se confirmará automáticamente al recibir el pago.</p>
              <button className="btn-secondary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={handleClose}>Listo</button>
            </div>
          )}

          {/* STEP: SPEI */}
          {step === STEP_SPEI && (
            <div className="mp-reference-screen fade-in">
              <div className="mp-ref-header spei">
                <span className="pm-emoji" style={{ fontSize: '2.5rem' }}>🏦</span>
                <h3>Transferencia SPEI</h3>
                <p>Realiza la transferencia desde tu app bancaria</p>
              </div>
              <div className="mp-ref-amount">
                <span>Total a transferir</span>
                <strong>${grandTotal.toFixed(2)} MXN</strong>
              </div>
              <div className="mp-spei-details">
                <div className="spei-row">
                  <span>Banco</span>
                  <strong>STP · Sistema de Transferencias</strong>
                </div>
                <div className="spei-row">
                  <span>CLABE interbancaria</span>
                  <strong className="clabe-num">{clabe}</strong>
                </div>
                <div className="spei-row">
                  <span>Beneficiario</span>
                  <strong>Appointment Salon &amp; Spa</strong>
                </div>
                <div className="spei-row">
                  <span>Referencia</span>
                  <strong>{oxxoRef.slice(0, 8)}</strong>
                </div>
              </div>
              <p className="mp-ref-expiry">⏰ Válido hasta: <strong>{expiryDate()}</strong></p>
              <p className="mp-ref-note">Tu pedido se confirmará automáticamente dentro de las próximas 2 horas al recibir el pago.</p>
              <button className="btn-secondary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={handleClose}>Listo</button>
            </div>
          )}

        </div>

        {/* ── Footer (summary + CTA) ── */}
        {[STEP_CART, STEP_SHIPPING].includes(step) && cart.length > 0 && (
          <div className="cart-footer">
            <div className="summary-details">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Envío</span>
                <span>{shippingCost === 0 ? 'Gratis' : `$${shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span className="grand-total-price">${grandTotal.toFixed(2)} MXN</span>
              </div>
            </div>
            <button
              className="checkout-btn btn-primary"
              onClick={handleNextStep}
            >
              {step === STEP_CART ? 'CONTINUAR' : 'ELEGIR MÉTODO DE PAGO'} <CreditCard size={18} />
            </button>
          </div>
        )}

      </div>
    </>
  );
};

export default Cart;
