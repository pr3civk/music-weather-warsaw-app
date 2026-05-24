import { pgTable, serial, text, timestamp, real, integer, uniqueIndex, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const weatherSnapshots = pgTable(
  'weather_snapshots',
  {
    id: serial('id').primaryKey(),
    capturedAt: timestamp('captured_at').notNull().unique(),
    temperature: real('temperature'),
    precipitation: real('precipitation'),
    cloudCover: real('cloud_cover'),
    windSpeed: real('wind_speed'),
    sunshineLastHour: real('sunshine_last_hour'),
    weatherCode: integer('weather_code'),
  },
  (t) => ({
    capturedAtIdx: index('weather_captured_at_idx').on(t.capturedAt),
  })
);

export const tracks = pgTable('tracks', {
  id: serial('id').primaryKey(),
  spotifyId: text('spotify_id').notNull().unique(),
  name: text('name').notNull(),
  artist: text('artist').notNull(),
  album: text('album'),
  durationMs: integer('duration_ms'),
  popularity: integer('popularity'),
  valence: real('valence'),
  energy: real('energy'),
  tempo: real('tempo'),
  danceability: real('danceability'),
  loudness: real('loudness'),
  acousticness: real('acousticness'),
  speechiness: real('speechiness'),
  instrumentalness: real('instrumentalness'),
  featuresLoadedAt: timestamp('features_loaded_at'),
});

export const spotifySnapshots = pgTable(
  'spotify_snapshots',
  {
    id: serial('id').primaryKey(),
    capturedAt: timestamp('captured_at').notNull().unique(),
    playlistId: text('playlist_id').notNull(),
    trackCount: integer('track_count').notNull().default(0),
  },
  (t) => ({
    capturedAtIdx: index('spotify_captured_at_idx').on(t.capturedAt),
  })
);

export const snapshotTracks = pgTable(
  'snapshot_tracks',
  {
    id: serial('id').primaryKey(),
    snapshotId: integer('snapshot_id')
      .notNull()
      .references(() => spotifySnapshots.id, { onDelete: 'cascade' }),
    trackId: integer('track_id')
      .notNull()
      .references(() => tracks.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
  },
  (t) => ({
    snapshotTrackUnique: uniqueIndex('snapshot_track_unique').on(t.snapshotId, t.trackId),
    snapshotIdx: index('snapshot_tracks_snapshot_idx').on(t.snapshotId),
  })
);

export const hourlyAggregates = pgTable(
  'hourly_aggregates',
  {
    id: serial('id').primaryKey(),
    hour: timestamp('hour').notNull().unique(),
    temperature: real('temperature'),
    precipitation: real('precipitation'),
    cloudCover: real('cloud_cover'),
    sunshineLastHour: real('sunshine_last_hour'),
    weatherCode: integer('weather_code'),
    avgValence: real('avg_valence'),
    avgEnergy: real('avg_energy'),
    avgTempo: real('avg_tempo'),
    avgDanceability: real('avg_danceability'),
    avgLoudness: real('avg_loudness'),
    avgAcousticness: real('avg_acousticness'),
    avgSpeechiness: real('avg_speechiness'),
    avgInstrumentalness: real('avg_instrumentalness'),
    trackCount: integer('track_count').notNull().default(0),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
  },
  (t) => ({
    hourIdx: index('hourly_aggregates_hour_idx').on(t.hour),
  })
);
