"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createRecord,
  deleteRecord,
  listRecords,
  updateRecord,
} from "@/lib/client-api";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useCollection<T extends { id: string }>(
  collection: string,
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] =
    useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] =
    useState<string | null>(null);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const requestVersion = useRef(0);

  const reload = useCallback(async () => {
    const version = requestVersion.current + 1;
    requestVersion.current = version;

    setLoading(true);
    setError(null);

    try {
      const records = await listRecords<T>(collection);

      if (requestVersion.current === version) {
        setItems(records);
      }
    } catch (requestError) {
      if (requestVersion.current === version) {
        setError(
          errorMessage(requestError, "Unable to load data."),
        );
      }
    } finally {
      if (requestVersion.current === version) {
        setLoading(false);
      }
    }
  }, [collection]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = useCallback(
    async (record: Omit<T, "id"> & { id?: string }) => {
      setCreating(true);
      setMutationError(null);

      try {
        const created = await createRecord(
          collection,
          record as Record<string, unknown>,
        );

        setItems((current) => [
          created as T,
          ...current.filter(
            (item) => item.id !== created.id,
          ),
        ]);

        return created as T;
      } catch (requestError) {
        const message = errorMessage(
          requestError,
          "Unable to create record.",
        );

        setMutationError(message);
        throw requestError;
      } finally {
        setCreating(false);
      }
    },
    [collection],
  );

  const update = useCallback(
    async (id: string, patch: Partial<T>) => {
      setUpdatingId(id);
      setMutationError(null);

      try {
        const updated = await updateRecord<T>(
          collection,
          id,
          patch,
        );

        setItems((current) =>
          current.map((item) =>
            item.id === id ? updated : item,
          ),
        );

        return updated;
      } catch (requestError) {
        const message = errorMessage(
          requestError,
          "Unable to update record.",
        );

        setMutationError(message);
        throw requestError;
      } finally {
        setUpdatingId(null);
      }
    },
    [collection],
  );

  const remove = useCallback(
    async (id: string) => {
      setDeletingId(id);
      setMutationError(null);

      try {
        await deleteRecord(collection, id);

        setItems((current) =>
          current.filter((item) => item.id !== id),
        );
      } catch (requestError) {
        const message = errorMessage(
          requestError,
          "Unable to delete record.",
        );

        setMutationError(message);
        throw requestError;
      } finally {
        setDeletingId(null);
      }
    },
    [collection],
  );

  const clearError = useCallback(() => {
    setError(null);
    setMutationError(null);
  }, []);

  return {
    items,
    loading,
    error,
    mutationError,
    creating,
    updatingId,
    deletingId,
    reload,
    create,
    update,
    remove,
    setItems,
    clearError,
  };
}
