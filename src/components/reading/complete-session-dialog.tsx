"use client"

import { useState } from "react"
import { completeJourney } from "@/app/actions/journeys"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Trophy, Star, PartyPopper } from "lucide-react"
import { toast } from "sonner"
import Confetti from "react-confetti"
import { useWindowSize } from "react-use"

interface CompleteSessionDialogProps {
    journeyId: string
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    open: boolean
}

export function CompleteSessionDialog({
    journeyId,
    onOpenChange,
    onSuccess,
    open
}: CompleteSessionDialogProps) {
    const [loading, setLoading] = useState(false)
    const [rating, setRating] = useState(0)
    const [review, setReview] = useState("")
    const [showConfetti, setShowConfetti] = useState(false)
    const { width, height } = useWindowSize()

    async function handleComplete() {
        if (rating === 0) {
            toast.error("Please rate your reading journey first!")
            return
        }

        setLoading(true)
        try {
            const result = await completeJourney(journeyId, rating, review)
            if (result.success) {
                setShowConfetti(true)
                toast.success("Journey completed! Congratulations!")
                setTimeout(() => {
                    setShowConfetti(false)
                    onSuccess()
                    onOpenChange(false)
                }, 4000)
            } else {
                toast.error(result.error || "Failed to complete journey")
            }
        } catch (error) {
            console.error("Error completing journey:", error)
            toast.error("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {showConfetti && <Confetti width={width} height={height} numberOfPieces={500} recycle={false} />}
            <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-800 text-gray-100">
                <DialogHeader>
                    <div className="mx-auto bg-amber-500/10 p-4 rounded-full mb-4">
                        <Trophy className="w-10 h-10 text-amber-500" />
                    </div>
                    <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                        Journey Complete!
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-400">
                        Congratulations on finishing this reading session. Take a moment to reflect on your journey.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Rating */}
                    <div className="flex flex-col items-center gap-3">
                        <Label className="text-gray-200">How would you rate this reading experience?</Label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className="transition-transform hover:scale-110 focus:outline-none"
                                >
                                    <Star
                                        className={`w-8 h-8 ${rating >= star
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-gray-600 hover:text-amber-500/50"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Review */}
                    <div className="space-y-2">
                        <Label htmlFor="review" className="text-gray-200">Final Thoughts (Optional)</Label>
                        <Textarea
                            id="review"
                            placeholder="What did you think about this read? Any key takeaways?"
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-amber-500 focus:ring-amber-500/20 min-h-[100px]"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="hover:bg-gray-800 text-gray-300"
                    >
                        Review Later
                    </Button>
                    <Button
                        onClick={handleComplete}
                        disabled={loading}
                        className="bg-amber-600 hover:bg-amber-700 text-white min-w-[150px]"
                    >
                        {loading ? "Completing..." : (
                            <span className="flex items-center gap-2">
                                <PartyPopper className="w-4 h-4" />
                                Mark as Complete
                            </span>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
