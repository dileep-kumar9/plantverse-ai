import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (process.env.SEED_CATALOG_CONFIRM !== "YES") {
  throw new Error("Set SEED_CATALOG_CONFIRM=YES after reviewing the catalogue. This script writes real product records.");
}
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (!projectId || !clientEmail || !privateKey) throw new Error("Firebase Admin credentials are required.");
const app = getApps()[0] || initializeApp({ projectId, credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore(app);
const catalogue = [
  { id: "soil-meter-basic", sku: "PV-METER-001", name: "Digital Soil Moisture Meter", description: "Manual soil moisture meter. Confirm supplier warranty and specifications before launch.", price: 899, stock: 0, category: "Devices", tag: "Manual reading", icon: "💧", active: false, currency: "INR", reserved: 0, sold: 0, weightKg: 0.4, lengthCm: 25, breadthCm: 8, heightCm: 5, fulfilmentEnabled: false },
  { id: "organic-compost-5kg", sku: "PV-SOIL-001", name: "Organic Compost 5 kg", description: "Catalogue template. Replace with verified supplier, batch, composition and compliance data.", price: 399, stock: 0, category: "Soil", tag: "Supplier verification required", icon: "🪴", active: false, currency: "INR", reserved: 0, sold: 0, weightKg: 5, lengthCm: 35, breadthCm: 25, heightCm: 12, fulfilmentEnabled: false },
];
const batch = db.batch();
for (const product of catalogue) batch.set(db.collection("products").doc(product.id), { ...product, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { merge: true });
await batch.commit();
console.log(`Seeded ${catalogue.length} inactive catalogue templates. Verify suppliers, stock and legal labelling before activation.`);
