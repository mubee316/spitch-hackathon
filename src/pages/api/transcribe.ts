// pages/api/transcribe.ts
import { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, File } from "formidable";
import fs from "fs";
import Spitch, { toFile } from "spitch";
import path from "path";

// Disable Next.js default body parser so formidable can handle it
export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseForm(
  req: NextApiRequest
): Promise<{ filePath: string; language: string }> {
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

      const language = Array.isArray(fields.language)
        ? fields.language[0]
        : fields.language || "en";

      resolve({ filePath: (file as File).filepath, language });
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

    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ error: "File not found" });
    }

    if (!process.env.SPITCH_API_KEY) {
      return res.status(500).json({ error: "API key not configured" });
    }

    // Validate language
    const allowedLanguages = ["yo", "en", "ha", "ig", "am"] as const;
    const selectedLanguage = allowedLanguages.includes(language as typeof allowedLanguages[number])
      ? (language as typeof allowedLanguages[number])
      : "en";

    // Init Spitch client
    const client = new Spitch({ apiKey: process.env.SPITCH_API_KEY });

    // Convert buffer → file object
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath) || ".wav";
    const fileName = `upload${ext}`;
    const file = await toFile(buffer, fileName);
    // Transcribe
    const response = await client.speech.transcribe({
      content: file,
      language: selectedLanguage,
    });

    // Cleanup
    fs.unlinkSync(filePath);

    return res.status(200).json({ text: response.text || "" });
  } catch (error: unknown) {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    const errorMessage =
      typeof error === "object" && error !== null && "message" in error
        ? (error as { message?: string }).message
        : "Internal server error";
    return res
      .status(500)
      .json({ error: errorMessage || "Internal server error" });
  }
}
