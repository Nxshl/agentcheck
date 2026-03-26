import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AppRecord {
  id: string;
  campaign: string;
  agent: string;
  number: string;
  posthog: string;
  isRejected: boolean;
  isIgnored: boolean;
  batchId?: string;
  createdAt: number;
}

export interface AppBatch {
  id: string;
  filename: string;
  rowCount: number;
  importedAt: number;
}

export interface AgentStat {
  agent: string;
  rejected: number;
  ignored: number;
  total: number;
}

// ── Classification ────────────────────────────────────────────────────────────
export function deriveFlags(posthog: string) {
  const l = posthog.toLowerCase();
  const isRejected = l.includes("reject") || l.includes("decline");
  const isIgnored =
    l.includes("ignor") ||
    l.includes("not answered") ||
    l.includes("no answer") ||
    l.includes("unanswered") ||
    l.includes("not answer") ||
    l.includes("busy");
  return { isRejected, isIgnored };
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Context ───────────────────────────────────────────────────────────────────
interface AppContextValue {
  records: AppRecord[];
  batches: AppBatch[];
  stats: AgentStat[];
  addRecord: (data: { campaign: string; agent: string; number: string; posthog: string }) => void;
  importBatch: (filename: string, rows: { campaign: string; agent: string; number: string; posthog: string }[]) => string;
  deleteBatch: (batchId: string) => void;
  clearAll: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<AppRecord[]>(() => load("agentcheck_records", []));
  const [batches, setBatches] = useState<AppBatch[]>(() => load("agentcheck_batches", []));

  // Persist whenever state changes
  useEffect(() => { save("agentcheck_records", records); }, [records]);
  useEffect(() => { save("agentcheck_batches", batches); }, [batches]);

  const stats: AgentStat[] = (() => {
    const map: Record<string, AgentStat> = {};
    for (const r of records) {
      if (!map[r.agent]) map[r.agent] = { agent: r.agent, rejected: 0, ignored: 0, total: 0 };
      map[r.agent].total++;
      if (r.isRejected) map[r.agent].rejected++;
      if (r.isIgnored) map[r.agent].ignored++;
    }
    return Object.values(map).sort(
      (a, b) => b.rejected + b.ignored - (a.rejected + a.ignored)
    );
  })();

  const addRecord = useCallback(
    (data: { campaign: string; agent: string; number: string; posthog: string }) => {
      const { isRejected, isIgnored } = deriveFlags(data.posthog);
      const rec: AppRecord = { ...data, id: uid(), isRejected, isIgnored, createdAt: Date.now() };
      setRecords((prev) => [rec, ...prev]);
    },
    []
  );

  const importBatch = useCallback(
    (filename: string, rows: { campaign: string; agent: string; number: string; posthog: string }[]) => {
      const batchId = uid();
      const batch: AppBatch = { id: batchId, filename, rowCount: rows.length, importedAt: Date.now() };
      const newRecs: AppRecord[] = rows.map((r) => ({
        ...r,
        id: uid(),
        batchId,
        ...deriveFlags(r.posthog),
        createdAt: Date.now(),
      }));
      setBatches((prev) => [batch, ...prev]);
      setRecords((prev) => [...newRecs, ...prev]);
      return batchId;
    },
    []
  );

  const deleteBatch = useCallback((batchId: string) => {
    setRecords((prev) => prev.filter((r) => r.batchId !== batchId));
    setBatches((prev) => prev.filter((b) => b.id !== batchId));
  }, []);

  const clearAll = useCallback(() => {
    setRecords([]);
    setBatches([]);
  }, []);

  return (
    <AppContext.Provider value={{ records, batches, stats, addRecord, importBatch, deleteBatch, clearAll }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppData must be inside AppProvider");
  return ctx;
}
