"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  gifUrl: string;
  instructions?: string[]; // Add instructions field
}

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

interface WorkoutPlanScreenProps {
  workoutRequest: string;
  onBack: () => void;
  onStartWorkout: (plan: WorkoutPlan) => void;
}

export function WorkoutPlanScreen({
  workoutRequest,
  onBack,
  onStartWorkout,
}: WorkoutPlanScreenProps) {
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Parse workout request to determine body parts to fetch
  const parseWorkoutRequest = (request: string): string[] => {
    const lowerRequest = request.toLowerCase();
    
    if (lowerRequest.includes("full") || lowerRequest.includes("whole") || lowerRequest.includes("complete")) {
      return ["chest", "back", "shoulders", "legs"];
    } else if (lowerRequest.includes("upper")) {
      return ["chest", "back", "shoulders"];
    } else if (lowerRequest.includes("lower")) {
      return ["legs"];
    } else if (lowerRequest.includes("chest")) {
      return ["chest"];
    } else if (lowerRequest.includes("back")) {
      return ["back"];
    } else if (lowerRequest.includes("leg") || lowerRequest.includes("thigh")) {
      return ["legs"];
    } else if (lowerRequest.includes("arm") || lowerRequest.includes("bicep") || lowerRequest.includes("tricep")) {
      return ["shoulders"];
    } else if (lowerRequest.includes("abs") || lowerRequest.includes("core")) {
      return ["waist"];
    } else {
      // Default to full workout
      return ["chest", "back", "shoulders", "legs"];
    }
  };

  // Convert API exercises to workout plan format
  const createWorkoutPlan = (exercises: Exercise[], request: string): WorkoutPlan => {
    const bodyParts = parseWorkoutRequest(request);
    const isFullWorkout = bodyParts.length > 2;
    
    // Select 2-3 exercises per body part, limit total to 8-10 exercises
    const maxExercisesPerBodyPart = Math.ceil(8 / bodyParts.length);
    const selectedExercises: Exercise[] = [];
    
    bodyParts.forEach(bodyPart => {
      const bodyPartExercises = exercises.filter(ex => ex.bodyPart === bodyPart);
      const shuffled = bodyPartExercises.sort(() => 0.5 - Math.random());
      selectedExercises.push(...shuffled.slice(0, maxExercisesPerBodyPart));
    });

    // Convert to workout plan format with rest periods
    const planExercises: WorkoutPlan['exercises'] = [];
    
    selectedExercises.forEach((exercise, index) => {
      planExercises.push({
        name: exercise.name,
        duration: "45 sec",
        type: "exercise",
        description: `Target: ${exercise.target} | Equipment: ${exercise.equipment}`,
        instructions: exercise.instructions?.join('. ') || "Follow proper form and technique" // Add instructions
      });
      
      // Add rest period after each exercise (except the last one)
      if (index < selectedExercises.length - 1) {
        planExercises.push({
          name: "Rest",
          duration: "15 sec",
          type: "rest",
          description: "Take a short break and prepare for the next exercise"
        });
      }
    });

    // Calculate total time
    const exerciseTime = selectedExercises.length * 45;
    const restTime = (selectedExercises.length - 1) * 15;
    const totalSeconds = exerciseTime + restTime;
    const totalMinutes = Math.ceil(totalSeconds / 60);

    return {
      title: isFullWorkout ? "Full Body Workout" : `${bodyParts.join(" & ").toUpperCase()} Workout`,
      totalTime: `${totalMinutes} min`,
      difficulty: selectedExercises.length <= 4 ? "Beginner" : selectedExercises.length <= 6 ? "Intermediate" : "Advanced",
      exercises: planExercises
    };
  };

  useEffect(() => {
    async function generateWorkoutPlan() {
      setLoading(true);
      setError("");
      
      try {
        const bodyParts = parseWorkoutRequest(workoutRequest);
        const allExercises: Exercise[] = [];
        
        // Fetch exercises for each body part
        for (const bodyPart of bodyParts) {
          try {
            const response = await fetch(`/api/workout?bodyPart=${bodyPart}`);
            if (response.ok) {
              const exercises = await response.json();
              allExercises.push(...exercises);
            }
          } catch (err) {
            console.warn(`Failed to fetch exercises for ${bodyPart}:`, err);
          }
        }
        
        if (allExercises.length === 0) {
          setError("Unable to fetch exercises. Please try again.");
          return;
        }
        
        const plan = createWorkoutPlan(allExercises, workoutRequest);
        setWorkoutPlan(plan);
        
      } catch (err) {
        console.error("Error generating workout plan:", err);
        setError("Failed to generate workout plan. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    if (workoutRequest) {
      generateWorkoutPlan();
    }
  }, [workoutRequest]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col p-6">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Generating Your Workout Plan</h2>
          <p className="text-muted-foreground text-center">
            Creating a personalized workout based on: &quot;{workoutRequest}&quot;
          </p>
        </div>
      </div>
    );
  }

  if (error || !workoutPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col p-6">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-red-600">Unable to Generate Workout</h2>
            <p className="text-muted-foreground">{error || "Something went wrong."}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleStartWorkout = () => {
    onStartWorkout(workoutPlan);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full">
        {/* Workout Plan Header */}
        <Card className="p-6 mb-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">{workoutPlan.title}</h1>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">
                {workoutPlan.difficulty}
              </span>
              <span>{workoutPlan.totalTime}</span>
              <span>{workoutPlan.exercises.filter(ex => ex.type === "exercise").length} exercises</span>
            </div>
            <p className="text-sm text-muted-foreground italic">
              Generated from: &quot;{workoutRequest}&quot;
            </p>
          </div>
        </Card>

        {/* Exercise List */}
        <div className="space-y-3 mb-8">
          {workoutPlan.exercises.map((exercise, index) => (
            <Card 
              key={index} 
              className={`p-4 ${
                exercise.type === "rest" 
                  ? "bg-muted/50 border-dashed" 
                  : "bg-background"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  exercise.type === "rest"
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground"
                }`}>
                  {exercise.type === "rest" ? "⏸" : Math.floor(index / 2) + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold capitalize">{exercise.name}</h3>
                  {exercise.description && (
                    <p className="text-sm text-muted-foreground">{exercise.description}</p>
                  )}
                  {/* {exercise.instructions && exercise.type === "exercise" && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      Instructions: {exercise.instructions}
                    </p>
                  )} */}
                </div>
                <div className="text-sm font-medium">
                  {exercise.duration}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Start Workout Button */}
        <div className="flex justify-center">
          <Button 
            onClick={handleStartWorkout}
            size="lg"
            className="px-8 py-3 text-lg"
          >
            Start Workout
          </Button>
        </div>
      </div>
    </div>
  );
}