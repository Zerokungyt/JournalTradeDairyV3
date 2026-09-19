import { Trade, TradeOutcome } from '../types';

export const TRADE_TECHNIQUES = [
  'ALCHEMIST',
  'FIRE',
  'ICT',
  'SMC',
  'SMT',
  'MSNR',
  'อื่น ๆ',
] as const;

export const LEGACY_PRICE_KEY = 'Legacy / Unclassified';

export const PRICE_KEYS_BY_TECHNIQUE: Record<string, string[]> = {
  ALCHEMIST: ['Classic A', 'Classic V', 'SBR', 'RBS', 'OCL', 'Quasimodo · QM', 'Fibo Circle', 'Fibo Storyline', 'อื่น ๆ'],
  FIRE: ['Fibonacci Inversion', 'อื่น ๆ'],
  ICT: ['Order Block', 'Engulfing Order Block', 'อื่น ๆ'],
  SMC: ['Order Block', 'Liquidity Block', 'BOS / CHOCH', 'อื่น ๆ'],
  SMT: ['SMT Divergence', 'อื่น ๆ'],
  MSNR: ['Classic A', 'Classic V', 'SBR', 'RBS', 'Significant Support / Resistance', 'อื่น ๆ'],
  'อื่น ๆ': ['อื่น ๆ'],
};

export const ENTRY_SETUPS = Array.from(new Set([
  ...Object.values(PRICE_KEYS_BY_TECHNIQUE).flat(),
  LEGACY_PRICE_KEY,
]));

const TECHNIQUE_SET = new Set<string>(TRADE_TECHNIQUES);

export const OPTIONAL_CONFIRMATIONS = [
  'CIC',
  'SMT',
  'QT',
  'Liquidity Sweep / TS',
  'Trendline Key',
  'PA',
  'Engulfing',
  'MSS / CHOCH',
  'BOS',
  'Rejection',
];

export const TRADE_TIMEFRAMES = ['M15', 'M30', 'H1', 'H4', 'D1'];

export const EXIT_TYPES = [
  'Take Profit',
  'Stop Loss',
  'Protected Exit / Guard',
  'Manual Exit',
  'Open / Other',
];

export const OUTCOME_LABELS: Record<TradeOutcome, string> = {
  win: 'WIN',
  loss: 'LOSS',
  breakeven: 'BE',
  breakeven_plus: 'BE+',
};

export function inferTechniqueFromPriceKey(priceKey: string): string {
  const normalized = priceKey.trim();
  if (!normalized) return 'อื่น ๆ';
  if (TECHNIQUE_SET.has(normalized)) return normalized;
  if (normalized === 'FIRE · Fibonacci Inversion' || normalized === 'Fibonacci Inversion') return 'FIRE';
  if (normalized.startsWith('ICT ')) return 'ICT';
  if (normalized === 'SMT Divergence') return 'SMT';
  if (['Classic A', 'Classic V', 'SBR', 'RBS', 'Significant Support / Resistance'].includes(normalized)) return 'MSNR';
  if (['OCL', 'Quasimodo · QM', 'Fibo Circle', 'Fibo Storyline'].includes(normalized)) return 'ALCHEMIST';
  return 'อื่น ๆ';
}

export function getTradeTechnique(trade: Trade): string {
  const strategy = trade.strategy?.trim();
  if (strategy) return strategy;
  const legacyTechnique = trade.technique?.trim();
  if (legacyTechnique && TECHNIQUE_SET.has(legacyTechnique)) return legacyTechnique;
  return inferTechniqueFromPriceKey(trade.setup?.trim() || legacyTechnique || '');
}

export function getTradePriceKey(trade: Trade): string {
  const rawSetup = trade.setup?.trim() || trade.technique?.trim() || '';
  if (!rawSetup || TECHNIQUE_SET.has(rawSetup)) return LEGACY_PRICE_KEY;
  if (rawSetup === 'FIRE · Fibonacci Inversion') return 'Fibonacci Inversion';
  if (rawSetup === 'ICT Order Block') return 'Order Block';
  if (rawSetup === 'ICT Engulfing Order Block') return 'Engulfing Order Block';
  return rawSetup;
}

export function getPriceKeysForTechnique(technique: string): string[] {
  return PRICE_KEYS_BY_TECHNIQUE[technique] || PRICE_KEYS_BY_TECHNIQUE['อื่น ๆ'];
}

// Alias retained for existing calendar call sites.
export function getTradeSetup(trade: Trade): string {
  return getTradePriceKey(trade);
}

export function getTradeOutcome(trade: Trade): TradeOutcome {
  if (trade.outcome) return trade.outcome;
  if (trade.profitLoss > 0) return 'win';
  if (trade.profitLoss < 0) return 'loss';
  return 'breakeven';
}

export function isDecidedOutcome(outcome: TradeOutcome): boolean {
  return outcome === 'win' || outcome === 'loss';
}
