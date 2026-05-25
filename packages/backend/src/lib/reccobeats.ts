const BASE = 'https://api.reccobeats.com/v1';
const BATCH_SIZE = 40;

export type AudioFeatures = {
  valence: number | null;
  energy: number | null;
  tempo: number | null;
  danceability: number | null;
  loudness: number | null;
  acousticness: number | null;
  speechiness: number | null;
  instrumentalness: number | null;
};

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function lookupReccoIds(spotifyIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (spotifyIds.length === 0) return map;
  const chunks: string[][] = [];
  for (let i = 0; i < spotifyIds.length; i += BATCH_SIZE) {
    chunks.push(spotifyIds.slice(i, i + BATCH_SIZE));
  }
  for (const chunk of chunks) {
    try {
      await lookupBatch(chunk, map);
    } catch (e) {
      console.warn('[reccobeats] batch failed, falling back to single:', e);
      for (const id of chunk) {
        try {
          await lookupBatch([id], map);
        } catch (e2) {
          console.warn(`[reccobeats] single lookup failed for ${id}:`, e2);
        }
        await sleep(200);
      }
    }
    await sleep(200);
  }
  return map;
}

async function lookupBatch(spotifyIds: string[], out: Map<string, string>) {
  const params = spotifyIds.map((id) => `ids=${encodeURIComponent(id)}`).join('&');
  const res = await fetch(`${BASE}/track?${params}`);
  if (!res.ok) {
    if (res.status === 414) throw new Error('414 URI too long');
    throw new Error(`reccobeats lookup failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    content?: Array<{ id: string; href?: string }>;
  };
  for (const t of data.content ?? []) {
    // href format: https://open.spotify.com/track/{spotifyId}
    const spId = t.href?.split('/').pop();
    if (spId) out.set(spId, t.id);
  }
}

export type TrackMetadata = {
  spotifyId: string;
  reccoId: string;
  title: string;
  artist: string;
  durationMs: number | null;
  popularity: number | null;
};

type ReccoTrackRaw = {
  id: string;
  trackTitle?: string;
  artists?: Array<{ name?: string }>;
  durationMs?: number;
  popularity?: number;
  href?: string;
  availableCountries?: string;
};

export async function fetchTracksMetadata(
  spotifyIds: string[]
): Promise<TrackMetadata[]> {
  const out: TrackMetadata[] = [];
  if (spotifyIds.length === 0) return out;
  const chunks: string[][] = [];
  for (let i = 0; i < spotifyIds.length; i += BATCH_SIZE) {
    chunks.push(spotifyIds.slice(i, i + BATCH_SIZE));
  }
  for (const chunk of chunks) {
    try {
      const params = chunk.map((id) => `ids=${encodeURIComponent(id)}`).join('&');
      const res = await fetch(`${BASE}/track?${params}`);
      if (!res.ok) throw new Error(`reccobeats metadata failed: ${res.status}`);
      const data = (await res.json()) as { content?: ReccoTrackRaw[] };
      for (const t of data.content ?? []) {
        const spId = t.href?.split('/').pop();
        if (!spId || !t.id) continue;
        out.push({
          spotifyId: spId,
          reccoId: t.id,
          title: t.trackTitle ?? 'Unknown',
          artist: t.artists?.map((a) => a.name).filter(Boolean).join(', ') || 'Unknown',
          durationMs: t.durationMs ?? null,
          popularity: t.popularity ?? null,
        });
      }
    } catch (e) {
      console.warn('[reccobeats] metadata batch failed:', e);
    }
    await sleep(200);
  }
  return out;
}

async function fetchFeatures(reccoId: string): Promise<AudioFeatures | null> {
  const res = await fetch(`${BASE}/track/${reccoId}/audio-features`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`reccobeats features failed: ${res.status}`);
  const f = (await res.json()) as Partial<AudioFeatures>;
  return {
    valence: f.valence ?? null,
    energy: f.energy ?? null,
    tempo: f.tempo ?? null,
    danceability: f.danceability ?? null,
    loudness: f.loudness ?? null,
    acousticness: f.acousticness ?? null,
    speechiness: f.speechiness ?? null,
    instrumentalness: f.instrumentalness ?? null,
  };
}

export async function fetchAudioFeaturesBySpotifyIds(
  spotifyIds: string[]
): Promise<Map<string, AudioFeatures>> {
  const out = new Map<string, AudioFeatures>();
  const reccoMap = await lookupReccoIds(spotifyIds);
  for (const [spId, reccoId] of reccoMap) {
    try {
      const f = await fetchFeatures(reccoId);
      if (f) out.set(spId, f);
    } catch (e) {
      console.warn(`[reccobeats] features failed for ${spId}:`, e);
    }
    await sleep(200);
  }
  return out;
}
