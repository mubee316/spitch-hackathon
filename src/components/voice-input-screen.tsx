"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, ArrowLeft } from "lucide-react";
import MicRecorder from "mic-recorder-to-mp3";

interface VoiceInputScreenProps {
  onBack: () => void;
  onTranscriptionComplete: (text: string) => void;
}

const SUPPORTED_LANGS = [
  { code: "en", label: "English" },
  { code: "yo", label: "Yoruba" },
  { code: "ig", label: "Igbo" },
  { code: "ha", label: "Hausa" },
];

const recorder = new MicRecorder({ bitRate: 128 });

export function VoiceInputScreen({
  onBack,
  onTranscriptionComplete,
}: VoiceInputScreenProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState("en");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showingTranscription, setShowingTranscription] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const startListening = async () => {
    try {
      setError("");
      setTranscript("");
      await recorder.start();
      setIsListening(true);
    } catch (err: any) {
      console.error("Mic access error:", err);
      setError(`Microphone error: ${err.message}`);
    }
  };

  const stopListening = async () => {
    try {
      setIsProcessing(true);
      const [buffer] = await recorder.stop().getMp3();
      //@ts-expect-error // Blob type issue
      const file = new File(buffer, "recording.mp3", { type: "audio/mp3" });

      const formData = new FormData();
      formData.append("file", file);  
      formData.append("language", language);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setTranscript(`Error: ${errorData.error || "Transcription failed"}`);
        return;
      }

      const data = await res.json();
      console.log("Transcription response:", data);

      const transcribedText = data.text || "No transcription received";
      setTranscript(transcribedText);
      setIsProcessing(false);
      
      // Show transcription for 5 seconds before auto-fetching workout
      if (data.text) {
        setShowingTranscription(true);
        setCountdown(5);
        
        // Start countdown
        const countdownInterval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              setShowingTranscription(false);
              onTranscriptionComplete(data.text);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err: unknown) {
      console.error("Transcription error:", err);
      setTranscript(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsListening(false);
      if (!showingTranscription) {
        setIsProcessing(false);
      }
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full space-y-8">
        {/* Language Selector */}
        <select
          className="p-2 border rounded w-full"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          {SUPPORTED_LANGS.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>

        {/* Mic Button */}
        <div className="relative">
          <Button
            onClick={handleMicClick}
            disabled={isProcessing}
            size="lg"
            className={`w-32 h-32 rounded-full transition-all duration-300 ${
              isListening
                ? "bg-gradient-to-br from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 shadow-2xl"
                : "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl"
            } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
            ) : isListening ? (
              <MicOff className="w-12 h-12 text-accent-foreground" />
            ) : (
              <Mic className="w-12 h-12 text-primary-foreground" />
            )}
          </Button>
        </div>

        {/* Stop Recording button */}
        {isListening && (
          <Button
            onClick={stopListening}
            variant="destructive"
            size="lg"
            className="w-full rounded-full mt-4"
          >
            Stop Recording
          </Button>
        )}

        {/* Status Messages */}
        {error && (
          <Card className="w-full p-4 border-red-200 bg-red-50">
            <div className="text-red-600 text-sm">{error}</div>
          </Card>
        )}

        {isProcessing && (
          <Card className="w-full p-4 border-blue-200 bg-blue-50">
            <div className="text-blue-600 text-sm flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
              Processing audio...
            </div>
          </Card>
        )}

        {/* Transcription Confirmation */}
        {showingTranscription && transcript && (
          <Card className="w-full p-4 border-green-200 bg-green-50">
            <div className="text-green-700">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Transcription Complete!</span>
                <span className="text-sm bg-green-200 px-2 py-1 rounded">
                  {countdown}s
                </span>
              </div>
              <div className="text-sm mb-3 italic">&ldquo;{transcript}&rdquo;</div>
              <div className="text-xs text-green-600 mb-3">
                Generating workout in {countdown} seconds...
              </div>
              <Button 
                onClick={() => {
                  setShowingTranscription(false);
                  onTranscriptionComplete(transcript);
                }}
                size="sm"
                className="w-full"
              >
                Continue Now
              </Button>
            </div>
          </Card>
        )}

        {/* Transcript */}
        <Card className="w-full p-6 min-h-[120px] shadow-lg">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Transcription
            </h3>
            <div className="text-foreground leading-relaxed">
              {transcript ? (
                <span className="text-foreground">{transcript}</span>
              ) : (
                <span className="text-muted-foreground italic">
                  Your speech will appear here...
                </span>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}