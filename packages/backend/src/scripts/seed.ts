import { sql } from 'drizzle-orm';
import { db, pool } from '../db/client.js';
import {
  hourlyAggregates,
  spotifySnapshots,
  weatherSnapshots,
  tracks,
  snapshotTracks,
} from '../db/schema.js';
import { startOfHourWarsaw } from '../lib/time.js';
import { subHours } from 'date-fns';

const HOURS = 7 * 24;
const PLAYLIST_ID = '37i9dQZEVXbN6itCcaL3Tt';

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

const FAKE_TRACKS = Array.from({ length: 60 }).map((_, i) => ({
  spotifyId: `seed_${i.toString().padStart(3, '0')}`,
  name: `Seed Track ${i + 1}`,
  artist: `Seed Artist ${(i % 12) + 1}`,
  album: `Seed Album ${(i % 8) + 1}`,
  durationMs: Math.floor(rand(160_000, 240_000)),
  popularity: Math.floor(rand(50, 95)),
  baseValence: rand(0.2, 0.85),
  baseEnergy: rand(0.3, 0.9),
  baseTempo: rand(80, 160),
  baseDanceability: rand(0.4, 0.9),
  loudness: rand(-12, -4),
  acousticness: rand(0, 0.6),
  speechiness: rand(0.03, 0.2),
  instrumentalness: rand(0, 0.1),
}));

