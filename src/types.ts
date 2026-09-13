export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  startingCapital: number;
  createdAt: string;
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

export interface Trade {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  technique: string;
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
