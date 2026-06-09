const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
const USER_AGENT = 'GoldenHour/1.0'

type NominatimAddress = {
  city?: string
  town?: string
  village?: string
  municipality?: string
  county?: string
  state?: string
  country?: string
}

type NominatimResult = {
  lat: string
  lon: string
  display_name: string
  address?: NominatimAddress
}

export type Place = {
  lat: number
  lng: number
  name: string
}

async function nominatimFetch(path: string): Promise<Response> {
  return fetch(`${NOMINATIM_BASE}${path}`, {
    headers: { 'Accept-Language': 'en', 'User-Agent': USER_AGENT },
  })
}

function placeNameFromAddress(address: NominatimAddress | undefined): string | null {
  if (!address) return null

  const locality =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.county

  if (locality && address.state) return `${locality}, ${address.state}`
  if (locality && address.country) return `${locality}, ${address.country}`
  return locality ?? address.state ?? address.country ?? null
}

function toPlace(result: NominatimResult): Place {
  return {
    lat: Number(result.lat),
    lng: Number(result.lon),
    name: placeNameFromAddress(result.address) ?? result.display_name.split(',')[0],
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<Place> {
  const response = await nominatimFetch(
    `/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
  )

  if (!response.ok) {
    throw new Error('Unable to look up this location.')
  }

  const result = (await response.json()) as NominatimResult
  return toPlace(result)
}

export async function searchCities(query: string): Promise<Place[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const response = await nominatimFetch(
    `/search?q=${encodeURIComponent(trimmed)}&format=json&addressdetails=1&limit=5`,
  )

  if (!response.ok) {
    throw new Error('City search is unavailable right now.')
  }

  const results = (await response.json()) as NominatimResult[]
  return results.map(toPlace)
}

export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
}

type OpenMeteoSearchResponse = {
  results?: Array<{
    name: string
    latitude: number
    longitude: number
    admin1?: string
    country?: string
  }>
}

export async function searchOpenMeteo(query: string): Promise<Place | null> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return null

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', trimmed)
  url.searchParams.set('count', '1')
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('City lookup is unavailable right now.')
  }

  const data = (await response.json()) as OpenMeteoSearchResponse
  const result = data.results?.[0]
  if (!result) return null

  const nameParts = [result.name, result.admin1, result.country].filter(Boolean)
  return {
    lat: result.latitude,
    lng: result.longitude,
    name: nameParts.join(', '),
  }
}
