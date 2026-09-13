# Changelog

## 3.0.0-foundation — 2026-09-13

### Added

- Local Profile with custom avatar, display name, plan name, bio, and starting capital
- Data Vault with versioned JSON export and validated restore
- Expectancy per trade and maximum drawdown analytics
- Mobile-responsive product header and navigation
- Automated GitHub Pages build and deployment workflow
- Product metadata and portfolio-oriented project documentation

### Changed

- Renamed the product from `JournalDairyTrade` to `JournalTradeDaily`
- Reframed the interface as a decision-intelligence workspace
- Updated default techniques to match the Alchemist research workflow
- Migrated existing V2.5 trades and cashflows to the single local owner profile

### Removed

- Firebase runtime integration
- Login, registration, Google sign-in, password, and simulated OTP flows
- Hard-coded personal email and remote stock avatar defaults
- Stale prebuilt single-file artifact

### Verification

- TypeScript type-check: pass
- Vite production build: pass

