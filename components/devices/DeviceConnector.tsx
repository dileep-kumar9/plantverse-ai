"use client";

import { useRef, useState } from "react";

export type ConnectedReading = {
  moisture?: number;
  ph?: number;
  temperature?: number;
  humidity?: number;
  ec?: number;
  device: string;
  connectionMethod: "bluetooth" | "serial";
  raw: string;
};

type Props = {
  onReading: (reading: ConnectedReading) => void;
};

const STANDARD_ENVIRONMENTAL_SERVICE = 0x181a;
const CHARACTERISTICS = {
  temperature: 0x2a6e,
  humidity: 0x2a6f,
} as const;

function clamp(value: number, minimum: number, maximum: number): number | undefined {
  return Number.isFinite(value) ? Math.max(minimum, Math.min(maximum, value)) : undefined;
}

function decodeStandardValue(kind: keyof typeof CHARACTERISTICS, value: DataView): number | undefined {
  if (value.byteLength < 2) return undefined;
  const raw = value.getInt16(0, true);
  if (kind === "temperature" || kind === "humidity") return raw / 100;
  return undefined;
}

function readingFromText(text: string, device: string): ConnectedReading {
  const trimmed = text.trim();
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const parts = trimmed.split(/[;,]/).map((item) => item.trim());
    for (const part of parts) {
      const [key, value] = part.split(/[:=]/, 2).map((item) => item.trim());
      if (key && value !== undefined) parsed[key.toLowerCase()] = Number(value);
    }
    if (Object.keys(parsed).length === 0 && parts.length >= 2) {
      parsed = { moisture: Number(parts[0]), ph: Number(parts[1]), temperature: Number(parts[2]) };
    }
  }
  const number = (...keys: string[]): number | undefined => {
    for (const key of keys) {
      const value = Number(parsed[key]);
      if (Number.isFinite(value)) return value;
    }
    return undefined;
  };
  return {
    moisture: clamp(number("moisture", "soil_moisture", "m") ?? Number.NaN, 0, 100),
    ph: clamp(number("ph", "pH") ?? Number.NaN, 0, 14),
    temperature: clamp(number("temperature", "temp", "t") ?? Number.NaN, -50, 100),
    humidity: clamp(number("humidity", "h") ?? Number.NaN, 0, 100),
    ec: clamp(number("ec", "conductivity", "fertility") ?? Number.NaN, 0, 100_000),
    device,
    connectionMethod: "serial",
    raw: trimmed.slice(0, 2_000),
  };
}

