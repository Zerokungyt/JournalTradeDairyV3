import { CashflowRecord, JournalBackup, Trade, UserProfile } from '../types';
import { TRADE_TECHNIQUES, getTradeOutcome, getTradePriceKey, getTradeTechnique } from './tradeTaxonomy';

export const DEFAULT_TECHNIQUES = [
  ...TRADE_TECHNIQUES,
];

export const CHART_PRESETS: { name: string; url: string }[] = [];

const PROFILE_KEY = 'jdt_v3_profile';
const TRADES_KEY = 'jdt_trades';
const CASHFLOWS_KEY = 'jdt_cashflows';

const DEFAULT_PROFILE: UserProfile = {
  uid: 'local_owner',
  displayName: 'My Trading Journal',
  photoURL: '',
  tradingPlan: 'Personal Playbook',
  bio: 'Process first. Outcome second.',
  startingCapital: 10000,
  createdAt: new Date().toISOString(),
};

function readArray<T>(key: string): T[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function sanitizeProfile(profile: UserProfile): UserProfile {
  const photoURL = typeof profile.photoURL === 'string' && profile.photoURL.startsWith('data:image/')
    ? profile.photoURL
    : '';
  const tradingPlan = profile.tradingPlan?.trim().toLowerCase() === 'alchemist'
    ? DEFAULT_PROFILE.tradingPlan
    : profile.tradingPlan;
  return { ...profile, photoURL, tradingPlan };
}

function migrateProfile(): UserProfile {
  const v3 = localStorage.getItem(PROFILE_KEY);
  if (v3) {
    try {
      const profile = sanitizeProfile({ ...DEFAULT_PROFILE, ...JSON.parse(v3), uid: 'local_owner', email: undefined });
      write(PROFILE_KEY, profile);
      return profile;
    } catch {
      // Fall through to the legacy migration.
    }
  }

  const legacyUsers = readArray<UserProfile>('jdt_users');
  const legacyId = localStorage.getItem('jdt_current_user_id');
  const legacy = legacyUsers.find((user) => user.uid === legacyId) || legacyUsers[0];
  const migrated: UserProfile = sanitizeProfile(legacy
    ? { ...DEFAULT_PROFILE, ...legacy, uid: 'local_owner', email: undefined }
    : DEFAULT_PROFILE);

  write(PROFILE_KEY, migrated);
  localStorage.removeItem('jdt_passwords');
  localStorage.removeItem('jdt_otps');
  localStorage.removeItem('jdt_firebase_config');
  return migrated;
}

function normalizeOwner<T extends { userId: string }>(records: T[]): T[] {
  return records.map((record) => ({ ...record, userId: 'local_owner' }));
}

function normalizeTrade(trade: Trade): Trade {
  const technique = getTradeTechnique(trade);
  const setup = getTradePriceKey(trade);
  return {
    ...trade,
    userId: 'local_owner',
    technique,
    strategy: technique,
    setup,
    direction: trade.direction || 'buy',
    timeframe: trade.timeframe || 'M15',
    entryStyle: trade.entryStyle || 'direct',
    confirmations: Array.isArray(trade.confirmations) ? trade.confirmations : [],
    outcome: getTradeOutcome(trade),
    exitType: trade.exitType || '',
  };
}

export const dbService = {
  getCurrentUser(): UserProfile {
    return migrateProfile();
  },

  updateProfile(
    _uid: string,
    displayName: string,
    photoURL: string,
    startingCapital: number,
    tradingPlan = 'Personal Playbook',
    bio = '',
  ): UserProfile {
    const profile: UserProfile = {
      ...migrateProfile(),
      uid: 'local_owner',
      email: undefined,
      displayName: displayName.trim(),
      photoURL,
      startingCapital,
      tradingPlan: tradingPlan.trim(),
      bio: bio.trim(),
    };
    write(PROFILE_KEY, profile);
    return profile;
  },

  getTrades(_userId = 'local_owner'): Trade[] {
    const trades = normalizeOwner(readArray<Trade>(TRADES_KEY)).map(normalizeTrade);
    write(TRADES_KEY, trades);
    return trades.sort((a, b) => b.createdAt - a.createdAt);
  },

  addTrade(tradeData: Omit<Trade, 'id' | 'createdAt'> & { id?: string }): Trade {
    const trades = this.getTrades();
    const existing = tradeData.id ? trades.find((trade) => trade.id === tradeData.id) : undefined;
    const result: Trade = {
      ...normalizeTrade(tradeData as Trade),
      userId: 'local_owner',
      id: tradeData.id || crypto.randomUUID(),
      createdAt: existing?.createdAt || Date.now(),
    };
    const next = existing
      ? trades.map((trade) => (trade.id === result.id ? result : trade))
      : [...trades, result];
    write(TRADES_KEY, next);
    return result;
  },

  deleteTrade(tradeId: string) {
    write(TRADES_KEY, this.getTrades().filter((trade) => trade.id !== tradeId));
  },

  updateStartingCapital(_userId: string, capital: number) {
    write(PROFILE_KEY, { ...migrateProfile(), startingCapital: capital });
  },

  getCashflows(_userId = 'local_owner'): CashflowRecord[] {
    const records = normalizeOwner(readArray<CashflowRecord>(CASHFLOWS_KEY));
    write(CASHFLOWS_KEY, records);
    return records.sort((a, b) => b.createdAt - a.createdAt);
  },

  addCashflow(record: Omit<CashflowRecord, 'id' | 'createdAt'>): CashflowRecord {
    const nextRecord: CashflowRecord = {
      ...record,
      userId: 'local_owner',
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    write(CASHFLOWS_KEY, [...this.getCashflows(), nextRecord]);
    return nextRecord;
  },

  deleteCashflow(id: string) {
    write(CASHFLOWS_KEY, this.getCashflows().filter((record) => record.id !== id));
  },

  createBackup(): JournalBackup {
    return {
      app: 'JournalTradeDaily',
      version: 3,
      exportedAt: new Date().toISOString(),
      profile: migrateProfile(),
      trades: this.getTrades(),
      cashflows: this.getCashflows(),
    };
  },

  restoreBackup(value: unknown): JournalBackup {
    if (!value || typeof value !== 'object') throw new Error('ไฟล์สำรองไม่ถูกต้อง');
    const backup = value as JournalBackup;
    if (backup.app !== 'JournalTradeDaily' || !backup.profile || !Array.isArray(backup.trades) || !Array.isArray(backup.cashflows)) {
      throw new Error('ไฟล์นี้ไม่ใช่ข้อมูลสำรองของ JournalTradeDaily');
    }
    const normalized: JournalBackup = {
      ...backup,
      version: 3,
      profile: { ...DEFAULT_PROFILE, ...backup.profile, uid: 'local_owner', email: undefined },
      trades: normalizeOwner(backup.trades).map(normalizeTrade),
      cashflows: normalizeOwner(backup.cashflows),
    };
    write(PROFILE_KEY, normalized.profile);
    write(TRADES_KEY, normalized.trades);
    write(CASHFLOWS_KEY, normalized.cashflows);
    localStorage.setItem('jdt_last_backup_at', new Date().toISOString());
    return normalized;
  },

  getLastBackupAt(): string | null {
    return localStorage.getItem('jdt_last_backup_at');
  },
};
