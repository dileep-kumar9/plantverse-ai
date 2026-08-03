export type AnalysisResult = {
  plantName: string;
  localName?: string;
  scientificName: string;
  healthScore: number;
  disease: string;
  confidence: number;
  severity: "none" | "mild" | "moderate" | "severe" | "unknown" | string;
  symptoms: string[];
  possibleCauses: string[];
  treatment: string[];
  prevention: string[];
  evidenceNeeded: string[];
  disclaimer: string;
};

export type SavedAnalysis = AnalysisResult & {
  id: string;
  scanType: string;
  createdAt: string;
  imageName?: string;
};
