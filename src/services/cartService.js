const CART_KEY = 'bore_barrel_cart'

const readCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY)
    const cart = raw ? JSON.parse(raw) : []
    return Array.isArray(cart) ? cart : []
  } catch (error) {
    throw new Error(`Could not load shopping cart: ${error.message}`)
  }
}

const saveCart = (cart) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  } catch (error) {
    throw new Error(`Could not save shopping cart: ${error.message}`)
  }
}

export { readCart, saveCart }
