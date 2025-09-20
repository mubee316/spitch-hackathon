import { useState, useEffect, useRef } from "react";

interface WorkoutPlan {
  title: string;
  totalTime: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  exercises: Array<{
    name: string;
    duration: string;
    type: "exercise" | "rest";
    description?: string;
    instructions?: string;
  }>;
}

interface WorkoutSessionScreenProps {
  workoutPlan: WorkoutPlan;
  onComplete: () => void;
  onExit: () => void;
}

export function WorkoutSessionScreen({
  workoutPlan,
  onComplete,
  onExit,
}: WorkoutSessionScreenProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [ttsStatus, setTtsStatus] = useState<string>('Ready');
  
  // Refs to prevent duplicate calls
  const isMountedRef = useRef(true);
  const currentRequestRef = useRef<AbortController | null>(null);
  const hasSpokenRef = useRef(false);

  // Parse duration string
  const parseDuration = (duration: string): number => {
    const match = duration.match(/(\d+)\s*(sec|min)/i);
    if (!match) return 30;
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    return unit === 'min' ? value * 60 : value;
  };

  // Smart TTS function that includes name and description
  const speakText = async (text: string) => {
    // Prevent multiple calls
    if (isSpeaking || isLoadingTTS || !text.trim()) {
      console.log('🚫 TTS blocked - already speaking/loading or no text');
      return;
    }

    // Cancel any existing request
    if (currentRequestRef.current) {
      currentRequestRef.current.abort();
    }

    setIsLoadingTTS(true);
    setTtsStatus('Starting...');
    
    // Create new abort controller
    const controller = new AbortController();
    currentRequestRef.current = controller;

    try {
      // Clean and limit text to reasonable length
      const cleanText = text
        .replace(/[^\w\s.,!?-]/g, ' ') // Remove special characters
        .replace(/\s+/g, ' ') // Replace multiple spaces
        .trim();
      
      // Limit to 180 characters for good balance between content and speed
      const limitedText = cleanText.length > 180 
        ? cleanText.substring(0, 180).trim() + "."
        : cleanText;

      if (!limitedText) {
        throw new Error('No valid text to speak');
      }

      console.log('🎤 Speaking:', limitedText);
      setTtsStatus('Calling API...');

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: limitedText, 
          language: selectedLanguage 
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      setTtsStatus('Processing audio...');
      const audioBlob = await response.blob();

      if (audioBlob.size === 0) {
        throw new Error('Empty audio received');
      }

      setTtsStatus('Playing...');
      setIsLoadingTTS(false);
      setIsSpeaking(true);
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Audio playback failed'));
        };
        
        audio.play().catch(reject);
      });

      setTtsStatus('Completed ✅');
      console.log('✅ TTS completed successfully');

    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🔄 TTS request cancelled');
        setTtsStatus('Cancelled');
      } else {
        const message = error instanceof Error ? error.message : String(error);
        console.error('💥 TTS Error:', message);
        setTtsStatus('Failed ❌');
      }
    } finally {
      // Always reset both states immediately
      setIsLoadingTTS(false);
      setIsSpeaking(false);
      currentRequestRef.current = null;
      
      // Clear status after 1.5 seconds
      setTimeout(() => {
        if (isMountedRef.current) {
          setTtsStatus('Ready');
        }
      }, 1500);
    }
  };

  // Get exercises
  const exercises = workoutPlan?.exercises?.filter(ex => ex.type === "exercise") || [];
  const currentExercise = exercises[currentExerciseIndex];
  const isLastExercise = currentExerciseIndex === exercises.length - 1;

  // Initialize timer when exercise changes
  useEffect(() => {
    if (currentExercise) {
      setTimeLeft(parseDuration(currentExercise.duration));
      hasSpokenRef.current = false; // Reset spoken flag
    }
  }, [currentExerciseIndex]);

  // Auto-speak when exercise changes (only once)
  useEffect(() => {
    if (currentExercise && !isRunning && !hasSpokenRef.current) {
      hasSpokenRef.current = true;
      
      const timer = setTimeout(() => {
        if (isMountedRef.current && currentExercise) {
          // Create text with name and description
          let textToSpeak = '';
          
          switch(selectedLanguage) {
            case 'yo':
              textToSpeak = `Ti o tele ni ${currentExercise.name}`;
              if (currentExercise.instructions) {
                textToSpeak += `. ${currentExercise.instructions}`;
              }
              break;
            case 'ig':
              textToSpeak = `Na-abịa bụ ${currentExercise.name}`;
              if (currentExercise.instructions) {
                textToSpeak += `. ${currentExercise.instructions}`;
              }
              break;
            case 'ha':
              textToSpeak = `Na gaba shine ${currentExercise.name}`;
              if (currentExercise.instructions) {
                textToSpeak += `. ${currentExercise.instructions}`;
              }
              break;
            default:
              textToSpeak = `Next exercise is ${currentExercise.name}`;
              if (currentExercise.instructions) {
                textToSpeak += `. ${currentExercise.instructions}`;
              }
          }
          
          speakText(textToSpeak);
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [currentExerciseIndex, isRunning, currentExercise, selectedLanguage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (currentRequestRef.current) {
        currentRequestRef.current.abort();
      }
    };
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (isLastExercise) {
              setIsRunning(false);
              onComplete();
              return 0;
            } else {
              setCurrentExerciseIndex((prevIndex) => prevIndex + 1);
              return parseDuration(exercises[currentExerciseIndex + 1]?.duration || "30 sec");
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isLastExercise, currentExerciseIndex, exercises, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const testTTS = () => {
    speakText("Test message");
  };

  const speakExerciseDescription = () => {
    if (currentExercise) {
      // Speak exercise name and description
      let textToSpeak = '';
      
      switch(selectedLanguage) {
        case 'yo':
          textToSpeak = `${currentExercise.name}`;
          if (currentExercise.instructions) {
            textToSpeak += `. ${currentExercise.instructions}`;
          }
          break;
        case 'ig':
          textToSpeak = `${currentExercise.name}`;
          if (currentExercise.instructions) {
            textToSpeak += `. ${currentExercise.instructions}`;
          }
          break;
        case 'ha':
          textToSpeak = `${currentExercise.name}`;
          if (currentExercise.instructions) {
            textToSpeak += `. ${currentExercise.instructions}`;
          }
          break;
        default:
          textToSpeak = `${currentExercise.name}`;
          if (currentExercise.instructions) {
            textToSpeak += `. ${currentExercise.instructions}`;
          }
      }
      
      speakText(textToSpeak);
    }
  };

  if (!workoutPlan || exercises.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">No workout plan found.</p>
        <button onClick={onExit} className="px-4 py-2 bg-blue-500 text-white rounded">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col p-6">
      {/* Simple Debug Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
        <div className="flex items-center justify-between">
          {/* <div>TTS: {ttsStatus}</div> */}
          <div className="flex items-center gap-2">
            <select 
              value={selectedLanguage} 
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="text-xs p-1 border rounded"
              disabled={isSpeaking}
            >
              <option value="en">English</option>
              <option value="yo">Yoruba</option>
              <option value="ig">Igbo</option>
              <option value="ha">Hausa</option>
            </select>
            {/* <button
              onClick={testTTS}
              disabled={isSpeaking}
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs disabled:opacity-50"
            >
              Test
            </button> */}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onExit} className="text-gray-600 hover:text-gray-800">
          ← Exit
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800">{workoutPlan.title}</h1>
          <p className="text-sm text-gray-600">{workoutPlan.difficulty} • {workoutPlan.totalTime}</p>
        </div>
        <div className="text-sm text-gray-600">
          {currentExerciseIndex + 1} / {exercises.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-8">
        <div
          className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${((currentExerciseIndex + 1) / exercises.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full space-y-6">
        {/* Current Exercise Card */}
        <div className="w-full p-6 text-center shadow-xl bg-white rounded-2xl border">
          <h2 className="text-2xl font-bold mb-3 text-gray-800 capitalize">
            {currentExercise?.name}
          </h2>
          
          {currentExercise?.description && (
            <p className="text-gray-600 mb-3 text-sm">
              {currentExercise.description.substring(0, 100)}...
            </p>
          )}

          {currentExercise?.instructions && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-blue-700 text-xs">
                {currentExercise.instructions.substring(0, 80)}...
              </p>
            </div>
          )}

          {/* Timer */}
          <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600 mb-6">
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 w-full">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
          >
            {isRunning ? "⏸ Pause" : "▶ Start"}
          </button>

          <button
            onClick={speakExerciseDescription}
            disabled={isSpeaking || isLoadingTTS || !currentExercise}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full font-bold hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50"
          >
            {isLoadingTTS ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Loading...
              </span>
            ) : isSpeaking ? (
              "🔊 Speaking..."
            ) : (
              "🎵 Speak"
            )}
          </button>

          <button
            onClick={() => {
              // Cancel any ongoing speech
              if (currentRequestRef.current) {
                currentRequestRef.current.abort();
              }
              
              if (isLastExercise) {
                onComplete();
              } else {
                setCurrentExerciseIndex(prev => prev + 1);
              }
            }}
            className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full font-bold hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg"
          >
            {isLastExercise ? "🏁" : "⏭"}
          </button>
        </div>
      </div>
    </div>
  );
}