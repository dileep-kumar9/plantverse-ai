export const USER_COLLECTIONS = [
  "analyses",
  "plants",
  "reminders",
  "settings",
  "profile",
  "cart",
  "orders",
  "notifications",
  "chats",
  "devices",
] as const;

export type UserCollection = (typeof USER_COLLECTIONS)[number];
export type DataWriteAction = "create" | "update" | "delete";

const WRITE_ACTIONS: Record<UserCollection, readonly DataWriteAction[]> = {
  analyses: ["create", "delete"],
  plants: ["create", "update", "delete"],
  reminders: ["create", "update", "delete"],
  settings: ["create", "update", "delete"],
  profile: ["create", "update", "delete"],
  cart: ["create", "update", "delete"],
  orders: [],
  notifications: ["update", "delete"],
  chats: ["create", "delete"],
  devices: ["create", "delete"],
};

export function isUserCollection(value: string): value is UserCollection {
  return USER_COLLECTIONS.includes(value as UserCollection);
}

export function canWriteCollection(collection: UserCollection, action: DataWriteAction): boolean {
  return WRITE_ACTIONS[collection].includes(action);
}

export function safeDocumentId(value: string): string {
  const id = value.trim();
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
    throw new Error("Invalid record identifier.");
  }
  return id;
}
