import FavoriteButton from '../common/FavoriteButton'
import { formatPrice, truncate } from '../../utils/helpers'
import { ShoppingCart, Share2 } from 'lucide-react'

export default function GunCard({ gun, onSelect, onEdit, onDelete, onAddToCart }) {
  const rawImage = gun.image_url || gun.image || '/guns/pistol.svg'
  const imgSrc = rawImage.includes(' |;| ') 
    ? rawImage.split(' |;| ')[0] 
    : (rawImage.includes(',') && !rawImage.startsWith('data:')) ? rawImage.split(',')[0] : rawImage

  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  const handleShare = async (e) => {
    e.stopPropagation()
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
      alert('Fitur Share tidak didukung di browser ini.')
    }
  }

  return (
    <li className="card">
      <button type="button" className="card-btn" onClick={() => onSelect(gun)}>
        <img
          className="card-img"
          src={imgSrc}
          alt={gun.name}
          width="240"
          height="180"
          loading="lazy"
          onError={(e) => { if (!e.currentTarget.src.endsWith('/guns/pistol.svg')) e.currentTarget.src = '/guns/pistol.svg' }}
        />
        <span className="name display">{gun.name}</span>
        <span className="type">{category}{caliber ? ` · ${caliber}` : ''}</span>
        {gun.description && <span className="card-desc">{truncate(gun.description, 72)}</span>}
        <span className="price">{formatPrice(price)}</span>
      </button>

      <div className="card-actions">
        <FavoriteButton gunId={gun.id || gun.name} />
        <button type="button" className="card-act-btn" onClick={handleShare}><Share2 size={15} /></button>
        {onAddToCart && <button type="button" className="card-act-btn" onClick={(e) => { e.stopPropagation(); onAddToCart(gun) }}><ShoppingCart size={15} /></button>}
        {onEdit && <button type="button" className="card-act-btn" onClick={(e) => { e.stopPropagation(); onEdit(gun) }}>✏️</button>}
        {onDelete && <button type="button" className="card-act-btn card-act-btn--danger" onClick={(e) => { e.stopPropagation(); onDelete(gun) }}>🗑️</button>}
      </div>
    </li>
  )
}
