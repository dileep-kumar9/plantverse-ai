export type GrowingSpace = "pot" | "terrace" | "field" | "empty-land";
export type AppLanguage = "English" | "Telugu" | "Hindi" | "Tamil" | "Kannada";

export type Reminder = {
  id: string;
  title: string;
  dueAt: string;
  done: boolean;
  plant?: string;
  pushEnabled?: boolean;
  pushSentAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Plant = {
  id: string;
  name: string;
  localName?: string;
  scientificName?: string;
  place: string;
  health: number;
  icon: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  currency: "INR";
  stock: number;
  reserved: number;
  sold: number;
  active: boolean;
  category: string;
  tag?: string;
  icon?: string;
  imageUrls?: string[];
  weightKg?: number;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
  taxCode?: string;
  fulfilmentEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  icon: string;
  category?: string;
  tag?: string;
  sku?: string;
  weightKg?: number;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ShippingAddress = {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: "IN";
};

export type OrderStatus =
  | "awaiting_payment"
  | "payment_expired"
  | "payment_failed"
  | "paid"
  | "processing"
  | "shipment_pending"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refund_pending"
  | "refunded"
  | "refund_failed";

export type Order = {
  id: string;
  orderNumber?: string;
  userId?: string;
  customerEmail?: string;
  items: Array<CartItem & { tag?: string; weightKg?: number }>;
  total: number;
  currency?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  address: ShippingAddress | string;
  amountPaid?: number;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  reservationId?: string;
  shipmentId?: string;
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  awbCode?: string;
  courierName?: string;
  trackingUrl?: string;
  refundId?: string;
  refundAmount?: number;
  restockOnRefund?: boolean;
};

export type ShipmentStatus =
  | "not_created"
  | "created"
  | "awb_assigned"
  | "pickup_scheduled"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "exception";

export type Shipment = {
  id: string;
  orderId: string;
  userId: string;
  provider: "shiprocket";
  status: ShipmentStatus;
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  awbCode?: string;
  courierName?: string;
  trackingUrl?: string;
  rawStatus?: string;
  createdAt: string;
  updatedAt: string;
};

export type CommunityPost = {
  id: string;
  title: string;
  body: string;
  tag: string;
  authorId: string;
  authorName: string;
  replies: number;
  reports: number;
  status: "published" | "hidden";
  verifiedExpert?: boolean;
  createdAt: string;
};

export type ExpertProfile = {
  id: string;
  userId: string;
  displayName: string;
  qualification: string;
  specialization: string[];
  verificationStatus: "pending" | "verified" | "rejected" | "suspended";
  verificationNote?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type DeviceReading = {
  id: string;
  moisture: number;
  ph: number;
  temperature?: number;
  humidity?: number;
  ec?: number;
  device?: string;
  connectionMethod?: "manual" | "bluetooth" | "serial" | "vendor-api";
  note?: string;
  raw?: string;
  createdAt: string;
};

export type UserProfile = {
  id: string;
  displayName: string;
  expertise: "beginner" | "home-grower" | "farmer" | "expert";
  growingSpaces: string[];
  locationName?: string;
  photoURL?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type InAppNotification = {
  id: string;
  type: "reminder" | "order" | "shipment" | "community" | "system";
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type AuditRecord = {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  outcome: "success" | "failure";
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
};
