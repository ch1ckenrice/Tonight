# Tonight

**Tonight** is a mobile-first movie-night decision app that helps people stop scrolling and choose something to watch together.

It supports a quick pass-the-phone flow on one device and real-time online rooms for friends choosing from separate devices.

[View the live demo](https://ch1ckenrice.github.io/Tonight/)

## What it does

### Pass-the-phone mode

- Choose a mood: easy, fun, tense, or thoughtful.
- Pick solo mode or add up to three friends on one device.
- Swipe or use the action buttons to like and skip films.
- Get a recommendation from the films everyone liked; if there is no full match, Tonight chooses the group’s most-liked film and uses TMDB rating as a tiebreaker.
- Keep an active round and the latest movie night locally, even after a refresh.

### Online rooms

- Create a room and share an invite link.
- Friends join anonymously from their own devices.
- The host chooses a mood and starts one shared movie deck.
- Each person votes privately and keeps their own progress.
- The lobby, room status, and final results update in real time when everyone has finished.

## Built with

| Area | Tools |
| --- | --- |
| UI | React 19, TypeScript, CSS |
| Tooling | Vite, ESLint |
| Routing | React Router with `HashRouter` for GitHub Pages |
| Movie data | [TMDB API](https://www.themoviedb.org/documentation/api) |
| Real-time rooms | Supabase: anonymous auth, Postgres, Row Level Security, Realtime |
| Deployment | GitHub Pages via GitHub Actions |

## Highlights

- A touch-friendly swipe interface built with Pointer Events, with drag feedback, directional affordances, and button-triggered swipe animations.
- Typed API and database models for movies, rooms, members, votes, and saved rounds.
- Mood-based TMDB discovery filtered for popular, non-adult feature films.
- Real-time online room updates without requiring users to refresh the page.
- Database-side access control with Supabase RLS policies, RPCs, and a trigger that marks a room complete after every member finishes voting.
- Responsive layouts designed mobile-first and refined for desktop screens.

## Run locally

### 1. Clone and install

```bash
git clone https://github.com/ch1ckenrice/Tonight.git
cd Tonight
npm install
```

### 2. Add environment variables

Create a `.env.local` file in the project root:

```env
VITE_TMDB_ACCESS_TOKEN=your_tmdb_read_access_token
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Do not commit `.env.local`. The app uses only a TMDB read access token and Supabase’s browser-safe publishable key; never add a Supabase `service_role` key to the client.

### 3. Configure Supabase

1. Create a Supabase project.
2. Enable **Anonymous Sign-Ins** in Supabase Auth.
3. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor.

The schema creates the room, member, and vote tables, applies RLS policies, registers the room RPCs, enables Realtime for the required tables, and adds the results trigger.

### 4. Start the app

```bash
npm run dev
```

Open the local URL printed by Vite.

## Available scripts

```bash
npm run dev     # Start the development server
npm run build   # Type-check and build a production bundle
npm run lint    # Run ESLint
npm run preview # Preview the production build locally
```

## Deployment

The app is deployed to GitHub Pages by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) whenever `main` is updated.

The workflow requires these GitHub Actions secrets:

```text
VITE_TMDB_ACCESS_TOKEN
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Vite injects `VITE_` values during the build, so update the repository secrets before triggering a production deployment.

## Project structure

```text
src/
├── components/    # Reusable cards, swipe UI, footer, recent-round card
├── data/          # Mood options
├── pages/         # Local and online room flows
├── services/      # TMDB, Supabase, auth, storage, room queries
├── types/         # Shared TypeScript domain types
├── App.tsx        # Routes
└── App.css        # Responsive application styles
```

## Credits

Movie data, posters, and ratings are provided by [TMDB](https://www.themoviedb.org/). This product uses the TMDB API but is not endorsed or certified by TMDB.
