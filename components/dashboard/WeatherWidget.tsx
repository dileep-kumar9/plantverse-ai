"use client";

import { useState } from "react";
import { LocateFixed, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatTemperature } from "@/lib/formatTemperature";

type Weather = {
  temperatureCelsius: number;
  feelsLikeCelsius: number;
  humidity: number;
  windSpeedKph: number;
  rainChance: number;
  condition: string;
  advice: string;
  timezone: string;
};

function iconFor(condition: string) {
  const value = condition.toLowerCase();
  if (value.includes("thunder")) return "⛈️";
  if (value.includes("rain") || value.includes("drizzle")) return "🌧️";
  if (value.includes("snow")) return "❄️";
  if (value.includes("fog")) return "🌫️";
  if (value.includes("clear")) return "☀️";
  return "🌤️";
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadWeather() {
    if (!navigator.geolocation) {
      setError("Location services are not supported by this browser.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const query = new URLSearchParams({
          lat: String(position.coords.latitude),
          lon: String(position.coords.longitude),
        });
        void apiFetch<{ weather: Weather }>(`/api/weather?${query}`)
          .then((response) => setWeather(response.weather))
          .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Unable to load weather."))
          .finally(() => setLoading(false));
      },
      (positionError) => {
        setLoading(false);
        setError(positionError.code === positionError.PERMISSION_DENIED
          ? "Location permission was not granted. You can enable it in your browser settings."
          : "Your location could not be determined.");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 15 * 60 * 1000 },
    );
  }

  return (
    <Card className="h-full" aria-busy={loading}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge tone="brand">Weather intelligence</Badge>
          <h2 className="mt-4 text-xl font-semibold">{weather ? weather.condition : "Local growing weather"}</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {weather ? `Forecast timezone: ${weather.timezone}` : "Share your location only when you are ready to request current conditions."}
          </p>
        </div>
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-3xl dark:bg-amber-950" aria-hidden="true">{weather ? iconFor(weather.condition) : "🌤️"}</span>
      </div>

      {!weather ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--surface-secondary)] p-5">
          <p className="text-sm leading-6 text-[var(--text-secondary)]">PlantVerse does not request precise location until you press the button below. Coordinates are sent only to the weather endpoint for this request.</p>
          <Button onClick={loadWeather} disabled={loading} className="mt-4">
            {loading ? <RefreshCw size={17} className="animate-spin" /> : <LocateFixed size={17} />}
            {loading ? "Loading weather…" : "Use my location"}
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-end gap-3">
            <strong className="text-4xl font-semibold tracking-tight">{formatTemperature(weather.temperatureCelsius)}</strong>
            <span className="pb-1 text-sm text-[var(--text-secondary)]">Feels like {formatTemperature(weather.feelsLikeCelsius)}</span>
            <button type="button" onClick={loadWeather} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary)] hover:underline"><RefreshCw size={14} /> Refresh</button>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-[var(--surface-secondary)] p-3 text-center"><p className="text-lg font-semibold">{Math.round(weather.humidity)}%</p><p className="mt-1 text-xs text-[var(--text-secondary)]">Humidity</p></div>
            <div className="rounded-2xl bg-[var(--surface-secondary)] p-3 text-center"><p className="text-lg font-semibold">{Math.round(weather.windSpeedKph)}</p><p className="mt-1 text-xs text-[var(--text-secondary)]">Wind km/h</p></div>
            <div className="rounded-2xl bg-[var(--surface-secondary)] p-3 text-center"><p className="text-lg font-semibold">{Math.round(weather.rainChance)}%</p><p className="mt-1 text-xs text-[var(--text-secondary)]">Rain</p></div>
          </div>
          <div className="mt-5 rounded-2xl border border-[var(--border-color)] bg-[var(--brand-soft)] p-4">
            <p className="text-sm font-semibold text-[var(--brand-primary)]">Weather-based care note</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{weather.advice}</p>
          </div>
        </>
      )}
      {error ? <p role="alert" className="mt-4 text-sm text-red-600">{error}</p> : null}
    </Card>
  );
}
