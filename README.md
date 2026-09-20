# JournalTradeDaily V3

A local-first decision journal for reviewing trading process, performance, and psychology. V3 is designed as a single-user research workspace: it opens directly, keeps data on the device, and does not require an account.

## Product goals

- Turn individual entries into reviewable evidence.
- Separate process quality from short-term outcomes.
- Keep personal journal data under the user's control.
- Make backup and recovery a first-class workflow.

## Current capabilities

- Calendar-based trade journal with screenshots and emotional context
- Performance dashboard with outcome-aware win rate, achieved risk-reward ratio, expectancy, and maximum drawdown
- Technique-first entries for FIRE, ALCHEMIST, ICT, SMC, SMT, and MSNR, including free-form custom techniques and multi-technique combos
- A drill-down technique archive with Price Key win rates, compact chart evidence, and full trade records
- Before and After chart evidence with After retained as the compact history thumbnail
- Technique, Price Key, and emotion breakdowns that keep BE and BE+ out of decided-trade win rate
- Deposit and withdrawal records
- Custom local profile, strategy identity, and avatar upload
- Versioned JSON export and restore
- Automatic migration from the V2.5 browser data model
- Adaptive navigation with a responsive mobile header, switchable sticky desktop top bar or side rail, and an animated compact rail for tablet-width screens
- An in-product Release Ledger for the complete V3.0.9 feature and refinement summary

## Privacy model

The production path has no login, password, OTP, or Firebase connection. Profile, trade, and cashflow records remain in browser storage until the user exports a backup. Uploaded images should be backed up before browser data is cleared.

## Development

```bash
bun install
bun run dev
```

Quality checks:

```bash
bun run lint
bun run build
```

Every push to `main` is checked and deployed through GitHub Actions.

## Netlify deployment

This repository is also Netlify-ready through `netlify.toml`. Import the same GitHub repository into Netlify and select the `main` branch. Netlify will run `npm run build`, publish `dist`, and automatically redeploy after every push to `main`.

GitHub Pages and Netlify can safely use the same source repository. Journal records remain in each browser's local storage, so different users and domains do not share profiles, trades, screenshots, or cashflow data. Each user should export a Data Vault backup before clearing browser data or changing devices.

## Status

V3.0.9 is the final V3 feature patch and is ready for user testing. Planned future work includes stronger storage capacity for image-heavy journals, deeper process-quality metrics, accessibility review, and structured usability testing.
