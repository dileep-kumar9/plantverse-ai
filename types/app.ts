export type GrowingSpace = "pot" | "terrace" | "field" | "empty-land";
export type AppLanguage = "English" | "Telugu" | "Hindi" | "Tamil" | "Kannada";
export type Reminder = { id: string; title: string; dueAt: string; done: boolean; plant?: string };
export type CartItem = { id: string; name: string; price: number; quantity: number; icon: string };
export type Order = { id: string; items: CartItem[]; total: number; status: "ordered"|"paid"|"shipped"|"delivered"; createdAt: string; address: string };
export type CommunityPost = { id:string; title:string; body:string; tag:string; replies:number; createdAt:string };
