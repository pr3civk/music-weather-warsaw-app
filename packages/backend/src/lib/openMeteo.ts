export type CurrentWeather = {
  temperature: number | null;
  precipitation: number | null;
  cloudCover: number | null;
  windSpeed: number | null;
  sunshineLastHour: number | null;
  weatherCode: number | null;
};

const WARSAW = { lat: 52.2297, lon: 21.0122 };

export async function fetchCurrentWeather(): Promise<CurrentWeather> {
  const params = new URLSearchParams({
    latitude: String(WARSAW.lat),
    longitude: String(WARSAW.lon),
    timezone: 'Europe/Warsaw',
    current: 'temperature_2m,precipitation,cloud_cover,wind_speed_10m,weather_code',
    hourly: 'sunshine_duration',
    past_hours: '1',
    forecast_hours: '1',
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`open-meteo failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as {
    current?: {
      temperature_2m?: number;
      precipitation?: number;
      cloud_cover?: number;
      wind_speed_10m?: number;
      weather_code?: number;
      time?: string;
    };
    hourly?: {
      time?: string[];
      sunshine_duration?: number[];
    };
  };
  const c = data.current ?? {};
  const hour = c.time?.slice(0, 13); // "YYYY-MM-DDTHH"
  let sunshine: number | null = null;
  if (hour && data.hourly?.time && data.hourly.sunshine_duration) {
    const idx = data.hourly.time.findIndex((t) => t.startsWith(hour));
    if (idx >= 0) sunshine = data.hourly.sunshine_duration[idx] ?? null;
  }
  return {
    temperature: c.temperature_2m ?? null,
    precipitation: c.precipitation ?? null,
    cloudCover: c.cloud_cover ?? null,
    windSpeed: c.wind_speed_10m ?? null,
    sunshineLastHour: sunshine,
    weatherCode: c.weather_code ?? null,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fetchCurrentWeather()
    .then((r) => console.log(r))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
