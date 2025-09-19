// src/app/api/tts/route.ts
import { NextResponse } from "next/server";
import { Spitch } from "spitch";

const DEFAULT_VOICES = {
  "en": "john",
  "yo": "funmi", 
  "ha": "hasan",
  "ig": "obinna",
  "am": "hana",
} as const;

export async function POST(req: Request) {
  console.log('🎵 TTS API called');
  
  try {
    const { text, language } = await req.json();
    
    if (!text || !language) {
      return NextResponse.json({ error: "Missing text or language" }, { status: 400 });
    }

    if (!process.env.SPITCH_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // Allow even longer text for full exercise info - 300 characters max
    const processedText = text
      .replace(/[^\w\s.,!?-]/g, ' ') // Clean special characters
      .replace(/\s+/g, ' ') // Remove extra spaces
      .substring(0, 300) // Increased limit for instructions
      .trim();
    
    console.log('📝 Processing:', processedText.substring(0, 80) + '...');

    const voice = DEFAULT_VOICES[language as keyof typeof DEFAULT_VOICES] || "john";
    
    const client = new Spitch({
      apiKey: process.env.SPITCH_API_KEY,
    });

    const response = await client.speech.generate({
      text: processedText,
      language,
      voice,
    });

    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    
    console.log('✅ Success - buffer size:', buffer.length);

    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": buffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('💥 Error:', error.message);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}