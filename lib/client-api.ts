export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { "content-type": "application/json" }
        : {}),
      ...(init?.headers ?? {}),
    },
    credentials: "same-origin",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? ((await response.json()) as { error?: string } & T)
    : ({} as T & { error?: string });

  if (!response.ok) {
    throw new ApiError(data.error ?? `Request failed (${response.status}).`, response.status);
  }
  return data;
}

export async function listRecords<T>(collection: string): Promise<T[]> {
  const data = await apiFetch<{ items: T[] }>(`/api/data/${collection}`);
  return data.items;
}

export async function createRecord<T extends Record<string, unknown>>(
  collection: string,
  record: T,
): Promise<T & { id: string }> {
  const data = await apiFetch<{ item: T & { id: string } }>(`/api/data/${collection}`, {
    method: "POST",
    body: JSON.stringify(record),
  });
  return data.item;
}

export async function updateRecord<T extends Record<string, unknown>>(
  collection: string,
  id: string,
  patch: Partial<T>,
): Promise<T & { id: string }> {
  const data = await apiFetch<{ item: T & { id: string } }>(
    `/api/data/${collection}/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(patch) },
  );
  return data.item;
}

export async function deleteRecord(collection: string, id: string): Promise<void> {
  await apiFetch(`/api/data/${collection}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function getRecord<T>(collection: string, id: string): Promise<T | null> {
  try {
    const data = await apiFetch<{ item: T }>(
      `/api/data/${collection}/${encodeURIComponent(id)}`,
    );
    return data.item;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
