import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { queries, mutations } from "@/api/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { fmtNum, fmtDate, weatherLabel } from "@/lib/format";

export function NowWidget() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(queries.current());

  const trigger = useMutation({
    ...mutations.trigger(),
    onSuccess: () => qc.invalidateQueries(),
  });

  const w = data.weather;
  const m = data.music;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            Now in Warsaw
            {w && (
              <Badge variant="outline" className="font-normal text-xs">
                {weatherLabel(w.weatherCode)}
              </Badge>
            )}
          </CardTitle>
          {w && (
            <p className="text-xs text-muted-foreground mt-1">
              Captured at {fmtDate(w.capturedAt)}
            </p>
          )}
        </div>
        {user?.role === "admin" && (
          <Button
            size="sm"
            variant="outline"
            disabled={trigger.isPending}
            onClick={() => trigger.mutate()}
          >
            {trigger.isPending ? "Triggering…" : "Trigger fetch"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Metric
          label="Temperature"
          value={`${fmtNum(w?.temperature ?? null, 1)}°C`}
        />
        <Metric
          label="Precipitation"
          value={`${fmtNum(w?.precipitation ?? null, 1)} mm`}
        />
        <Metric
          label="Cloud cover"
          value={`${fmtNum(w?.cloudCover ?? null, 0)}%`}
        />
        <Metric
          label="Sunshine"
          value={`${fmtNum((w?.sunshineLastHour ?? 0) / 60, 1)} min`}
        />
        <Metric label="Valence" value={fmtNum(m.avgValence)} accent />
        <Metric label="Energy" value={fmtNum(m.avgEnergy)} accent />
        <Metric label="Tempo" value={`${fmtNum(m.avgTempo, 1)} BPM`} accent />
        <Metric label="Danceability" value={fmtNum(m.avgDanceability)} accent />
        <Metric
          label="Loudness"
          value={`${fmtNum(m.avgLoudness, 1)} dB`}
          accent
        />
        <Metric label="Acousticness" value={fmtNum(m.avgAcousticness)} accent />
        <Metric label="Speechiness" value={fmtNum(m.avgSpeechiness)} accent />
        <Metric
          label="Instrumental"
          value={fmtNum(m.avgInstrumentalness)}
          accent
        />
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`text-xl font-semibold mt-1 ${accent ? "text-primary" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
