import { lazy, Suspense, useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import PWABadge from './components/PWABadge.jsx'
import ConfirmModal from './components/modals/ConfirmModal.jsx'
import SplashScreen from './components/common/SplashScreen.jsx'
import gunService from './services/gunService.js'
import archiveService from './services/archiveService.js'
import { readCart, saveCart } from './services/cartService.js'
import userService from './services/userService.js'
import GUNS_LOCAL from './data/guns.js'
import './App.css'

const Catalog = lazy(() => import('./pages/Catalog.jsx'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
const EditProfilePage = lazy(() => import('./pages/EditProfilePage.jsx'))
const CreateGunPage = lazy(() => import('./pages/CreateGunPage.jsx'))
const EditGunPage = lazy(() => import('./pages/EditGunPage.jsx'))
const CartPage = lazy(() => import('./pages/CartPage.jsx'))
const GunDetail = lazy(() => import('./components/gun/GunDetail.jsx'))

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab] = useState('Catalog')
  const [sharedLink] = useState(() => {
    const sharedId = new URLSearchParams(window.location.search).get('gun')
    const localGun = sharedId
      ? GUNS_LOCAL
        .map((gun, index) => ({ ...gun, id: gun.id || `local-${index}` }))
        .find((gun) => String(gun.id) === sharedId || gun.name === sharedId)
      : null
    return { sharedId, localGun }
  })
  const [mode, setMode] = useState(sharedLink.localGun ? 'detail' : 'list')
  const [selectedGun, setSelectedGun] = useState(sharedLink.localGun)
  const [editingGun, setEditingGun] = useState(null)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [archiving, setArchiving] = useState(false)
  const [deepLinkError, setDeepLinkError] = useState('')
  const [initialCart] = useState(() => {
    try {
      return { items: readCart(), error: '' }
    } catch (error) {
      return { items: [], error: error.message }
    }
  })
  const [cart, setCart] = useState(initialCart.items)
  const [cartError, setCartError] = useState(initialCart.error)
  const profile = userService.getUserProfile()

  const updateCart = (nextCart) => {
    setCart(nextCart)
    try {
      saveCart(nextCart)
      setCartError('')
    } catch (error) {
      setCartError(error.message)
    }
  }

  useEffect(() => {
    const { sharedId, localGun } = sharedLink
    if (!sharedId || localGun) return undefined
    let active = true

    const loadSharedGun = async () => {
      try {
        const response = await gunService.getGunById(sharedId)
        const gun = response?.data || response?.recipe || response
        if (!gun || !active) return
        setSelectedGun(gun)
        setMode('detail')
      } catch (error) {
        if (active) setDeepLinkError(`Could not load the shared product: ${error.message}`)
      }
    }
    loadSharedGun()
    return () => { active = false }
  }, [sharedLink])

  const handleNavigate = (target, payload) => {
    if (target === 'Create') {
      setMode('create')
    } else if (target === 'Edit') {
      setEditingGun(payload)
      setMode('edit')
    } else if (target === 'EditProfile') {
      setMode('profile-edit')
    } else if (target === 'Detail') {
      setSelectedGun(payload)
      setMode('detail')
    } else if (target === 'Cart') {
      setMode('cart')
    } else {
      setTab(target)
      setMode('list')
      setSelectedGun(null)
      setEditingGun(null)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAddToCart = (gun) => {
    const id = String(gun.id || gun.name)
    const existing = cart.find((item) => String(item.id) === id)
    if (existing) {
      updateCart(cart.map((item) => String(item.id) === id
        ? { ...item, quantity: item.quantity + 1 }
        : item))
      return
    }
    updateCart([...cart, { ...gun, id, quantity: 1 }])
  }

  const handleChangeQuantity = (id, quantity) => {
    updateCart(quantity < 1
      ? cart.filter((item) => String(item.id) !== String(id))
      : cart.map((item) => String(item.id) === String(id) ? { ...item, quantity } : item))
  }

  const handleBackToCatalog = () => {
    setMode('list')
    setSelectedGun(null)
    setEditingGun(null)
    setTab('Catalog')
  }

  const handleArchive = () => {
    if (!archiveTarget) return
    try {
      setArchiving(true)
      archiveService.archive(archiveTarget.id)
      setArchiveTarget(null)
      setSelectedGun(null)
      setMode('list')
      setTab('Catalog')
    } catch (error) {
      setDeepLinkError(error.message)
    } finally {
      setArchiving(false)
    }
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="shell">
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <Header
        tab={mode === 'list' ? tab : ''}
        onTab={handleNavigate}
        onNavigateCreate={() => handleNavigate('Create')}
        onNavigateCart={() => handleNavigate('Cart')}
        cartCount={cartCount}
      />

      <main className="main">
        <Suspense fallback={<div className="state-box">Loading page…</div>}>
          {mode === 'create' && (
            <CreateGunPage
              onBack={handleBackToCatalog}
              onSuccess={handleBackToCatalog}
            />
          )}
          {mode === 'edit' && (
            <EditGunPage
              gun={editingGun}
              gunId={editingGun?.id}
              onBack={handleBackToCatalog}
              onSuccess={handleBackToCatalog}
            />
          )}
          {mode === 'profile-edit' && (
            <EditProfilePage
              onBack={() => { setMode('list'); setTab('Profile') }}
              onSaved={() => { setMode('list'); setTab('Profile') }}
            />
          )}
          {mode === 'detail' && selectedGun && (
            <GunDetail
              gun={selectedGun}
              onBack={handleBackToCatalog}
              onEdit={(gun) => handleNavigate('Edit', gun)}
              onDelete={setArchiveTarget}
              onAddToCart={handleAddToCart}
            />
          )}
          {mode === 'cart' && (
            <CartPage
              cart={cart}
              onChangeQuantity={handleChangeQuantity}
              onRemove={(id) => handleChangeQuantity(id, 0)}
              onBack={handleBackToCatalog}
              onEditProfile={() => handleNavigate('EditProfile')}
              whatsappNumber={profile.whatsappNumber}
            />
          )}
          {mode === 'list' && tab === 'Catalog' && (
            <Catalog onNavigate={handleNavigate} onAddToCart={handleAddToCart} />
          )}
          {mode === 'list' && tab === 'Favorites' && (
            <FavoritesPage
              onSelectGun={(gun) => handleNavigate('Detail', gun)}
              onNavigateCatalog={() => setTab('Catalog')}
              onAddToCart={handleAddToCart}
            />
          )}
          {mode === 'list' && tab === 'Profile' && (
            <ProfilePage
              onReplaySplash={() => setShowSplash(true)}
              onNavigate={handleNavigate}
            />
          )}
        </Suspense>
        {(deepLinkError || cartError) && (
          <div className="toast toast--error">{deepLinkError || cartError}</div>
        )}
      </main>

      <ConfirmModal
        open={Boolean(archiveTarget)}
        title="Archive product"
        message={`Archive "${archiveTarget?.name}"? It can be restored from your profile.`}
        confirmLabel="Archive"
        danger
        loading={archiving}
        onConfirm={handleArchive}
        onCancel={() => setArchiveTarget(null)}
      />
      <PWABadge />
      <Footer />
    </div>
  )
}

export default App
