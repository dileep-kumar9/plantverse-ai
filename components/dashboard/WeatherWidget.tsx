import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { weatherData } from "@/constants/weather";
import { formatTemperature } from "@/lib/formatTemperature";

export default function WeatherWidget() {
  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge tone="brand">Weather intelligence</Badge>

          <h2 className="mt-4 text-xl font-semibold">
            {weatherData.location}
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {weatherData.condition}
          </p>
        </div>

        <span
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-3xl dark:bg-amber-950"
          aria-hidden="true"
        >
          🌤️
        </span>
      </div>

      <div className="mt-6 flex items-end gap-3">
        <strong className="text-4xl font-semibold tracking-tight">
          {formatTemperature(weatherData.temperatureCelsius)}
        </strong>

        <span className="pb-1 text-sm text-[var(--text-secondary)]">
          Feels like {formatTemperature(weatherData.feelsLikeCelsius)}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-[var(--surface-secondary)] p-3 text-center">
          <p className="text-lg font-semibold">{weatherData.humidity}%</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Humidity
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--surface-secondary)] p-3 text-center">
          <p className="text-lg font-semibold">
            {weatherData.windSpeedKph}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Wind km/h
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--surface-secondary)] p-3 text-center">
          <p className="text-lg font-semibold">
            {weatherData.rainChance}%
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Rain
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--border-color)] bg-[var(--brand-soft)] p-4">
        <p className="text-sm font-semibold text-[var(--brand-primary)]">
          Plant AI advice
        </p>

        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          {weatherData.advice}
        </p>
      </div>
    </Card>
  );
}