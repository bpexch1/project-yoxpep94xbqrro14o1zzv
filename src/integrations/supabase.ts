import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) || (typeof process !== "undefined" && process.env?.VITE_SUPABASE_URL) || "";
const supabaseAnonKey = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) || (typeof process !== "undefined" && process.env?.VITE_SUPABASE_ANON_KEY) || "";

// Initial seed data for offline / standalone preview
const SEED_CLIENTS = [
  {
    id: "client-book-01",
    username: "Book",
    full_name: "Company Super Admin",
    role: "company",
    credit_received: 0,
    credit_remaining: 0,
    cash: 0,
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
    role: "admin",
    credit_received: 0,
    credit_remaining: 0,
    cash: 0,
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
    role: "client",
    credit_received: 0,
    credit_remaining: 0,
    cash: 0,
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
    role: "client",
    credit_received: 0,
    credit_remaining: 0,
    cash: 0,
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

const nowMs = Date.now();

const SEED_MATCHES = [
  // Cricket Matches
  {
    id: "match-ck-01",
    sport: "Cricket",
    team1: "India",
    team2: "Australia",
    title: "India v Australia",
    status: "live",
    match_time: new Date(nowMs - 3600000).toISOString(),
    odds: 1.85,
    back_odds: 1.85,
    lay_odds: 1.88,
    back_odds2: 2.14,
    lay_odds2: 2.18,
    category: "ICC Champions Trophy",
    created_at: new Date(nowMs - 86400000).toISOString(),
  },
  {
    id: "match-ck-02",
    sport: "Cricket",
    team1: "Chennai Super Kings",
    team2: "Mumbai Indians",
    title: "Chennai Super Kings v Mumbai Indians",
    status: "live",
    match_time: new Date(nowMs - 1800000).toISOString(),
    odds: 1.92,
    back_odds: 1.92,
    lay_odds: 1.96,
    back_odds2: 2.05,
    lay_odds2: 2.09,
    category: "Indian Premier League",
    created_at: new Date(nowMs - 86400000).toISOString(),
  },
  {
    id: "match-ck-03",
    sport: "Cricket",
    team1: "England",
    team2: "South Africa",
    title: "England v South Africa",
    status: "upcoming",
    match_time: new Date(nowMs + 7200000).toISOString(),
    odds: 1.90,
    back_odds: 1.90,
    lay_odds: 1.94,
    back_odds2: 2.08,
    lay_odds2: 2.12,
    category: "T20 International Series",
    created_at: new Date(nowMs - 86400000).toISOString(),
  },
  {
    id: "match-ck-04",
    sport: "Cricket",
    team1: "Pakistan",
    team2: "New Zealand",
    title: "Pakistan v New Zealand",
    status: "upcoming",
    match_time: new Date(nowMs + 18000000).toISOString(),
    odds: 1.95,
    back_odds: 1.95,
    lay_odds: 1.99,
    back_odds2: 2.02,
    lay_odds2: 2.06,
    category: "ODI Tri-Series",
    created_at: new Date(nowMs - 86400000).toISOString(),
  },

  // Soccer Matches
  {
    id: "match-sc-01",
    sport: "Soccer",
    team1: "Arsenal",
    team2: "Chelsea",
    title: "Arsenal v Chelsea",
    status: "live",
    match_time: new Date(nowMs - 2700000).toISOString(),
    odds: 1.78,
    back_odds: 1.78,
    lay_odds: 1.82,
    back_odds2: 4.80,
    lay_odds2: 4.90,
    category: "Premier League",
    created_at: new Date(nowMs - 86400000).toISOString(),
  },
  {
    id: "match-sc-02",
    sport: "Soccer",
    team1: "Real Madrid",
    team2: "Barcelona",
    title: "Real Madrid v Barcelona",
    status: "live",
    match_time: new Date(nowMs - 1200000).toISOString(),
    odds: 2.10,
    back_odds: 2.10,
    lay_odds: 2.16,
    back_odds2: 3.40,
    lay_odds2: 3.50,
    category: "La Liga",
    created_at: new Date(nowMs - 86400000).toISOString(),
  },
  {
    id: "match-sc-03",
    sport: "Soccer",
    team1: "Liverpool",
    team2: "Manchester City",
    title: "Liverpool v Manchester City",
    status: "upcoming",
    match_time: new Date(nowMs + 14400000).toISOString(),
    odds: 2.30,
    back_odds: 2.30,
    lay_odds: 2.36,
    back_odds2: 3.10,
    lay_odds2: 3.18,
    category: "Premier League",
    created_at: new Date(nowMs - 86400000).toISOString(),
  },

  // Tennis Matches
  {
    id: "match-tn-01",
    sport: "Tennis",
    team1: "Carlos Alcaraz",
    team2: "Novak Djokovic",
    title: "Carlos Alcaraz v Novak Djokovic",
    status: "live",
    match_time: new Date(nowMs - 3000000).toISOString(),
    odds: 1.82,
    back_odds: 1.82,
    lay_odds: 1.86,
    back_odds2: 2.18,
    lay_odds2: 2.24,
    category: "ATP Masters 1000",
    created_at: new Date(nowMs - 86400000).toISOString(),
  },
  {
    id: "match-tn-02",
    sport: "Tennis",
    team1: "Jannik Sinner",
    team2: "Daniil Medvedev",
    title: "Jannik Sinner v Daniil Medvedev",
    status: "upcoming",
    match_time: new Date(nowMs + 10800000).toISOString(),
    odds: 1.65,
    back_odds: 1.65,
    lay_odds: 1.69,
    back_odds2: 2.45,
    lay_odds2: 2.52,
    category: "ATP Grand Slam",
    created_at: new Date(nowMs - 86400000).toISOString(),
  },
];

const SEED_BETS: any[] = [];

const SEED_TRANSACTIONS: any[] = [];

// Helper to get / set localStorage table collections
export function resetAndSeedDatabase(): void {
  try {
    const keysToRemove = [
      "exchange_db_clients",
      "exchange_db_matches",
      "exchange_db_bets",
      "exchange_db_transactions",
      "exchange_db_game_settings",
      "exchange_db_live_rates",
      "clientSession",
      "supabase.auth.token",
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("sb-") ||
          key.startsWith("exchange_") ||
          key.includes("auth") ||
          key.includes("Session"))
      ) {
        localStorage.removeItem(key);
      }
    }

    localStorage.setItem("exchange_db_clients", JSON.stringify(SEED_CLIENTS));
    localStorage.setItem("exchange_db_matches", JSON.stringify(SEED_MATCHES));
    localStorage.setItem("exchange_db_bets", JSON.stringify(SEED_BETS));
    localStorage.setItem("exchange_db_transactions", JSON.stringify(SEED_TRANSACTIONS));
    localStorage.setItem("exchange_db_initialized_v5", "true");
  } catch (err) {
    console.error("[DB_RESET] Error during resetAndSeedDatabase:", err);
  }
}

