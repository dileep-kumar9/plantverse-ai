export type ScanCategory =
  | "plant"
  | "soil"
  | "land"
  | "disease"
  | "fruit"
  | "flower"
  | "tree";

export type InputMethod =
  | "camera"
  | "gallery"
  | "video"
  | "voice";
  
export interface ScanType {
  id: ScanCategory;
  title: string;
  description: string;
  icon: string;
  accent: string;
}

export const scanTypes: ScanType[] = [
  {
    id: "plant",
    title: "Plant Health",
    description: "Leaves, stems and flowers",
    icon: "🌿",
    accent: "#22c55e",
  },
  {
    id: "soil",
    title: "Soil Analysis",
    description: "Nutrients and moisture",
    icon: "🌱",
    accent: "#b45309",
  },
  {
    id: "land",
    title: "Land Analysis",
    description: "Field planning",
    icon: "🏞",
    accent: "#16a34a",
  },
  {
    id: "disease",
    title: "Pest & Disease",
    description: "AI disease detection",
    icon: "🐛",
    accent: "#dc2626",
  },
  {
    id: "fruit",
    title: "Fruit Analysis",
    description: "Ripeness and quality",
    icon: "🍎",
    accent: "#f97316",
  },
  {
    id: "flower",
    title: "Flower Analysis",
    description: "Bloom health",
    icon: "🌸",
    accent: "#ec4899",
  },
  {
    id: "tree",
    title: "Tree Analysis",
    description: "Tree growth and diseases",
    icon: "🌳",
    accent: "#15803d",
  },
];