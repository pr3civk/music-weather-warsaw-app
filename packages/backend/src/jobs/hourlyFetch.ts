import cron from "node-cron";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  weatherSnapshots,
  spotifySnapshots,
  snapshotTracks,
  tracks,
  hourlyAggregates,
} from "../db/schema.js";
import { fetchCurrentWeather } from "../lib/openMeteo.js";
import { getTopPL, TOP_PL_PLAYLIST_ID } from "../lib/spotify.js";
import { fetchAudioFeaturesBySpotifyIds } from "../lib/reccobeats.js";
import { startOfHourWarsaw } from "../lib/time.js";
import { env } from "../env.js";

function hasRealSpotifyCreds(): boolean {
  return (
    !!env.SPOTIFY_CLIENT_ID &&
    !env.SPOTIFY_CLIENT_ID.startsWith("your_") &&
    !!env.SPOTIFY_CLIENT_SECRET &&
    !env.SPOTIFY_CLIENT_SECRET.startsWith("your_")
  );
}

export function startCronJobs() {
  cron.schedule(
    "0 * * * *",
    () => {
      runHourlyFetch().catch((e) => console.error("[cron] run failed", e));
    },
    { timezone: "Europe/Warsaw" },
  );
  console.log('[cron] scheduled "0 * * * *" Europe/Warsaw');
}

