"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, updateRecord } from "@/lib/client-api";
import type { DashboardSummary } from "@/types/dashboard";
import type { Reminder } from "@/types/app";

const empty: DashboardSummary = {
  plants: [],
  analyses: [],
  reminders: [],
  stats: { plantCount: 0, needAttention: 0, scansThisWeek: 0, healthScore: 0 },
};

type DashboardContextValue = {
  data: DashboardSummary;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  toggleReminder: (reminder: Reminder) => Promise<void>;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export default function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DashboardSummary>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<DashboardSummary>("/api/dashboard");
      setData(response);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleReminder = useCallback(async (reminder: Reminder) => {
    const previous = data.reminders;
    const nextDone = !reminder.done;
    setData((current) => ({
      ...current,
      reminders: current.reminders.map((item) =>
        item.id === reminder.id ? { ...item, done: nextDone } : item,
      ),
    }));

    try {
      await updateRecord<Reminder>("reminders", reminder.id, { done: nextDone });
      if (nextDone) {
        setData((current) => ({
          ...current,
          reminders: current.reminders.filter((item) => item.id !== reminder.id),
        }));
      }
    } catch (requestError) {
      setData((current) => ({ ...current, reminders: previous }));
      throw requestError;
    }
  }, [data.reminders]);

  const value = useMemo(
    () => ({ data, loading, error, refresh, toggleReminder }),
    [data, loading, error, refresh, toggleReminder],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboardData() {
  const value = useContext(DashboardContext);
  if (!value) throw new Error("useDashboardData must be used inside DashboardDataProvider.");
  return value;
}
