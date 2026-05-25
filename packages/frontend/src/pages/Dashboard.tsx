import { Suspense, useState } from 'react';
import { NowWidget } from '@/components/NowWidget';
import { DualLineChart } from '@/components/DualLineChart';
import { NowWidgetSkeleton, ChartSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

const RANGES = [
  { label: '24h', hours: 24 },
  { label: '48h', hours: 48 },
  { label: '7d', hours: 24 * 7 },
  { label: '30d', hours: 24 * 30 },
] as const;

export function Dashboard() {
  const [hours, setHours] = useState<number>(48);

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
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight mb-1">Weather ↔ Music</h2>
            <p className="text-sm text-muted-foreground">
              Sześć par metryk pogoda × muzyka. Linie pomarańczowe/cyan = pogoda (lewa oś), fioletowe = muzyka (prawa oś).
            </p>
          </div>
          <RangePicker value={hours} onChange={setHours} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {PAIRS.map((p) => (
            <Suspense key={`${p.title}:${hours}`} fallback={<ChartSkeleton />}>
              <DualLineChart title={p.title} pair={p.pair} hours={hours} />
            </Suspense>
          ))}
        </div>
      </div>
    </div>
  );
}

function RangePicker({ value, onChange }: { value: number; onChange: (h: number) => void }) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5 bg-card">
      {RANGES.map((r) => (
        <Button
          key={r.label}
          size="sm"
          variant="ghost"
          className={cn(
            'h-7 px-3 text-xs font-medium',
            value === r.hours && 'bg-muted text-foreground',
          )}
          onClick={() => onChange(r.hours)}
        >
          {r.label}
        </Button>
      ))}
    </div>
  );
}
