export type HourlyPoint = {
  hour: string;
  temperature: number | null;
  precipitation: number | null;
  cloudCover: number | null;
  sunshineLastHour: number | null;
  avgValence: number | null;
  avgEnergy: number | null;
  avgTempo: number | null;
  avgDanceability: number | null;
  avgLoudness: number | null;
  avgAcousticness: number | null;
  avgSpeechiness: number | null;
  avgInstrumentalness: number | null;
};

export type CorrelationResult = {
  r: number;
  r2: number;
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  direction: 'positive' | 'negative' | 'none';
  label: string;
};

export type CorrelationMatrixEntry = {
  weatherMetric: string;
  musicMetric: string;
  result: CorrelationResult;
};

const WEATHER_METRICS = ['temperature', 'precipitation', 'cloudCover', 'sunshineLastHour'] as const;
const MUSIC_METRICS = [
  'avgValence',
  'avgEnergy',
  'avgTempo',
  'avgDanceability',
  'avgLoudness',
  'avgAcousticness',
  'avgSpeechiness',
  'avgInstrumentalness',
] as const;

export function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  let sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sx += x[i]!; sy += y[i]!; }
  const mx = sx / n;
  const my = sy / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i]! - mx;
    const b = y[i]! - my;
    num += a * b;
    dx2 += a * a;
    dy2 += b * b;
  }
  const denom = Math.sqrt(dx2 * dy2);
  if (denom === 0) return 0;
  return num / denom;
}

export function describeCorrelation(r: number): CorrelationResult {
  const abs = Math.abs(r);
  let strength: CorrelationResult['strength'] = 'none';
  if (abs >= 0.7) strength = 'strong';
  else if (abs >= 0.4) strength = 'moderate';
  else if (abs >= 0.2) strength = 'weak';
  const direction: CorrelationResult['direction'] = r > 0.05 ? 'positive' : r < -0.05 ? 'negative' : 'none';
  const label =
    strength === 'none'
      ? 'no correlation'
      : `${strength} ${direction === 'none' ? '' : direction}`.trim();
  return { r: round(r, 3), r2: round(r * r, 3), strength, direction, label };
}

function round(x: number, digits = 3): number {
  const k = 10 ** digits;
  return Math.round(x * k) / k;
}

export function computeCorrelationMatrix(data: HourlyPoint[]): CorrelationMatrixEntry[] {
  const out: CorrelationMatrixEntry[] = [];
  for (const wm of WEATHER_METRICS) {
    for (const mm of MUSIC_METRICS) {
      const pairs = data
        .map((d) => ({ a: d[wm], b: d[mm] }))
        .filter((p): p is { a: number; b: number } => typeof p.a === 'number' && typeof p.b === 'number');
      const xs = pairs.map((p) => p.a);
      const ys = pairs.map((p) => p.b);
      const r = pearson(xs, ys);
      out.push({ weatherMetric: wm, musicMetric: mm, result: describeCorrelation(r) });
    }
  }
  return out;
}
