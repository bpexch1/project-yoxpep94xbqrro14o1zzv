import { serviceRequest } from "@/services/client";
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
    return serviceRequest<any[]>('entityRead', {table:this._table,filters:[...this._filters,...this._inFilters.map(f=>({column:f.column,method:'in',value:f.values}))],sort:this._sortColumn,ascending:this._sortAsc,limit:this._limitVal});
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
    throw new Error("Record deletion requires an audited backend workflow");
  }
}

/**
 * Checks if a username already exists in the system (case-insensitive) using public_clients view.
 */
export async function checkUsernameExists(username: string): Promise<boolean> {
 const rows=await serviceRequest<any[]>('entityRead',{table:'clients',filters:[{column:'username',method:'eq',value:username.trim()}],limit:1});
 return rows.length>0;
}

const CLIENT_SAFE_COLUMNS =
  "id, username, full_name, role, credit_received, credit_remaining, cash, pl_downline, balance_upline, status, parent_username, phone, downline_share, reference, betting_allowed, can_settle_pl, commission, notes, created_at, updated_at";

// Core entity factory
function createEntity(entityName: string) {
  const readTable = getReadTable(entityName);
  const writeTable = getWriteTable(entityName);

  return {
    list: async (sort?: string, limitN?: number): Promise<any[]> => {
      return new QueryBuilder(readTable).sort(sort||'-created_at').limit(limitN||500).exec();
    },
    filter: async (filters: Record<string, any>, sort?: string, limitN?: number): Promise<any[]> => {
      const query=new QueryBuilder(readTable).sort(sort||'-created_at').limit(limitN||500);
      for(const [key,value] of Object.entries(filters)) if(value!==undefined&&value!==null) query.where(key,value);
      return query.exec();
    },
    create: async (payload: Record<string, any>): Promise<any> => {
      if(entityName==='Client') return serviceRequest('saveClient',{data:payload});
      throw new Error('Use the dedicated backend service to create this record');
    },
    update: async (id:string,payload:Record<string,any>):Promise<any> => {
      if(entityName==='Client') return serviceRequest('saveClient',{id,data:payload});
      throw new Error('Use the dedicated backend service to change this record');
    },
    delete: async (_id:string):Promise<void> => { throw new Error('Record deletion is unavailable through the client'); },

    query: (): QueryBuilder => new QueryBuilder(readTable),

    batch: (): BatchBuilder => new BatchBuilder(writeTable),
  };
}

// --- Exported entities ---

export const User = {
  auth: {
    currentUser: () => {
      localStorage.removeItem("clientSession");
      if (!sessionStorage.getItem("exchangeSessionToken")) return null;
      const data = sessionStorage.getItem("clientSession");
      try {
        return data ? JSON.parse(data) : null;
      } catch {
        sessionStorage.removeItem("clientSession");
        return null;
      }
    },
  },
};

export const Client = createEntity("Client");
export const Match = createEntity("Match");
export const SportsMatch = createEntity("SportsMatch");
export const Bet = createEntity("Bet");
export const Transaction = createEntity("Transaction");
