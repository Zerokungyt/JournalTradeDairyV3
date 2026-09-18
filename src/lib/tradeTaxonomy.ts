import { Trade, TradeOutcome } from '../types';

export const ENTRY_SETUPS = [
  'Classic A',
  'Classic V',
  'SBR',
  'RBS',
  'OCL',
  'FIRE · Fibonacci Inversion',
  'ICT Order Block',
  'ICT Engulfing Order Block',
  'Quasimodo · QM',
  'Fibo Circle',
  'Fibo Storyline',
  'อื่น ๆ',
];

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

export function getTradeSetup(trade: Trade): string {
  return trade.setup?.trim() || trade.technique?.trim() || 'Legacy / Unclassified';
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
