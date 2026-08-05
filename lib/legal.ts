export const TERMS_VERSION = "2026-08-04";
export const PRIVACY_VERSION = "2026-08-04";
export const COOKIE_VERSION = "2026-08-04";
export const REFUND_POLICY_VERSION = "2026-08-04";
export const SHIPPING_POLICY_VERSION = "2026-08-04";

export type LegalOperator = {
  legalName: string;
  tradeName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  supportEmail: string;
  privacyEmail: string;
  supportPhone: string;
  gstin: string;
  jurisdiction: string;
};

function value(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

export function getLegalOperator(): LegalOperator {
  return {
    legalName: value("LEGAL_OPERATOR_NAME", "PlantVerse operator details pending"),
    tradeName: value("LEGAL_TRADE_NAME", "PlantVerse AI"),
    address: value("LEGAL_REGISTERED_ADDRESS", "Registered address pending"),
    city: value("LEGAL_CITY", "City pending"),
    state: value("LEGAL_STATE", "State pending"),
    postalCode: value("LEGAL_POSTAL_CODE", "Postal code pending"),
    country: value("LEGAL_COUNTRY", "India"),
    supportEmail: value("LEGAL_SUPPORT_EMAIL", "support@example.invalid"),
    privacyEmail: value("LEGAL_PRIVACY_EMAIL", "privacy@example.invalid"),
    supportPhone: value("LEGAL_SUPPORT_PHONE", "Phone pending"),
    gstin: value("LEGAL_GSTIN", "GSTIN pending if applicable"),
    jurisdiction: value("LEGAL_JURISDICTION", "India"),
  };
}

export function missingLegalEnvironmentVariables(): string[] {
  const required = [
    "LEGAL_OPERATOR_NAME",
    "LEGAL_REGISTERED_ADDRESS",
    "LEGAL_CITY",
    "LEGAL_STATE",
    "LEGAL_POSTAL_CODE",
    "LEGAL_COUNTRY",
    "LEGAL_SUPPORT_EMAIL",
    "LEGAL_PRIVACY_EMAIL",
    "LEGAL_SUPPORT_PHONE",
    "LEGAL_JURISDICTION",
  ];
  return required.filter((name) => !process.env[name]?.trim());
}
