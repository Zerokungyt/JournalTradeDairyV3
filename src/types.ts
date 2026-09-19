export interface UserProfile {
  uid: string;
  email?: string;
  displayName: string;
  photoURL: string;
  tradingPlan?: string;
  bio?: string;
  startingCapital: number;
  createdAt: string;
}

export interface JournalBackup {
  app: 'JournalTradeDaily';
  version: 3;
  exportedAt: string;
  profile: UserProfile;
  trades: Trade[];
  cashflows: CashflowRecord[];
}

export type CashflowType = 'deposit' | 'withdrawal';

export interface CashflowRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  type: CashflowType;
  amount: number;
  note?: string;
  createdAt: number;
}

export type TradeEmotion = 'fear' | 'overconfident' | 'calm' | 'greedy' | 'patient' | 'other';
export type TradeOutcome = 'win' | 'loss' | 'breakeven' | 'breakeven_plus';
export type TradeDirection = 'buy' | 'sell';
export type TradeEntryStyle = 'direct' | 'confirmed';

export interface Trade {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  technique: string; // High-level technique; retained for backward-compatible backups.
  strategy?: string; // ALCHEMIST, FIRE, ICT, SMC, SMT, MSNR, etc.
  setup?: string; // Price Key / entry model inside the selected technique.
  direction?: TradeDirection;
  timeframe?: string;
  entryStyle?: TradeEntryStyle;
  confirmations?: string[];
  outcome?: TradeOutcome;
  exitType?: string;
  realizedR?: number;
  mfe?: number;
  mae?: number;
  tp: number;
  sl: number;
  profitLoss: number; // Positive for profit, negative for loss
  reason: string;
  emotion: TradeEmotion;
  imageUrl: string; // Can be base64 or external url
  notes?: string;
  createdAt: number;
}

export interface TechniqueStats {
  name: string;
  count: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface EmotionStats {
  name: string;
  value: number;
  color: string;
}
