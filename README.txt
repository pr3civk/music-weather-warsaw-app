MusicWeather Warsaw
===================

Aplikacja webowa analizująca korelację między pogodą w Warszawie a nastrojem
muzyki w Top 50 PL na Spotify. Cron co godzinę zapisuje snapshot pogody +
muzyki, dashboard liczy korelacje Pearsona, eksport JSON/XML.


WYMAGANIA
---------

  - Docker Desktop (https://www.docker.com/products/docker-desktop)
  - Konto Spotify Developer (free)
  - (opcjonalnie) Node.js 20+ i Bun 1.3+ jeśli chcesz uruchamiać bez Dockera


KONFIGURACJA SPOTIFY
--------------------

  1. Wejdź na https://developer.spotify.com/dashboard i zaloguj się
  2. "Create app":
       - App name: MusicWeather (dowolnie)
       - App description: dowolnie
       - Redirect URI: http://localhost:3001  (wymagane, ale nieużywane)
       - APIs used: Web API
  3. Po stworzeniu w Settings skopiuj:
       - Client ID
       - Client Secret (kliknij "View client secret")


KONFIGURACJA .env
-----------------

  Skopiuj plik .env.example do .env i uzupełnij:

    cp .env.example .env

  Pola do uzupełnienia:

    SPOTIFY_CLIENT_ID=<twój client id>
    SPOTIFY_CLIENT_SECRET=<twój client secret>
    JWT_SECRET=<dowolny ciąg min. 32 znaki, np. wygeneruj `openssl rand -hex 32`>

  Resztę zostaw domyślną (postgres, porty itd.)


URUCHOMIENIE (Docker)
---------------------

    docker compose up --build

  Po starcie:
    - Backend:   http://localhost:3001  (API + cron, pierwszy fetch przy starcie)
    - Frontend:  http://localhost:5173
    - Postgres:  localhost:5432

  W logach backendu zobaczysz:
    [cron] scheduled "0 * * * *" Europe/Warsaw
    [cron] ✓ <hour> | temp: <X>°C | tracks: 50

  Frontend automatycznie proxyuje /api → backend.


PIERWSZE LOGOWANIE
------------------

  1. Otwórz http://localhost:5173 → przekierowuje na /login
  2. Kliknij "Register" i utwórz konto
       UWAGA: pierwszy zarejestrowany user dostaje rolę admin automatycznie
  3. Po zalogowaniu zobaczysz /dashboard z widgetem "Now in Warsaw"
  4. Admin ma przycisk "Trigger fetch" — ręcznie odpala cron


SEED DANYCH (do prezentacji)
----------------------------

  Cron generuje 1 snapshot/h, więc do testu korelacji trzeba zebrać kilka godzin
  danych. Żeby od razu mieć 168 godzin (7 dni) syntetycznych danych:

    docker compose exec backend bun run seed

  Skrypt czyści tabele i wstawia 168 godzin fake snapshotów z wbudowaną
  syntetyczną korelacją (cieplej i słonecznie → wyższy valence; deszcz → niższy).
  Po seedzie odśwież /dashboard/correlation i zobaczysz pełną macierz.


ARCHITEKTURA
------------

  Monorepo (Bun workspaces):

    packages/shared    - zod DTO + typy (wspólne backend ↔ frontend)
    packages/backend   - Node + Express + TS, Drizzle ORM, node-cron
    packages/frontend  - Vite + React + TS, TanStack Query, shadcn/ui, Tailwind

  Backend cron (co godzinę, 0 * * * *):
    1. Pobiera bieżącą pogodę z Open-Meteo Forecast API
    2. Pobiera Top 50 PL z Spotify Web API (Client Credentials)
    3. Dla nowych tracków pobiera audio features z ReccoBeats API
       (Spotify zdeprecjonował /audio-features dla nowych apek 11/2024)
    4. Zapisuje weather_snapshot + spotify_snapshot + tracks + snapshot_tracks
       w jednej transakcji (ON CONFLICT DO NOTHING)
    5. Liczy i UPSERTuje hourly_aggregate

  Baza (PostgreSQL):
    users, weather_snapshots, tracks, spotify_snapshots,
    snapshot_tracks, hourly_aggregates


KORELACJA PEARSONA
------------------

  Endpoint:    GET /api/correlation
  Page:        /dashboard/correlation

  Liczone są pary 4 metryki pogody × 4 metryki muzyki = 16 par:

    Pogoda:  temperature, precipitation, cloud_cover, sunshine_last_hour
    Muzyka:  avg_valence, avg_energy, avg_tempo, avg_danceability

  Interpretacja współczynnika r ∈ [-1, +1]:
    |r| ≥ 0.7    silna korelacja
    0.4 ≤ |r| < 0.7   umiarkowana
    0.2 ≤ |r| < 0.4   słaba
    |r| < 0.2    brak korelacji

    r > 0   dodatnia (wzrost X → wzrost Y)
    r < 0   ujemna   (wzrost X → spadek Y)

  Heatmapa: fiolet = +, pomarańcz = −, intensywność = |r|

  Wymaga ≥ 5 punktów danych (godzin), inaczej zwraca warning "Za mało danych".


EKSPORT
-------

  /dashboard/export — wybierz zakres dat + format (JSON/XML) → download

  CLI:
    curl -b cookies.txt 'http://localhost:3001/api/export?format=xml&from=...&to=...' \
      -o aggregate.xml


ENDPOINTY API
-------------

  Auth:
    POST   /api/auth/register   { name, email, password }
    POST   /api/auth/login      { email, password }
    POST   /api/auth/logout
    GET    /api/auth/me

  Dane (wymagają JWT cookie "mw_token"):
    GET    /api/current
    GET    /api/weather?from=...&to=...
    GET    /api/music?from=...&to=...&limit=50
    GET    /api/correlation?from=...&to=...
    GET    /api/export?format=json|xml&from=...&to=...
    POST   /api/admin/trigger    (admin only)


URUCHOMIENIE LOKALNE (bez Dockera)
----------------------------------

    bun install
    docker run -d --name mw-pg -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password \
      -e POSTGRES_DB=music_weather -p 5432:5432 postgres:16-alpine
    # uzupełnij .env z DATABASE_URL=postgresql://postgres:password@localhost:5432/music_weather
    bun --filter @mw/backend db:push
    bun --filter @mw/backend dev    # backend na :3001
    bun --filter @mw/frontend dev   # frontend na :5173


ŹRÓDŁA DANYCH
-------------

  Pogoda:  Open-Meteo Forecast API (https://open-meteo.com) — darmowe, bez klucza
  Muzyka:  Spotify Web API
