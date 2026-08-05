import { cleanText } from "@/lib/security";
import type { ShippingAddress } from "@/types/app";

export function sanitizeShippingAddress(value: unknown): ShippingAddress {
  const input = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const address: ShippingAddress = {
    name: cleanText(input.name, 100),
    phone: cleanText(input.phone, 20).replace(/[^0-9+]/g, ""),
    addressLine1: cleanText(input.addressLine1, 180),
    addressLine2: cleanText(input.addressLine2, 180),
    city: cleanText(input.city, 80),
    state: cleanText(input.state, 80),
    postalCode: cleanText(input.postalCode, 10).replace(/\s/g, ""),
    country: "IN",
  };
  if (address.name.length < 2) throw Object.assign(new Error("Enter the recipient name."), { status: 400 });
  if (!/^(?:\+91)?[6-9]\d{9}$/.test(address.phone)) {
    throw Object.assign(new Error("Enter a valid Indian mobile number."), { status: 400 });
  }
  if (address.addressLine1.length < 8) {
    throw Object.assign(new Error("Enter a complete street address."), { status: 400 });
  }
  if (address.city.length < 2 || address.state.length < 2) {
    throw Object.assign(new Error("Enter city and state."), { status: 400 });
  }
  if (!/^\d{6}$/.test(address.postalCode)) {
    throw Object.assign(new Error("Enter a valid 6-digit Indian PIN code."), { status: 400 });
  }
  return address;
}
