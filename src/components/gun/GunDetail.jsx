import { useState, useEffect } from 'react'
import { ArrowLeft, Star, Send, Loader, Share2, ShoppingCart, ThumbsDown, ThumbsUp, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react' // Tambahan ChevronLeft & ChevronRight
import FavoriteButton from '../common/FavoriteButton'
import { useReviews, useCreateReview } from '../../hooks/useReviews'
import { getUserIdentifier } from '../../services/userService'
import reviewService from '../../services/reviewService'
import { formatPrice, averageRating } from '../../utils/helpers'
import { getGunShareUrl } from '../../utils/share'

export default function GunDetail({ gun, onBack, onEdit, onDelete, onAddToCart }) {
  const rawImage = gun.image_url || gun.image || '/guns/pistol.svg'
  const imageList = rawImage.includes(' |;| ') 
    ? rawImage.split(' |;| ') 
    : (rawImage.includes(',') && !rawImage.startsWith('data:')) ? rawImage.split(',') : [rawImage]
  
  const [activeImage, setActiveImage] = useState(imageList[0] || '/guns/pistol.svg')

  useEffect(() => {
    setActiveImage(imageList[0] || '/guns/pistol.svg')
  }, [gun.image_url])

  // --- LOGIKA SLIDER PANAH KIRI & KANAN ---
  const currentIndex = imageList.indexOf(activeImage)
  
  const handlePrevImage = () => {
    const prevIndex = currentIndex === 0 ? imageList.length - 1 : currentIndex - 1
    setActiveImage(imageList[prevIndex])
  }
  
  const handleNextImage = () => {
    const nextIndex = currentIndex === imageList.length - 1 ? 0 : currentIndex + 1
    setActiveImage(imageList[nextIndex])
  }
  // ----------------------------------------

  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(gun.id)
  const { createReview, loading: submitting } = useCreateReview()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')
  const [editingReview, setEditingReview] = useState(null)
  const [shareFeedback, setShareFeedback] = useState('')
  const [reviewVotes, setReviewVotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bore_barrel_review_votes') || '{}') } catch { return {} }
  })

  const avgRating = gun.average_rating || averageRating(reviews)
  const reviewCount = gun.review_count ?? reviews.length

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError(''); setReviewSuccess('')
    if (rating < 1 || rating > 5) return setReviewError('Rating must be between 1 and 5.')

    const data = { user_identifier: getUserIdentifier(), rating, comment: comment.trim() }
    let result
    if (editingReview) {
      try {
        const response = await reviewService.updateReview(editingReview.id, data)
        result = response?.data || response
      } catch (err) { return setReviewError(err.message || 'Could not update review.') }
    } else {
      result = await createReview(gun.id, data)
    }

    if (result) {
      setReviewSuccess(editingReview ? 'Review updated.' : 'Review submitted!')
      setComment(''); setRating(5); setEditingReview(null); refetchReviews()
    } else { setReviewError(editingReview ? 'Could not update review.' : 'Could not submit review.') }
  }

  const handleShare = async () => {
    const url = getGunShareUrl(gun)
    try {
      if (navigator.share) await navigator.share({ title: gun.name, text: `Lihat ${gun.name}`, url })
      else { await navigator.clipboard.writeText(url); setShareFeedback('Link copied.') }
    } catch (err) { if (err.name !== 'AbortError') setShareFeedback('Could not share this link.') }
    setTimeout(() => setShareFeedback(''), 2500)
  }

  const handleReviewVote = (review, vote) => {
    const reviewKey = String(review.id)
    const nextVote = reviewVotes[reviewKey] === vote ? null : vote
    const updatedVotes = { ...reviewVotes }
    if (nextVote) updatedVotes[reviewKey] = nextVote; else delete updatedVotes[reviewKey]
    try { localStorage.setItem('bore_barrel_review_votes', JSON.stringify(updatedVotes)); setReviewVotes(updatedVotes) } 
    catch (err) { setReviewError(`Could not save your vote: ${err.message}`) }
  }

  const handleDeleteReview = async (review) => {
    if (!window.confirm('Delete your review?')) return
    try { await reviewService.deleteReview(review.id); refetchReviews() } 
    catch (err) { setReviewError(err.message || 'Could not delete review.') }
  }

  const startEditingReview = (review) => {
    setEditingReview(review); setRating(Number(review.rating) || 5); setComment(review.comment || ''); setReviewError(''); setReviewSuccess('')
  }

  return (
    <div className="detail">
      <button type="button" className="detail-back" onClick={onBack}><ArrowLeft size={18} /> Back to Catalog</button>

      <div className="detail-hero">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
          
          {/* PEMBUNGKUS GAMBAR UTAMA DAN PANAH */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <img
              className="detail-img"
              src={activeImage}
              alt={gun.name}
              loading="lazy"
              onError={(e) => { if (!e.currentTarget.src.endsWith('/guns/pistol.svg')) e.currentTarget.src = '/guns/pistol.svg' }}
              style={{ width: '100%' }}
            />
            
            {/* Tombol Panah Kiri & Kanan (Hanya muncul jika gambar lebih dari 1) */}
            {imageList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  style={{
                    position: 'absolute', left: '10px', background: 'rgba(0, 0, 0, 0.5)', color: 'white',
                    border: 'none', borderRadius: '50%', width: '36px', height: '36px',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: '0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  style={{
                    position: 'absolute', right: '10px', background: 'rgba(0, 0, 0, 0.5)', color: 'white',
                    border: 'none', borderRadius: '50%', width: '36px', height: '36px',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: '0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* THUMBNAILS (Tetap dipertahankan) */}
          {imageList.length > 1 && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '5px' }}>
              {imageList.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  onClick={() => setActiveImage(img)}
                  style={{ 
                    width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', 
                    cursor: 'pointer', border: activeImage === img ? '2px solid var(--brass)' : '1px solid var(--line)' 
                  }}
                  onError={(e) => e.currentTarget.style.display = 'none'}
                />
              ))}
            </div>
          )}
        </div>

        <div className="detail-info">
          <h1 className="display">{gun.name}</h1>
          <p className="type">{category}{caliber ? ` · ${caliber}` : ''}</p>
          <p className="price detail-price">{formatPrice(price)}</p>
          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </p>
          )}

          <div className="detail-actions">
            <FavoriteButton gunId={gun.id || gun.name} />
            {onAddToCart && <button type="button" className="btn btn--outline" onClick={() => onAddToCart(gun)}><ShoppingCart size={16} /> Add to cart</button>}
            <button type="button" className="btn btn--outline" onClick={handleShare}><Share2 size={16} /> Share</button>
            {shareFeedback && <span className="form-hint">{shareFeedback}</span>}
            {onEdit && <button type="button" className="btn btn--outline" onClick={() => onEdit(gun)}>Edit</button>}
            {onDelete && <button type="button" className="btn btn--danger" onClick={() => onDelete(gun)}>Archive</button>}
          </div>
        </div>
      </div>

      <section className="detail-section">
        <h2>Description</h2>
        <p>{gun.description || 'No description available.'}</p>
      </section>

      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Specifications</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => <li key={ing.id || i}><strong>{ing.name}</strong> — {ing.quantity}</li>)}
          </ul>
        </section>
      )}

      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Assembly / Maintenance Steps</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => <li key={step.id || i}>{step.instruction || step}</li>)}
          </ol>
        </section>
      )}

      <section className="detail-section">
        <h2>Reviews</h2>
        <p className="form-hint">Review votes are saved on this device.</p>
        <form className="review-form" onSubmit={handleSubmitReview}>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" className="star-btn" onClick={() => setRating(n)}>
                <Star size={22} fill={n <= rating ? 'var(--brass)' : 'none'} stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'} />
              </button>
            ))}
          </div>
          <textarea className="review-input" rows="3" placeholder="Write a short review (optional)…" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} />
          <button type="submit" className="btn btn--primary" disabled={submitting || !gun.id}>
            {submitting ? <><Loader size={16} className="spin" /> Submitting…</> : <><Send size={16} /> {editingReview ? 'Save Review' : 'Submit Review'}</>}
          </button>
          {editingReview && <button type="button" className="btn btn--outline" onClick={() => { setEditingReview(null); setComment(''); setRating(5) }}>Cancel edit</button>}
          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
          {!gun.id && <p className="form-hint">Reviews require a server-generated product ID.</p>}
        </form>

        {reviewsLoading ? (
          <p className="detail-loading">Loading reviews…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.map((rev) => (
              <li key={rev.id} className="review-item">
                <div className="review-head">
                  <span className="review-user">{rev.user_identifier || 'Anonymous'}</span>
                  <span className="review-stars-display">
                    {Array.from({ length: 5 }, (_, i) => <Star key={i} size={14} fill={i < rev.rating ? 'var(--brass)' : 'none'} stroke={i < rev.rating ? 'var(--brass)' : 'var(--line)'} />)}
                  </span>
                </div>
                {rev.comment && <p className="review-comment">{rev.comment}</p>}
                <div className="review-actions">
                  {['up', 'down'].map((vote) => {
                    const countKey = vote === 'up' ? 'upvotes' : 'downvotes'
                    const Icon = vote === 'up' ? ThumbsUp : ThumbsDown
                    const selected = reviewVotes[String(rev.id)] === vote
                    return (
                      <button key={vote} type="button" className={`review-vote${selected ? ' review-vote--active' : ''}`} onClick={() => handleReviewVote(rev, vote)}>
                        <Icon size={15} /> {Math.max(0, Number(rev[countKey]) || 0) + (selected ? 1 : 0)}
                      </button>
                    )
                  })}
                  {(rev.user_id === getUserIdentifier() || rev.user_identifier === getUserIdentifier()) && (
                    <>
                      <button type="button" className="review-vote" onClick={() => startEditingReview(rev)}><Pencil size={14} /> Edit</button>
                      <button type="button" className="review-vote" onClick={() => handleDeleteReview(rev)}><Trash2 size={14} /> Delete</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="detail-empty">No reviews yet. Be the first!</p>
        )}
      </section>
    </div>
  )
}
