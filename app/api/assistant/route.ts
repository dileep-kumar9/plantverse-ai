import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest){
 try{
  const apiKey=process.env.GEMINI_API_KEY; if(!apiKey) return NextResponse.json({error:"GEMINI_API_KEY is not configured."},{status:500});
  const {message,context,language="English",level="beginner"}=await req.json();
  if(!message?.trim()) return NextResponse.json({error:"Message is required."},{status:400});
  const ai=new GoogleGenAI({apiKey});
  const response=await ai.models.generateContent({model:"gemini-3.6-flash",contents:[{role:"user",parts:[{text:`You are PlantVerse AI, a cautious agriculture and gardening assistant. Reply in ${language}. Explanation level: ${level}. Use the supplied scan/plant context when relevant. Never claim certainty from insufficient evidence. For pesticides or fertilizers, prioritize low-risk integrated pest management, label compliance, protective equipment, local rules, and professional confirmation.\n\nContext:\n${JSON.stringify(context||{})}\n\nUser: ${message}`}]}],config:{temperature:0.35}});
  return NextResponse.json({reply:response.text||"I could not generate a response."});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Assistant request failed."},{status:500})}
}
