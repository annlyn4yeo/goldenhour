import { useCallback, useEffect, useMemo, useState } from 'react'
import { reverseGeocode } from '../lib/geocoding'
import useAsync from './useAsync'
import { fetchJson } from './useFetch'

const DEFAULT_COORDS = { lat: 12.9716, lng: 77.5946 }
const DEFAULT_CITY_NAME = 'Bangalore, India'

type PermissionState = 'pending' | 'granted' | 'denied'

type Coords = {
  lat: number
  lng: number
}

type UseLocationReturn = {
  coords: Coords | null
  cityName: string
  permissionState: PermissionState
  isLoading: boolean
  setManualCity: (city: string) => void
}

type OpenMeteoSearchResponse = {
  results?: Array<{ name: string }>
}

function buildOpenMeteoSearchUrl(lat: number, lng: number): string {
  const query = `${lat.toFixed(2)},${lng.toFixed(2)}`
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', query)
  url.searchParams.set('count', '1')
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')
  return url.toString()
}

async function lookupCityNameOpenMeteo(lat: number, lng: number): Promise<string | null> {
  const data = await fetchJson<OpenMeteoSearchResponse>(buildOpenMeteoSearchUrl(lat, lng))
  return data.results?.[0]?.name ?? null
}

async function resolveCityName(lat: number, lng: number): Promise<string | null> {
  try {
    const place = await reverseGeocode(lat, lng)
    if (place.name) return place.name
  } catch {
    // fall through to Open-Meteo
  }

  try {
    return await lookupCityNameOpenMeteo(lat, lng)
  } catch {
    return null
  }
}

export default function useLocation(): UseLocationReturn {
  const [permissionState, setPermissionState] = useState<PermissionState>('pending')
  const [geoCoords, setGeoCoords] = useState<Coords | null>(null)
  const [manualCity, setManualCityState] = useState<string | null>(null)
  const [geoResolved, setGeoResolved] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) {
      setPermissionState('denied')
      setGeoResolved(true)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setPermissionState('granted')
      },
      () => {
        setPermissionState('denied')
        setGeoResolved(true)
      },
      {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 300_000,
      },
    )
  }, [])

  const shouldResolveCity = permissionState === 'granted' && geoCoords !== null
  const coordsKey = geoCoords ? `${geoCoords.lat},${geoCoords.lng}` : null

  const { data: geocodedCityName, loading: geocoding } = useAsync(
    () => resolveCityName(geoCoords!.lat, geoCoords!.lng),
    [coordsKey],
    { enabled: shouldResolveCity },
  )

  useEffect(() => {
    if (!shouldResolveCity) return
    if (!geocoding) setGeoResolved(true)
  }, [shouldResolveCity, geocoding])

  const setManualCity = useCallback((city: string) => {
    const trimmed = city.trim()
    setManualCityState(trimmed.length > 0 ? trimmed : null)
  }, [])

  const { coords, cityName } = useMemo(() => {
    if (permissionState === 'granted' && geoCoords) {
      return {
        coords: geoCoords,
        cityName: geocodedCityName ?? '',
      }
    }

    if (permissionState === 'denied') {
      if (manualCity) {
        return { coords: null, cityName: manualCity }
      }
      return { coords: DEFAULT_COORDS, cityName: DEFAULT_CITY_NAME }
    }

    return { coords: null, cityName: '' }
  }, [permissionState, geoCoords, geocodedCityName, manualCity])

  const isLoading = !geoResolved

  return {
    coords,
    cityName,
    permissionState,
    isLoading,
    setManualCity,
  }
}
