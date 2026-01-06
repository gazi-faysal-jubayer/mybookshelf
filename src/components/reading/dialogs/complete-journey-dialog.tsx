"use client"

import { useState, useEffect } from "react"
import { completeJourney, getJourneyStats } from "@/app/actions/journeys"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Star, Sparkles, BookOpen, Clock, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface CompleteJourneyDialogProps {
    journeyId: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    currentProgress?: number
}

interface JourneyStatistics {
    totalSessions: number
    totalPagesRead: number
    totalTimeSpent: number
    totalThoughts: number
    averagePagesPerSession: number
    averageTimePerSession: number
}

export function CompleteJourneyDialog({
    journeyId,
    open,
    onOpenChange,
    onSuccess,
    currentProgress = 0
}: CompleteJourneyDialogProps) {
    const [step, setStep] = useState<'confirm' | 'rate' | 'celebrate'>('confirm')
    const [rating, setRating] = useState(0)
    const [review, setReview] = useState("")
    const [isCompleting, setIsCompleting] = useState(false)
    const [stats, setStats] = useState<JourneyStatistics | null>(null)
    const [hoveredStar, setHoveredStar] = useState(0)

    // Load stats when dialog opens
    useEffect(() => {
        if (open) {
            setStep(currentProgress < 100 ? 'confirm' : 'rate')
            setRating(0)
            setReview("")
            loadStats()
        }
    }, [open, currentProgress])

    const loadStats = async () => {
        try {
            const journeyStats = await getJourneyStats(journeyId)
            if (journeyStats) {
                setStats(journeyStats)
            }
        } catch (error) {
            console.error("Failed to load stats:", error)
        }
    }

    const handleConfirmComplete = () => {
        setStep('rate')
    }

    const handleComplete = async () => {
        if (rating === 0) {
            toast.error("Please select a rating")
            return
        }

        setIsCompleting(true)
        try {
            const result = await completeJourney(
                journeyId,
                rating,
                review.trim() || undefined
            )

            if (result.success) {
                setStep('celebrate')
                // Close after showing celebration
                setTimeout(() => {
                    onOpenChange(false)
                    onSuccess?.()
                    toast.success("🎉 Congratulations on completing your reading journey!")
                }, 2500)
            } else {
                toast.error(result.error || "Failed to complete journey")
                setIsCompleting(false)
            }
        } catch (error) {
            toast.error("Failed to complete journey")
            setIsCompleting(false)
        }
    }

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes}m`
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                {/* Step 1: Confirm if progress < 100% */}
                {step === 'confirm' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Complete Reading Journey?</DialogTitle>
                            <DialogDescription>
                                You're at {Math.round(currentProgress)}% progress. You can still mark this journey as complete.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-6">
                            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                <p className="text-sm text-amber-900 dark:text-amber-100">
                                    💡 <strong>Tip:</strong> You're not quite at 100% yet. You can continue reading and complete later, or mark as complete now if you're done.
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Continue Reading
                            </Button>
                            <Button onClick={handleConfirmComplete}>
                                Complete Anyway
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* Step 2: Rate and Review */}
                {step === 'rate' && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                Complete Your Journey
                            </DialogTitle>
                            <DialogDescription>
                                Congratulations on finishing! Rate your reading experience.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            {/* Journey Stats Summary */}
                            {stats && (
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-accent/50 rounded-lg p-3 text-center">
                                        <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                        <p className="text-2xl font-bold">{stats.totalSessions}</p>
                                        <p className="text-xs text-muted-foreground">sessions</p>
                                    </div>
                                    <div className="bg-accent/50 rounded-lg p-3 text-center">
                                        <BookOpen className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                        <p className="text-2xl font-bold">{stats.totalPagesRead}</p>
                                        <p className="text-xs text-muted-foreground">pages</p>
                                    </div>
                                    <div className="bg-accent/50 rounded-lg p-3 text-center">
                                        <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                        <p className="text-2xl font-bold">{formatDuration(stats.totalTimeSpent)}</p>
                                        <p className="text-xs text-muted-foreground">reading time</p>
                                    </div>
                                </div>
                            )}

                            {/* Rating */}
                            <div className="space-y-3">
                                <Label>Your Rating *</Label>
                                <div className="flex items-center justify-center gap-2 py-2">
                                    {Array.from({ length: 5 }).map((_, i) => {
                                        const starValue = i + 1
                                        const isActive = starValue <= (hoveredStar || rating)
                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setRating(starValue)}
                                                onMouseEnter={() => setHoveredStar(starValue)}
                                                onMouseLeave={() => setHoveredStar(0)}
                                                className="focus:outline-none transition-transform hover:scale-110"
                                            >
                                                <Star
                                                    className={cn(
                                                        "h-10 w-10 transition-colors cursor-pointer",
                                                        isActive
                                                            ? "fill-yellow-400 text-yellow-400"
                                                            : "text-gray-300 hover:text-yellow-200"
                                                    )}
                                                />
                                            </button>
                                        )
                                    })}
                                </div>
                                {rating > 0 && (
                                    <p className="text-center text-sm text-muted-foreground">
                                        {rating === 5 && "Outstanding! ⭐"}
                                        {rating === 4 && "Really enjoyed it! 🌟"}
                                        {rating === 3 && "It was good 👍"}
                                        {rating === 2 && "Not bad 📖"}
                                        {rating === 1 && "Didn't enjoy it 😕"}
                                    </p>
                                )}
                            </div>

                            {/* Review */}
                            <div className="space-y-2">
                                <Label htmlFor="complete-review">Your Review (optional)</Label>
                                <Textarea
                                    id="complete-review"
                                    placeholder="Share your thoughts about the book..."
                                    value={review}
                                    onChange={(e) => setReview(e.target.value)}
                                    rows={4}
                                />
                                <p className="text-xs text-muted-foreground">
                                    You can skip this and write a review later
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCompleting}>
                                Cancel
                            </Button>
                            <Button onClick={handleComplete} disabled={isCompleting || rating === 0}>
                                {isCompleting ? "Completing..." : "Complete Journey"}
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* Step 3: Celebration */}
                {step === 'celebrate' && (
                    <div className="py-12">
                        <div className="text-center space-y-4">
                            <div className="text-6xl animate-bounce">🎉</div>
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Congratulations!</h3>
                                <p className="text-muted-foreground">
                                    You've completed your reading journey!
                                </p>
                            </div>
                            {rating > 0 && (
                                <div className="flex items-center justify-center gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={cn(
                                                "h-6 w-6",
                                                i < rating
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-gray-300"
                                            )}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
