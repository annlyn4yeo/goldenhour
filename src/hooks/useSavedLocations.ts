import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const STORAGE_KEY = 'auric_locations'

const LAL_BAGH = {
  name: 'Lal Bagh, Bangalore',
  lat: 12.9507,
  lng: 77.5848,
} as const

export type SavedLocation = {
  id: string
  name: string
  lat: number
  lng: number
  note?: string
  addedAt: string
}

type StoredData = {
  locations: SavedLocation[]
  activeLocationId: string | null
}

type SeedLocation = {
  lat: number
  lng: number
  name: string
}

type UseSavedLocationsOptions = {
  seedLocation?: SeedLocation | null
  locationReady?: boolean
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function loadStoredData(): StoredData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as StoredData
    if (!Array.isArray(parsed.locations)) return null

    return {
      locations: parsed.locations,
      activeLocationId: parsed.activeLocationId ?? parsed.locations[0]?.id ?? null,
    }
  } catch {
    return null
  }
}

function persist(data: StoredData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function buildDefaultLocations(seedLocation?: SeedLocation | null): SavedLocation[] {
  const now = new Date().toISOString()
  const userLocation: SavedLocation = seedLocation
    ? {
        id: createId(),
        name: seedLocation.name,
        lat: seedLocation.lat,
        lng: seedLocation.lng,
        addedAt: now,
      }
    : {
        id: createId(),
        name: 'Bangalore, India',
        lat: 12.9716,
        lng: 77.5946,
        addedAt: now,
      }

  return [
    userLocation,
    {
      id: createId(),
      name: LAL_BAGH.name,
      lat: LAL_BAGH.lat,
      lng: LAL_BAGH.lng,
      addedAt: now,
    },
  ]
}

export default function useSavedLocations(options: UseSavedLocationsOptions = {}) {
  const { seedLocation = null, locationReady = false } = options
  const [locations, setLocations] = useState<SavedLocation[]>([])
  const [activeLocationId, setActiveLocationIdState] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const hasSeededRef = useRef(false)

  useEffect(() => {
    const stored = loadStoredData()
    if (stored && stored.locations.length > 0) {
      setLocations(stored.locations)
      setActiveLocationIdState(stored.activeLocationId ?? stored.locations[0].id)
      hasSeededRef.current = true
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated || hasSeededRef.current || !locationReady) return

    const defaults = buildDefaultLocations(seedLocation)
    hasSeededRef.current = true
    setLocations(defaults)
    setActiveLocationIdState(defaults[0].id)
    persist({ locations: defaults, activeLocationId: defaults[0].id })
  }, [hydrated, locationReady, seedLocation])

  useEffect(() => {
    if (!hydrated || locations.length === 0) return
    persist({ locations, activeLocationId })
  }, [hydrated, locations, activeLocationId])

  const setActiveLocation = useCallback((id: string) => {
    setActiveLocationIdState(id)
  }, [])

  const addLocation = useCallback((location: Omit<SavedLocation, 'id' | 'addedAt'>) => {
    const entry: SavedLocation = {
      ...location,
      id: createId(),
      addedAt: new Date().toISOString(),
    }

    setLocations((prev) => [...prev, entry])
    setActiveLocationIdState(entry.id)
    return entry
  }, [])

  const removeLocation = useCallback((id: string) => {
    setLocations((prev) => {
      const next = prev.filter((location) => location.id !== id)
      setActiveLocationIdState((currentActiveId) => {
        if (currentActiveId !== id) return currentActiveId
        return next[0]?.id ?? null
      })
      return next
    })
  }, [])

  const activeLocation = useMemo(
    () => locations.find((location) => location.id === activeLocationId) ?? locations[0] ?? null,
    [locations, activeLocationId],
  )

  return {
    locations,
    addLocation,
    removeLocation,
    activeLocationId,
    activeLocation,
    setActiveLocation,
    hydrated,
  }
}
