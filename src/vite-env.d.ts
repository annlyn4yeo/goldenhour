/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENWEATHER_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'suncalc' {
  export interface SunTimes {
    sunrise: Date
    sunriseEnd: Date
    sunsetStart: Date
    sunset: Date
    dawn: Date
    dusk: Date
    nauticalDawn: Date
    nauticalDusk: Date
    nightEnd: Date
    night: Date
    goldenHour: Date
    goldenHourEnd: Date
    blueHourEnd: Date
    blueHourStart: Date
    solarNoon: Date
    nadir: Date
  }

  export interface SunPosition {
    altitude: number
    azimuth: number
  }

  export function getTimes(date: Date, lat: number, lng: number, height?: number): SunTimes
  export function getPosition(date: Date, lat: number, lng: number): SunPosition
  export function addTime(angle: number, riseName: string, setName: string): void
}