export default function DeviceConnector({ onReading }: Props) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [serviceUuid, setServiceUuid] = useState("");
  const [characteristicUuid, setCharacteristicUuid] = useState("");
  const serialPort = useRef<SerialPort | null>(null);
  const serialReader = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  async function connectStandardBluetooth() {
    if (!navigator.bluetooth) {
      setMessage("Web Bluetooth is unavailable. Use Chrome/Edge on HTTPS or manual entry.");
      return;
    }
    setBusy(true);
    setMessage("Select a compatible Bluetooth environmental sensor…");
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [STANDARD_ENVIRONMENTAL_SERVICE],
      });
      const server = await device.gatt?.connect();
      if (!server) throw new Error("The selected device does not expose a GATT server.");
      const service = await server.getPrimaryService(STANDARD_ENVIRONMENTAL_SERVICE);
      const reading: ConnectedReading = {
        device: device.name || `Bluetooth ${device.id.slice(0, 8)}`,
        connectionMethod: "bluetooth",
        raw: "Bluetooth Environmental Sensing service",
      };
      for (const [kind, uuid] of Object.entries(CHARACTERISTICS) as Array<
        [keyof typeof CHARACTERISTICS, number]
      >) {
        try {
          const characteristic = await service.getCharacteristic(uuid);
          const value = await characteristic.readValue();
          const decoded = decodeStandardValue(kind, value);
          if (decoded !== undefined) reading[kind] = decoded;
        } catch {
          // Characteristics are optional and vary by device.
        }
      }
      onReading(reading);
      setMessage("Bluetooth reading received. Review it before saving.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bluetooth connection failed.");
    } finally {
      setBusy(false);
    }
  }

  async function connectCustomBluetooth() {
    if (!navigator.bluetooth) {
      setMessage("Web Bluetooth is unavailable in this browser.");
      return;
    }
    if (!serviceUuid.trim() || !characteristicUuid.trim()) {
      setMessage("Enter documented service and characteristic UUIDs from the device vendor.");
      return;
    }
    setBusy(true);
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [serviceUuid.trim()],
      });
      const server = await device.gatt?.connect();
      if (!server) throw new Error("The selected device does not expose Bluetooth GATT.");
      const service = await server.getPrimaryService(serviceUuid.trim());
      const characteristic = await service.getCharacteristic(characteristicUuid.trim());
      const value = await characteristic.readValue();
      const bytes = Array.from(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
      const text = new TextDecoder().decode(new Uint8Array(bytes)).trim();
      const parsed = text
        ? readingFromText(text, device.name || "Bluetooth device")
        : {
            device: device.name || "Bluetooth device",
            connectionMethod: "bluetooth" as const,
            raw: bytes.map((byte) => byte.toString(16).padStart(2, "0")).join(" "),
          };
      onReading({ ...parsed, connectionMethod: "bluetooth" });
      setMessage("Custom Bluetooth value received. Confirm vendor scaling before saving.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Custom Bluetooth connection failed.");
    } finally {
      setBusy(false);
    }
  }

  async function connectSerial() {
    if (!navigator.serial) {
      setMessage("Web Serial is unavailable. Use Chrome/Edge on desktop over HTTPS.");
      return;
    }
    setBusy(true);
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      serialPort.current = port;
      if (!port.readable) throw new Error("The device did not provide a readable serial stream.");
      const reader = port.readable.getReader();
      serialReader.current = reader;
      const decoder = new TextDecoder();
      let buffer = "";
      setMessage("Serial device connected. Waiting for a JSON or key:value line…");
      while (true) {
        const result = await reader.read();
        if (result.done) break;
        buffer += decoder.decode(result.value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          onReading(readingFromText(line, "USB serial sensor"));
          setMessage("Serial reading received. Review it before saving.");
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Serial connection failed.");
    } finally {
      serialReader.current?.releaseLock();
      serialReader.current = null;
      setBusy(false);
    }
  }

  async function disconnectSerial() {
    try {
      await serialReader.current?.cancel();
      serialReader.current?.releaseLock();
      serialReader.current = null;
      await serialPort.current?.close();
      serialPort.current = null;
      setMessage("Serial device disconnected.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to disconnect the serial device.");
    }
  }

  return (
    <section className="dashboard-panel">
      <h2 className="text-xl font-semibold">Direct device connection</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        Connections run only after you select a device. Browser support, vendor protocol and HTTPS are required.
        Always compare readings with the device display and calibration instructions.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="voice-button" disabled={busy} onClick={() => void connectStandardBluetooth()}>
          Connect standard Bluetooth
        </button>
        <button type="button" className="outline-button" disabled={busy} onClick={() => void connectSerial()}>
          Connect USB serial
        </button>
        <button type="button" className="outline-button" onClick={() => void disconnectSerial()}>
          Disconnect serial
        </button>
      </div>
      <details className="mt-5 rounded-2xl border border-[var(--border-color)] p-4">
        <summary className="cursor-pointer font-semibold">Documented custom Bluetooth protocol</summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">Service UUID
            <input value={serviceUuid} onChange={(event) => setServiceUuid(event.target.value)} className="mt-2 w-full rounded-xl border p-3" placeholder="0000181a-0000-1000-8000-00805f9b34fb" />
          </label>
          <label className="text-sm font-medium">Characteristic UUID
            <input value={characteristicUuid} onChange={(event) => setCharacteristicUuid(event.target.value)} className="mt-2 w-full rounded-xl border p-3" placeholder="Vendor characteristic UUID" />
          </label>
        </div>
        <button type="button" className="outline-button mt-4" disabled={busy} onClick={() => void connectCustomBluetooth()}>
          Read documented characteristic
        </button>
      </details>
      {message ? <p className="mt-4 text-sm text-[var(--text-secondary)]" role="status">{message}</p> : null}
    </section>
  );
}
