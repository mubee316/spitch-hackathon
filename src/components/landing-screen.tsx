"use client"

import { Button } from "@/components/ui/button"
import { Mic, Dumbbell, Zap, Target } from "lucide-react"

interface LandingScreenProps {
  onStartWorkout: () => void
}

export function LandingScreen({ onStartWorkout }: LandingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-xl" />
        <div className="absolute bottom-32 right-16 w-48 h-48 bg-accent/10 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-primary/8 rounded-full blur-lg" />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-md mx-auto space-y-8">
        {/* Logo with AI glow effect */}
        <div className="relative">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg relative">
            <Dumbbell className="w-12 h-12 text-primary-foreground" />
            {/* AI glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent rounded-2xl animate-pulse" />
            <div className="absolute -inset-1 bg-gradient-to-br from-primary/30 to-accent/20 rounded-2xl blur-sm -z-10" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-primary text-balance">FitCoach AI</h1>
          <p className="text-lg text-secondary/80 text-pretty">Your voice-powered fitness coach</p>
        </div>

        {/* Features preview */}
        <div className="grid grid-cols-3 gap-4 py-6">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-card rounded-xl flex items-center justify-center shadow-sm">
              <Mic className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground text-center">Voice Control</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-card rounded-xl flex items-center justify-center shadow-sm">
              <Zap className="w-6 h-6 text-accent" />
            </div>
            <span className="text-xs text-muted-foreground text-center">AI Powered</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-card rounded-xl flex items-center justify-center shadow-sm">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground text-center">Personalized</span>
          </div>
        </div>

        {/* Start workout button */}
        <Button
          onClick={onStartWorkout}
          size="lg"
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 rounded-full group"
        >
          <Mic className="w-5 h-5 mr-3 group-hover:animate-pulse cursor-pointer" />
          Start Workout
        </Button>

        {/* Motivational text */}
        <p className="text-sm text-muted-foreground text-pretty">
          Ready to transform your fitness journey with AI guidance?
        </p>
      </div>
    </div>
  )
}
