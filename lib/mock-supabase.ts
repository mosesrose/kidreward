/**
 * Mock Supabase client for demo/PoC mode.
 * Mirrors the fluent query builder API used throughout the app.
 * All data lives in mockStore (lib/mock-data.ts) and mutations are reflected immediately.
 */
import { mockStore, enrichCompletions, enrichRedemptions } from './mock-data';

type FilterOp = 'eq' | 'neq' | 'in' | 'is' | 'gt';
interface Filter { col: string; op: FilterOp; val: any }

type MockResult = { data: any; error: null };

// ─── Query builder ────────────────────────────────────────────────────────────

class MockQueryBuilder {
  private _table: string;
  private _op: 'select' | 'insert' | 'update' = 'select';
  private _filters: Filter[] = [];
  private _insertPayload: any;
  private _updatePayload: any;
  private _limitNum?: number;
  private _isSingle = false;
  private _isMaybeSingle = false;
  private _returnAfterInsert = false;

  constructor(table: string) { this._table = table; }

  select(_fields = '*') {
    if (this._op === 'insert') {
      this._returnAfterInsert = true;
      return this;
    }
    this._op = 'select';
    return this;
  }

  insert(payload: any) {
    this._insertPayload = payload;
    this._op = 'insert';
    return this;
  }

  update(payload: any) {
    this._updatePayload = payload;
    this._op = 'update';
    return this;
  }

  eq(col: string, val: any)    { this._filters.push({ col, op: 'eq', val }); return this; }
  neq(col: string, val: any)   { this._filters.push({ col, op: 'neq', val }); return this; }
  in(col: string, val: any[])  { this._filters.push({ col, op: 'in', val }); return this; }
  is(col: string, val: any)    { this._filters.push({ col, op: 'is', val }); return this; }
  gt(_col: string, _val: any)  { return this; } // expire filter — mock data is always valid
  or(_filter: string)          { return this; } // simplified: no filter (returns all matching family/child)
  order(_col: string, _opts?: { ascending: boolean }) { return this; }

  limit(n: number) { this._limitNum = n; return this; }

  single() {
    this._isSingle = true;
    return Promise.resolve(this._resolve());
  }

  maybeSingle() {
    this._isMaybeSingle = true;
    return Promise.resolve(this._resolve());
  }

  then(resolve: (v: MockResult) => any, reject?: (e: any) => any) {
    return Promise.resolve(this._resolve()).then(resolve, reject);
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private _applyFilters(items: any[]): any[] {
    return items.filter(item =>
      this._filters.every(f => {
        switch (f.op) {
          case 'eq':  return item[f.col] === f.val;
          case 'neq': return item[f.col] !== f.val;
          case 'in':  return Array.isArray(f.val) && f.val.includes(item[f.col]);
          case 'is':  return f.val === null ? item[f.col] == null : item[f.col] === f.val;
          default:    return true;
        }
      })
    );
  }

  private _resolve(): MockResult {
    if (this._op === 'insert') return this._handleInsert();
    if (this._op === 'update') return this._handleUpdate();
    return this._handleSelect();
  }

  private _handleInsert(): MockResult {
    const newItem = {
      id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      created_at: new Date().toISOString(),
      ...this._insertPayload,
    };
    (mockStore as any)[this._table] = [
      ...((mockStore as any)[this._table] ?? []),
      newItem,
    ];
    if (!this._returnAfterInsert) return { data: null, error: null };
    if (this._isSingle) return { data: newItem, error: null };
    return { data: [newItem], error: null };
  }

  private _handleUpdate(): MockResult {
    const list: any[] = (mockStore as any)[this._table] ?? [];
    (mockStore as any)[this._table] = list.map(item => {
      if (!this._applyFilters([item]).length) return item;
      return { ...item, ...this._updatePayload };
    });
    return { data: null, error: null };
  }

  private _handleSelect(): MockResult {
    const rawList: any[] = (mockStore as any)[this._table] ?? [];

    // Enrich with related data for tables that need joins
    let list: any[];
    switch (this._table) {
      case 'completions':
        list = enrichCompletions(rawList);
        break;
      case 'redemptions':
        list = enrichRedemptions(rawList);
        break;
      default:
        list = rawList;
    }

    let results = this._applyFilters(list);
    if (this._limitNum !== undefined) results = results.slice(0, this._limitNum);

    if (this._isSingle || this._isMaybeSingle) {
      return { data: results[0] ?? null, error: null };
    }
    return { data: results, error: null };
  }
}

// ─── RPC handlers ─────────────────────────────────────────────────────────────

function handleRpc(fn: string, params: Record<string, any>): Promise<MockResult> {
  if (fn === 'award_gems') {
    const { p_child_id, p_gems } = params;
    const member = mockStore.family_members.find(m => m.child_id === p_child_id);
    if (member) {
      member.gem_balance += p_gems;
      member.total_gems_earned += p_gems;
    }
  } else if (fn === 'spend_gems') {
    const { p_child_id, p_gems } = params;
    const member = mockStore.family_members.find(m => m.child_id === p_child_id);
    if (member) {
      if (member.gem_balance < p_gems) {
        return Promise.resolve({ data: null, error: { message: 'Insufficient gem balance' } as any });
      }
      member.gem_balance -= p_gems;
    }
  }
  return Promise.resolve({ data: null, error: null });
}

// ─── Mock auth (no-op — auth is handled by MockAuthContext) ───────────────────

const mockAuth = {
  getSession: () => Promise.resolve({ data: { session: { user: { id: 'mock-parent-id' } } } }),
  onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
  signOut: () => Promise.resolve({ error: null }),
};

// ─── Exported mock client ─────────────────────────────────────────────────────

export const mockSupabase = {
  from: (table: string) => new MockQueryBuilder(table),
  rpc: (fn: string, params: Record<string, any>) => handleRpc(fn, params),
  auth: mockAuth,
};
