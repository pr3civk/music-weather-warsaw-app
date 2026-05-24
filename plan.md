Zbuduj aplikację webową "MusicWeather Warsaw" — analiza korelacji między pogodą
w Warszawie a nastrojem muzyki w polskich chartach Spotify.

Cron odpala się co godzinę i zapisuje spójną parę danych: pogoda sprzed 3h +
aktualny stan Top 50 PL Spotify. Po zebraniu historii (im dłużej działa, tym lepiej)
dashboard liczy korelacje Pearsona.

## Stack

- Backend: Node.js + Express + TypeScript (tsx)
- Frontend: Vite + React + TypeScript
- ORM: Drizzle ORM + PostgreSQL (pg driver)
- Auth: własny JWT (jose) + bcryptjs — httpOnly cookie
- Cron: node-cron w procesie Express — "0 \* \* \* \*" (co godzinę)
- Docker: Docker Compose — 3 serwisy: postgres, backend, frontend
- Monorepo: packages/frontend + packages/backend, root package.json z workspaces

## Logika czasowa (WAŻNE)

Cron strzela co godzinę. Każdy run:

- targetTime = now() - 3 godziny (zaokrąglone do pełnej godziny)
- Pobiera pogodę Open-Meteo dla targetTime
- Pobiera aktualny Top 50 PL ze Spotify (co godzinę i tak się zmienia mało,
  ale rejestrujemy stan w momencie runu)
- Zapisuje oba snapshoty z captured_at = targetTime
- Przelicza hourly_aggregate dla targetTime

Przykład: cron o 14:05 → targetTime = 11:00 → weather(11:00) + spotify(teraz, ale
oznaczone jako 11:00) zapisane do bazy.

Dzięki temu Open-Meteo archive API zawsze ma dane (min. 1h opóźnienie, my bierzemy 3h).

## Źródła danych

### Pogoda — Open-Meteo Archive API

- URL: https://archive-api.open-meteo.com/v1/archive
- Parametry:
  latitude=52.2297
  longitude=21.0122
  timezone=Europe/Warsaw
  start_date=YYYY-MM-DD (data targetTime)
  end_date=YYYY-MM-DD (ta sama data)
  hourly=temperature_2m,precipitation,cloud_cover,wind_speed_10m,
  sunshine_duration,weather_code
- Z odpowiedzi bierzemy dane dla konkretnej godziny targetTime (indeks w tablicy hourly.time)

### Muzyka — Spotify Web API, Client Credentials

- Auth: POST https://accounts.spotify.com/api/token, grant_type=client_credentials
- Credentials: Base64(CLIENT_ID:CLIENT_SECRET) w nagłówku Authorization: Basic
- Token cache w pamięci serwera (expires_in - 60s margines)
- Playlista: GET /v1/playlists/37i9dQZEVXbM9RY2pCKKTe/tracks?limit=50
- Dla tracków bez audio features: GET /v1/audio-features?ids=... (batch max 100)
- Delay 200ms między batchami

## Schemat bazy (Drizzle + PostgreSQL)

### users

- id serial PK
- email text UNIQUE NOT NULL
- password_hash text NOT NULL
- name text NOT NULL
- role text DEFAULT 'user' -- 'user' | 'admin'
- created_at timestamp DEFAULT now()

### weather_snapshots

- id serial PK
- captured_at timestamp UNIQUE NOT NULL -- = targetTime (pełna godzina)
- temperature real -- °C
- precipitation real -- mm
- cloud_cover real -- %
- wind_speed real -- km/h
- sunshine_last_hour real -- sekundy nasłonecznienia w tej godzinie
- weather_code integer -- WMO weather code

### tracks

- id serial PK
- spotify_id text UNIQUE NOT NULL
- name text NOT NULL
- artist text NOT NULL
- album text
- duration_ms integer
- popularity integer
- valence real -- 0=smutny, 1=radosny
- energy real
- tempo real -- BPM
- danceability real
- loudness real -- dB
- acousticness real
- speechiness real
- instrumentalness real
- features_loaded_at timestamp -- NULL = brak features

