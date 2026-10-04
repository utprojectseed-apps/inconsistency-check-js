# inconsistency-check-js

Project SEED staff report. Upload the REDCap survey export and the per-game CSVs
to see each participant's compliance strikes and compensation. Everything runs in
the browser: uploads are read locally and PDFs are built locally. Never commit
participant exports.

```bash
pnpm install
pnpm start                  # http://localhost:3000
pnpm test                   # watch mode; `pnpm test --run` runs once
pnpm run deploy             # builds and publishes to gh-pages (`pnpm deploy` is a different, built-in command)
```

- Strike rules: `src/survey/surveystrikes.js`, `src/game_data/gamestrikes.js`, `src/game_data/lightsout.js`
- REDCap data dictionaries: `src/survey/*DataDict.csv` (re-export when the REDCap form changes)
- New study page: add it under `src/pages/`, plus a `<Route>` and `NavLink` in `src/App.js`
