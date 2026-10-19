# inconsistency-check-js

Project SEED staff report. Upload the REDCap survey export and the per-game CSVs
to see each participant's compliance strikes and compensation. Everything runs in
the browser: uploads are read locally and PDFs are built locally. Never commit
participant exports.

```bash
pnpm install
pnpm start                  # http://localhost:3000/inconsistency-check-js/
pnpm test                   # watch mode; `pnpm test --run` runs once
pnpm run deploy             # lints, tests, builds and publishes to gh-pages (`pnpm deploy` is a different, built-in command)
pnpm clean                  # deletes build/ (overrides pnpm's built-in clean, which deletes node_modules)
pnpm lint                   # eslint + eslint-plugin-unicorn; runs as part of deploy
```

- Strike rules: `src/survey/surveystrikes.js`, `src/game_data/gamestrikes.js`, `src/game_data/lightsout.js`
- REDCap data dictionaries: `src/survey/*DataDict.csv` (re-export when the REDCap form changes)
- New study page: add it under `src/pages/`, plus a `<Route>` and `NavLink` in `src/App.js`
