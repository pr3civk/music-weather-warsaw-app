import { env } from '../env.js';

export const TOP_PL_PLAYLIST_ID = '37i9dQZEVXbN6itCcaL3Tt'; // Top 50 - Polska (Spotify editorial)

type TokenCache = { token: string; expiresAt: number };
let cache: TokenCache | null = null;

async function getToken(): Promise<string> {
  const now = Date.now();
  if (cache && cache.expiresAt > now + 60_000) return cache.token;
  const basic = Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`spotify token failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cache = { token: data.access_token, expiresAt: now + data.expires_in * 1000 };
  return cache.token;
}

export type SpotifyTrack = {
  spotifyId: string;
  name: string;
  artist: string;
  album: string | null;
  durationMs: number | null;
  popularity: number | null;
  position: number;
};

type SpotifyTrackRaw = {
  id: string | null;
  name: string;
  artists: Array<{ name: string }>;
  album?: { name?: string };
  duration_ms?: number;
  popularity?: number;
};

function mapTrack(t: SpotifyTrackRaw, position: number): SpotifyTrack | null {
  if (!t.id) return null;
  return {
    spotifyId: t.id,
    name: t.name,
    artist: t.artists.map((a) => a.name).join(', '),
    album: t.album?.name ?? null,
    durationMs: t.duration_ms ?? null,
    popularity: t.popularity ?? null,
    position,
  };
}

export async function getTopPL(playlistId = TOP_PL_PLAYLIST_ID): Promise<{ playlistId: string; tracks: SpotifyTrack[] }> {
  const token = await getToken();
  const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50&market=PL`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.ok) {
    const data = (await res.json()) as { items: Array<{ track: SpotifyTrackRaw | null }> };
    const tracks: SpotifyTrack[] = [];
    data.items.forEach((item, i) => {
      if (!item.track) return;
      const m = mapTrack(item.track, i + 1);
      if (m) tracks.push(m);
    });
    return { playlistId, tracks };
  }
  if (res.status === 403) {
    console.warn('[spotify] playlist 403 (editorial Premium-gated) — falling back to /search');
    return await searchTopPL(token);
  }
  throw new Error(`spotify playlist failed: ${res.status} ${await res.text()}`);
}

async function searchTopPL(token: string): Promise<{ playlistId: string; tracks: SpotifyTrack[] }> {
  const year = new Date().getFullYear();
  // Spotify Search: popular PL tracks from current + previous year, sorted by popularity client-side
  const queries = [`year:${year - 1}-${year}`, `genre:"polish pop"`, `genre:"polish hip hop"`];
  const seen = new Set<string>();
  const collected: SpotifyTrackRaw[] = [];

  for (const q of queries) {
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&market=PL&limit=50`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      console.warn(`[spotify] search failed for "${q}":`, res.status);
      continue;
    }
    const data = (await res.json()) as { tracks?: { items?: SpotifyTrackRaw[] } };
    for (const t of data.tracks?.items ?? []) {
      if (t.id && !seen.has(t.id)) {
        seen.add(t.id);
        collected.push(t);
      }
    }
  }

  collected.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  const top50 = collected.slice(0, 50);
  const tracks = top50.map((t, i) => mapTrack(t, i + 1)).filter((t): t is SpotifyTrack => t !== null);
  return { playlistId: `search:fallback:${year}`, tracks };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  getTopPL()
    .then((r) => {
      console.log(`Got ${r.tracks.length} tracks from ${r.playlistId}`);
      console.log(r.tracks.slice(0, 5));
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
