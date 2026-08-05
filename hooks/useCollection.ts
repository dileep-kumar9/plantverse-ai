"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createRecord,
  deleteRecord,
  listRecords,
  updateRecord,
} from "@/lib/client-api";

export function useCollection<T extends { id: string }>(collection: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await listRecords<T>(collection);
      setItems(records);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load data.");
    } finally {
      setLoading(false);
    }
  }, [collection]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = useCallback(
    async (record: Omit<T, "id"> & { id?: string }) => {
      const created = await createRecord(collection, record as Record<string, unknown>);
      setItems((current) => [created as T, ...current.filter((item) => item.id !== created.id)]);
      return created as T;
    },
    [collection],
  );

  const update = useCallback(
    async (id: string, patch: Partial<T>) => {
      const updated = await updateRecord<T>(collection, id, patch);
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
      return updated;
    },
    [collection],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteRecord(collection, id);
      setItems((current) => current.filter((item) => item.id !== id));
    },
    [collection],
  );

  return { items, loading, error, reload, create, update, remove, setItems };
}
