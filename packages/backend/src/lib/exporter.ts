import { Builder } from 'xml2js';

export type ExportRow = {
  hour: string;
  temperature: number | null;
  precipitation: number | null;
  cloudCover: number | null;
  sunshineLastHour: number | null;
  weatherCode: number | null;
  avgValence: number | null;
  avgEnergy: number | null;
  avgTempo: number | null;
  avgDanceability: number | null;
  avgLoudness: number | null;
  avgAcousticness: number | null;
  avgSpeechiness: number | null;
  avgInstrumentalness: number | null;
  trackCount: number;
};

export type ExportMeta = {
  from: string;
  to: string;
  count: number;
  generatedAt: string;
};

export function buildJsonExport(rows: ExportRow[], meta: ExportMeta): string {
  return JSON.stringify({ meta, data: rows }, null, 2);
}

export function buildXmlExport(rows: ExportRow[], meta: ExportMeta): string {
  const builder = new Builder({ rootName: 'export', renderOpts: { pretty: true, indent: '  ' } });
  return builder.buildObject({
    meta,
    data: { row: rows.map((r) => ({ $: { hour: r.hour }, ...r })) },
  });
}
