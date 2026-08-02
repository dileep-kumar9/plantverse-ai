"use client";

import { useState } from "react";
import ScanModeCard from "@/components/scan/ScanModeCard";
import type { ScanMode } from "@/types/scan";

const scanModes: ScanMode[] = [
  {
    id: "plant",
    title: "🌿 Plant Doctor",
    description:
      "Identify plants, detect diseases and receive treatment suggestions.",
    icon: "🌿",
    features: [
      "Plant identification",
      "Disease detection",
      "Treatment recommendations",
    ],
  },
  {
    id: "soil",
    title: "🌱 Soil Expert",
    description:
      "Analyze soil quality and receive recommendations for improvement.",
    icon: "🌱",
    features: [
      "Soil analysis",
      "Nutrient suggestions",
      "Crop compatibility",
    ],
  },
  {
    id: "land",
    title: "🌾 Land Planner",
    description:
      "Analyze empty land and discover suitable crops and layouts.",
    icon: "🌾",
    features: [
      "Land analysis",
      "Crop planning",
      "Garden layouts",
    ],
  },
  {
    id: "video",
    title: "🎥 Video AI",
    description:
      "Upload or record videos for advanced AI inspection.",
    icon: "🎥",
    features: [
      "Video analysis",
      "Timeline detection",
      "AI observations",
    ],
  },
  {
    id: "voice",
    title: "🎤 Voice Assistant",
    description:
      "Talk naturally with PlantVerse AI in your preferred language.",
    icon: "🎤",
    features: [
      "Voice input",
      "Ask questions",
      "AI conversations",
    ],
  },
  {
    id: "device",
    title: "📡 Device Checker",
    description:
      "Verify sensor and smart farming device compatibility.",
    icon: "📡",
    features: [
      "Bluetooth support",
      "Device compatibility",
      "Manual readings",
    ],
  },
  {
    id: "translator",
    title: "🌐 Plant Translator",
    description:
      "Translate plant names, reports and selected text.",
    icon: "🌐",
    features: [
      "Plant name translation",
      "Report translation",
      "Text selection translation",
    ],
  },
];

export default function ScanPage() {
  const [selectedMode, setSelectedMode] = useState<ScanMode | null>(null);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-5 py-8">

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900">
            AI Workspace
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            Select one AI mode to begin. PlantVerse will guide you
            step-by-step throughout the process.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {scanModes.map((mode) => (
            <ScanModeCard
              key={mode.id}
              mode={mode}
              selected={selectedMode?.id === mode.id}
              onSelect={setSelectedMode}
            />
          ))}
        </div>

        {selectedMode && (
          <div className="mt-10 rounded-3xl bg-white p-8 shadow-lg">

            <h2 className="text-2xl font-bold">
              {selectedMode.icon} {selectedMode.title}
            </h2>

            <p className="mt-3 text-gray-600">
              {selectedMode.description}
            </p>

            <button
              className="mt-8 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
            >
              Continue →
            </button>

          </div>
        )}

      </div>
    </main>
  );
}