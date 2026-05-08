# Quran Revision Tracker

A privacy-first, offline-capable web and Android app for tracking Quran memorization progress and scheduling revisions.

## Features

- **Track all 114 Surahs** — log which surahs you've memorized and monitor your progress
- **Smart revision scheduling** — get recommended revisions based on proven memorization techniques
- **Offline-first** — works fully without an internet connection using IndexedDB local storage
- **No account required** — no registration or login needed; all data stays on your device
- **Backup & restore** — export your data as JSON and import it on any device
- **Android app** — built with Capacitor for native Android support

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build tool:** Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Local storage:** IndexedDB (via `idb`)
- **Mobile:** Capacitor (Android)
- **Analytics:** PostHog (privacy-respecting, no personal data collected)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun

### Installation

```sh
# Clone the repo
git clone https://github.com/RiffRaff12/quran-tracker.git
cd quran-tracker

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### Available Scripts

```sh
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run tests
npm run test:ui      # Run tests with Vitest UI
npm run lint         # Lint with ESLint
```

## Android Build

This app uses [Capacitor](https://capacitorjs.com/) for Android.

```sh
npm run build
npx cap sync android
npx cap open android
```

Then build and run from Android Studio.

## Data & Privacy

- All data is stored **locally on your device** — nothing is sent to a server
- No personal information is collected
- Export your data anytime via the in-app export button
- Import a previously exported JSON file to restore or transfer your data

## Project Structure

```
src/
├── components/     # Reusable UI components
│   └── ui/         # shadcn/ui base components
├── pages/          # App pages/routes
├── hooks/          # Custom React hooks
├── lib/            # Utility libraries
├── utils/          # Helper functions (surah data, etc.)
└── types/          # TypeScript type definitions
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)
