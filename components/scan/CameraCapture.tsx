"use client";

import { CameraIcon, Mic, MicOff, RefreshCcw, Square, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CameraCaptureProps = {
  onPhoto: (file: File) => void;
  onVideo: (file: File) => void;
  onClose: () => void;
};

export default function CameraCapture({ onPhoto, onVideo, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [micEnabled, setMicEnabled] = useState(true);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void openCamera();
    return stopAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode, micEnabled]);

  function stopAll() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function openCamera() {
    stopAll();
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } },
        audio: micEnabled,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError("Camera or microphone permission was denied, or this browser cannot access them.");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      onPhoto(new File([blob], `plantverse-${Date.now()}.jpg`, { type: "image/jpeg" }));
      stopAll();
    }, "image/jpeg", 0.92);
  }

  function toggleRecording() {
    const stream = streamRef.current;
    if (!stream) return;

    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      onVideo(new File([blob], `plantverse-${Date.now()}.webm`, { type: "video/webm" }));
      stopAll();
    };
    recorder.start();
    setRecording(true);
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--border-color)] bg-black text-white">
      <div className="relative aspect-video min-h-72 bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        {error ? (
          <div className="absolute inset-0 grid place-items-center p-8 text-center text-sm text-red-200">{error}</div>
        ) : null}
        {recording ? (
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1.5 text-sm font-semibold">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" /> Recording
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 p-4">
        <button type="button" className="camera-control" onClick={() => setFacingMode((value) => value === "environment" ? "user" : "environment")}>
          <RefreshCcw size={19} /> Switch
        </button>
        <button type="button" className="camera-control" onClick={() => setMicEnabled((value) => !value)}>
          {micEnabled ? <Mic size={19} /> : <MicOff size={19} />} {micEnabled ? "Mic on" : "Mic off"}
        </button>
        <button type="button" className="camera-primary" onClick={capturePhoto} disabled={recording || Boolean(error)}>
          <CameraIcon size={21} /> Capture
        </button>
        <button type="button" className={recording ? "camera-danger" : "camera-control"} onClick={toggleRecording} disabled={Boolean(error)}>
          {recording ? <Square size={18} fill="currentColor" /> : <Video size={20} />}
          {recording ? "Stop & analyze" : "Record"}
        </button>
        <button type="button" className="camera-control" onClick={() => { stopAll(); onClose(); }}>
          Close
        </button>
      </div>
    </div>
  );
}
