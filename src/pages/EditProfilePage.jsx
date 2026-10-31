import { useState } from 'react'
import { ArrowLeft, Camera, Save } from 'lucide-react'
import userService from '../services/userService'

export default function EditProfilePage({ onBack, onSaved }) {
  const [profile] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(profile.username || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [whatsappNumber, setWhatsappNumber] = useState(profile.whatsappNumber || '')
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [error, setError] = useState('')

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file for your avatar.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Avatar image must be under 2MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setAvatar(reader.result)
      setError('')
    }
    reader.onerror = () => setError('Could not read the avatar image.')
    reader.readAsDataURL(file)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const digits = whatsappNumber.replace(/\D/g, '')
    if (whatsappNumber.trim() && digits.length < 8) {
      setError('Enter a valid WhatsApp number including its country code.')
      return
    }

    const result = userService.saveUserProfile({
      ...profile,
      username: username.trim() || 'Shooter',
      bio: bio.trim(),
      whatsappNumber: digits,
      avatar,
    })
    if (!result.success) {
      setError(result.message || 'Could not save your profile.')
      return
    }
    onSaved?.()
  }

  return (
    <section className="form-page">
      <button type="button" className="detail-back" onClick={onBack}><ArrowLeft size={18} /> Back to profile</button>
      <div className="form-title-group">
        <h1 className="display">Edit profile</h1>
        <p className="lede">Update your name, bio, and WhatsApp checkout number.</p>
      </div>
      <form className="entry-form profile-edit-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="edit-profile-avatar" className="form-label">Profile photo</label>
          {avatar && <img src={avatar} alt="Profile preview" className="avatar-img profile-avatar-preview" loading="lazy" />}
          <label className="btn btn--outline btn--sm profile-avatar-picker" htmlFor="edit-profile-avatar">
            <Camera size={15} /> Choose image
          </label>
          <input id="edit-profile-avatar" className="hidden-file-input" type="file" accept="image/*" onChange={handleAvatarChange} />
        </div>
        <div className="form-group">
          <label htmlFor="edit-profile-name" className="form-label">Name</label>
          <input id="edit-profile-name" className="form-input" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={60} />
        </div>
        <div className="form-group">
          <label htmlFor="edit-profile-bio" className="form-label">Bio</label>
          <textarea id="edit-profile-bio" className="form-textarea" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={500} />
        </div>
        <div className="form-group">
          <label htmlFor="edit-profile-whatsapp" className="form-label">WhatsApp checkout number</label>
          <input
            id="edit-profile-whatsapp"
            className="form-input"
            type="tel"
            inputMode="tel"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="62812xxxxxxx"
          />
          <p className="form-hint">Include the country code, for example 62 for Indonesia.</p>
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions-bar">
          <button type="button" className="btn btn--outline" onClick={onBack}>Cancel</button>
          <button type="submit" className="btn btn--primary"><Save size={16} /> Save profile</button>
        </div>
      </form>
    </section>
  )
}
