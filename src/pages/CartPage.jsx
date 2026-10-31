import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { formatPrice } from '../utils/helpers'

export default function CartPage({ cart, onChangeQuantity, onRemove, onBack, onEditProfile, whatsappNumber }) {
  const total = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0)
  const phone = String(whatsappNumber || '').replace(/\D/g, '')
  const orderMessage = [
    'Hi aku mau pesan:',
    ...cart.map((item) => `- ${item.name} x${item.quantity} (${formatPrice((Number(item.price) || 0) * item.quantity)})`),
    `Total: ${formatPrice(total)}`,
  ].join('\n')
  const checkoutUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(orderMessage)}`
    : null

  return (
    <section className="cart-page">
      <button type="button" className="detail-back" onClick={onBack}><ArrowLeft size={18} /> Back to catalog</button>
      <div className="form-title-group">
        <h1 className="display">Shopping cart</h1>
        <p className="lede">Review your items, then send the order through WhatsApp.</p>
      </div>
      {cart.length === 0 ? (
        <div className="state-box"><ShoppingCart size={32} /><p>Your cart is empty.</p></div>
      ) : (
        <>
          <ul className="profile-list cart-list">
            {cart.map((item) => (
              <li key={item.id} className="profile-list-item">
                <div>
                  <strong>{item.name}</strong>
                  <p>{formatPrice(item.price)} each</p>
                </div>
                <div className="cart-item-actions">
                  <button type="button" className="icon-btn" onClick={() => onChangeQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`}>
                    <Minus size={14} />
                  </button>
                  <span>{item.quantity}</span>
                  <button type="button" className="icon-btn" onClick={() => onChangeQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`}>
                    <Plus size={14} />
                  </button>
                  <button type="button" className="icon-btn" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name}`}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="cart-total"><strong>Total</strong><strong>{formatPrice(total)}</strong></div>
          {checkoutUrl ? (
            <a className="btn btn--primary" href={checkoutUrl} target="_blank" rel="noreferrer">
              Checkout via WhatsApp
            </a>
          ) : (
            <div className="cart-phone-missing">
              <p>Set a WhatsApp checkout number in your profile before placing an order.</p>
              <button type="button" className="btn btn--outline" onClick={onEditProfile}>Set WhatsApp number</button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
