import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PlanEntry } from '../lib/calculator'

interface PlanState {
  entries: PlanEntry[]
  addItem: (entry: PlanEntry) => void
  addMany: (entries: PlanEntry[]) => void
  update: (itemId: string, patch: Partial<Omit<PlanEntry, 'itemId'>>) => void
  remove: (itemId: string) => void
  clear: () => void
}

function mergeEntries(entries: PlanEntry[], next: PlanEntry[]): PlanEntry[] {
  const byId = new Map(entries.map((entry) => [entry.itemId, entry]))
  for (const entry of next) {
    if (!byId.has(entry.itemId)) byId.set(entry.itemId, entry)
  }
  return [...byId.values()]
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      entries: [],
      addItem: (entry) =>
        set((state) => ({ entries: mergeEntries(state.entries, [entry]) })),
      addMany: (entries) =>
        set((state) => ({ entries: mergeEntries(state.entries, entries) })),
      update: (itemId, patch) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.itemId === itemId ? { ...entry, ...patch } : entry,
          ),
        })),
      remove: (itemId) =>
        set((state) => ({
          entries: state.entries.filter((entry) => entry.itemId !== itemId),
        })),
      clear: () => set({ entries: [] }),
    }),
    {
      name: 'valheim-recipes:plan',
      version: 1,
      skipHydration: true,
    },
  ),
)
