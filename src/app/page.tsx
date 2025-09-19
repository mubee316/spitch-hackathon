"use client"

import { useState } from "react"
import { LandingScreen } from "../components/landing-screen"
import { VoiceInputScreen } from "../components/voice-input-screen"
import { WorkoutPlanScreen } from "../components/workout-plan-screen"
import { WorkoutSessionScreen } from "../components/workout-session-screen"
import { CompletionScreen } from "../components/completion-screen"

type Screen = "landing" | "voice-input" | "workout-plan" | "workout-session" | "completion"

interface WorkoutPlan {
  title: string
  totalTime: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  exercises: Array<{
    name: string
    duration: string
    type: "exercise" | "rest"
    description?: string
  }>
}

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("landing")
  const [workoutRequest, setWorkoutRequest] = useState("")
  const [selectedWorkoutPlan, setSelectedWorkoutPlan] = useState<WorkoutPlan | null>(null)

  const handleStartWorkout = () => {
    setCurrentScreen("voice-input")
  }

  const handleBackToLanding = () => {
    setCurrentScreen("landing")
  }

  const handleTranscriptionComplete = (text: string) => {
    setWorkoutRequest(text)
    setCurrentScreen("workout-plan")
  }

  const handleBackToVoiceInput = () => {
    setCurrentScreen("voice-input")
  }

  const handleStartWorkoutSession = (plan: WorkoutPlan) => {
    setSelectedWorkoutPlan(plan)
    setCurrentScreen("workout-session")
  }

  const handleWorkoutComplete = () => {
    setCurrentScreen("completion")
  }

  const handleExitWorkout = () => {
    setCurrentScreen("workout-plan")
  }

  const handleStartAnotherWorkout = () => {
    setWorkoutRequest("")
    setSelectedWorkoutPlan(null)
    setCurrentScreen("voice-input")
  }

  const handleGoHome = () => {
    setWorkoutRequest("")
    setSelectedWorkoutPlan(null)
    setCurrentScreen("landing")
  }

  console.log({
  LandingScreen,
  VoiceInputScreen,
  WorkoutPlanScreen,
  WorkoutSessionScreen,
  CompletionScreen,
});

  switch (currentScreen) {
    case "landing":
      return <LandingScreen onStartWorkout={handleStartWorkout} />
    case "voice-input":
      return <VoiceInputScreen onBack={handleBackToLanding} onTranscriptionComplete={handleTranscriptionComplete} />
    case "workout-plan":
      return (
        <WorkoutPlanScreen
          workoutRequest={workoutRequest}
          onBack={handleBackToVoiceInput}
          onStartWorkout={handleStartWorkoutSession}
        />
      )
    case "workout-session":
      return selectedWorkoutPlan ? (
        <WorkoutSessionScreen
          workoutPlan={selectedWorkoutPlan}
          onComplete={handleWorkoutComplete}
          onExit={handleExitWorkout}
        />
      ) : (
        <LandingScreen onStartWorkout={handleStartWorkout} />
      )
    case "completion":
      return selectedWorkoutPlan ? (
        <CompletionScreen
          workoutPlan={selectedWorkoutPlan}
          onStartAnother={handleStartAnotherWorkout}
          onGoHome={handleGoHome}
        />
      ) : (
        <LandingScreen onStartWorkout={handleStartWorkout} />
      )
    default:
      return <LandingScreen onStartWorkout={handleStartWorkout} />
  }
}
