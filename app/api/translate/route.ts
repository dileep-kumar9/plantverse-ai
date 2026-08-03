import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
export async function POST(req:NextRequest){
 try{const apiKey=process.env.GEMINI_API_KEY;if(!apiKey)return NextResponse.json({error:"GEMINI_API_KEY is not configured."},{status:500});
 const {text,targetLanguage="Telugu",context="agriculture",mode="line-by-line"}=await req.json();
 if(!text?.trim())return NextResponse.json({error:"Text is required."},{status:400});
 const ai=new GoogleGenAI({apiKey}); const r=await ai.models.generateContent({model:"gemini-3.6-flash",contents:[{role:"user",parts:[{text:`Translate the following ${context} text into ${targetLanguage}. Preserve plant names accurately, keep scientific names unchanged, preserve numbering and safety warnings. Output ${mode}. Return only the translation.\n\n${text}`}]}],config:{temperature:0.1}});
 return NextResponse.json({translation:r.text||""});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Translation failed."},{status:500})}}
