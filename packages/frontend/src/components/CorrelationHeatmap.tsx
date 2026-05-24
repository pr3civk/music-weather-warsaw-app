import { useSuspenseQuery } from '@tanstack/react-query';
import { queries } from '@/api/queries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const WEATHER_LABELS: Record<string, string> = {
  temperature: 'Temperature',
  precipitation: 'Precipitation',
  cloudCover: 'Cloud cover',
  sunshineLastHour: 'Sunshine',
};
const MUSIC_LABELS: Record<string, string> = {
  avgValence: 'Valence',
  avgEnergy: 'Energy',
  avgTempo: 'Tempo',
  avgDanceability: 'Dance',
  avgLoudness: 'Loudness',
  avgAcousticness: 'Acoustic',
  avgSpeechiness: 'Speech',
  avgInstrumentalness: 'Instrumental',
};
const WEATHER_KEYS = ['temperature', 'precipitation', 'cloudCover', 'sunshineLastHour'];
const MUSIC_KEYS = [
  'avgValence',
  'avgEnergy',
  'avgTempo',
  'avgDanceability',
  'avgLoudness',
  'avgAcousticness',
  'avgSpeechiness',
  'avgInstrumentalness',
];

function cellStyle(r: number): React.CSSProperties {
  const intensity = Math.min(1, Math.abs(r));
  if (r >= 0) {
    return { background: `oklch(0.55 ${0.22 * intensity} 290 / ${0.15 + 0.6 * intensity})` };
  }
  return { background: `oklch(0.65 ${0.18 * intensity} 50 / ${0.15 + 0.6 * intensity})` };
}

export function CorrelationHeatmap() {
  const { data } = useSuspenseQuery(queries.correlation());

  if (data.warning) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Correlation matrix</CardTitle>
          <CardDescription>{data.warning} (n={data.dataPoints})</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const matrixByKey = new Map(
    data.matrix.map((m) => [`${m.weatherMetric}|${m.musicMetric}`, m.result])
  );

  const ranking = [...data.matrix]
    .sort((a, b) => Math.abs(b.result.r) - Math.abs(a.result.r))
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Correlation matrix</CardTitle>
          <CardDescription>
            Pearson r — purple = positive, orange = negative. n = {data.dataPoints} hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-xs uppercase text-muted-foreground font-medium p-2"></th>
                  {MUSIC_KEYS.map((mk) => (
                    <th key={mk} className="text-left text-xs uppercase text-muted-foreground font-medium p-2">
                      {MUSIC_LABELS[mk]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WEATHER_KEYS.map((wk) => (
                  <tr key={wk}>
                    <th className="text-left text-xs uppercase text-muted-foreground font-medium p-2">
                      {WEATHER_LABELS[wk]}
                    </th>
                    {MUSIC_KEYS.map((mk) => {
                      const r = matrixByKey.get(`${wk}|${mk}`);
                      if (!r) return <td key={mk} />;
                      return (
                        <td key={mk} className="p-1">
                          <div
                            className="rounded-md p-3 border border-border/50 text-center"
                            style={cellStyle(r.r)}
                          >
                            <div className="text-base font-semibold">{r.r.toFixed(2)}</div>
                            <div className="text-[10px] uppercase tracking-wider text-foreground/70 mt-0.5">
                              {r.strength}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top 5 strongest</CardTitle>
          <CardDescription>Sorted by |r|</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ranking.map((row, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm">
                  {WEATHER_LABELS[row.weatherMetric]} ↔ {MUSIC_LABELS[row.musicMetric]}
                </div>
                <div className="text-xs text-muted-foreground">{row.result.label}</div>
              </div>
              <Badge
                variant="outline"
                className="font-mono"
                style={{ borderColor: row.result.r >= 0 ? 'oklch(0.65 0.21 290)' : 'oklch(0.70 0.17 50)' }}
              >
                r = {row.result.r.toFixed(2)}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
