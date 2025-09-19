import Spitch, { toFile } from "spitch";
import fs from "fs";

// Initialize client with API key
const client = new Spitch({ apiKey: process.env.SPITCH_API_KEY! });

/**
 * Transcribe a local audio file
 * @param path Path to audio file (e.g. "public/audio/hello.wav")
 * @param language Language code ("en", "yo", "ig", etc.)
 */
export async function transcribeFile(path: string, language: string = "yo") {
  try {
    const buffer = fs.readFileSync(path);
    const file = await toFile(buffer, path);

    const res = await client.speech.transcribe({
      content: file,
      language: "yo",
    });

    return res.text; // transcript string
  } catch (err) {
    console.error("Error transcribing file:", err);
    throw err;
  }
}

/**
 * Transcribe audio from a URL
 * @param url Public URL to the audio file
 * @param language Language code
 */
export async function transcribeUrl(url: string, language: string = "en") {
  try {
    const res = await client.speech.transcribe({
      url,
      language: "yo",
    });

    return res.text;
  } catch (err) {
    console.error("Error transcribing URL:", err);
    throw err;
  }
}
