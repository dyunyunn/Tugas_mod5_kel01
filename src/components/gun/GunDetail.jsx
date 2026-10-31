import { useState } from 'react'
import { ArrowLeft, Star, Send, Loader, Share2, ShoppingCart, ThumbsDown, ThumbsUp, Pencil, Trash2 } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import { useReviews, useCreateReview } from '../../hooks/useReviews'
import { getUserIdentifier } from '../../services/userService'
import reviewService from '../../services/reviewService'
import { formatPrice, averageRating } from '../../utils/helpers'
import { getGunShareUrl } from '../../utils/share'

/**
 * Full-screen product detail view.
 *
 * @param {Object}   props
 * @param {Object}   props.gun       — product data
 * @param {Function} props.onBack    — return to catalog
 * @param {Function} [props.onEdit]  — navigate to edit page
 * @param {Function} [props.onDelete]— trigger delete flow
 */
export default function GunDetail({ gun, onBack, onEdit, onDelete, onAddToCart }) {
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  // Reviews
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(gun.id)
  const { createReview, loading: submitting } = useCreateReview()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')
  const [editingReview, setEditingReview] = useState(null)
  const [shareFeedback, setShareFeedback] = useState('')
  const [reviewVotes, setReviewVotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bore_barrel_review_votes') || '{}')
    } catch {
      return {}
    }
  })

  const avgRating = gun.average_rating || averageRating(reviews)
  const reviewCount = gun.review_count ?? reviews.length

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')

    if (rating < 1 || rating > 5) {
      setReviewError('Rating must be between 1 and 5.')
      return
    }

    const data = {
      user_identifier: getUserIdentifier(),
      rating,
      comment: comment.trim(),
    }
    let result
    if (editingReview) {
      try {
        const response = await reviewService.updateReview(editingReview.id, data)
        result = response?.data || response
      } catch (err) {
        setReviewError(err.message || 'Could not update review.')
        return
      }
    } else {
      result = await createReview(gun.id, data)
    }

    if (result) {
      setReviewSuccess(editingReview ? 'Review updated.' : 'Review submitted!')
      setComment('')
      setRating(5)
      setEditingReview(null)
      refetchReviews()
    } else {
      setReviewError(editingReview ? 'Could not update review.' : 'Could not submit review. The server may be unavailable.')
    }
  }

  const handleShare = async () => {
    const url = getGunShareUrl(gun)
    try {
      if (navigator.share) {
        await navigator.share({ title: gun.name, text: `Lihat ${gun.name}`, url })
      } else {
        await navigator.clipboard.writeText(url)
        setShareFeedback('Link copied.')
      }
    } catch (err) {
      if (err.name !== 'AbortError') setShareFeedback('Could not share this link.')
    }
    setTimeout(() => setShareFeedback(''), 2500)
  }

  const handleReviewVote = (review, vote) => {
    const reviewKey = String(review.id)
    const nextVote = reviewVotes[reviewKey] === vote ? null : vote
    const updatedVotes = { ...reviewVotes }
    if (nextVote) updatedVotes[reviewKey] = nextVote
    else delete updatedVotes[reviewKey]

    try {
      localStorage.setItem('bore_barrel_review_votes', JSON.stringify(updatedVotes))
      setReviewVotes(updatedVotes)
    } catch (err) {
      setReviewError(`Could not save your vote: ${err.message}`)
    }
  }

  const handleDeleteReview = async (review) => {
    if (!window.confirm('Delete your review?')) return
    try {
      await reviewService.deleteReview(review.id)
      refetchReviews()
    } catch (err) {
      setReviewError(err.message || 'Could not delete review.')
    }
  }

  const startEditingReview = (review) => {
    setEditingReview(review)
    setRating(Number(review.rating) || 5)
    setComment(review.comment || '')
    setReviewError('')
    setReviewSuccess('')
  }

  return (
    <div className="detail">
      {/* Back button */}
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to Catalog
      </button>

      {/* Hero */}
      <div className="detail-hero">
        <img
          className="detail-img"
          src={imgSrc}
          alt={gun.name}
          loading="lazy"
          onError={(event) => {
            if (!event.currentTarget.src.endsWith('/guns/pistol.svg')) {
              event.currentTarget.src = '/guns/pistol.svg'
            }
          }}
        />
        <div className="detail-info">
          <h1 className="display">{gun.name}</h1>
          <p className="type">
            {category}
            {caliber ? ` · ${caliber}` : ''}
          </p>
          <p className="price detail-price">{formatPrice(price)}</p>

          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </p>
          )}

          <div className="detail-actions">
            <FavoriteButton gunId={gun.id || gun.name} />
            {onAddToCart && (
              <button type="button" className="btn btn--outline" onClick={() => onAddToCart(gun)}>
                <ShoppingCart size={16} /> Add to cart
              </button>
            )}
            <button type="button" className="btn btn--outline" onClick={handleShare}>
              <Share2 size={16} /> Share
            </button>
            {shareFeedback && <span className="form-hint">{shareFeedback}</span>}
            {onEdit && (
              <button type="button" className="btn btn--outline" onClick={() => onEdit(gun)}>
                Edit
              </button>
            )}
            {onDelete && (
              <button type="button" className="btn btn--danger" onClick={() => onDelete(gun)}>
                Archive
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="detail-section">
        <h2>Description</h2>
        <p>{gun.description || 'No description available.'}</p>
      </section>

      {/* Specifications (from ingredients / steps if present) */}
      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Specifications</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => (
              <li key={ing.id || i}>
                <strong>{ing.name}</strong> — {ing.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Assembly / Maintenance Steps</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => (
              <li key={step.id || i}>
                {step.instruction || step}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Reviews Section */}
      <section className="detail-section">
        <h2>Reviews</h2>
        <p className="form-hint">Review votes are saved on this device.</p>

        {/* Submit review */}
        <form className="review-form" onSubmit={handleSubmitReview}>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  size={22}
                  fill={n <= rating ? 'var(--brass)' : 'none'}
                  stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>

          <textarea
            className="review-input"
            rows="3"
            placeholder="Write a short review (optional)…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />

          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting || !gun.id}
          >
            {submitting ? (
              <><Loader size={16} className="spin" /> Submitting…</>
            ) : (
              <><Send size={16} /> {editingReview ? 'Save Review' : 'Submit Review'}</>
            )}
          </button>
          {editingReview && (
            <button
              type="button"
              className="btn btn--outline"
              onClick={() => {
                setEditingReview(null)
                setComment('')
                setRating(5)
              }}
            >
              Cancel edit
            </button>
          )}

          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
          {!gun.id && (
            <p className="form-hint">
              Reviews require a server-generated product ID. This product is local-only.
            </p>
          )}
        </form>

        {/* Existing reviews */}
        {reviewsLoading ? (
          <p className="detail-loading">Loading reviews…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.map((rev) => (
              <li key={rev.id} className="review-item">
                <div className="review-head">
                  <span className="review-user">{rev.user_identifier || 'Anonymous'}</span>
                  <span className="review-stars-display">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < rev.rating ? 'var(--brass)' : 'none'}
                        stroke={i < rev.rating ? 'var(--brass)' : 'var(--line)'}
                      />
                    ))}
                  </span>
                </div>
                {rev.comment && <p className="review-comment">{rev.comment}</p>}
                <div className="review-actions">
                  {['up', 'down'].map((vote) => {
                    const countKey = vote === 'up' ? 'upvotes' : 'downvotes'
                    const Icon = vote === 'up' ? ThumbsUp : ThumbsDown
                    const selected = reviewVotes[String(rev.id)] === vote
                    return (
                      <button
                        key={vote}
                        type="button"
                        className={`review-vote${selected ? ' review-vote--active' : ''}`}
                        onClick={() => handleReviewVote(rev, vote)}
                        aria-pressed={selected}
                      >
                        <Icon size={15} /> {Math.max(0, Number(rev[countKey]) || 0) + (selected ? 1 : 0)}
                      </button>
                    )
                  })}
                  {(rev.user_id === getUserIdentifier() || rev.user_identifier === getUserIdentifier()) && (
                    <>
                      <button type="button" className="review-vote" onClick={() => startEditingReview(rev)} aria-label="Edit your review">
                        <Pencil size={14} /> Edit
                      </button>
                      <button type="button" className="review-vote" onClick={() => handleDeleteReview(rev)} aria-label="Delete your review">
                        <Trash2 size={14} /> Delete
                      </button>
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
