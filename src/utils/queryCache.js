const cache = new Map()

export const getCachedQuery = (key, loader, ttl = 30_000) => {
  const cached = cache.get(key)
  if (cached?.value !== undefined && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.value)
  }
  if (cached?.promise) return cached.promise

  const promise = loader()
    .then((value) => {
      cache.set(key, { value, expiresAt: Date.now() + ttl })
      return value
    })
    .catch((error) => {
      cache.delete(key)
      throw error
    })

  cache.set(key, { promise, expiresAt: 0 })
  return promise
}

export const invalidateQueries = (prefix) => {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
}