### spotify_snapshots

- id serial PK
- captured_at timestamp UNIQUE NOT NULL -- = targetTime
- playlist_id text NOT NULL
- track_count integer DEFAULT 0

### snapshot_tracks

- id serial PK
- snapshot_id integer FK → spotify_snapshots(id) ON DELETE CASCADE
- track_id integer FK → tracks(id) ON DELETE CASCADE
- position integer NOT NULL -- 1-50
- UNIQUE(snapshot_id, track_id)

### hourly_aggregates

- id serial PK
- hour timestamp UNIQUE NOT NULL -- = targetTime
- temperature real
- precipitation real
- cloud_cover real
- weather_code integer
- avg_valence real
- avg_energy real
- avg_tempo real
- avg_danceability real
- track_count integer
- computed_at timestamp DEFAULT now()

## Backend routes

Wszystkie /api/_ poza /api/auth/_ wymagają ważnego JWT.
Middleware JWT czyta cookie "mw_token" lub nagłówek Authorization: Bearer.
Ustawia req.user = { id, email, role }.

### Auth

POST /api/auth/register body: { name, email, password }
POST /api/auth/login body: { email, password }
POST /api/auth/logout -- czyści cookie
GET /api/auth/me -- zwraca req.user + name z bazy

### Data endpoints

GET /api/weather
-- query: from (ISO timestamp), to (ISO timestamp), domyślnie ostatnie 48h
-- zwraca weather_snapshots w zakresie

GET /api/music
-- query: from, to, limit=50
-- zwraca top tracki z avg_position w zakresie

GET /api/correlation
-- query: from, to (domyślnie cały zebrany zakres)
-- odczyt z isolation level SERIALIZABLE (raw SQL: BEGIN ISOLATION LEVEL SERIALIZABLE)
-- zwraca { matrix: CorrelationMatrix[], timeSeries: HourlyPoint[], dataPoints: number }

GET /api/current
-- ostatni hourly_aggregate z bazy (najświeższy snapshot)
-- zwraca { weather: {...}, music: { avgValence, avgEnergy, topTracks: [...] } }
-- używany przez dashboard do widgetu "teraz"

GET /api/export?format=json|xml&from=...&to=...
-- pobiera hourly_aggregates, zwraca plik do ściągnięcia jako attachment

POST /api/admin/trigger
-- tylko role=admin
-- ręcznie triggeruje runHourlyFetch() (ten sam co cron)
-- zwraca { ok: true, targetTime }

## Cron — packages/backend/src/jobs/hourlyFetch.ts

Eksportuje:

- startCronJobs() — rejestruje cron "0 \* \* \* \*", timezone Europe/Warsaw
- runHourlyFetch() — async, wywoływana i przez cron i przez admin trigger

runHourlyFetch():

1. Oblicz targetTime = subHours(new Date(), 3), zaokrąglij do pełnej godziny
2. Sprawdź czy hourly_aggregates już ma rekord dla tego hour → jeśli tak, skip z logiem
3. Pobierz pogodę z Open-Meteo archive dla targetTime
4. Pobierz Top 50 PL ze Spotify
5. Dla nowych tracków (bez features_loaded_at) pobierz audio features
6. Zapisz wszystko w jednej transakcji db.transaction():
   a. INSERT weather_snapshot (captured_at=targetTime) ON CONFLICT DO NOTHING
   b. INSERT spotify_snapshot (captured_at=targetTime) ON CONFLICT DO NOTHING
   c. UPSERT tracks (spotify_id conflict → update popularity)
   d. INSERT snapshot_tracks ON CONFLICT DO NOTHING
7. Oblicz i UPSERT hourly_aggregate dla targetTime
8. Zaloguj: [cron] ✓ targetTime | temp: X°C | valence: X.XX | tracks: N

## Korelacja Pearsona — packages/backend/src/lib/correlation.ts

Typy:
HourlyPoint = { hour, temperature, precipitation, cloud_cover, sunshine_last_hour,
avg_valence, avg_energy, avg_tempo, avg_danceability }
CorrelationResult = { r, r2, strength, direction, label }
CorrelationMatrix = { weatherMetric, musicMetric, result }

