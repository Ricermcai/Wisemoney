
export interface Quote {
  id: string;
  text: string;
  category: string;
  interpretation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum ViewState {
  WALL = 'WALL',
  CHAT = 'CHAT',
  LEDGER = 'LEDGER',
  JOURNAL = 'JOURNAL',
  DATA = 'DATA',
}

export type FundType = 'FREEDOM' | 'DREAM' | 'PLAY';
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL';

export interface Transaction {
  id: string;
  amount: number;
  fundType: FundType;
  type: TransactionType;
  description: string;
  date: number;
}

export interface DreamGoal {
  id: string;
  name: string;
  cost: number;
  isAchieved: boolean;
  achievedDate?: number;
}

export interface LedgerState {
  freedomFund: number;
  dreamFund: number;
  playFund: number;
  transactions: Transaction[];
  dreamGoals: DreamGoal[];
  percentages: {
    freedom: number;
    dream: number;
    play: number;
  };
}

export interface JournalEntry {
  id: string;
  timestamp: number;
  items: string[];
}

export const STORAGE_KEYS = {
  // New unified DB key
  DB: 'moneys-wisdom-db-v1',
  // Legacy keys for migration
  LEGACY_LEDGER: 'moneys-wisdom-ledger-v1',
  LEGACY_JOURNAL: 'moneys-wisdom-journal-v1'
};

export interface BackupData {
  version: number;
  timestamp: number;
  ledger: LedgerState | null;
  journal: JournalEntry[] | null;
}

// Internal app state structure
export interface AppData {
  version: number;
  timestamp: number;
  ledger: LedgerState;
  journal: JournalEntry[];
}
