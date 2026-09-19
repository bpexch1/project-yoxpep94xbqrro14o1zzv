import { supabase } from "@/integrations/supabase";

// Map entity names to Supabase table names
const TABLE_MAP: Record<string, string> = {
  Client: "clients",
  Match: "matches",
  SportsMatch: "matches",
  Bet: "bets",
  Transaction: "transactions",
};

function getTable(entityName: string): string {
  const table = TABLE_MAP[entityName];
  if (!table) throw new Error(`Unknown entity: ${entityName}`);
  return table;
}

function transformRow(row: any): any {
  if (!row) return null;
  return { ...row };
}

// Generic query builder that mimics the old SuperdevClient chaining API
class QueryBuilder {
  private _table: string;
  private _filters: Array<{ method: string; column: string; value: any }> = [];
  private _sortColumn: string = "created_at";
  private _sortAsc: boolean = false;
  private _limitVal: number = 500;
  private _inFilters: Array<{ column: string; values: any[] }> = [];

  constructor(table: string) {
    this._table = table;
  }

  where(column: string, value: any): this;
  where(column: string, op: string, value: any): this;
  where(column: string, opOrValue: any, value?: any): this {
    if (value === undefined) {
      this._filters.push({ method: "eq", column, value: opOrValue });
    } else {
      const op = opOrValue;
      if (op === "in") {
        this._inFilters.push({ column, values: value });
      } else {
        this._filters.push({ method: op, column, value });
      }
    }
    return this;
  }

  in(column: string, values: any[]): this {
    this._inFilters.push({ column, values });
    return this;
  }

  sort(column: string): this {
    if (column.startsWith("-")) {
      this._sortColumn = column.slice(1);
      this._sortAsc = false;
    } else {
      this._sortColumn = column;
      this._sortAsc = true;
    }
    return this;
  }

  limit(n: number): this {
    this._limitVal = n;
    return this;
  }

  async exec(): Promise<any[]> {
    let query = supabase.from(this._table).select("*");

    for (const f of this._filters) {
      if (f.method === "eq") query = (query as any).eq(f.column, f.value);
      else if (f.method === "neq") query = (query as any).neq(f.column, f.value);
      else if (f.method === "gt") query = (query as any).gt(f.column, f.value);
      else if (f.method === "gte") query = (query as any).gte(f.column, f.value);
      else if (f.method === "lt") query = (query as any).lt(f.column, f.value);
      else if (f.method === "lte") query = (query as any).lte(f.column, f.value);
    }

    for (const f of this._inFilters) {
      query = (query as any).in(f.column, f.values);
    }

    query = (query as any).order(this._sortColumn, { ascending: this._sortAsc });
    query = (query as any).limit(this._limitVal);

    const { data, error } = await query;
    if (error) {
      console.error(`[${this._table}] query error:`, error.message);
      return [];
    }
    return (data || []).map(transformRow);
  }
}

// Generic batch operations
class BatchBuilder {
  private _table: string;

  constructor(table: string) {
    this._table = table;
  }

  async delete(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    const { error } = await supabase.from(this._table).delete().in("id", ids);
    if (error) throw new Error(error.message);
  }
}

/**
 * Checks if a username already exists in the system (case-insensitive).
 */
export async function checkUsernameExists(username: string): Promise<boolean> {
  if (!username || !username.trim()) return false;
  const clean = username.trim().toLowerCase();

  // Check Supabase clients table case-insensitively using ilike
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("id, username")
      .ilike("username", clean);

    if (!error && Array.isArray(data) && data.length > 0) {
      const match = data.some(
        (c: any) => (c.username || "").trim().toLowerCase() === clean
      );
      if (match) return true;
    }

    // Secondary fallback in case ilike is not indexed or exact matching
    const { data: allData, error: allErr } = await supabase
      .from("clients")
      .select("username")
      .limit(1000);

    if (!allErr && Array.isArray(allData)) {
      const exists = allData.some(
        (c: any) => (c.username || "").trim().toLowerCase() === clean
      );
      if (exists) return true;
    }
  } catch (err) {
    console.debug("checkUsernameExists check error:", err);
  }

  return false;
}

// Core entity factory
function createEntity(entityName: string) {
  const table = getTable(entityName);

  return {
    list: async (sort?: string, limitN?: number): Promise<any[]> => {
      let q = supabase.from(table).select("*");
      if (sort) {
        const asc = !sort.startsWith("-");
        const col = sort.startsWith("-") ? sort.slice(1) : sort;
        q = (q as any).order(col, { ascending: asc });
      } else {
        q = (q as any).order("created_at", { ascending: false });
      }
      if (limitN) q = (q as any).limit(limitN);
      else q = (q as any).limit(500);

      const { data, error } = await q;
      if (error) {
        console.error(`[${table}] list error:`, error.message);
        return [];
      }
      return (data || []).map(transformRow);
    },

    filter: async (filters: Record<string, any>, sort?: string, limitN?: number): Promise<any[]> => {
      let q = supabase.from(table).select("*");

      for (const [key, val] of Object.entries(filters)) {
        if (val !== undefined && val !== null) {
          q = (q as any).eq(key, val);
        }
      }

      if (sort) {
        const asc = !sort.startsWith("-");
        const col = sort.startsWith("-") ? sort.slice(1) : sort;
        q = (q as any).order(col, { ascending: asc });
      } else {
        q = (q as any).order("created_at", { ascending: false });
      }

      q = (q as any).limit(limitN ?? 500);

      const { data, error } = await q;
      if (error) {
        console.error(`[${table}] filter error:`, error.message);
        return [];
      }
      return (data || []).map(transformRow);
    },

    create: async (payload: Record<string, any>): Promise<any> => {
      if (entityName === "Client" && payload.username) {
        const isDuplicate = await checkUsernameExists(payload.username);
        if (isDuplicate) {
          throw new Error("Username already exists. Please choose a different username");
        }
      }

      const { data, error } = await supabase
        .from(table)
        .insert(payload)
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return transformRow(data);
    },

    update: async (id: string, payload: Record<string, any>): Promise<any> => {
      const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return transformRow(data);
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
    },

    query: (): QueryBuilder => new QueryBuilder(table),

    batch: (): BatchBuilder => new BatchBuilder(table),
  };
}

// --- Exported entities ---

export const User = {
  auth: {
    currentUser: () => {
      const data = localStorage.getItem("clientSession");
      return data ? JSON.parse(data) : null;
    },
  },
};

export const Client = createEntity("Client");
export const Match = createEntity("Match");
export const SportsMatch = createEntity("SportsMatch");
export const Bet = createEntity("Bet");
export const Transaction = createEntity("Transaction");
