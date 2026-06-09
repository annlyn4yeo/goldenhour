export type WeatherCategory = 'clear' | 'partlyCloudy' | 'overcast' | 'precipitation'

export function isOvercastWeather(category: WeatherCategory): boolean {
  return category === 'overcast' || category === 'precipitation'
}