// Auto-run reset on first load of v5
if (typeof window !== "undefined" && !localStorage.getItem("exchange_db_initialized_v5")) {
  resetAndSeedDatabase();
}

function getLocalTable(table: string): any[] {
  try {
    if (table === "public_clients") {
      const clients = getLocalTable("clients");
      return clients.map((c: any) => {
        const copy = { ...c };
        delete copy.password;
        return copy;
      });
    }

    const key = `exchange_db_${table}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      let items = JSON.parse(raw);
      if ((table === "matches" || table === "sports_matches") && Array.isArray(items)) {
        if (items.length === 0) {
          items = [...SEED_MATCHES];
          localStorage.setItem(key, JSON.stringify(items));
        }
      }

      if (table === "clients" && Array.isArray(items)) {
        let changed = false;
        // Ensure Book exists with company role
        const bookIndex = items.findIndex(
          (c: any) => c && String(c.username || "").toLowerCase() === "book"
        );
        if (bookIndex >= 0) {
          if (
            items[bookIndex].role !== "company" ||
            items[bookIndex].status !== "active" ||
            items[bookIndex].cash === 5000000 ||
            items[bookIndex].cash === 4995000 ||
            items[bookIndex].credit_received === 10000000
          ) {
            items[bookIndex].role = "company";
            items[bookIndex].status = "active";
            if (items[bookIndex].cash === 5000000 || items[bookIndex].cash === 4995000) {
              items[bookIndex].cash = 0;
            }
            if (items[bookIndex].credit_received === 10000000) {
              items[bookIndex].credit_received = 0;
              items[bookIndex].credit_remaining = 0;
            }
            changed = true;
          }
        } else {
          items.unshift(SEED_CLIENTS[0]);
          changed = true;
        }

        // Ensure client1 exists
        const client1Index = items.findIndex(
          (c: any) => c && String(c.username || "").toLowerCase() === "client1"
        );
        if (client1Index === -1) {
          items.push(SEED_CLIENTS[2]);
          changed = true;
        }

        if (changed) {
          localStorage.setItem(key, JSON.stringify(items));
        }
      }

      return items;
    }

    let seed: any[] = [];
    if (table === "clients") seed = SEED_CLIENTS;
    else if (table === "matches" || table === "sports_matches") seed = SEED_MATCHES;
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
    const targetKey = table === "public_clients" ? "exchange_db_clients" : `exchange_db_${table}`;
    localStorage.setItem(targetKey, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to persist to localStorage:", e);
  }
}

// In-memory query builder mock that mirrors the Supabase fluent API
export class MockQueryBuilder {
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

  ilike(col: string, val: string) {
    this._filters.push((item) => {
      const itemVal = String(item[col] ?? "").toLowerCase();
      const cleanPattern = String(val ?? "").toLowerCase().replace(/%/g, ".*");
      try {
        return new RegExp(`^${cleanPattern}$`, "i").test(itemVal);
      } catch {
        return itemVal.includes(String(val).toLowerCase());
      }
    });
    return this;
  }

  like(col: string, val: string) {
    this._filters.push((item) => {
      const itemVal = String(item[col] ?? "");
      const cleanPattern = String(val ?? "").replace(/%/g, ".*");
      try {
        return new RegExp(`^${cleanPattern}$`).test(itemVal);
      } catch {
        return itemVal.includes(String(val));
      }
    });
    return this;
  }

  is(col: string, val: any) {
    this._filters.push((item) => item[col] === val);
    return this;
  }

  contains(col: string, val: any) {
    this._filters.push((item) => {
      const itemVal = item[col];
      if (Array.isArray(itemVal)) return itemVal.includes(val);
      if (typeof itemVal === "string") return itemVal.includes(String(val));
      return false;
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
    this._filters.push((item) => Array.isArray(vals) && vals.includes(item[col]));
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

// Resilient query wrapper that transparently falls back to MockQueryBuilder if Supabase network call fails
class ResilientQueryBuilder {
  private _table: string;
  private _mock: MockQueryBuilder;
  private _realQuery: any;

  constructor(table: string, realQuery: any) {
    this._table = table;
    this._mock = new MockQueryBuilder(table);
    this._realQuery = realQuery;
  }

  select(cols?: string) {
    this._mock.select(cols);
    if (this._realQuery && typeof this._realQuery.select === "function") {
      try {
        this._realQuery = this._realQuery.select(cols);
      } catch {
        this._realQuery = null;
      }
    }
    return this;
  }

  insert(data: any) {
    this._mock.insert(data);
    if (this._realQuery && typeof this._realQuery.insert === "function") {
      try {
        this._realQuery = this._realQuery.insert(data);
      } catch {
        this._realQuery = null;
      }
    }
    return this;
  }

  update(data: any) {
    this._mock.update(data);
    if (this._realQuery && typeof this._realQuery.update === "function") {
      try {
        this._realQuery = this._realQuery.update(data);
      } catch {
        this._realQuery = null;
      }
    }
    return this;
  }

  delete() {
    this._mock.delete();
    if (this._realQuery && typeof this._realQuery.delete === "function") {
      try {
        this._realQuery = this._realQuery.delete();
      } catch {
        this._realQuery = null;
      }
    }
    return this;
  }

  eq(col: string, val: any) {
    this._mock.eq(col, val);
    if (this._realQuery && typeof this._realQuery.eq === "function") {
      try {
        this._realQuery = this._realQuery.eq(col, val);
      } catch {
        this._realQuery = null;
      }
    }
    return this;
  }

  neq(col: string, val: any) {
    this._mock.neq(col, val);
    if (this._realQuery && typeof this._realQuery.neq === "function") {
      try {
        this._realQuery = this._realQuery.neq(col, val);
      } catch {
        this._realQuery = null;
      }
    }
    return this;
  }

  gt(col: string, val: any) {
    this._mock.gt(col, val);
    if (this._realQuery && typeof this._realQuery.gt === "function") {
      try {
        this._realQuery = this._realQuery.gt(col, val);
      } catch {
        this._realQuery = null;
      }
    }
    return this;
  }

  gte(col: string, val: any) {
    this._mock.gte(col, val);
    if (this._realQuery && typeof this._realQuery.gte === "function") {
      try {
        this._realQuery = this._realQuery.gte(col, val);
      } catch {
        this._realQuery = null;
      }
    }
    return this;
  }

  lt(col: string, val: any) {
    this._mock.lt(col, val);
    if (this._realQuery && typeof this._realQuery.lt === "function") {
      try {
        this._realQuery = this._realQuery.lt(col, val);
      } catch {
        this._realQuery = null;
      }
    }
    return this;
  }

  lte(col: string, val: any) {
    this._mock.lte(col, val);
    if (this._realQuery && typeof this._realQuery.lte === "function") {
      try {
        this._realQuery = this._realQuery.lte(col, val);
      } catch {
        this._realQuery = null;
      }
    }
    return this;
  }

  ilike(col: string, val: string) {
    this._mock.ilike(col, val);
    if (this._realQuery && typeof this._realQuery.ilike === "function") {
      try {
        this._realQuery = this._realQuery.ilike(col, val);
      } catch {
        this._realQuery = null;
      }
    }
    return this;
  }

  like(col: string, val: string) {
    this._mock.like(col, val);
    if (this._realQuery && typeof this._realQuery.like === "function") {
      try {
        this._realQuery = this._realQuery.like(col, val);
      } catch {
        this._realQuery = null;
      }
    }
    return this;
  }

  in(col: string, vals: any[]) {
    this._mock.in(col, vals);
    if (this._realQuery && typeof this._realQuery.in === "function") {
      try {
        this._realQuery = this._realQuery.in(col, vals);
      } catch {
        this._realQuery = null;
      }
    }
    return this;
  }

  is(col: string, val: any) {
    this._mock.is(col, val);
    if (this._realQuery && typeof this._realQuery.is === "function") {
      try {
        this._realQuery = this._realQuery.is(col, val);
      } catch {
        this._realQuery = null;
      }
    }
    return this;
  }

  contains(col: string, val: any) {
    this._mock.contains(col, val);
    if (this._realQuery && typeof this._realQuery.contains === "function") {
      try {
        this._realQuery = this._realQuery.contains(col, val);
      } catch {
        this._realQuery = null;
      }
    }
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this._mock.order(col, opts);
    if (this._realQuery && typeof this._realQuery.order === "function") {
      try {
        this._realQuery = this._realQuery.order(col, opts);
      } catch {
        this._realQuery = null;
      }
    }
    return this;
  }

  limit(n: number) {
    this._mock.limit(n);
    if (this._realQuery && typeof this._realQuery.limit === "function") {
      try {
        this._realQuery = this._realQuery.limit(n);
      } catch {
        this._realQuery = null;
      }
    }
    return this;
  }

  single() {
    this._mock.single();
    if (this._realQuery && typeof this._realQuery.single === "function") {
      try {
        this._realQuery = this._realQuery.single();
      } catch {
        this._realQuery = null;
      }
    }
    return this;
  }

  maybeSingle() {
    this._mock.maybeSingle();
    if (this._realQuery && typeof this._realQuery.maybeSingle === "function") {
      try {
        this._realQuery = this._realQuery.maybeSingle();
      } catch {
        this._realQuery = null;
      }
    }
    return this;
  }

  async then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    if (this._realQuery && typeof this._realQuery.then === "function") {
      try {
        // Run with a 3500ms safety timeout to prevent stalling on unreachable network
        const queryPromise = Promise.resolve(this._realQuery);
        const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
          setTimeout(() => reject(new Error("Supabase request timeout")), 3500)
        );
        const res = (await Promise.race([queryPromise, timeoutPromise])) as any;

        if (res && res.error) {
          const errMsg = String(res.error?.message || "");
          if (
            errMsg.includes("fetch") ||
            errMsg.includes("Failed to fetch") ||
            errMsg.includes("NetworkError") ||
            errMsg.includes("timeout") ||
            errMsg.includes("schema cache") ||
            errMsg.includes("relation") ||
            errMsg.includes("does not exist") ||
            errMsg.includes("404") ||
            errMsg.includes("500") ||
            errMsg.includes("502") ||
            errMsg.includes("503")
          ) {
            const mockRes = await this._mock;
            return Promise.resolve(mockRes).then(onfulfilled, onrejected);
          }
        }

        if (res && !res.error && res.data !== null && res.data !== undefined) {
          return Promise.resolve(res).then(onfulfilled, onrejected);
        }
      } catch {
        // Fallback gracefully on network error / failed fetch
        const mockRes = await this._mock;
        return Promise.resolve(mockRes).then(onfulfilled, onrejected);
      }
    }

    const mockRes = await this._mock;
    return Promise.resolve(mockRes).then(onfulfilled, onrejected);
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
          if (realClient && typeof realClient.from === "function") {
            try {
              const rQuery = realClient.from(table);
              return new ResilientQueryBuilder(table, rQuery);
            } catch {
              return new MockQueryBuilder(table);
            }
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

export default supabase;
