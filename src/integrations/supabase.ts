import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Initial seed data for offline / standalone preview
const SEED_CLIENTS = [
  {
    id: "client-book-01",
    username: "Book",
    full_name: "Company Super Admin",
    password: "admin",
    role: "company",
    credit_received: 10000000,
    credit_remaining: 10000000,
    cash: 5000000,
    pl_downline: 0,
    balance_upline: 0,
    status: "active",
    parent_username: "",
    phone: "9876543210",
    downline_share: 100,
    reference: "Master Book",
    betting_allowed: true,
    can_settle_pl: true,
    commission: 2.0,
    notes: "Main company top-level account",
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "client-admin-01",
    username: "admin",
    full_name: "Exchange Senior Admin",
    password: "admin",
    role: "admin",
    credit_received: 2000000,
    credit_remaining: 2000000,
    cash: 1000000,
    pl_downline: 0,
    balance_upline: 0,
    status: "active",
    parent_username: "Book",
    phone: "9876543211",
    downline_share: 85,
    reference: "Admin 1",
    betting_allowed: true,
    can_settle_pl: true,
    commission: 2.0,
    notes: "Senior administrator account",
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "client-user-01",
    username: "client1",
    full_name: "John Player",
    password: "client1",
    role: "client",
    credit_received: 50000,
    credit_remaining: 45000,
    cash: 25000,
    pl_downline: 0,
    balance_upline: 0,
    status: "active",
    parent_username: "admin",
    phone: "9876543212",
    downline_share: 0,
    reference: "Demo client",
    betting_allowed: true,
    can_settle_pl: false,
    commission: 0.0,
    notes: "Demo player account",
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "client-user-02",
    username: "demo_user",
    full_name: "Demo Player",
    password: "demo",
    role: "client",
    credit_received: 20000,
    credit_remaining: 18500,
    cash: 10000,
    pl_downline: 0,
    balance_upline: 0,
    status: "active",
    parent_username: "admin",
    phone: "9876543213",
    downline_share: 0,
    reference: "Guest player",
    betting_allowed: true,
    can_settle_pl: false,
    commission: 0.0,
    notes: "Demo guest account",
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_MATCHES = [
  {
    id: "match-01",
    title: "India vs Australia",
    sport: "cricket",
    team1: "India",
    team2: "Australia",
    match_time: new Date(Date.now() + 1800000).toISOString(),
    status: "live",
    back_odds: 1.85,
    lay_odds: 1.88,
    back_odds2: 2.12,
    lay_odds2: 2.16,
    category: "ICC T20 Series",
    betfair_event_id: "331001",
    cricbuzz_match_id: "8801",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "match-02",
    title: "England vs South Africa",
    sport: "cricket",
    team1: "England",
    team2: "South Africa",
    match_time: new Date(Date.now() + 7200000).toISOString(),
    status: "upcoming",
    back_odds: 1.92,
    lay_odds: 1.95,
    back_odds2: 1.98,
    lay_odds2: 2.02,
    category: "ODI World Series",
    betfair_event_id: "331002",
    cricbuzz_match_id: "8802",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "match-03",
    title: "Real Madrid vs Barcelona",
    sport: "football",
    team1: "Real Madrid",
    team2: "Barcelona",
    match_time: new Date(Date.now() + 3600000).toISOString(),
    status: "live",
    back_odds: 2.20,
    lay_odds: 2.25,
    back_odds2: 3.10,
    lay_odds2: 3.20,
    category: "La Liga",
    betfair_event_id: "331003",
    cricbuzz_match_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "match-04",
    title: "Novak Djokovic vs Carlos Alcaraz",
    sport: "tennis",
    team1: "Novak Djokovic",
    team2: "Carlos Alcaraz",
    match_time: new Date(Date.now() + 5400000).toISOString(),
    status: "live",
    back_odds: 1.75,
    lay_odds: 1.80,
    back_odds2: 2.20,
    lay_odds2: 2.26,
    category: "Wimbledon Championship",
    betfair_event_id: "331004",
    cricbuzz_match_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "match-05",
    title: "Chennai Super Kings vs Mumbai Indians",
    sport: "cricket",
    team1: "Chennai Super Kings",
    team2: "Mumbai Indians",
    match_time: new Date(Date.now() + 86400000).toISOString(),
    status: "upcoming",
    back_odds: 1.90,
    lay_odds: 1.94,
    back_odds2: 1.96,
    lay_odds2: 2.00,
    category: "Indian Premier League",
    betfair_event_id: "331005",
    cricbuzz_match_id: "8805",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_BETS = [
  {
    id: "bet-01",
    user_email: "client1",
    match_id: "match-01",
    match_title: "India vs Australia",
    selection: "India",
    bet_type: "back",
    stake: 5000,
    odds: 1.85,
    potential_win: 4250,
    status: "pending",
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "bet-02",
    user_email: "demo_user",
    match_id: "match-03",
    match_title: "Real Madrid vs Barcelona",
    selection: "Real Madrid",
    bet_type: "back",
    stake: 1500,
    odds: 2.20,
    potential_win: 1800,
    status: "pending",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_TRANSACTIONS = [
  {
    id: "tx-01",
    client_username: "client1",
    type: "credit",
    amount: 50000,
    description: "Initial Credit Allotment",
    before_balance: 0,
    after_balance: 50000,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "tx-02",
    client_username: "client1",
    type: "cash",
    amount: 25000,
    description: "Cash Deposit",
    before_balance: 0,
    after_balance: 25000,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

// Helper to get / set localStorage table collections
function getLocalTable(table: string): any[] {
  try {
    const key = `exchange_db_${table}`;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);

    let seed: any[] = [];
    if (table === "clients") seed = SEED_CLIENTS;
    else if (table === "matches") seed = SEED_MATCHES;
    else if (table === "bets") seed = SEED_BETS;
    else if (table === "transactions") seed = SEED_TRANSACTIONS;

    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  } catch {
    return [];
  }
}

function saveLocalTable(table: string, data: any[]): void {
  try {
    localStorage.setItem(`exchange_db_${table}`, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to persist to localStorage:", e);
  }
}

// In-memory query builder mock that mirrors the Supabase fluent API
class MockQueryBuilder {
  private _table: string;
  private _operation: "select" | "insert" | "update" | "delete" = "select";
  private _insertPayload: any = null;
  private _updatePayload: any = null;
  private _filters: Array<(item: any) => boolean> = [];
  private _sortCol: string | null = null;
  private _sortAsc: boolean = true;
  private _limitCount: number | null = null;
  private _isSingle: boolean = false;

  constructor(table: string) {
    this._table = table;
  }

  select(_cols?: string) {
    return this;
  }

  insert(data: any) {
    this._operation = "insert";
    this._insertPayload = data;
    return this;
  }

  update(data: any) {
    this._operation = "update";
    this._updatePayload = data;
    return this;
  }

  delete() {
    this._operation = "delete";
    return this;
  }

  eq(col: string, val: any) {
    this._filters.push((item) => {
      const itemVal = item[col];
      if (typeof val === "string" && typeof itemVal === "string") {
        return itemVal.toLowerCase() === val.toLowerCase();
      }
      return itemVal === val;
    });
    return this;
  }

  neq(col: string, val: any) {
    this._filters.push((item) => item[col] !== val);
    return this;
  }

  gt(col: string, val: any) {
    this._filters.push((item) => item[col] > val);
    return this;
  }

  gte(col: string, val: any) {
    this._filters.push((item) => item[col] >= val);
    return this;
  }

  lt(col: string, val: any) {
    this._filters.push((item) => item[col] < val);
    return this;
  }

  lte(col: string, val: any) {
    this._filters.push((item) => item[col] <= val);
    return this;
  }

  in(col: string, vals: any[]) {
    this._filters.push((item) => vals.includes(item[col]));
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this._sortCol = col;
    this._sortAsc = opts?.ascending ?? true;
    return this;
  }

  limit(n: number) {
    this._limitCount = n;
    return this;
  }

  single() {
    this._isSingle = true;
    return this;
  }

  maybeSingle() {
    this._isSingle = true;
    return this;
  }

  private _execute(): { data: any; error: any } {
    const list = getLocalTable(this._table);

    if (this._operation === "insert") {
      const toInsert = Array.isArray(this._insertPayload) ? this._insertPayload : [this._insertPayload];
      const inserted = toInsert.map((item) => ({
        id: item.id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...item,
      }));
      const updatedList = [...list, ...inserted];
      saveLocalTable(this._table, updatedList);
      const res = this._isSingle ? inserted[0] : (Array.isArray(this._insertPayload) ? inserted : inserted[0]);
      return { data: res, error: null };
    }

    if (this._operation === "update") {
      let updatedItem: any = null;
      const updatedList = list.map((item) => {
        const matches = this._filters.every((f) => f(item));
        if (matches) {
          updatedItem = { ...item, ...this._updatePayload, updated_at: new Date().toISOString() };
          return updatedItem;
        }
        return item;
      });
      saveLocalTable(this._table, updatedList);
      return { data: this._isSingle ? updatedItem : updatedList, error: null };
    }

    if (this._operation === "delete") {
      const remaining = list.filter((item) => !this._filters.every((f) => f(item)));
      saveLocalTable(this._table, remaining);
      return { data: null, error: null };
    }

    // Select operation
    let result = list.filter((item) => this._filters.every((f) => f(item)));

    if (this._sortCol) {
      const col = this._sortCol;
      const asc = this._sortAsc;
      result.sort((a, b) => {
        if (a[col] < b[col]) return asc ? -1 : 1;
        if (a[col] > b[col]) return asc ? 1 : -1;
        return 0;
      });
    }

    if (this._limitCount != null) {
      result = result.slice(0, this._limitCount);
    }

    if (this._isSingle) {
      return { data: result[0] || null, error: null };
    }

    return { data: result, error: null };
  }

  // Promise interface for await
  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this._execute()).then(onfulfilled, onrejected);
  }
}

// Create real client if valid URL and Key are present
let realClient: any = null;
if (supabaseUrl && supabaseAnonKey && typeof supabaseUrl === "string" && supabaseUrl.startsWith("http")) {
  try {
    realClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn("[Exchange] Using mock database adapter:", err);
  }
}

export const supabase: any = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === "from") {
        return (table: string) => {
          if (realClient) {
            return realClient.from(table);
          }
          return new MockQueryBuilder(table);
        };
      }
      if (realClient && prop in realClient) {
        return (realClient as any)[prop];
      }
      return () => new MockQueryBuilder("default");
    },
  }
);
