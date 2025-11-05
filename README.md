# Fifaleague Dashboard

A modern React + TypeScript application that powers a private FIFA league dashboard. It combines authenticated access, real-time match management, advanced player analytics, and multilingual support in a single responsive interface.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Environment & Firebase Setup](#environment--firebase-setup)
- [Available Scripts](#available-scripts)
- [Testing Strategy](#testing-strategy)
- [Internationalization](#internationalization)
- [Deployment Notes](#deployment-notes)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Authenticated experience** – Users sign in before accessing the application shell, which guards all `/app/*` routes through a reusable `<RequireAuth />` wrapper and context-driven session handling.
- **Firebase-powered data** – Match history, pending approvals, and live activity logs stream from Firebase Realtime Database, while helpers for signing in/out and session listeners are exposed from a single service module.【
- **Insightful dashboards** – Interactive components surface results, tables, and trends (including ApexCharts visualizations, partner synergy metrics, and animated scoreboards) so league participants can monitor performance over time.
- **Rich UI with theming** – Material UI powers consistent styling, responsive layouts, and light/dark theming that can be toggled globally via the main layout.
- **Pending match workflow** – Moderators can review, approve, or reject submitted match requests backed by contextual helpers and activity logging, preventing accidental duplication of scores.
- **News and documentation hub** – Long-form history, announcements, and about pages make the app more than a scoreboard, providing a narrative for the league inside the authenticated navigation shell.

## Tech Stack

| Category           | Details                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Framework          | [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) for blazing-fast local development and modern build tooling. |
| Language           | TypeScript with strict ESLint/TS-ESLint configuration for consistent typing and linting.                                  |
| UI Library         | Material UI 7 with Emotion styling, Framer Motion animations, and custom SCSS modules for branding.                       |
| Data & Auth        | Firebase Realtime Database and Firebase Auth for secure, real-time persistence and identity management.                   |
| Charts & Analytics | ApexCharts components with reusable selectors for advanced player metrics and partner synergies.                          |
| Testing            | Vitest, Testing Library, and Playwright for unit, integration, and end-to-end coverage                                    |

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-org>/React---Fifaleague.git
   cd React---Fifaleague
   ```
2. **Install dependencies** (Node.js 18+ recommended)
   ```bash
   npm install
   ```
3. **Configure environment variables** (see [Environment & Firebase Setup](#environment--firebase-setup)).
4. **Run the development server**
   ```bash
   npm run dev
   ```
   Vite will expose the app at the URL printed in the console (typically `http://localhost:5173`).

## Project Structure

```
src/
├── App.tsx                # Theme provider, routing shell, and layout composition
├── AppRoutes.tsx          # Route definitions (auth gate + navigation shell)
├── common/                # UI primitives, contexts, hooks, constants, and utilities
├── pages/                 # Feature pages (home, ranking, matches, pending reviews, etc.)
├── styles/                # Global SCSS helpers and mixins
├── theme/                 # Material UI theme configuration & palettes
└── locales/               # JSON translations consumed by i18next
```

This modular structure keeps Firebase interactions, UI primitives, and domain logic decoupled, making it easy to extend or swap data sources without touching presentation layers.

## Environment & Firebase Setup

The project ships with a sample Firebase configuration (`src/common/services/firebase.ts`). Replace those values with your own project credentials or refactor the file to source from `import.meta.env` variables (e.g., `VITE_FIREBASE_API_KEY`) to keep secrets out of source control.

1. Create a Firebase project with **Authentication (Email/Password)** and the **Realtime Database** enabled.
2. Generate a web app within Firebase and copy the config keys.
3. Update the configuration in `src/common/services/firebase.ts` or inject them via environment variables before building.
4. Seed the Realtime Database with the collections expected by the contexts:
   - `matches` – played match records consumed by `MatchesContext`.
   - `pendingMatchRequests` – submissions awaiting moderator review.
   - `activityLogs` – optional feed of match-related events.

## Available Scripts

| Command                   | Description                                                         |
| ------------------------- | ------------------------------------------------------------------- |
| `npm run dev`             | Launches the Vite dev server with hot module replacement.           |
| `npm run build`           | Type-checks the project and outputs a production bundle to `dist/`. |
| `npm run preview`         | Serves the build locally for smoke testing.                         |
| `npm run lint`            | Runs ESLint across the entire codebase.                             |
| `npm test`                | Executes the Vitest test suite (unit + integration).                |
| `npm run test:e2e`        | Runs the Playwright end-to-end tests in headless mode.              |
| `npm run test:e2e:headed` | Opens Playwright in headed mode for interactive debugging.          |

## Testing Strategy

- **Unit & Integration** – Vitest with React Testing Library covers hooks and contexts (e.g., authentication flows, match extraction helpers).
- **End-to-End** – Playwright scripts navigate key journeys such as authentication, table insights, ranking comparisons, and stats drill-downs to guarantee regression safety for real users.
- **Mocked Firebase utilities** – Dedicated helpers in `test-utils/` fabricate database snapshots so logic can be validated without touching production data.

To run the full suite locally:

```bash
npm run lint
npm test
npm run test:e2e
```

## Internationalization

The application boots i18next with Polish (default), English, Spanish, and German resource bundles. Locale files live in `src/locales/` and can be extended by adding another JSON file and registering it within `src/i18n.ts`. Runtime translations are consumed via `useTranslation()` hooks throughout pages and components.

## Deployment Notes

- **Static hosting** – `npm run build` produces a static bundle compatible with any CDN or static host.
- **Vercel** – A `vercel.json` rewrite ensures client-side routing resolves back to `index.html`, making Vercel deployment seamless.
- **Environment variables** – When deploying, make sure your Firebase credentials are provided as environment variables or injected at build time.

## Contributing

1. Fork the repository and create a feature branch.
2. Follow the existing ESLint and TypeScript guidelines before opening a pull request.
3. Add or update unit/E2E tests alongside feature work.
4. Submit a PR describing your changes and referencing any relevant issues.

## License

No explicit license has been provided. If you plan to open-source the project, add a `LICENSE` file clarifying usage rights.
