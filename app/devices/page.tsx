"use client";

import { useState } from "react";

import DeviceConnector, { type ConnectedReading } from "@/components/devices/DeviceConnector";
import PageIntro from "@/components/shared/PageIntro";
import { useCollection } from "@/hooks/useCollection";
import { DEVICE_CATALOG } from "@/lib/app-data";
import { apiFetch } from "@/lib/client-api";
import type { DeviceReading } from "@/types/app";

type DeviceResult = {
  brand: string;
  model: string;
  status: string;
  methods: string[];
  features: string[];
  notes: string;
};

export default function DevicesPage() {
  const { items: readings, create, remove } = useCollection<DeviceReading>("devices");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<DeviceResult | null>(null);
  const [moisture, setMoisture] = useState(45);
  const [ph, setPh] = useState(6.5);
  const [temperature, setTemperature] = useState<number | undefined>();
  const [humidity, setHumidity] = useState<number | undefined>();
  const [ec, setEc] = useState<number | undefined>();
  const [device, setDevice] = useState("");
  const [connectionMethod, setConnectionMethod] = useState<DeviceReading["connectionMethod"]>("manual");
  const [raw, setRaw] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  async function check() {
    setMessage("");
    try {
      const response = await apiFetch<{ result: DeviceResult }>("/api/device-check", {
        method: "POST",
        body: JSON.stringify({ query }),
      });
      setResult(response.result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to check device.");
    }
  }

  function receiveConnectedReading(reading: ConnectedReading) {
    if (reading.moisture !== undefined) setMoisture(reading.moisture);
    if (reading.ph !== undefined) setPh(reading.ph);
    setTemperature(reading.temperature);
    setHumidity(reading.humidity);
    setEc(reading.ec);
    setDevice(reading.device);
    setConnectionMethod(reading.connectionMethod);
    setRaw(reading.raw);
    setMessage("Device values loaded. Review them and save when they match the meter display.");
  }

  async function save() {
    await create({
      moisture,
      ph,
      temperature,
      humidity,
      ec,
      device: device.trim(),
      connectionMethod,
      raw: raw.slice(0, 2_000),
      note: note.trim(),
      createdAt: new Date().toISOString(),
    });
    setMessage("Reading saved to your account.");
    setNote("");
  }

  const interpretation = `${
    moisture < 30
      ? "Dry reading — compare with the plant's needs before watering."
      : moisture > 75
        ? "Wet reading — avoid extra watering and inspect drainage."
        : "Moderate moisture."
  } ${ph < 5.5 ? "Soil is acidic." : ph > 7.5 ? "Soil is alkaline." : "pH is suitable for many plants."}`;

  return (
    <main className="page-wrap">
      <PageIntro
        eyebrow="Meter compatibility and readings"
        title="Devices & Moisture"
        description="Use manual entry, standard Web Bluetooth, documented GATT characteristics, or USB serial devices where the browser and vendor protocol support them."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="dashboard-panel">
          <div className="flex gap-2">
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-4" placeholder="Device name or model" />
            <button className="voice-button" onClick={() => void check()}>Verify</button>
          </div>
          {result ? (
            <div className="mt-5 rounded-2xl bg-[var(--surface-secondary)] p-5">
              <div className="flex justify-between gap-3"><h2 className="font-semibold">{result.brand} {result.model}</h2><span className="health-pill">{result.status}</span></div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{result.notes}</p>
              <p className="mt-3 text-sm">Methods: {result.methods.join(", ")}</p>
            </div>
          ) : null}
          <div className="mt-5 space-y-3">
            {DEVICE_CATALOG.map((item) => (
              <div key={item.model} className="rounded-2xl border border-[var(--border-color)] p-4">
                <b>{item.brand} {item.model}</b>
                <p className="text-sm text-[var(--text-secondary)]">{item.status} · {item.notes}</p>
              </div>
            ))}
          </div>
        </section>

        <DeviceConnector onReading={receiveConnectedReading} />
      </div>

      <section className="dashboard-panel mt-6">
        <h2 className="text-xl font-semibold">Review and save reading</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Device or location
            <input value={device} onChange={(event) => setDevice(event.target.value)} className="mt-2 w-full rounded-2xl border p-3" placeholder="Terrace meter" />
          </label>
          <label className="text-sm font-medium">Connection method
            <select value={connectionMethod} onChange={(event) => setConnectionMethod(event.target.value as DeviceReading["connectionMethod"])} className="mt-2 w-full rounded-2xl border p-3">
              <option value="manual">Manual</option><option value="bluetooth">Bluetooth</option><option value="serial">USB serial</option><option value="vendor-api">Vendor API</option>
            </select>
          </label>
        </div>
        <label className="mt-5 block">Moisture: {moisture.toFixed(1)}%<input className="mt-2 w-full" type="range" min="0" max="100" step="0.1" value={moisture} onChange={(event) => setMoisture(Number(event.target.value))} /></label>
        <label className="mt-5 block">pH: {ph.toFixed(1)}<input className="mt-2 w-full" type="range" min="0" max="14" step="0.1" value={ph} onChange={(event) => setPh(Number(event.target.value))} /></label>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="text-sm">Temperature °C<input type="number" step="0.1" value={temperature ?? ""} onChange={(event) => setTemperature(event.target.value ? Number(event.target.value) : undefined)} className="mt-2 w-full rounded-xl border p-3" /></label>
          <label className="text-sm">Humidity %<input type="number" step="0.1" value={humidity ?? ""} onChange={(event) => setHumidity(event.target.value ? Number(event.target.value) : undefined)} className="mt-2 w-full rounded-xl border p-3" /></label>
          <label className="text-sm">EC / fertility<input type="number" step="0.1" value={ec ?? ""} onChange={(event) => setEc(event.target.value ? Number(event.target.value) : undefined)} className="mt-2 w-full rounded-xl border p-3" /></label>
        </div>
        <label className="mt-5 block text-sm font-medium">Note<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border p-3" /></label>
        <div className="mt-5 rounded-2xl bg-[var(--brand-soft)] p-4">{interpretation}</div>
        <button className="voice-button mt-5" onClick={() => void save()}>Save reading</button>
        {message ? <p className="mt-3 text-sm text-[var(--text-secondary)]" role="status">{message}</p> : null}
      </section>

      <section className="dashboard-panel mt-6">
        <h2 className="text-xl font-semibold">Recent readings</h2>
        <div className="mt-4 space-y-3">
          {readings.slice(0, 10).map((reading) => (
            <div key={reading.id} className="flex items-center justify-between gap-4 rounded-2xl bg-[var(--surface-secondary)] p-4">
              <div>
                <p className="font-semibold">Moisture {reading.moisture}% · pH {reading.ph.toFixed(1)}</p>
                <p className="text-sm text-[var(--text-secondary)]">{reading.device || "Manual reading"} · {reading.connectionMethod || "manual"} · {new Date(reading.createdAt).toLocaleString()}</p>
              </div>
              <button type="button" onClick={() => void remove(reading.id)} className="text-sm text-red-600">Delete</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
