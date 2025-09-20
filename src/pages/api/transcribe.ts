import { NextApiRequest, NextApiResponse } from "next";
import formidable, { IncomingForm, File } from "formidable";
import fs from "fs";
import Spitch, { toFile } from "spitch";
import path from "path";

// Disable Next.js default body parser so formidable can handle it
export const config = {
  api: {
    bodyParser: false,
  },
};

// Define supported languages to match Spitch API
type SupportedLanguage = "en" | "yo" | "ha" | "ig" | "am";

// Language validation function
function isValidLanguage(lang: string): lang is SupportedLanguage {
  return ["en", "yo", "ha", "ig", "am"].includes(lang);
}

async function parseForm(
  req: NextApiRequest
): Promise<{ filePath: string; language: SupportedLanguage }> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      uploadDir:
        process.platform === "win32" ? process.env.TEMP || "C:\\temp" : "/tmp",
      keepExtensions: true,
      maxFileSize: 25 * 1024 * 1024, // 25MB max (Spitch limit)
    });

    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) return reject(new Error("No file uploaded"));

      const languageField = Array.isArray(fields.language)
        ? fields.language[0]
        : fields.language || "en";

      // Validate and type-cast the language
      const language: SupportedLanguage = isValidLanguage(languageField) 
        ? languageField 
        : "en"; // Default to English if invalid

      resolve({ 
        filePath: (file as File).filepath, 
        language 
      });
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let filePath = "";

  try {
    const { filePath: uploadedFilePath, language } = await parseForm(req);
    filePath = uploadedFilePath;

    console.log('📝 Transcribing file:', path.basename(filePath), 'Language:', language);

    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ error: "File not found" });
    }

    if (!process.env.SPITCH_API_KEY) {
      return res.status(500).json({ error: "API key not configured" });
    }

    // Init Spitch client
    const client = new Spitch({ apiKey: process.env.SPITCH_API_KEY });

    // Convert buffer → file object
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath) || ".wav";
    const fileName = `upload${ext}`;
    const file = await toFile(buffer, fileName);

    console.log('🎤 Starting transcription...');

    // Transcribe with properly typed language
    const response = await client.speech.transcribe({
      content: file,
      language, // Now properly typed as SupportedLanguage
    });

    console.log('✅ Transcription completed:', response.text?.substring(0, 100));

    // Cleanup
    fs.unlinkSync(filePath);

    return res.status(200).json({ 
      text: response.text || "",
      language: language,
      success: true
    });

  } catch (error: unknown) {
    let errorMessage = "Internal server error";
    if (typeof error === "object" && error !== null && "message" in error) {
      errorMessage = String((error as { message?: unknown }).message);
    }
    console.error('💥 Transcription error:', errorMessage);
    
    // Cleanup on error
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }

    return res.status(500).json({ 
      error: errorMessage,
      success: false
    });
  }
}