export async function runHourlyFetch(): Promise<{
  capturedAt: Date;
  skipped: boolean;
}> {
  const capturedAt = startOfHourWarsaw();

  if (!hasRealSpotifyCreds()) {
    console.log(
      "[cron] skip — SPOTIFY_CLIENT_ID/SECRET are placeholders, fill .env to enable",
    );
    return { capturedAt, skipped: true };
  }

  const existing = await db
    .select({ id: hourlyAggregates.id, trackCount: hourlyAggregates.trackCount })
    .from(hourlyAggregates)
    .where(eq(hourlyAggregates.hour, capturedAt))
    .limit(1);
  if (existing.length > 0 && (existing[0]?.trackCount ?? 0) > 0) {
    console.log(`[cron] skip ${capturedAt.toISOString()} (already aggregated, tracks=${existing[0]?.trackCount})`);
    return { capturedAt, skipped: true };
  }
  if (existing.length > 0) {
    console.log(`[cron] retry ${capturedAt.toISOString()} (previous attempt had 0 tracks)`);
  }

  const [weather, spotify] = await Promise.all([
    fetchCurrentWeather(),
    getTopPL(),
  ]);

  const spotifyIds = spotify.tracks.map((t) => t.spotifyId);
  const existingTracks = spotifyIds.length
    ? await db
        .select({
          spotifyId: tracks.spotifyId,
          featuresLoadedAt: tracks.featuresLoadedAt,
        })
        .from(tracks)
        .where(
          sql`${tracks.spotifyId} IN (${sql.join(
            spotifyIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        )
    : [];
  const haveFeatures = new Set(
    existingTracks
      .filter((t) => t.featuresLoadedAt !== null)
      .map((t) => t.spotifyId),
  );
  const needFeatures = spotifyIds.filter((id) => !haveFeatures.has(id));

  let featuresMap = new Map<
    string,
    Awaited<ReturnType<typeof fetchAudioFeaturesBySpotifyIds>> extends Map<
      string,
      infer V
    >
      ? V
      : never
  >();
  if (needFeatures.length > 0) {
    try {
      featuresMap = await fetchAudioFeaturesBySpotifyIds(needFeatures);
    } catch (e) {
      console.warn(
        "[cron] reccobeats batch failed, continuing without features:",
        e,
      );
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .insert(weatherSnapshots)
      .values({
        capturedAt,
        temperature: weather.temperature,
        precipitation: weather.precipitation,
        cloudCover: weather.cloudCover,
        windSpeed: weather.windSpeed,
        sunshineLastHour: weather.sunshineLastHour,
        weatherCode: weather.weatherCode,
      })
      .onConflictDoNothing({ target: weatherSnapshots.capturedAt });

    const [snap] = await tx
      .insert(spotifySnapshots)
      .values({
        capturedAt,
        playlistId: spotify.playlistId || TOP_PL_PLAYLIST_ID,
        trackCount: spotify.tracks.length,
      })
      .onConflictDoNothing({ target: spotifySnapshots.capturedAt })
      .returning({ id: spotifySnapshots.id });

    let snapshotId = snap?.id;
    if (!snapshotId) {
      const [row] = await tx
        .select({ id: spotifySnapshots.id })
        .from(spotifySnapshots)
        .where(eq(spotifySnapshots.capturedAt, capturedAt))
        .limit(1);
      snapshotId = row?.id;
    }
    if (!snapshotId) throw new Error("snapshot id missing");

    for (const t of spotify.tracks) {
      const f = featuresMap.get(t.spotifyId);
      const featuresLoadedAt = f ? new Date() : null;
      const [upserted] = await tx
        .insert(tracks)
        .values({
          spotifyId: t.spotifyId,
          name: t.name,
          artist: t.artist,
          album: t.album,
          durationMs: t.durationMs,
          popularity: t.popularity,
          valence: f?.valence ?? null,
          energy: f?.energy ?? null,
          tempo: f?.tempo ?? null,
          danceability: f?.danceability ?? null,
          loudness: f?.loudness ?? null,
          acousticness: f?.acousticness ?? null,
          speechiness: f?.speechiness ?? null,
          instrumentalness: f?.instrumentalness ?? null,
          featuresLoadedAt,
        })
        .onConflictDoUpdate({
          target: tracks.spotifyId,
          set: {
            popularity: t.popularity,
            ...(f
              ? {
                  valence: f.valence,
                  energy: f.energy,
                  tempo: f.tempo,
                  danceability: f.danceability,
                  loudness: f.loudness,
                  acousticness: f.acousticness,
                  speechiness: f.speechiness,
                  instrumentalness: f.instrumentalness,
                  featuresLoadedAt,
                }
              : {}),
          },
        })
        .returning({ id: tracks.id });

      if (!upserted?.id) continue;
      await tx
        .insert(snapshotTracks)
        .values({ snapshotId, trackId: upserted.id, position: t.position })
        .onConflictDoNothing();
    }

    // Compute aggregate
    const aggRows = await tx.execute(sql`
      SELECT
        AVG(t.valence)::real AS avg_valence,
        AVG(t.energy)::real AS avg_energy,
        AVG(t.tempo)::real AS avg_tempo,
        AVG(t.danceability)::real AS avg_danceability,
        AVG(t.loudness)::real AS avg_loudness,
        AVG(t.acousticness)::real AS avg_acousticness,
        AVG(t.speechiness)::real AS avg_speechiness,
        AVG(t.instrumentalness)::real AS avg_instrumentalness,
        COUNT(t.id)::int AS track_count
      FROM snapshot_tracks st
      JOIN tracks t ON t.id = st.track_id
      WHERE st.snapshot_id = ${snapshotId}
    `);
    const agg = (aggRows.rows[0] ?? {}) as {
      avg_valence: number | null;
      avg_energy: number | null;
      avg_tempo: number | null;
      avg_danceability: number | null;
      avg_loudness: number | null;
      avg_acousticness: number | null;
      avg_speechiness: number | null;
      avg_instrumentalness: number | null;
      track_count: number;
    };

    const aggValues = {
      avgValence: agg.avg_valence,
      avgEnergy: agg.avg_energy,
      avgTempo: agg.avg_tempo,
      avgDanceability: agg.avg_danceability,
      avgLoudness: agg.avg_loudness,
      avgAcousticness: agg.avg_acousticness,
      avgSpeechiness: agg.avg_speechiness,
      avgInstrumentalness: agg.avg_instrumentalness,
      trackCount: agg.track_count,
    };

    await tx
      .insert(hourlyAggregates)
      .values({
        hour: capturedAt,
        temperature: weather.temperature,
        precipitation: weather.precipitation,
        cloudCover: weather.cloudCover,
        sunshineLastHour: weather.sunshineLastHour,
        weatherCode: weather.weatherCode,
        ...aggValues,
      })
      .onConflictDoUpdate({
        target: hourlyAggregates.hour,
        set: {
          temperature: weather.temperature,
          precipitation: weather.precipitation,
          cloudCover: weather.cloudCover,
          sunshineLastHour: weather.sunshineLastHour,
          weatherCode: weather.weatherCode,
          ...aggValues,
          computedAt: new Date(),
        },
      });
  });

  console.log(
    `[cron] ✓ ${capturedAt.toISOString()} | temp: ${weather.temperature}°C | tracks: ${spotify.tracks.length}`,
  );
  return { capturedAt, skipped: false };
}
