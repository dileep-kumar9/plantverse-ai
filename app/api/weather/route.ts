import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/server/require-user";

function conditionFromCode(code: number): string {
  if (code === 0) return "Clear sky";
  if ([1, 2, 3].includes(code)) return "Partly cloudy";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
  if ([71, 73, 75, 77].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Rain showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorms";
  return "Mixed weather";
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await enforceRateLimit(request, "weather", 60, 60 * 60, user.sub);
    const latitude = Number(request.nextUrl.searchParams.get("lat"));
    const longitude = Number(request.nextUrl.searchParams.get("lon"));
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return NextResponse.json({ error: "Invalid latitude." }, { status: 400 });
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: "Invalid longitude." }, { status: 400 });
    }

    const endpoint = new URL("https://api.open-meteo.com/v1/forecast");
    endpoint.searchParams.set("latitude", String(latitude));
    endpoint.searchParams.set("longitude", String(longitude));
    endpoint.searchParams.set(
      "current",
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
    );
    endpoint.searchParams.set("daily", "precipitation_probability_max");
    endpoint.searchParams.set("forecast_days", "1");
    endpoint.searchParams.set("timezone", "auto");

    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Weather service is temporarily unavailable.");
    const data = (await response.json()) as {
      timezone?: string;
      current?: {
        temperature_2m?: number;
        relative_humidity_2m?: number;
        apparent_temperature?: number;
        weather_code?: number;
        wind_speed_10m?: number;
      };
      daily?: { precipitation_probability_max?: number[] };
    };
    const current = data.current;
    if (!current) throw new Error("Weather data was incomplete.");
    const rainChance = Number(data.daily?.precipitation_probability_max?.[0] ?? 0);
    const condition = conditionFromCode(Number(current.weather_code ?? -1));
    const advice =
      rainChance >= 60
        ? "Rain is likely. Check soil moisture before watering and protect recently treated plants."
        : Number(current.temperature_2m ?? 0) >= 34
          ? "Heat stress is possible. Water early, mulch the soil, and avoid spraying during the hottest hours."
          : Number(current.relative_humidity_2m ?? 0) >= 80
            ? "High humidity can increase fungal risk. Improve airflow and avoid wetting leaves late in the day."
            : "Conditions are moderate. Check the soil before watering instead of following a fixed schedule.";

    return NextResponse.json({
      weather: {
        temperatureCelsius: Number(current.temperature_2m ?? 0),
        feelsLikeCelsius: Number(current.apparent_temperature ?? current.temperature_2m ?? 0),
        humidity: Number(current.relative_humidity_2m ?? 0),
        windSpeedKph: Number(current.wind_speed_10m ?? 0),
        rainChance,
        condition,
        advice,
        timezone: data.timezone ?? "auto",
      },
    });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 500);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load weather." },
      { status },
    );
  }
}
