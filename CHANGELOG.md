# Changelog

## 3.2.0-structured-journal — 2026-09-18

### Added

- Added a persistent desktop workspace rail for Journal, Analysis, Capital Ledger, account metrics, and profile access
- Added first-class trade fields for Price Key setup, direction, key timeframe, entry style, outcome, exit type, confirmations, Realized R, MFE, and MAE
- Added Alchemist setup presets including Classic A, Classic V, SBR, RBS, OCL, FIRE, ICT Order Blocks, QM, and Fibonacci workflows
- Added independent WIN, LOSS, BE, and BE+ outcomes
- Added an expandable Advanced Research section so optional confirmation data does not slow down direct entries

### Changed

- Rebuilt the trade form around Entry Model, Plan & Outcome, and Review instead of one generic technique field
- Treated Classic A/V and other Price Keys as complete entry setups; CISD-style structure evidence, PA, Engulfing, SMT, QT, and liquidity evidence remain optional confirmations
- Updated win-rate calculations to use only decided WIN and LOSS outcomes while retaining BE/BE+ P&L in balance and equity calculations
- Updated setup analytics and calendar records to use the structured setup label
- Preserved legacy records by migrating the old technique value into the new setup field with safe defaults
- Kept the mobile header compact while moving the complete identity workspace into the desktop rail

### Verification

- TypeScript type-check: pass
- Vite production build: pass

## 3.1.0-editorial — 2026-09-13

### Design direction

- Rebuilt the interface around a Midnight Editorial art direction
- Introduced a warm charcoal, parchment, and muted-gold color system
- Replaced the generic SaaS header with an edition-based journal masthead
- Removed decorative glows, excessive gradients, pill navigation, and oversized rounding
- Added editorial typography, stronger hierarchy, and quieter data surfaces
- Improved calendar density and mobile sizing while preserving one-tap entry creation
- Unified journal, analytics, profile, trade, and capital-ledger surfaces
- Added reduced-motion support and more deliberate focus states
- Replaced Profit Factor with achieved reward-to-risk based on average realized wins and losses
- Consolidated the six headline metrics into a quieter editorial statistics rail
- Replaced the initial-letter fallback with a neutral social-style profile silhouette
- Migrated legacy remote stock avatars to the neutral fallback while preserving locally uploaded images
- Flattened the calendar into a compact editorial grid and reduced the daily detail rail on tablet and desktop
- Restored the narrow daily rail at tablet widths and removed stretched height from the psychology card
- Reordered calendar cells into date, centered P&L, and bottom trade/emotion metadata

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
- Updated default technique presets for structured trade review
- Migrated existing V2.5 trades and cashflows to the single local owner profile

### Removed

- Firebase runtime integration
- Login, registration, Google sign-in, password, and simulated OTP flows
- Hard-coded personal email and remote stock avatar defaults
- Stale prebuilt single-file artifact

### Verification

- TypeScript type-check: pass
- Vite production build: pass
