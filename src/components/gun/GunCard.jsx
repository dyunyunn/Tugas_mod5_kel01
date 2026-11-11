import FavoriteButton from '../common/FavoriteButton'
import { formatPrice, truncate } from '../../utils/helpers'
import { ShoppingCart, Share2 } from 'lucide-react' // Tambahan import Share2

/**
 * Product card used in the catalog grid.
 *
 * @param {Object}   props
 * @param {Object}   props.gun       — product data
 * @param {Function} props.onSelect  — called with the gun when clicked
 * @param {Function} [props.onEdit]  — called when Edit is clicked (admin)
 * @param {Function} [props.onDelete]— called when Delete is clicked (admin)
 */
export default function GunCard({ gun, onSelect, onEdit, onDelete, onAddToCart }) {
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  // 1. Fungsi Web Share API
  const handleShare = async (e) => {
    e.stopPropagation() // Mencegah klik kartu utama secara tidak sengaja
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bore & Barrel - ${gun.name}`,
          text: `Cek ${gun.name} (${category}) seharga ${formatPrice(price)} ini!`,
          url: window.location.href
        })
      } catch (error) {
        console.log('Batal membagikan:', error)
      }
    } else {
      alert('Fitur Share tidak didukung di browser ini. Coba buka via browser HP!')
    }
  }

  return (
    <li className="card">
      <button
        type="button"
        className="card-btn"
        onClick={() => onSelect(gun)}
        aria-label={`View ${gun.name}`}
      >
        <img
          className="card-img"
          src={imgSrc}
          alt={gun.name}
          width="240"
          height="180"
          loading="lazy"
          onError={(event) => {
            if (!event.currentTarget.src.endsWith('/guns/pistol.svg')) {
              event.currentTarget.src = '/guns/pistol.svg'
            }
          }}
        />

        <span className="name display">{gun.name}</span>

        <span className="type">
          {category}
          {caliber ? ` · ${caliber}` : ''}
        </span>

        {gun.description && (
          <span className="card-desc">{truncate(gun.description, 72)}</span>
        )}

        <span className="price">{formatPrice(price)}</span>
      </button>

      {/* Floating actions row */}
      <div className="card-actions">
        <FavoriteButton gunId={gun.id || gun.name} />

        {/* 2. Tombol Share Baru */}
        <button
          type="button"
          className="card-act-btn"
          onClick={handleShare}
          aria-label={`Share ${gun.name}`}
          title="Share to..."
        >
          <Share2 size={15} />
        </button>

        {onAddToCart && (
          <button
            type="button"
            className="card-act-btn"
            onClick={(e) => { e.stopPropagation(); onAddToCart(gun) }}
            aria-label={`Add ${gun.name} to cart`}
            title="Add to cart"
          >
            <ShoppingCart size={15} />
          </button>
        )}

        {onEdit && (
          <button
            type="button"
            className="card-act-btn"
            onClick={(e) => { e.stopPropagation(); onEdit(gun) }}
            aria-label={`Edit ${gun.name}`}
            title="Edit"
          >
            ✏️
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            className="card-act-btn card-act-btn--danger"
            onClick={(e) => { e.stopPropagation(); onDelete(gun) }}
            aria-label={`Archive ${gun.name}`}
            title="Archive"
          >
            🗑️
          </button>
        )}
      </div>
    </li>
  )
}
