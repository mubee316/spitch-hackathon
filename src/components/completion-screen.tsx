"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trophy, Zap, Target, RotateCcw, Home } from "lucide-react"

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

interface CompletionScreenProps {
  workoutPlan: WorkoutPlan
  onStartAnother: () => void
  onGoHome: () => void
}

export function CompletionScreen({ workoutPlan, onStartAnother, onGoHome }: CompletionScreenProps) {
  const [showConfetti, setShowConfetti] = useState(true)
  const [animationPhase, setAnimationPhase] = useState(0)

  useEffect(() => {
    // Animate in phases for a more dynamic celebration
    const timer1 = setTimeout(() => setAnimationPhase(1), 500)
    const timer2 = setTimeout(() => setAnimationPhase(2), 1000)
    const timer3 = setTimeout(() => setAnimationPhase(3), 1500)
    const timer4 = setTimeout(() => setShowConfetti(false), 4000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [])

  const exerciseCount = workoutPlan.exercises.filter((ex) => ex.type === "exercise").length
  const totalExercises = workoutPlan.exercises.length

  const celebrationMessages = [
    "Outstanding work! You're unstoppable!",
    "Amazing dedication! Your body thanks you!",
    "Incredible effort! You're getting stronger!",
    "Fantastic job! You crushed that workout!",
    "Phenomenal! You're on fire today!",
  ]

  const randomMessage = celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Confetti particles */}
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className={`absolute w-3 h-3 opacity-80 animate-bounce ${
                i % 4 === 0 ? "bg-primary" : i % 4 === 1 ? "bg-accent" : i % 4 === 2 ? "bg-secondary" : "bg-primary/60"
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
                borderRadius: Math.random() > 0.5 ? "50%" : "0%",
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}

          {/* Celebration bursts */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full animate-ping" />
          <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-accent/30 rounded-full animate-pulse" />
          <div className="absolute bottom-1/3 left-1/3 w-40 h-40 bg-primary/10 rounded-full animate-bounce" />
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 text-center max-w-md mx-auto space-y-8">
        {/* Trophy icon with glow */}
        <div
          className={`transition-all duration-1000 ${animationPhase >= 1 ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
        >
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center shadow-2xl relative">
            <Trophy className="w-16 h-16 text-accent-foreground" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-full animate-pulse" />
            <div className="absolute -inset-2 bg-gradient-to-br from-accent/30 to-primary/20 rounded-full blur-lg -z-10" />
          </div>
        </div>

        {/* Celebration text */}
        <div
          className={`space-y-4 transition-all duration-1000 delay-300 ${animationPhase >= 2 ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
        >
          <h1 className="text-4xl font-bold text-primary text-balance">Workout Complete!</h1>
          <p className="text-xl text-secondary/80 text-pretty">
            You just crushed a {workoutPlan.totalTime} {workoutPlan.title.toLowerCase()}!
          </p>
          <p className="text-lg text-accent font-medium text-pretty animate-pulse">{randomMessage}</p>
        </div>

        {/* Stats cards */}
        <div
          className={`grid grid-cols-3 gap-3 transition-all duration-1000 delay-500 ${animationPhase >= 3 ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
        >
          <Card className="p-4 bg-gradient-to-br from-card to-card/80 shadow-lg">
            <div className="text-center space-y-2">
              <Zap className="w-6 h-6 text-primary mx-auto" />
              <div className="text-2xl font-bold text-primary">{exerciseCount}</div>
              <div className="text-xs text-muted-foreground">Exercises</div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-card to-card/80 shadow-lg">
            <div className="text-center space-y-2">
              <Target className="w-6 h-6 text-accent mx-auto" />
              <div className="text-2xl font-bold text-accent">{workoutPlan.totalTime}</div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-card to-card/80 shadow-lg">
            <div className="text-center space-y-2">
              <Trophy className="w-6 h-6 text-primary mx-auto" />
              <div className="text-2xl font-bold text-primary">{workoutPlan.difficulty}</div>
              <div className="text-xs text-muted-foreground">Level</div>
            </div>
          </Card>
        </div>

        {/* Action buttons */}
        <div
          className={`space-y-4 transition-all duration-1000 delay-700 ${animationPhase >= 3 ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
        >
          <Button
            onClick={onStartAnother}
            size="lg"
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 rounded-full group"
          >
            <RotateCcw className="w-5 h-5 mr-3 group-hover:rotate-180 transition-transform duration-300" />
            Start Another Workout
          </Button>

          <Button
            onClick={onGoHome}
            variant="outline"
            size="lg"
            className="w-full h-12 text-base font-medium rounded-full border-2 hover:bg-muted/50 group bg-transparent"
          >
            <Home className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
            Back to Home
          </Button>
        </div>

        {/* Motivational quote */}
        <div
          className={`pt-4 transition-all duration-1000 delay-1000 ${animationPhase >= 3 ? "opacity-100" : "opacity-0"}`}
        >
          <p className="text-sm text-muted-foreground text-pretty italic">
            &quot;Every workout is a step closer to your best self. Keep going!&quot;
          </p>
        </div>
      </div>

      {/* Background celebration elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/20 rounded-full blur-2xl animate-bounce" />
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-primary/30 rounded-full blur-lg animate-ping" />
      </div>
    </div>
  )
}
