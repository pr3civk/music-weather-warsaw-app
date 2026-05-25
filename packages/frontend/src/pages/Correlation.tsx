import { Suspense, useState } from 'react';
import { CorrelationHeatmap } from '@/components/CorrelationHeatmap';
import { CorrelationHeatmapSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const RANGES = [
  { label: '24h', hours: 24 },
  { label: '7d', hours: 24 * 7 },
  { label: '30d', hours: 24 * 30 },
  { label: 'All', hours: 0 },
] as const;

const WEATHER_OPTIONS = [
  { value: '', label: 'All weather' },
  { value: 'temperature', label: 'Temperature' },
  { value: 'precipitation', label: 'Precipitation' },
  { value: 'cloudCover', label: 'Cloud cover' },
  { value: 'sunshineLastHour', label: 'Sunshine' },
] as const;

const MUSIC_OPTIONS = [
  { value: '', label: 'All music' },
  { value: 'avgValence', label: 'Valence' },
  { value: 'avgEnergy', label: 'Energy' },
  { value: 'avgTempo', label: 'Tempo' },
  { value: 'avgDanceability', label: 'Danceability' },
  { value: 'avgLoudness', label: 'Loudness' },
  { value: 'avgAcousticness', label: 'Acousticness' },
  { value: 'avgSpeechiness', label: 'Speechiness' },
  { value: 'avgInstrumentalness', label: 'Instrumental' },
] as const;

export function Correlation() {
  const [hours, setHours] = useState<number>(0);
  const [weather, setWeather] = useState<string>('');
  const [music, setMusic] = useState<string>('');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Correlation</h1>
        <p className="text-sm text-muted-foreground">
          Pearson r between weather × music metrics. Filter to highlight a specific pair.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-4 p-4 rounded-md border border-border bg-card">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Range</Label>
          <div className="inline-flex rounded-md border border-border p-0.5">
            {RANGES.map((r) => (
              <Button
                key={r.label}
                size="sm"
                variant="ghost"
                className={cn('h-7 px-3 text-xs font-medium', hours === r.hours && 'bg-muted text-foreground')}
                onClick={() => setHours(r.hours)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="weather-sel" className="text-xs uppercase tracking-wider text-muted-foreground">
            Weather metric
          </Label>
          <select
            id="weather-sel"
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {WEATHER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="music-sel" className="text-xs uppercase tracking-wider text-muted-foreground">
            Music metric
          </Label>
          <select
            id="music-sel"
            value={music}
            onChange={(e) => setMusic(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {MUSIC_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {(weather || music || hours !== 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setWeather('');
              setMusic('');
              setHours(0);
            }}
          >
            Reset
          </Button>
        )}
      </div>

      <Suspense key={hours} fallback={<CorrelationHeatmapSkeleton />}>
        <CorrelationHeatmap hours={hours} highlightWeather={weather} highlightMusic={music} />
      </Suspense>
    </div>
  );
}
