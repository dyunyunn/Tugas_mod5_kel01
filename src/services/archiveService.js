const ARCHIVE_KEY = 'bore_barrel_archived_products'

const readIds = () => {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY)
    const ids = raw ? JSON.parse(raw) : []
    if (!Array.isArray(ids)) throw new Error('Archived product data is invalid.')
    return ids.map(String)
  } catch (error) {
    throw new Error(`Could not read archived products: ${error.message}`)
  }
}

const saveIds = (ids) => {
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify([...new Set(ids.map(String))]))
  } catch (error) {
    throw new Error(`Could not save archived products: ${error.message}`)
  }
}

const archiveService = {
  getArchivedIds: readIds,
  isArchived: (id) => readIds().includes(String(id)),
  archive(id) {
    saveIds([...readIds(), id])
  },
  restore(id) {
    saveIds(readIds().filter((archivedId) => archivedId !== String(id)))
  },
}

export default archiveService
