export const getGunShareUrl = (gun) => {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  url.searchParams.set('gun', String(gun.id || gun.name))
  return url.toString()
}

export const getShareId = (gun) => String(gun.id || gun.name)
