import { supabase } from "@/integrations/supabase";
import bcrypt from "bcryptjs";

// Map entity names to Supabase table/view names for reads and writes
const READ_TABLE_MAP: Record<string, string> = {
  Client: "public_clients",
  Match: "matches",
  SportsMatch: "matches",
  Bet: "bets",
  Transaction: "transactions",
};

const WRITE_TABLE_MAP: Record<string, string> = {
  Client: "clients",
  Match: "matches",
  SportsMatch: "matches",
  Bet: "bets",
  Transaction: "transactions",
};

function getReadTable(entityName: string): string {
  const table = READ_TABLE_MAP[entityName];
  if (!table) throw new Error(`Unknown entity: ${entityName}`);
  return table;
}

function getWriteTable(entityName: string): string {
  const table = WRITE_TABLE_MAP[entityName];
  if (!table) throw new Error(`Unknown entity: ${entityName}`);
  return table;
}

function transformRow(row: any): any {
  if (!row) return null;
  const copy = { ...row };
  // Security guard: never leak password field if somehow present in row
  if ("password" in copy) {
    delete copy.password;
  }
  return copy;
}

// Helper to hash password if plain text
export function hashPasswordIfPlain(password: string): string {
  if (!password) return "";
  const isBcrypt =
    password.startsWith("$2a$") ||
    password.startsWith("$2b$") ||
    password.startsWith("$2y$");
  if (isBcrypt) return password;
  return bcrypt.hashSync(password, 10);
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
    const isClientTable = this._table === "clients" || this._table === "public_clients";
    const targetTable = isClientTable ? "public_clients" : this._table;
    const selectCols = isClientTable ? CLIENT_SAFE_COLUMNS : "*";

    let query = supabase.from(targetTable).select(selectCols);

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
      console.error(`[${targetTable}] query error:`, error.message);
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
 * Checks if a username already exists in the system (case-insensitive) using public_clients view.
 */
export async function checkUsernameExists(username: string): Promise<boolean> {
  if (!username || !username.trim()) return false;
  const clean = username.trim().toLowerCase();

  // Check Supabase public_clients view case-insensitively using ilike
  try {
    const { data, error } = await supabase
      .from("public_clients")
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
      .from("public_clients")
      .select("username")
      .limit(1000);

    if (!allErr && Array.isArray(allData)) {
      const exists = allData.some(
        (c: any) => (c.username || "").trim().toLowerCase() === clean
      );
      if (exists) return true;
    }
  } catch (err) {
    // Silent check
  }

  return false;
}

const CLIENT_SAFE_COLUMNS =
  "id, username, full_name, role, credit_received, credit_remaining, cash, pl_downline, balance_upline, status, parent_username, phone, downline_share, reference, betting_allowed, can_settle_pl, commission, notes, created_at, updated_at";

// Core entity factory
function createEntity(entityName: string) {
  const readTable = getReadTable(entityName);
  const writeTable = getWriteTable(entityName);

  return {
    list: async (sort?: string, limitN?: number): Promise<any[]> => {
      const selectCols = entityName === "Client" ? CLIENT_SAFE_COLUMNS : "*";
      let q = supabase.from(readTable).select(selectCols);
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
        console.error(`[${readTable}] list error:`, error.message);
        return [];
      }
      return (data || []).map(transformRow);
    },

    filter: async (filters: Record<string, any>, sort?: string, limitN?: number): Promise<any[]> => {
      const selectCols = entityName === "Client" ? CLIENT_SAFE_COLUMNS : "*";
      let q = supabase.from(readTable).select(selectCols);

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
        console.error(`[${readTable}] filter error:`, error.message);
        return [];
      }
      return (data || []).map(transformRow);
    },

    create: async (payload: Record<string, any>): Promise<any> => {
      const dataToInsert = { ...payload };

      if (entityName === "Client") {
        if (dataToInsert.username) {
          const isDuplicate = await checkUsernameExists(dataToInsert.username);
          if (isDuplicate) {
            throw new Error("Username already exists. Please choose a different username");
          }
        }
        if (dataToInsert.password) {
          dataToInsert.password = hashPasswordIfPlain(dataToInsert.password);
        }
      }

      const selectCols = entityName === "Client" ? CLIENT_SAFE_COLUMNS : "*";
      const { data, error } = await supabase
        .from(writeTable)
        .insert(dataToInsert)
        .select(selectCols)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return transformRow(data);
    },

    update: async (id: string, payload: Record<string, any>): Promise<any> => {
      const dataToUpdate = { ...payload };

      if (entityName === "Client" && dataToUpdate.password) {
        dataToUpdate.password = hashPasswordIfPlain(dataToUpdate.password);
      }

      const selectCols = entityName === "Client" ? CLIENT_SAFE_COLUMNS : "*";
      const { data, error } = await supabase
        .from(writeTable)
        .update(dataToUpdate)
        .eq("id", id)
        .select(selectCols)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return transformRow(data);
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await supabase.from(writeTable).delete().eq("id", id);
      if (error) throw new Error(error.message);
    },

    query: (): QueryBuilder => new QueryBuilder(readTable),

    batch: (): BatchBuilder => new BatchBuilder(writeTable),
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
