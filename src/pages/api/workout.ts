// pages/api/workout.ts
import type { NextApiRequest, NextApiResponse } from "next";

interface ApiError extends Error {
  status?: number;
  response?: {
    status: number;
    statusText: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { bodyPart } = req.query; // e.g. abs, legs, back

    if (!bodyPart) {
      return res.status(400).json({ error: "Missing bodyPart query param" });
    }

    const response = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/bodyPart/${bodyPart}`,
      {
        headers: {
          "X-RapidAPI-Key": process.env.EXERCISEDB_KEY!,
          "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch from ExerciseDB" });
    }

    const data = await response.json();

    // pick 5 random exercises for variety
    const shuffled = data.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);

    res.status(200).json(selected);
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('API Error:', apiError.message || 'Unknown error');

    res.status(500).json({ error: apiError.message });
  }
}
