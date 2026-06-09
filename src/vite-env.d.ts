/// <reference types="vite/client" />

declare module 'suncalc' {
  export interface SunTimes {
    sunrise: Date
    sunset: Date
    goldenHour: Date
    goldenHourEnd: Date
  }

  export function getTimes(date: Date, lat: number, lng: number): SunTimes
}
