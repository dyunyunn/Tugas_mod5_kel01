import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  Loader,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import gunService from '../services/gunService'
import uploadService from '../services/uploadService'
import {
  saveDraft,
  loadDraft,
  deleteDraft,
  hasDraft,
  getDraftTimestamp,
  formatDraftTime,
} from '../utils/draftStorage'
import ConfirmModal from '../components/modals/ConfirmModal'

export default function CreateGunPage({ onBack, onSuccess }) {
  const [currentStep, setCurrentStep] = useState('upload')

  const [formData, setFormData] = useState({
    name: '',
    type: 'Pistol',
    caliber: '9mm',
    category: 'makanan', 
    difficulty: 'mudah', 
    price: 599,
    description: '',
    servings: 1,
    is_featured: false,
  })

  // --- PERUBAHAN MULTI-UPLOAD: State diubah menjadi Array ---
  const [images, setImages] = useState([]) // Menyimpan file & preview
  const [uploadedImageUrls, setUploadedImageUrls] = useState([])

  const [specs, setSpecs] = useState([
    { name: 'Frame', quantity: 'Polymer' },
    { name: 'Action', quantity: 'Striker-Fired' },
    { name: 'Capacity', quantity: '17 rounds' },
  ])

  const [steps, setSteps] = useState([
    'Verify firearm is completely unloaded and point in safe direction.',
    'Disassemble slide assembly from receiver frame for routine maintenance.',
  ])

  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [showDraftModal, setShowDraftModal] = useState(() => hasDraft('create'))
  const [draftTimestamp, setDraftTimestamp] = useState(() => getDraftTimestamp('create'))

  const handleSaveDraft = useCallback((notify = true) => {
    const draftData = {
      formData,
      specs,
      steps,
      uploadedImageUrls,
    }
    const saved = saveDraft(draftData, 'create')
    if (saved) {
      const ts = getDraftTimestamp('create')
      setDraftTimestamp(ts)
      if (notify) {
        setSuccessMsg(`Draft saved (${formatDraftTime(ts)})`)
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    }
  }, [formData, specs, steps, uploadedImageUrls])

  useEffect(() => {
    if (currentStep !== 'form') return
    const interval = setInterval(() => {
      handleSaveDraft(false)
    }, 30000)
    return () => clearInterval(interval)
  }, [handleSaveDraft, currentStep])

  const handleLoadDraft = () => {
    const draft = loadDraft('create')
    if (draft) {
      if (draft.formData) setFormData(draft.formData)
      if (draft.specs) setSpecs(draft.specs)
      if (draft.steps) setSteps(draft.steps)
      if (draft.uploadedImageUrls) {
        setUploadedImageUrls(draft.uploadedImageUrls)
        // Re-create preview format dari draft URLs
        setImages(draft.uploadedImageUrls.map(url => ({
          id: Math.random().toString(36).substring(7),
          file: null,
          preview: url
        })))
        setCurrentStep('form')
      }
      setShowDraftModal(false)
      setSuccessMsg('Draft successfully loaded.')
      setTimeout(() => setSuccessMsg(''), 4000)
    }
  }

  const handleDiscardDraft = () => {
    deleteDraft('create')
    setShowDraftModal(false)
    setDraftTimestamp(null)
  }

  // --- PERUBAHAN MULTI-UPLOAD: Handle Multiple Files ---
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    let hasError = false
    const newImages = []
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024 || !allowed.includes(file.type)) {
        hasError = true
      } else {
        newImages.push({
          id: Math.random().toString(36).substring(7),
          file: file,
          preview: URL.createObjectURL(file)
        })
      }
    })

    if (hasError) setError('Some files were skipped (exceeded 5MB or invalid format).')
    else setError('')

    setImages((prev) => [...prev, ...newImages])
  }

  const handleRemoveImage = (idToRemove) => {
    setImages((prev) => prev.filter(img => img.id !== idToRemove))
  }

  const handleSelectPreset = (url) => {
    setImages([{ id: 'preset', file: null, preview: url }])
    setUploadedImageUrls([url])
    setCurrentStep('form')
    setError('')
  }

  // --- PERUBAHAN MULTI-UPLOAD: Upload Semua File Sekaligus ---
  const handleUploadImage = async () => {
    if (images.length === 0) {
      if (uploadedImageUrls.length > 0) {
        setCurrentStep('form')
        return
      }
      setError('Please select at least one image file first.')
      return
    }

    try {
      setUploading(true)
      setError('')
      
      // Upload paralel menggunakan Promise.all
      const uploadPromises = images.map(async (img) => {
        if (img.file) {
          const result = await uploadService.uploadImage(img.file)
          if (result.success && result.data?.url) return result.data.url
          throw new Error('Image upload failed.')
        }
        return img.preview // Fallback untuk preset
      })

      const urls = await Promise.all(uploadPromises)
      setUploadedImageUrls(urls)
      setCurrentStep('form')
    } catch (err) {
      console.warn('Upload API failed, falling back to local preview:', err)
      setUploadedImageUrls(images.map(img => img.preview))
      setCurrentStep('form')
    } finally {
      setUploading(false)
    }
  }

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSpecChange = (index, field, value) => {
    setSpecs((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const addSpec = () => setSpecs((prev) => [...prev, { name: '', quantity: '' }])
  const removeSpec = (index) => {
    if (specs.length > 1) setSpecs((prev) => prev.filter((_, i) => i !== index))
  }

  const handleStepChange = (index, value) => {
    setSteps((prev) => {
      const copy = [...prev]
      copy[index] = value
      return copy
    })
  }

  const addStep = () => setSteps((prev) => [...prev, ''])
  const removeStep = (index) => {
    if (steps.length > 1) setSteps((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim() || formData.name.trim().length < 3) {
      setError('Product name must be at least 3 characters.')
      return
    }

    const cleanSpecs = specs.filter((s) => s.name.trim()).map((s) => ({
      name: s.name.trim(),
      quantity: s.quantity.trim() || 'Standard',
    }))
    if (cleanSpecs.length === 0) return setError('Please provide at least one specification.')

    const cleanSteps = steps.filter((s) => s.trim()).map((s) => s.trim())
    if (cleanSteps.length === 0) return setError('Please provide at least one step.')

    // Menggabungkan URL array menjadi string ber-koma (jika API backend hanya menerima format string)
    const combinedImageUrl = uploadedImageUrls.length > 0 
      ? uploadedImageUrls.join(',') 
      : '/guns/pistol.svg'

    const payload = {
      name: formData.name.trim(),
      category: formData.category || 'makanan',
      description: formData.description.trim() || `${formData.type} caliber ${formData.caliber}.`,
      image_url: combinedImageUrl,
      prep_time: 15,
      cook_time: Number(formData.price) || 500,
      servings: Number(formData.servings) || 1,
      difficulty: formData.difficulty || 'mudah',
      is_featured: Boolean(formData.is_featured),
      ingredients: cleanSpecs,
      steps: cleanSteps,
    }

    try {
      setCreating(true)
      const response = await gunService.createGun(payload)
      if (response.success || response.data) {
        deleteDraft('create')
        if (onSuccess) onSuccess(response.data)
        else if (onBack) onBack()
      } else {
        throw new Error(response.message || 'Failed to create product.')
      }
    } catch (err) {
      setError(err.message || 'Error occurred while saving product to server.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="form-page">
      <div className="form-head">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Back to Catalog
        </button>
        <div className="form-head-actions">
          {currentStep === 'form' && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => handleSaveDraft(true)}
            >
              <Save size={14} /> Save Draft
            </button>
          )}
        </div>
      </div>

      <div className="form-title-group">
        <h1 className="display">Register New Hardware</h1>
        <p className="lede">Add a firearm or accessory to the catalog.</p>
      </div>

      {error && <div className="toast toast--error"><AlertCircle size={18} /> {error}</div>}
      {successMsg && <div className="toast toast--success"><CheckCircle size={18} /> {successMsg}</div>}

      <div className="form-steps-nav">
        <div className={`step-badge ${currentStep === 'upload' ? 'step-badge--active' : 'step-badge--done'}`}>1. Imagery</div>
        <div className="step-badge-connector" />
        <div className={`step-badge ${currentStep === 'form' ? 'step-badge--active' : ''}`}>2. Specifications &amp; Details</div>
      </div>

      {currentStep === 'upload' && (
        <div className="card-box">
          <h2 className="card-box-title">Weapon Imagery</h2>
          <p className="card-box-desc">Upload multiple authentic photographs (max 5MB each).</p>

          {images.length === 0 ? (
            <div className="upload-dropzone">
              {/* --- PERUBAHAN MULTI-UPLOAD: Atribut 'multiple' ditambahkan --- */}
              <input
                id="gun-image-input"
                type="file"
                multiple 
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden-file-input"
              />
              <label htmlFor="gun-image-input" className="upload-label">
                <Upload size={36} className="upload-icon" />
                <span className="upload-main-text">Click to choose image files</span>
                <span className="upload-sub-text">You can select multiple images</span>
              </label>

              <div className="preset-selector">
                <span className="preset-title">Or use a stock preset:</span>
                <div className="preset-pills">
                  <button type="button" className="pill" onClick={() => handleSelectPreset('/guns/pistol.svg')}>Pistol Vector</button>
                  <button type="button" className="pill" onClick={() => handleSelectPreset('/guns/rifle.svg')}>Rifle Vector</button>
                  <button type="button" className="pill" onClick={() => handleSelectPreset('/guns/shotgun.svg')}>Shotgun Vector</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="preview-container">
              {/* --- PERUBAHAN MULTI-UPLOAD: Grid Preview Gambar --- */}
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {images.map((img) => (
                  <div key={img.id} style={{ position: 'relative', width: '120px', height: '120px' }}>
                    <img 
                      src={img.preview} 
                      alt="preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }} 
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img.id)}
                      style={{
                        position: 'absolute', top: '-8px', right: '-8px',
                        background: 'red', color: 'white', border: 'none',
                        borderRadius: '50%', width: '24px', height: '24px',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer'
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                {/* Tombol tambah gambar lagi */}
                <label style={{ 
                  width: '120px', height: '120px', border: '2px dashed #ccc', 
                  borderRadius: '8px', display: 'flex', justifyContent: 'center', 
                  alignItems: 'center', cursor: 'pointer', color: '#666'
                }}>
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                  <Plus size={24} />
                </label>
              </div>

              <div className="preview-actions">
                <button type="button" className="btn btn--primary" onClick={handleUploadImage} disabled={uploading}>
                  {uploading ? <><Loader size={18} className="spin" /> Uploading…</> : <><Upload size={18} /> Confirm Imagery & Continue</>}
                </button>
                <button type="button" className="btn btn--outline" onClick={() => {
                  setUploadedImageUrls(images.map(i => i.preview))
                  setCurrentStep('form')
                }}>
                  Continue without uploading
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {currentStep === 'form' && (
        <form onSubmit={handleSubmit} className="entry-form">
          <div className="selected-thumb-bar">
            {/* Tampilkan gambar pertama sebagai thumbnail representatif */}
            <img src={uploadedImageUrls[0] || images[0]?.preview} alt="Selected" className="thumb-small" />
            <div className="thumb-info">
              <span className="thumb-title">{uploadedImageUrls.length || images.length} Imagery Assigned</span>
              <span className="thumb-sub">Ready for registration</span>
            </div>
            <button type="button" className="btn btn--outline btn--sm" onClick={() => setCurrentStep('upload')}>
              Edit Images
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Model Designation <span className="req">*</span></label>
              <input id="name" type="text" name="name" value={formData.name} onChange={handleFormChange} required className="form-input" />
            </div>
            <div className="form-group">
              <label htmlFor="type" className="form-label">Platform / Category <span className="req">*</span></label>
              <select id="type" name="type" value={formData.type} onChange={(e) => {
                handleFormChange(e)
                setFormData((prev) => ({ ...prev, category: e.target.value === 'Pistol' ? 'makanan' : 'minuman' }))
              }} className="form-select">
                <option value="Pistol">Pistol (Sidearm)</option>
                <option value="Rifle">Rifle (Long Gun)</option>
                <option value="Shotgun">Shotgun (Smoothbore)</option>
                <option value="Submachine Gun">Submachine Gun</option>
              </select>
            </div>
          </div>

          <div className="form-grid form-grid--3">
            <div className="form-group">
              <label htmlFor="caliber" className="form-label">Caliber / Chambering <span className="req">*</span></label>
              <input id="caliber" type="text" name="caliber" value={formData.caliber} onChange={handleFormChange} required className="form-input" />
            </div>
            <div className="form-group">
              <label htmlFor="price" className="form-label">Price (USD) <span className="req">*</span></label>
              <input id="price" type="number" name="price" value={formData.price} onChange={handleFormChange} required className="form-input" />
            </div>
            <div className="form-group">
              <label htmlFor="difficulty" className="form-label">Grade / Build Quality <span className="req">*</span></label>
              <select id="difficulty" name="difficulty" value={formData.difficulty} onChange={handleFormChange} className="form-select">
                <option value="mudah">Commercial / Standard</option>
                <option value="sedang">Mil-Spec / Service Issue</option>
                <option value="sulit">Match Grade / Custom</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">Armory Description</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleFormChange} rows={3} className="form-textarea" />
          </div>

          <div className="form-fieldset">
            <div className="fieldset-header">
              <label className="form-label">Specifications &amp; Components</label>
              <button type="button" className="btn btn--outline btn--sm" onClick={addSpec}><Plus size={14} /> Add Spec</button>
            </div>
            <div className="multi-rows">
              {specs.map((spec, i) => (
                <div key={i} className="multi-row">
                  <input type="text" placeholder="Attribute" value={spec.name} onChange={(e) => handleSpecChange(i, 'name', e.target.value)} className="form-input" />
                  <input type="text" placeholder="Value" value={spec.quantity} onChange={(e) => handleSpecChange(i, 'quantity', e.target.value)} className="form-input" />
                  <button type="button" className="btn btn--danger-ghost" onClick={() => removeSpec(i)} disabled={specs.length <= 1}><X size={16} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-fieldset">
            <div className="fieldset-header">
              <label className="form-label">Assembly &amp; Maintenance Protocol</label>
              <button type="button" className="btn btn--outline btn--sm" onClick={addStep}><Plus size={14} /> Add Step</button>
            </div>
            <div className="multi-rows">
              {steps.map((st, i) => (
                <div key={i} className="step-row">
                  <span className="step-num">{i + 1}</span>
                  <input type="text" placeholder="Step instruction" value={st} onChange={(e) => handleStepChange(i, e.target.value)} className="form-input" />
                  <button type="button" className="btn btn--danger-ghost" onClick={() => removeStep(i)} disabled={steps.length <= 1}><X size={16} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="checkbox-row">
            <input id="is_featured" type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleFormChange} className="form-checkbox" />
            <label htmlFor="is_featured" className="checkbox-label">Feature in Armory Showcase</label>
          </div>

          <div className="form-actions-bar">
            <button type="button" className="btn btn--outline" onClick={onBack} disabled={creating}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={creating}>
              {creating ? <><Loader size={18} className="spin" /> Registering…</> : 'Commit to Armory'}
            </button>
          </div>
        </form>
      )}

      <ConfirmModal
        open={showDraftModal}
        title="Resume Previous Draft?"
        message={`An unfinished draft from ${draftTimestamp ? formatDraftTime(draftTimestamp) : 'earlier'} was detected. Would you like to resume editing?`}
        confirmLabel="Load Draft"
        cancelLabel="Discard"
        onConfirm={handleLoadDraft}
        onCancel={handleDiscardDraft}
      />
    </div>
  )
}