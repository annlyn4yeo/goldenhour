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
    sunset: Date
    dawn: Date
    dusk: Date
    nightEnd: Date
    goldenHour: Date
    goldenHourEnd: Date
    blueHourEnd: Date
    blueHourStart: Date
    solarNoon: Date
  }

  export function getTimes(date: Date, lat: number, lng: number): SunTimes
  export function addTime(angle: number, riseName: string, setName: string): void
}
