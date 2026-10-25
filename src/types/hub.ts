export interface BotCounters {
  books_good: number;
  books_trash: number;
}

export interface BotStats {
  counters: BotCounters;
  uptime: number;
  kills: Record<string, number>;
}

export interface BotState {
  id: string;
  username: string;
  hp: number;
  maxHp?: number;
  food: number;
  level: number;
  current_action: string;
  status?: string;
  lapis: number;
  books: number;
  trashCount: number;
  trash_limit: number;
  modules: string[]; // e.g. ["attack", "invis", "food", "exp", "enchant", "auto_sort"]
  foodThreshold: number;
  expThreshold: number;
  enchant_button_index: number; // 0: 30 lvl, 1: 20 lvl, 2: 10 lvl
  anarchy_farm: string;
  anarchy_trash: string;
  enchant_whitelist: string;
  stats: BotStats;
  current_books: Record<string, number>;
  connected: boolean;
  lastSeen: number;
  host: string;
  port: number;
}

export interface Incident {
  id: string;
  timestamp: string;
  bot_id: string;
  category: 'danger' | 'warn' | 'error' | 'info';
  msg: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'danger' | 'ack' | 'cmd';
  bot_id?: string;
  msg: string;
}

export interface GraphPoint {
  time: string;
  rawTime: number;
  books_good: number;
  books_trash: number;
  profit: number;
}

export interface HubConfig {
  mainAccount: string;
  autoPauseAllOnDanger: boolean;
  autoScanOnStart: boolean;
  autoScanPortStart: number;
  autoScanPortEnd: number;
  host: string;
  bots: Array<{
    id: string;
    host: string;
    port: number;
  }>;
}

export type HubTab = 'overview' | 'control' | 'graph' | 'stats' | 'incidents' | 'logs' | 'settings';
