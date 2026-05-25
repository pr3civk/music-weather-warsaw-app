import { useState, useMemo } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { queries } from '@/api/queries';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fmtNum } from '@/lib/format';
import { cn } from '@/lib/utils';
import { startOfHourMinusIso } from '@/lib/time';

type SortKey = 'avgPosition' | 'valence' | 'energy' | 'tempo' | 'danceability' | 'popularity';

type Props = {
  hours?: number;
  query?: string;
  minPopularity?: number;
};

export function TrackTable({ hours = 48, query = '', minPopularity = 0 }: Props = {}) {
  const fromIso = useMemo(() => startOfHourMinusIso(hours), [hours]);
  const { data } = useSuspenseQuery(queries.music(fromIso, undefined, 200));
  const [sort, setSort] = useState<SortKey>('avgPosition');
  const [asc, setAsc] = useState(true);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = data.filter((t) => {
      if (minPopularity > 0 && (t.popularity ?? 0) < minPopularity) return false;
      if (q) {
        const hay = `${t.name} ${t.artist}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    filtered.sort((a, b) => {
      const va = a[sort];
      const vb = b[sort];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return asc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return filtered;
  }, [data, sort, asc, query, minPopularity]);

  function toggle(k: SortKey) {
    if (k === sort) setAsc(!asc);
    else {
      setSort(k);
      setAsc(k === 'avgPosition');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top tracks ({rows.length} {rows.length === 1 ? 'match' : 'matches'})</CardTitle>
        <CardDescription>Click any column header to sort. Filters apply client-side.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHead label="#" k="avgPosition" sort={sort} asc={asc} onSort={toggle} />
              <TableHead>Track</TableHead>
              <TableHead>Artist</TableHead>
              <SortHead label="Pop" k="popularity" sort={sort} asc={asc} onSort={toggle} />
              <SortHead label="Valence" k="valence" sort={sort} asc={asc} onSort={toggle} accent />
              <SortHead label="Energy" k="energy" sort={sort} asc={asc} onSort={toggle} accent />
              <SortHead label="Tempo" k="tempo" sort={sort} asc={asc} onSort={toggle} accent />
              <SortHead label="Dance" k="danceability" sort={sort} asc={asc} onSort={toggle} accent />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {t.avgPosition != null ? t.avgPosition.toFixed(1) : '–'}
                </TableCell>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="text-muted-foreground">{t.artist}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">{t.popularity ?? '–'}</Badge>
                </TableCell>
                <FeatureCell v={t.valence} />
                <FeatureCell v={t.energy} />
                <TableCell className="font-mono text-xs">{fmtNum(t.tempo, 1)}</TableCell>
                <FeatureCell v={t.danceability} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function SortHead({
  label, k, sort, asc, onSort, accent,
}: {
  label: string;
  k: SortKey;
  sort: SortKey;
  asc: boolean;
  onSort: (k: SortKey) => void;
  accent?: boolean;
}) {
  const active = sort === k;
  return (
    <TableHead
      className={cn(
        'cursor-pointer select-none hover:text-foreground',
        active && 'text-foreground',
        accent && 'text-primary/80'
      )}
      onClick={() => onSort(k)}
    >
      {label}{active ? (asc ? ' ↑' : ' ↓') : ''}
    </TableHead>
  );
}

function FeatureCell({ v }: { v: number | null }) {
  if (v == null) return <TableCell className="text-muted-foreground">–</TableCell>;
  return (
    <TableCell>
      <div className="flex items-center gap-2">
        <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${Math.round(v * 100)}%` }} />
        </div>
        <span className="font-mono text-xs">{v.toFixed(2)}</span>
      </div>
    </TableCell>
  );
}
