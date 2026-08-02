export type ScanModeId =
  | "plant"
  | "soil"
  | "land"
  | "video"
  | "voice"
  | "device"
  | "translator";

export type ScanMode = {
  id: ScanModeId;
  title: string;
  description: string;
  icon: string;
  features: string[];
};