async function main() {
  console.log(`[seed] clearing existing data…`);
  await db.execute(sql`TRUNCATE snapshot_tracks, hourly_aggregates, spotify_snapshots, weather_snapshots, tracks RESTART IDENTITY CASCADE`);

  console.log(`[seed] inserting ${FAKE_TRACKS.length} tracks…`);
  const trackRows = await db
    .insert(tracks)
    .values(
      FAKE_TRACKS.map((t) => ({
        spotifyId: t.spotifyId,
        name: t.name,
        artist: t.artist,
        album: t.album,
        durationMs: t.durationMs,
        popularity: t.popularity,
        valence: t.baseValence,
        energy: t.baseEnergy,
        tempo: t.baseTempo,
        danceability: t.baseDanceability,
        loudness: t.loudness,
        acousticness: t.acousticness,
        speechiness: t.speechiness,
        instrumentalness: t.instrumentalness,
        featuresLoadedAt: new Date(),
      }))
    )
    .returning({ id: tracks.id, spotifyId: tracks.spotifyId });

  const trackIdBySpotify = new Map(trackRows.map((r) => [r.spotifyId, r.id]));
  const allIds = trackRows.map((r) => r.id);

  const baseHour = startOfHourWarsaw();
  console.log(`[seed] generating ${HOURS} hourly snapshots ending ${baseHour.toISOString()}…`);

  for (let i = HOURS - 1; i >= 0; i--) {
    const hour = subHours(baseHour, i);
    // synthetic weather with sinusoidal temp (daily cycle) + weekly drift
    const hOfDay = hour.getHours();
    const temp = 10 + 8 * Math.sin(((hOfDay - 6) / 24) * Math.PI * 2) + rand(-2, 2);
    const cloud = Math.max(0, Math.min(100, 50 + 40 * Math.sin(((i / 24) * Math.PI)) + rand(-15, 15)));
    const precip = cloud > 70 ? Math.max(0, rand(-0.5, 4)) : 0;
    const wind = rand(2, 18);
    const sunshine = Math.max(0, Math.min(3600, (100 - cloud) * 30 + rand(-200, 200)));
    const weatherCode = precip > 1 ? 61 : cloud > 70 ? 3 : cloud > 30 ? 2 : 0;

    await db.insert(weatherSnapshots).values({
      capturedAt: hour,
      temperature: temp,
      precipitation: precip,
      cloudCover: cloud,
      windSpeed: wind,
      sunshineLastHour: sunshine,
      weatherCode,
    });

    const [snap] = await db
      .insert(spotifySnapshots)
      .values({ capturedAt: hour, playlistId: PLAYLIST_ID, trackCount: 50 })
      .returning({ id: spotifySnapshots.id });
    if (!snap) continue;

    // pick 50 tracks at random for this snapshot
    const shuffled = [...allIds].sort(() => Math.random() - 0.5).slice(0, 50);
    await db.insert(snapshotTracks).values(
      shuffled.map((trackId, pos) => ({
        snapshotId: snap.id,
        trackId,
        position: pos + 1,
      }))
    );

    // synthetic correlation: warmer/sunnier → higher valence; rain → lower valence
    // bias tracks selected so aggregate valence/energy depend on weather
    const aggRows = await db.execute(sql`
      SELECT
        AVG(t.valence)::real AS avg_valence,
        AVG(t.energy)::real AS avg_energy,
        AVG(t.tempo)::real AS avg_tempo,
        AVG(t.danceability)::real AS avg_danceability,
        AVG(t.loudness)::real AS avg_loudness,
        AVG(t.acousticness)::real AS avg_acousticness,
        AVG(t.speechiness)::real AS avg_speechiness,
        AVG(t.instrumentalness)::real AS avg_instrumentalness
      FROM snapshot_tracks st JOIN tracks t ON t.id = st.track_id
      WHERE st.snapshot_id = ${snap.id}
    `);
    const baseAgg = aggRows.rows[0] as {
      avg_valence: number;
      avg_energy: number;
      avg_tempo: number;
      avg_danceability: number;
      avg_loudness: number;
      avg_acousticness: number;
      avg_speechiness: number;
      avg_instrumentalness: number;
    };
    // inject correlation: weather bias
    const tempBias = (temp - 10) / 30; // -0.3 .. +0.5
    const sunBias = sunshine / 3600 / 2; // 0 .. 0.5
    const rainFactor = precip > 0 ? Math.min(1, precip / 3) : 0; // 0..1
    const cloudFactor = cloud / 100; // 0..1

    // valence: cieplej/słonecznie ↑, deszcz ↓
    const avgValence = clamp(baseAgg.avg_valence + tempBias * 0.4 + sunBias * 0.3 - rainFactor * 0.25);
    // energy: cieplej → wyższe
    const avgEnergy = clamp(baseAgg.avg_energy + tempBias * 0.25 - rainFactor * 0.15);
    // tempo: cieplej → szybciej
    const avgTempo = baseAgg.avg_tempo + tempBias * 8 - rainFactor * 6;
    // danceability: słonecznie ↑
    const avgDanceability = clamp(baseAgg.avg_danceability + sunBias * 0.1);
    // loudness (dB, ujemny zwykle): zachmurzenie/deszcz → ciszej
    const avgLoudness = baseAgg.avg_loudness - cloudFactor * 1.5 - rainFactor * 1.0;
    // acousticness: deszcz/pochmurno → bardziej akustyczne
    const avgAcousticness = clamp(baseAgg.avg_acousticness + cloudFactor * 0.15 + rainFactor * 0.2);
    // speechiness: lekkie wahania, ciepło → trochę więcej (rap?)
    const avgSpeechiness = clamp(baseAgg.avg_speechiness + tempBias * 0.05);
    // instrumentalness: deszcz → instrumentalka, słońce → wokal
    const avgInstrumentalness = clamp(baseAgg.avg_instrumentalness + rainFactor * 0.15 - sunBias * 0.05);

    await db.insert(hourlyAggregates).values({
      hour,
      temperature: temp,
      precipitation: precip,
      cloudCover: cloud,
      sunshineLastHour: sunshine,
      weatherCode,
      avgValence,
      avgEnergy,
      avgTempo,
      avgDanceability,
      avgLoudness,
      avgAcousticness,
      avgSpeechiness,
      avgInstrumentalness,
      trackCount: 50,
    });
  }

  console.log(`[seed] done — inserted ${HOURS} hourly snapshots`);
  await pool.end();
}

function clamp(v: number, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, v));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
