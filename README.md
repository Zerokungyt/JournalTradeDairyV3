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
- Structured Alchemist entries with Price Key setups, direct/confirmed execution, optional confirmations, and research metrics
- Setup and emotion breakdowns that keep BE and BE+ out of decided-trade win rate
- Deposit and withdrawal records
- Custom local profile, strategy identity, and avatar upload
- Versioned JSON export and restore
- Automatic migration from the V2.5 browser data model
- Responsive mobile header and a persistent desktop workspace rail with profile, navigation, and account metrics

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

## Status

V3 foundation is complete. Planned work includes stronger storage capacity for image-heavy journals, deeper process-quality metrics, accessibility review, and structured usability testing.
