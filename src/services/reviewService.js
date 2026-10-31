import { apiClient, IS_SUPABASE } from '../config/api'
import { getCachedQuery, invalidateQueries } from '../utils/queryCache'

// ---------------------------------------------------------------------------
// ReviewService — product reviews & ratings.
// Supports both Supabase (public.reviews) and university API (/api/v1/recipes/:id/reviews).
// ---------------------------------------------------------------------------

class ReviewService {
  /**
   * Fetch all reviews for a given product.
   */
  async getReviews(gunId) {
    return getCachedQuery(`reviews:${gunId}`, async () => {
      if (IS_SUPABASE) {
        const data = await apiClient.get(
          `/rest/v1/reviews?product_id=eq.${gunId}&select=*&order=created_at.desc`,
        )
        const list = Array.isArray(data)
          ? data.map((r) => ({
              id: r.id,
              product_id: r.product_id,
              user_id: r.user_id,
              user_identifier: r.user_id ? `Operator ${String(r.user_id).substring(0, 8)}` : 'Anonymous',
              rating: r.rating,
              comment: r.comment || '',
              created_at: r.created_at,
            }))
          : []

        return { success: true, data: list }
      }

      return apiClient.get(`/api/v1/recipes/${gunId}/reviews`)
    })
  }

  /**
   * Submit a new review.
   * @param {string|number} gunId
   * @param {Object} reviewData  { user_identifier, rating, comment }
   */
  async createReview(gunId, reviewData) {
    if (IS_SUPABASE) {
      const payload = {
        product_id: Number(gunId),
        user_id: reviewData.user_id || reviewData.user_identifier,
        rating: Number(reviewData.rating),
        comment: reviewData.comment || '',
      }

      const res = await apiClient.post('/rest/v1/reviews', payload, {
        headers: { Prefer: 'return=representation' },
      })
      const created = Array.isArray(res) ? res[0] : res
      invalidateQueries(`reviews:${gunId}`)
      return {
        success: true,
        data: {
          ...created,
          user_id: created?.user_id || payload.user_id,
          user_identifier: reviewData.user_identifier,
        },
      }
    }

    const result = await apiClient.post(`/api/v1/recipes/${gunId}/reviews`, reviewData)
    invalidateQueries(`reviews:${gunId}`)
    return result
  }

  /**
   * Edit an existing review.
   */
  async updateReview(reviewId, reviewData) {
    if (IS_SUPABASE) {
      const res = await apiClient.patch(
        `/rest/v1/reviews?id=eq.${reviewId}`,
        {
          rating: Number(reviewData.rating),
          comment: reviewData.comment,
        },
        { headers: { Prefer: 'return=representation' } },
      )
      invalidateQueries('reviews:')
      return { success: true, data: Array.isArray(res) ? res[0] : res }
    }

    const result = await apiClient.put(`/api/v1/reviews/${reviewId}`, reviewData)
    invalidateQueries('reviews:')
    return result
  }

  /**
   * Delete a review.
   */
  async deleteReview(reviewId) {
    if (IS_SUPABASE) {
      await apiClient.delete(`/rest/v1/reviews?id=eq.${reviewId}`)
      invalidateQueries('reviews:')
      return { success: true }
    }

    const result = await apiClient.delete(`/api/v1/reviews/${reviewId}`)
    invalidateQueries('reviews:')
    return result
  }
}

export default new ReviewService()
