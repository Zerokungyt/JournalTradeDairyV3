# Changelog

## V3.0.9-release-translations — 2026-09-20

### Added

- Added TH, EN, ZH, and DE language controls to the V3.0.9 Release Ledger
- Added complete localized release copy for Thai, English, Simplified Chinese, and German
- Added a browser-persistent language preference with Thai as the first-use default

### Changed

- Styled language abbreviations as compact square gold controls that remain consistent with the Midnight Editorial interface

### Verification

- TypeScript type-check: pass
- Vite production build: pass

## V3.0.9 — Final V3 patch — 2026-09-20

### Added

- Added an in-product Release Ledger summarizing the complete Trade Record, Visual Evidence, Research, Analytics, and Workspace feature set
- Added persistent Release Ledger entry points to the side rail, compact rail, top navigation, and mobile navigation
- Added a subtle NEW indicator that clears after the current release notes are opened and remains dismissed on that browser

### Changed

- Set the public application version to 3.0.9
- Kept release information separate from the working dashboard so the journal remains focused and uncluttered
- Included the LucasTD creator signature in the final release record

### Verification

- TypeScript type-check: pass
- Vite production build: pass

## 3.6.0-before-after-evidence — 2026-09-20

### Added

- Added separate Before and After chart uploads to new and existing trade records
- Added a full-detail evidence comparison that presents the pre-entry thesis before the post-trade outcome
- Added independent replacement, drag-and-drop, preview, and removal controls for both images

### Changed

- Existing chart images remain the After image automatically for complete backward compatibility
- Calendar cards and Technique history continue using only the After image as their compact thumbnail
- Journal backup and restore now preserve the optional Before image alongside the existing After image

### Verification

- TypeScript type-check: pass
- Vite production build: pass

## 3.5.2-custom-technique-flow — 2026-09-20

### Changed

- Replaced the preset Price Key dropdown with a direct-entry field whenever “อื่น ๆ” Technique is selected
- Restored the preset dropdown automatically when returning to standard Techniques
- Preserved custom Technique and Price Key values when reopening existing trade records
- Required a named Price Key for custom Techniques so analytics do not accumulate ambiguous “อื่น ๆ” entries

### Verification

- TypeScript type-check: pass
- Vite production build: pass

## 3.5.1-creator-credit — 2026-09-20

### Changed

- Added a restrained “Designed & developed by LucasTD” creator credit to the global footer
- Kept the signature readable across mobile, tablet, and desktop layouts without competing with journal content

### Verification

- TypeScript type-check: pass
- Vite production build: pass

## 3.5.0-combo-techniques — 2026-09-20

### Added

- Added independent multi-select Technique controls for combinations such as ICT + MSNR and MSNR + SMC
- Added an inline custom Technique field when “อื่น ๆ” is selected; custom systems can also be combined with built-in techniques
- Added structured `techniques` arrays to trade records while retaining readable legacy fields for backup compatibility
- Added a production Netlify configuration with automatic builds from GitHub and SPA fallback routing

### Changed

- Price Key choices now combine the available models from every selected Technique without duplicate options
- Technique history, Price Key statistics, calendar records, compact evidence cards, and full trade details now use the saved Technique combination
- Existing single-technique and legacy combination records migrate automatically without discarding their original labels

### Verification

- TypeScript type-check: pass
- Vite production build: pass

## 3.4.0-technique-archive — 2026-09-19

### Added

- Added a Technique-first trade structure for FIRE, ALCHEMIST, ICT, SMC, SMT, MSNR, and custom systems
- Added Technique-specific Price Key choices while retaining custom Price Keys for research workflows
- Added an interactive technique archive in Analysis: Technique → Price Key statistics → compact chart-backed trade history → full trade record

### Changed

- Separated the high-level trading system from the Price Key used for entry across forms, detail views, calendar cards, and analytics
- Reduced edit actions to one clear control in the full trade record; calendar cards now open details instead of presenting another edit action
- Migrated existing browser records conservatively and marked ambiguous legacy entries as unclassified instead of inventing a Price Key
- Classified legacy Classic A, Classic V, SBR, and RBS records under MSNR while preserving their original Price Key labels

### Verification

- TypeScript type-check: pass
- Vite production build: pass

## 3.3.0-adaptive-navigation — 2026-09-18

### Added

- Added a persistent navigation preference with desktop side-rail and top-bar layouts
- Added an animated compact mode for the side rail to recover workspace width on tablets and narrower desktop screens

### Changed

- Preserved quick metrics, profile access, Journal, Analysis, and Capital Ledger controls in both desktop layouts
- Defaulted first-time users on medium desktop/tablet widths to the compact rail while leaving mobile navigation unchanged
- Sized the sticky rail against the live browser viewport so profile controls remain visible before scrolling, including on tablets with expanded browser chrome
- Allowed the navigation settings panel to escape the rail boundary instead of being clipped in the expanded sidebar layout

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
