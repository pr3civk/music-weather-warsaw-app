import { useMemo } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { queries } from '@/api/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fmtHour } from '@/lib/format';
import { startOfHourMinusIso } from '@/lib/time';

type WeatherKey = 'temperature' | 'precipitation' | 'cloudCover' | 'sunshineLastHour';
type MusicKey =
  | 'avgValence'
  | 'avgEnergy'
  | 'avgTempo'
  | 'avgDanceability'
  | 'avgLoudness'
  | 'avgAcousticness'
  | 'avgSpeechiness'
  | 'avgInstrumentalness';

type Pair = {
  leftKey: WeatherKey;
  rightKey: MusicKey;
  leftLabel: string;
  rightLabel: string;
  leftColor: string;
  rightColor: string;
};

export function DualLineChart({ title, pair, hours = 48 }: { title: string; pair: Pair; hours?: number }) {
  const fromIso = useMemo(() => startOfHourMinusIso(hours), [hours]);
  const { data } = useSuspenseQuery(queries.correlation(fromIso));
  const series = data.timeSeries.map((d) => ({
    hour: fmtHour(d.hour),
    [pair.leftKey]: d[pair.leftKey],
    [pair.rightKey]: d[pair.rightKey],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 25%)" />
            <XAxis dataKey="hour" stroke="hsl(220 15% 55%)" fontSize={11} />
            <YAxis yAxisId="left" stroke={pair.leftColor} fontSize={11} />
            <YAxis yAxisId="right" orientation="right" stroke={pair.rightColor} fontSize={11} />
            <Tooltip
              contentStyle={{
                background: 'hsl(220 24% 8%)',
                border: '1px solid hsl(220 16% 20%)',
                borderRadius: 6,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey={pair.leftKey}
              name={pair.leftLabel}
              stroke={pair.leftColor}
              dot={false}
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey={pair.rightKey}
              name={pair.rightLabel}
              stroke={pair.rightColor}
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
