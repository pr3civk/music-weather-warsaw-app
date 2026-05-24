import { useMemo } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { queries } from '@/api/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fmtHour } from '@/lib/format';
import { startOfHourMinusIso } from '@/lib/time';

const tooltipStyle = {
  background: 'oklch(0.205 0 0)',
  border: '1px solid oklch(1 0 0 / 15%)',
  borderRadius: 6,
  fontSize: 12,
};

export function WeatherCharts() {
  const fromIso = useMemo(() => startOfHourMinusIso(72), []);
  const { data } = useSuspenseQuery(queries.weather(fromIso));

  const series = [...data]
    .reverse()
    .map((d) => ({
      hour: fmtHour(d.capturedAt),
      temperature: d.temperature,
      precipitation: d.precipitation,
      cloudCover: d.cloudCover,
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Temperature (72h)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.70 0.17 50)" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="oklch(0.70 0.17 50)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 8%)" />
              <XAxis dataKey="hour" stroke="oklch(0.708 0 0)" fontSize={11} />
              <YAxis stroke="oklch(0.708 0 0)" fontSize={11} unit="°" />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="temperature"
                stroke="oklch(0.70 0.17 50)"
                fill="url(#tempGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Precipitation (72h)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 8%)" />
              <XAxis dataKey="hour" stroke="oklch(0.708 0 0)" fontSize={11} />
              <YAxis stroke="oklch(0.708 0 0)" fontSize={11} unit=" mm" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="precipitation" fill="oklch(0.65 0.15 195)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
