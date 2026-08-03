"use client";

import { useEffect, useRef, useState } from "react";
import AnalysisResult from "@/components/scan/AnalysisResult";
import ImagePreview from "@/components/scan/ImagePreview";
import ImageUploader from "@/components/scan/ImageUploader";
import InputMethodSelector from "@/components/scan/InputMethodSelector";
import ScanStepper from "@/components/scan/ScanStepper";
import ScanTypeSelector from "@/components/scan/ScanTypeSelector";
import Card from "@/components/ui/Card";
import type { AnalysisResult as AnalysisResultType } from "@/types/analysis";
import type { InputMethod, ScanCategory, ScanType } from "@/types/scan-wizard";

export default function ScanPage() {
  const [selectedType, setSelectedType] = useState<ScanCategory | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<InputMethod | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResultType | null>(null);
  const [voiceText, setVoiceText] = useState("");
  const videoRef = useRef<HTMLInputElement | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function clearMedia() { if (previewUrl) URL.revokeObjectURL(previewUrl); setSelectedFile(null); setPreviewUrl(null); setAnalysisError(null); setResult(null); }
  function handleScanTypeSelect(type: ScanType) { setSelectedType(type.id); setSelectedMethod(null); clearMedia(); }
  function handleMethodSelect(method: InputMethod) { setSelectedMethod(method); clearMedia(); }
  function handleFile(file: File) { if (previewUrl) URL.revokeObjectURL(previewUrl); setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); setAnalysisError(null); }

  async function handleAnalyze() {
    if (!selectedFile || !selectedType) return;
    try {
      setIsAnalyzing(true); setAnalysisError(null);
      const formData = new FormData(); formData.append("image", selectedFile); formData.append("scanType", selectedType);
      const response = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed.");
      setResult(data.result as AnalysisResultType);
    } catch (error) { setAnalysisError(error instanceof Error ? error.message : "Analysis failed."); }
    finally { setIsAnalyzing(false); }
  }

  const currentStep = result ? 5 : isAnalyzing ? 4 : selectedFile ? 3 : selectedType ? 2 : 1;
  const imageMode = selectedMethod === "gallery" || selectedMethod === "camera";

  if (result && selectedType) return <main className="px-4 py-8 sm:px-6"><div className="mx-auto max-w-6xl"><ScanStepper currentStep={5}/><AnalysisResult result={result} scanType={selectedType} imageName={selectedFile?.name} onReset={() => { setSelectedType(null); setSelectedMethod(null); clearMedia(); }}/></div></main>;

  return <main className="px-4 py-8 sm:px-6"><div className="mx-auto max-w-7xl">
    <p className="eyebrow">AI-powered visual workspace</p><h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">PlantVerse Smart Scan</h1><p className="mt-3 max-w-2xl text-[var(--text-secondary)]">Start with a photo, camera, video, or spoken explanation. The AI requests more evidence when certainty is low.</p>
    <Card className="mt-8"><ScanStepper currentStep={currentStep}/></Card>
    <section className="mt-10">
      {!selectedType ? <ScanTypeSelector selectedType={selectedType} onSelect={handleScanTypeSelect}/> : !selectedMethod ? <><div className="mb-6 dashboard-panel"><p className="text-sm text-[var(--text-secondary)]">Selected analysis</p><h2 className="mt-2 text-2xl font-semibold capitalize">{selectedType}</h2><button onClick={() => { setSelectedType(null); setSelectedMethod(null); clearMedia(); }} className="mt-4 text-sm font-semibold text-[var(--brand-primary)]">← Change scan type</button></div><InputMethodSelector selectedMethod={selectedMethod} onSelect={handleMethodSelect}/></> : imageMode ? <>
        <div className="mb-6 flex items-center justify-between"><div><p className="text-sm text-[var(--text-secondary)]">Selected input</p><h2 className="mt-1 text-2xl font-semibold capitalize">{selectedMethod}</h2></div><button onClick={() => { setSelectedMethod(null); clearMedia(); }} className="text-sm font-semibold text-[var(--brand-primary)]">Change method</button></div>
        {analysisError && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{analysisError}</div>}
        {selectedFile && previewUrl ? <div className="relative"><ImagePreview file={selectedFile} previewUrl={previewUrl} onChangeImage={() => hiddenInputRef.current?.click()} onRemove={clearMedia} onAnalyze={handleAnalyze}/>{isAnalyzing && <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/50"><div className="rounded-3xl bg-white p-7 text-center text-gray-900"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-green-600"/><h3 className="mt-4 text-xl font-semibold">Analyzing evidence</h3><p className="mt-2 text-sm text-gray-600">Identifying subject, symptoms, causes, and safe next steps.</p></div></div>}</div> : <ImageUploader onImageSelect={handleFile}/>} 
        <input ref={hiddenInputRef} type="file" accept="image/*" capture={selectedMethod === "camera" ? "environment" : undefined} hidden onChange={(e) => { const f=e.target.files?.[0]; if(f) handleFile(f); e.target.value=""; }}/>
      </> : selectedMethod === "video" ? <div className="dashboard-panel text-center"><div className="text-5xl">🎥</div><h2 className="mt-4 text-2xl font-semibold">Show and explain</h2><p className="mx-auto mt-2 max-w-xl text-[var(--text-secondary)]">Record or upload a short video while explaining the plant, soil, device, or location. Video AI adapter is ready for a multimodal backend.</p><button onClick={() => videoRef.current?.click()} className="voice-button mt-5">Choose video</button><input ref={videoRef} type="file" accept="video/*" capture="environment" hidden onChange={(e)=>{const f=e.target.files?.[0]; if(f) alert(`Video selected: ${f.name}. Video analysis requires a provider with video input enabled.`)}}/></div> : <div className="dashboard-panel"><div className="text-center text-5xl">🎤</div><h2 className="mt-4 text-center text-2xl font-semibold">Explain using your voice</h2><textarea value={voiceText} onChange={(e)=>setVoiceText(e.target.value)} rows={6} className="mt-5 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-4 outline-none" placeholder="Speak using your keyboard microphone or type in English, Telugu, or mixed language..."/><p className="mt-2 text-sm text-[var(--text-secondary)]">PlantVerse preserves your intention while correcting grammar. Browser speech recognition can be enabled where supported.</p></div>}
    </section>
  </div></main>;
}