Funkcje:
pearson(x: number[], y: number[]): number
describeCorrelation(r: number): CorrelationResult
-- |r|>=0.7 strong, 0.4-0.7 moderate, 0.2-0.4 weak, <0.2 none
computeCorrelationMatrix(data: HourlyPoint[]): CorrelationMatrix[]
-- 4 weather x 4 music = 16 par

## Export XML/JSON — packages/backend/src/lib/exporter.ts

buildJsonExport(rows: HourlyAggregate[], meta): string
buildXmlExport(rows: HourlyAggregate[], meta): string -- użyj xml2js Builder

## Frontend — Vite + React + TypeScript

React Router v6, 7 widoków:

/login -- formularz, POST /api/auth/login, redirect → /dashboard
/register -- formularz, POST /api/auth/register, redirect → /dashboard

/dashboard -- "teraz" widget (GET /api/current) + dwa LineCharty z ostatnich 48h:
temperatura vs valence, opady vs energy (Recharts)

/dashboard/correlation
-- heatmapa 4x4 (tabela, kolory wg r: fioletowy=+, pomarańczowy=-) + ranking top 5 korelacji

/dashboard/weather
-- AreaChart temperatury + BarChart opadów (groupBy hour)

/dashboard/music
-- tabela tracków z ostatniego snapshotu + ich audio features,
sortowalna po valence/energy/tempo

/dashboard/export
-- date-range picker, toggle JSON/XML, przycisk pobierz

Sidebar nawigacja z logout. Ciemny motyw, CSS Modules.
Recharts do wykresów.
Proxy w vite.config.ts: "/api" → "http://localhost:3001"

## Docker Compose

services:
postgres:
image: postgres:16-alpine
environment: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
volumes: pgdata:/var/lib/postgresql/data
healthcheck: pg_isready

backend:
build: packages/backend
ports: "3001:3001"
env_file: .env
depends_on: postgres (condition: service_healthy)
command: >
sh -c "npm run db:push && npm run dev"

frontend:
build: packages/frontend
ports: "5173:5173"
environment:
VITE_API_URL: http://localhost:3001
depends_on: backend

## .env.example

DATABASE_URL=postgresql://postgres:password@postgres:5432/music_weather
SPOTIFY_CLIENT_ID=twoj_client_id
SPOTIFY_CLIENT_SECRET=twoj_client_secret
JWT_SECRET=minimum_32_znakowy_sekret_zmien_to
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

## packages/backend/package.json scripts

"dev": "tsx watch src/index.ts"
"db:push": "drizzle-kit push"
"db:generate": "drizzle-kit generate"

## packages/frontend/package.json scripts

"dev": "vite"
"build": "vite build"

## README.txt (wymagany przez prowadzącego)

Zawiera:

1. Wymagania: Docker Desktop, Node.js 20+, konto Spotify Developer
2. Jak założyć Spotify App i wziąć CLIENT_ID + CLIENT_SECRET
   (developer.spotify.com → Create App, Redirect URI = http://localhost:3001)
3. Uzupełnij .env na podstawie .env.example
4. docker-compose up --build
5. Aplikacja sama zbiera dane co godzinę (cron)
   Admin może triggerować ręcznie przez POST /api/admin/trigger (panel w UI)
6. Opis architektury: monorepo, dwa źródła danych, korelacja Pearsona
7. Opis korelacji: co oznacza r, które pary są badane

## Uwagi implementacyjne

- CORS w Express: credentials: true, origin: FRONTEND_URL z env
- Cookie: httpOnly, sameSite: lax, secure: false na dev
- Jeśli dataPoints < 5 w /api/correlation → zwróć { matrix: [], dataPoints, warning: "Za mało danych" }
- Cron loguje każdy run z timestampem i kluczowymi wartościami
- index.ts uruchamia startCronJobs() i od razu runHourlyFetch() przy starcie
  (żeby nie czekać godziny na pierwsze dane)
- drizzle.config.ts w packages/backend, schema w src/db/schema.ts
