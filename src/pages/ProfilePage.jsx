import { lazy, Suspense, useMemo, useState } from 'react'
import { Archive, Check, Copy, FileText, Heart, Pencil, Play, Shield, Trash2 } from 'lucide-react'
import userService from '../services/userService'
import archiveService from '../services/archiveService'
import { getAllDrafts, deleteDraft } from '../utils/draftStorage'
import { useFavorites } from '../hooks/useFavorites'
import { useGuns } from '../hooks/useGuns'
import GUNS_LOCAL from '../data/guns'

const About = lazy(() => import('./About'))
const Contact = lazy(() => import('./Contact'))

const PROFILE_SECTIONS = ['Overview', 'About', 'Contact', 'Drafts', 'Archive']

export default function ProfilePage({ onReplaySplash, onNavigate }) {
  const [profile] = useState(() => userService.getUserProfile())
  const [section, setSection] = useState('Overview')
  const [feedback, setFeedback] = useState('')
  const [drafts, setDrafts] = useState(getAllDrafts)
  const [archiveState, setArchiveState] = useState(() => {
    try {
      return { ids: archiveService.getArchivedIds(), error: '' }
    } catch (error) {
      return { ids: [], error: error.message }
    }
  })
  const archivedIds = archiveState.ids
  const { favorites } = useFavorites()
  const { guns: apiGuns } = useGuns({ limit: 100 })

  const knownGuns = useMemo(() => {
    const map = new Map()
    GUNS_LOCAL.forEach((gun, index) => {
      const item = { ...gun, id: gun.id || `local-${index}` }
      map.set(String(item.id), item)
    })
    apiGuns.forEach((gun) => map.set(String(gun.id), gun))
    return map
  }, [apiGuns])

  const archivedGuns = archivedIds.map((id) => knownGuns.get(id) || { id, name: `Product ${id}` })

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(profile.userId)
      setFeedback('User ID copied.')
      setTimeout(() => setFeedback(''), 2500)
    } catch (error) {
      setFeedback(`Could not copy user ID: ${error.message}`)
    }
  }

  const handleDeleteDraft = (id) => {
    if (!window.confirm('Delete this saved draft?')) return
    if (!deleteDraft(id)) {
      setFeedback('Could not delete the saved draft.')
      return
    }
    setDrafts((current) => current.filter((draft) => draft.id !== id))
  }

  const handleRestoreArchive = (id) => {
    try {
      archiveService.restore(id)
      setArchiveState((current) => ({
        ids: current.ids.filter((archivedId) => archivedId !== String(id)),
        error: '',
      }))
      setFeedback('Product restored to the catalog.')
      setTimeout(() => setFeedback(''), 2500)
    } catch (error) {
      setFeedback(error.message)
    }
  }

  return (
    <div className="profile-page">
      <section className="masthead profile-masthead">
        <div>
          <h1 className="display">Profile</h1>
          <p className="lede">Your account, saved drafts, and archived products.</p>
        </div>
        {onReplaySplash && (
          <button type="button" className="btn btn--outline btn--sm" onClick={onReplaySplash}>
            <Play size={14} /> Replay Intro
          </button>
        )}
      </section>

      <nav className="profile-tabs" aria-label="Profile sections">
        {PROFILE_SECTIONS.map((item) => (
          <button
            key={item}
            type="button"
            className={`profile-tab${section === item ? ' profile-tab--active' : ''}`}
            onClick={() => setSection(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      {feedback && <div className="toast toast--success"><Check size={18} /> {feedback}</div>}

      {section === 'Overview' && (
        <section className="profile-card">
          <div className="profile-card-top">
            <div className="avatar-wrap">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.username} className="avatar-img" loading="lazy" />
              ) : (
                <div className="avatar-placeholder"><Shield size={36} stroke="var(--brass)" /></div>
              )}
            </div>
            <div className="profile-identity">
              <h2 className="display">{profile.username || 'Shooter'}</h2>
              <p>{profile.bio || 'No bio added yet.'}</p>
              <div className="profile-id-row">
                <span className="mono-badge">{profile.userId}</span>
                <button type="button" className="icon-btn" onClick={handleCopyId} title="Copy User ID">
                  <Copy size={14} />
                </button>
              </div>
              <button
                type="button"
                className="btn btn--outline btn--sm profile-edit-btn"
                onClick={() => onNavigate?.('EditProfile')}
              >
                <Pencil size={14} /> Edit profile
              </button>
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <Heart size={20} className="stat-icon" stroke="var(--brass)" />
              <div className="stat-val">{favorites.length}</div>
              <div className="stat-label">Favorites</div>
            </div>
            <button type="button" className="stat-item stat-item--button" onClick={() => setSection('Drafts')}>
              <FileText size={20} className="stat-icon" stroke="var(--steel)" />
              <div className="stat-val">{drafts.length}</div>
              <div className="stat-label">Saved drafts</div>
            </button>
            <button type="button" className="stat-item stat-item--button" onClick={() => setSection('Archive')}>
              <Archive size={20} className="stat-icon" stroke="var(--steel)" />
              <div className="stat-val">{archivedIds.length}</div>
              <div className="stat-label">Archived products</div>
            </button>
          </div>
          <p className="form-hint profile-wa">
            Checkout WhatsApp: {profile.whatsappNumber || 'Not set'}{' '}
            <button type="button" className="link-btn" onClick={() => onNavigate?.('EditProfile')}>
              Set number
            </button>
          </p>
        </section>
      )}

      {section === 'Drafts' && (
        <section className="profile-section">
          <div className="list-head"><h2>Saved drafts</h2><span className="count">{drafts.length} draft(s)</span></div>
          {drafts.length === 0 ? (
            <p className="state-box">There are no saved drafts on this device.</p>
          ) : (
            <ul className="profile-list">
              {drafts.map((draft) => {
                const isCreate = draft.id === 'create'
                const name = draft.formData?.name || (isCreate ? 'New product draft' : `Edit product ${draft.id}`)
                return (
                  <li key={draft.id} className="profile-list-item">
                    <div><strong>{name}</strong><p>Saved {draft.savedAt ? new Date(draft.savedAt).toLocaleString() : 'previously'}</p></div>
                    <div className="profile-list-actions">
                      <button
                        type="button"
                        className="btn btn--outline btn--sm"
                        onClick={() => onNavigate?.(isCreate ? 'Create' : 'Edit', isCreate ? undefined : { id: draft.id })}
                      >
                        Continue
                      </button>
                      <button type="button" className="icon-btn" onClick={() => handleDeleteDraft(draft.id)} title="Delete draft">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      {section === 'Archive' && (
        <section className="profile-section">
          <div className="list-head"><h2>Archived products</h2><span className="count">{archivedGuns.length} item(s)</span></div>
          <p className="form-hint">Archive state is stored in this browser and does not permanently delete the server record.</p>
          {archiveState.error && <p className="form-error">{archiveState.error}</p>}
          {archivedGuns.length === 0 ? (
            <p className="state-box">No products in the archive.</p>
          ) : (
            <ul className="profile-list">
              {archivedGuns.map((gun) => (
                <li key={gun.id} className="profile-list-item">
                  <div><strong>{gun.name}</strong><p>{gun.type || gun.category || 'Product'} · {gun.id}</p></div>
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => handleRestoreArchive(gun.id)}>
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {section === 'About' && <Suspense fallback={<p className="state-box">Loading about…</p>}><About /></Suspense>}
      {section === 'Contact' && <Suspense fallback={<p className="state-box">Loading contact…</p>}><Contact /></Suspense>}
    </div>
  )
}
