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

const SEED_MATCHES: any[] = [];

const SEED_BETS: any[] = [];

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
    if (raw) {
      let items = JSON.parse(raw);
      if (table === "matches" && Array.isArray(items)) {
        // Filter out any legacy dummy seed matches
        items = items.filter(
          (m: any) =>
            m &&
            !["match-01", "match-02", "match-03", "match-04", "match-05"].includes(m.id) &&
            m.title !== "India vs Australia" &&
            m.title !== "Chennai Super Kings vs Mumbai Indians" &&
            m.title !== "Real Madrid vs Barcelona" &&
            m.title !== "England vs South Africa" &&
            m.title !== "Novak Djokovic vs Carlos Alcaraz"
        );
        localStorage.setItem(key, JSON.stringify(items));
      }
      return items;
    }

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
