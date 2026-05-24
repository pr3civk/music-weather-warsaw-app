import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const today = () => new Date().toISOString().slice(0, 10);
const weekAgo = () => new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10);

export function Export() {
  const [from, setFrom] = useState(weekAgo());
  const [to, setTo] = useState(today());
  const [format, setFormat] = useState<'json' | 'xml'>('json');

  function buildUrl() {
    const params = new URLSearchParams({
      format,
      from: new Date(from).toISOString(),
      to: new Date(to + 'T23:59:59').toISOString(),
    });
    return `/api/export?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Export</h1>
        <p className="text-sm text-muted-foreground">Download hourly aggregates as JSON or XML.</p>
      </header>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Build export</CardTitle>
          <CardDescription>Select date range and format.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="from">From</Label>
              <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to">To</Label>
              <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Format</Label>
            <div className="flex gap-2">
              {(['json', 'xml'] as const).map((f) => (
                <Button
                  key={f}
                  type="button"
                  variant={format === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormat(f)}
                >
                  {f.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          <a href={buildUrl()} download className="inline-block pt-2">
            <Button>Download {format.toUpperCase()}</Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
