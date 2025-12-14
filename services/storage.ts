
import { AppData, LedgerState, JournalEntry, STORAGE_KEYS } from '../types';
import { INITIAL_DATA } from '../data/initialData'; // Import the master data file

const DB_VERSION = 2; 

export interface ImportStats {
  success: boolean;
  transactionCount: number;
  journalCount: number;
  message?: string;
}

export const StorageService = {
  /**
   * Retrieves the unified database object.
   * Logic: Checks INITIAL_DATA (code) vs LocalStorage. 
   * If code is newer (version bump) or timestamp is higher, it wins.
   */
  getDB: (): AppData => {
    let localDB: AppData | null = null;
    try {
      const dbStr = localStorage.getItem(STORAGE_KEYS.DB);
      if (dbStr) {
        localDB = JSON.parse(dbStr);
      }
    } catch (e) {
      console.error("DB Read Error", e);
    }

    // LOGIC: Sync from Code File
    if (INITIAL_DATA) {
        // Priority 1: Version Upgrade
        // If code has a newer version number than local, force update from code.
        const codeVersion = INITIAL_DATA.version || 0;
        const localVersion = localDB?.version || 0;
        
        if (codeVersion > localVersion) {
             console.log(`App Upgrade (v${localVersion} -> v${codeVersion}): Loading from initialData.ts`);
             // We return INITIAL_DATA, but we don't auto-save immediately to avoid overwriting 
             // before the user interacts. The app state will reflect INITIAL_DATA.
             // (Actually, safer to return it, let app render, and next save will persist it)
             return INITIAL_DATA;
        }

        // Priority 2: Timestamp Check (Only if versions are same)
        // If versions match, we usually trust LocalStorage unless it's missing or older.
        if (codeVersion === localVersion) {
            const codeTimestamp = INITIAL_DATA.timestamp || 0;
            const localTimestamp = localDB?.timestamp || 0;

            // If local doesn't exist, OR code is strictly newer
            if (!localDB || codeTimestamp > localTimestamp) {
                return INITIAL_DATA;
            }
        }
    }

    // Fallback: If local exists and is valid/newer, use local
    if (localDB) {
        return localDB;
    }

    return INITIAL_DATA;
  },

  /**
   * Saves the entire database state.
   * CRITICAL FIX: Monotonic Timestamp
   * We ensure the new timestamp is strictly greater than both:
   * 1. The current real time (Date.now())
   * 2. The timestamp in INITIAL_DATA (to beat future-dated static files)
   * 3. The timestamp currently in localStorage
   */
  saveDB: (data: AppData) => {
    try {
        let maxExistingTs = Date.now();

        // Check 1: Static file timestamp
        if (INITIAL_DATA && INITIAL_DATA.timestamp) {
            maxExistingTs = Math.max(maxExistingTs, INITIAL_DATA.timestamp);
        }

        // Check 2: Current LocalStorage timestamp
        try {
            const currentLocal = localStorage.getItem(STORAGE_KEYS.DB);
            if (currentLocal) {
                const parsed = JSON.parse(currentLocal);
                if (parsed.timestamp) {
                    maxExistingTs = Math.max(maxExistingTs, parsed.timestamp);
                }
            }
        } catch(e) {}

        // Create a new timestamp that is guaranteed to be the newest
        const newTimestamp = maxExistingTs + 1;
        
        const toSave = { ...data, timestamp: newTimestamp };
        localStorage.setItem(STORAGE_KEYS.DB, JSON.stringify(toSave));
    } catch (e) {
        console.error("Failed to save to localStorage.", e);
        alert("系统错误：保存数据失败！可能是存储空间不足。");
    }
  },

  saveLedger: (ledger: LedgerState) => {
    const db = StorageService.getDB();
    db.ledger = ledger;
    StorageService.saveDB(db);
  },

  saveJournal: (journal: JournalEntry[]) => {
    const db = StorageService.getDB();
    db.journal = journal;
    StorageService.saveDB(db);
  },

  /**
   * Imports a backup object with Verification.
   */
  importBackup: (data: any): ImportStats => {
      try {
        if (!data || typeof data !== 'object') {
            return { success: false, transactionCount: 0, journalCount: 0, message: "文件格式错误" };
        }
        
        let newLedger = INITIAL_DATA.ledger;
        if (data.ledger && typeof data.ledger === 'object') {
            newLedger = { ...INITIAL_DATA.ledger, ...data.ledger }; 
            if (!Array.isArray(newLedger.transactions)) newLedger.transactions = [];
        }

        let newJournal: JournalEntry[] = [];
        if (Array.isArray(data.journal)) {
            newJournal = data.journal;
        }

        // We use saveDB here to ensure the imported data gets a valid high timestamp
        const newDB: AppData = {
            version: Math.max(DB_VERSION, data.version || 0),
            timestamp: 0, // saveDB will fix this
            ledger: newLedger,
            journal: newJournal
        };

        StorageService.saveDB(newDB);

        return {
            success: true,
            transactionCount: newLedger.transactions.length,
            journalCount: newJournal.length
        };

      } catch (e: any) {
          console.error("Import failed", e);
          return { success: false, transactionCount: 0, journalCount: 0, message: e.message };
      }
  },

  clearDB: () => {
    // Revert to initial data state but empty, effectively resetting
    const emptyDB: AppData = {
        version: DB_VERSION,
        timestamp: 0, // saveDB will generate a fresh timestamp > INITIAL_DATA
        ledger: { ...INITIAL_DATA.ledger },
        journal: [] 
    };
    // Reset specific ledger values to 0
    emptyDB.ledger.freedomFund = 0;
    emptyDB.ledger.dreamFund = 0;
    emptyDB.ledger.playFund = 0;
    emptyDB.ledger.transactions = [];
    emptyDB.ledger.dreamGoals = [];

    StorageService.saveDB(emptyDB);
  }
};
