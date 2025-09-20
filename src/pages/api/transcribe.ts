// pages/api/transcribe.ts
import { NextApiRequest, NextApiResponse } from "next";
import Spitch, { toFile } from "spitch";

// Disable Next.js default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    const buffer = Buffer.concat(chunks);

    if (!process.env.SPITCH_API_KEY) {
      return res.status(500).json({ error: "API key not configured" });
    }

    // Convert buffer to File
    const file = await toFile(buffer, "recording.mp3");

    // Init Spitch client
    const client = new Spitch({ apiKey: process.env.SPITCH_API_KEY });

    const response = await client.speech.transcribe({
      content: file,
      language: "en", // or your dynamic choice
    });

    return res.status(200).json({ text: response.text || "" });
  } catch (error: unknown) {
    console.error("Transcribe error:", error);
    const errorMessage =
      typeof error === "object" && error !== null && "message" in error
        ? (error as { message?: string }).message
        : "Internal Server Error";
    return res.status(500).json({ error: errorMessage || "Internal Server Error" });
  }
}
