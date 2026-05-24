import { Suspense } from 'react';
import { NowWidget } from '@/components/NowWidget';
import { DualLineChart } from '@/components/DualLineChart';
import { NowWidgetSkeleton, ChartSkeleton } from '@/components/skeletons';

const WEATHER_COLOR = {
  temperature: 'oklch(0.70 0.17 50)',
  precipitation: 'oklch(0.65 0.15 195)',
  cloudCover: 'oklch(0.62 0.05 240)',
  sunshineLastHour: 'oklch(0.78 0.18 90)',
} as const;

const MUSIC_COLOR = 'oklch(0.65 0.21 290)';

const PAIRS = [
  {
    title: 'Temperature ↔ Valence',
    pair: {
      leftKey: 'temperature' as const,
      rightKey: 'avgValence' as const,
      leftLabel: 'Temp °C',
      rightLabel: 'Valence',
      leftColor: WEATHER_COLOR.temperature,
      rightColor: MUSIC_COLOR,
    },
  },
  {
    title: 'Precipitation ↔ Valence (rain = sadder?)',
    pair: {
      leftKey: 'precipitation' as const,
      rightKey: 'avgValence' as const,
      leftLabel: 'Precip mm',
      rightLabel: 'Valence',
      leftColor: WEATHER_COLOR.precipitation,
      rightColor: MUSIC_COLOR,
    },
  },
  {
    title: 'Precipitation ↔ Instrumentalness',
    pair: {
      leftKey: 'precipitation' as const,
      rightKey: 'avgInstrumentalness' as const,
      leftLabel: 'Precip mm',
      rightLabel: 'Instrumental',
      leftColor: WEATHER_COLOR.precipitation,
      rightColor: MUSIC_COLOR,
    },
  },
  {
    title: 'Cloud cover ↔ Acousticness',
    pair: {
      leftKey: 'cloudCover' as const,
      rightKey: 'avgAcousticness' as const,
      leftLabel: 'Cloud %',
      rightLabel: 'Acoustic',
      leftColor: WEATHER_COLOR.cloudCover,
      rightColor: MUSIC_COLOR,
    },
  },
  {
    title: 'Sunshine ↔ Danceability',
    pair: {
      leftKey: 'sunshineLastHour' as const,
      rightKey: 'avgDanceability' as const,
      leftLabel: 'Sunshine s',
      rightLabel: 'Dance',
      leftColor: WEATHER_COLOR.sunshineLastHour,
      rightColor: MUSIC_COLOR,
    },
  },
  {
    title: 'Temperature ↔ Energy',
    pair: {
      leftKey: 'temperature' as const,
      rightKey: 'avgEnergy' as const,
      leftLabel: 'Temp °C',
      rightLabel: 'Energy',
      leftColor: WEATHER_COLOR.temperature,
      rightColor: MUSIC_COLOR,
    },
  },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">Live weather + Top 50 PL Spotify snapshot.</p>
      </header>

      <Suspense fallback={<NowWidgetSkeleton />}>
        <NowWidget />
      </Suspense>

      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-1">Weather ↔ Music (last 48h)</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Sześć par metryk pogoda × muzyka. Linie pomarańczowe/cyan = pogoda (lewa oś), fioletowe = muzyka (prawa oś).
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {PAIRS.map((p) => (
            <Suspense key={p.title} fallback={<ChartSkeleton />}>
              <DualLineChart title={p.title} pair={p.pair} />
            </Suspense>
          ))}
        </div>
      </div>
    </div>
  );
}
