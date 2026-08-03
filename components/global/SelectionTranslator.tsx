"use client";
import { useEffect, useState } from "react";
export default function SelectionTranslator(){
 const [text,setText]=useState(""),[open,setOpen]=useState(false),[result,setResult]=useState(""),[language,setLanguage]=useState("Telugu");
 useEffect(()=>{function pick(){const s=window.getSelection()?.toString().trim()||"";if(s.length>2&&s.length<2000){setText(s);setOpen(true);setResult("")}}document.addEventListener("mouseup",pick);return()=>document.removeEventListener("mouseup",pick)},[]);
 async function translate(){const r=await fetch("/api/translate",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text,targetLanguage:language,context:"selected PlantVerse content",mode:"stacked"})});const d=await r.json();setResult(d.translation||d.error)}
 if(!open)return null;return <div className="selection-translator"><div className="flex justify-between gap-3"><b>Selected text</b><button onClick={()=>setOpen(false)}>✕</button></div><p className="mt-2 line-clamp-3 text-sm text-[var(--text-secondary)]">{text}</p><div className="mt-3 flex gap-2"><select value={language} onChange={e=>setLanguage(e.target.value)} className="outline-button"><option>Telugu</option><option>Hindi</option><option>Tamil</option><option>Kannada</option><option>English</option></select><button onClick={translate} className="voice-button">Translate</button></div>{result&&<div className="mt-3 max-h-48 overflow-auto rounded-2xl bg-[var(--surface-secondary)] p-3 text-sm whitespace-pre-wrap">{result}</div>}</div>
}
