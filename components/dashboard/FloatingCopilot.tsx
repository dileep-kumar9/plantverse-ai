"use client";

import { useState } from "react";

export default function FloatingCopilot() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-3xl text-white shadow-2xl hover:bg-green-700"
      >
        🤖
      </button>

      {open && (
        <div className="fixed bottom-28 right-6 z-50 w-80 rounded-3xl bg-white p-5 shadow-2xl">

          <h2 className="text-xl font-bold">
            Plant AI
          </h2>

          <p className="mt-3 text-sm text-gray-600">
            How can I help you today?
          </p>

          <div className="mt-5 space-y-2">

            <button className="w-full rounded-xl bg-green-100 p-3 text-left">
              📷 Scan Plant
            </button>

            <button className="w-full rounded-xl bg-green-100 p-3 text-left">
              🌱 Analyze Soil
            </button>

            <button className="w-full rounded-xl bg-green-100 p-3 text-left">
              🌐 Translate
            </button>

          </div>

        </div>
      )}
    </>
  );
}