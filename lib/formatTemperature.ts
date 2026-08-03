export type TemperatureUnit = "celsius" | "fahrenheit";

export function formatTemperature(
  celsius: number,
  unit: TemperatureUnit = "celsius",
): string {
  if (unit === "fahrenheit") {
    const fahrenheit = Math.round((celsius * 9) / 5 + 32);
    return `${fahrenheit}°F`;
  }

  return `${Math.round(celsius)}°C`;
}