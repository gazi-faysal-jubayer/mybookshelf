"use client"

import { useEffect, useState } from "react"
import { ReadingJourney, getAllJourneys } from "@/app/actions/journeys"
import { JourneyCard } from "./journey-card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Plus } from "lucide-react"
import { toast } from "sonner"
import { startReading } from "@/app/actions/reading-sessions"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface JourneyTimelineProps {
    bookId: string
    userId: string
    isOwner: boolean
    currentStatus: string
}

export function JourneyTimeline({ bookId, userId, isOwner, currentStatus }: JourneyTimelineProps) {
    const [journeys, setJourneys] = useState<ReadingJourney[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedJourney, setSelectedJourney] = useState<string | null>(null)
    const [showNewSeasonDialog, setShowNewSeasonDialog] = useState(false)
    const [newSeasonVisibility, setNewSeasonVisibility] = useState<'public' | 'connections' | 'private'>('public')
    const [isStarting, setIsStarting] = useState(false)

    const loadJourneys = async () => {
        setIsLoading(true)
        try {
            const data = await getAllJourneys(bookId, userId)
            setJourneys(data)
            // Auto-select active journey
            const active = data.find(j => j.status === 'active')
            if (active) {
                setSelectedJourney(active.id)
            }
        } catch (error) {
            toast.error("Failed to load reading journeys")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadJourneys()
    }, [bookId, userId])

    const handleStartNewSeason = async () => {
        setIsStarting(true)
        try {
            await startReading(bookId, undefined, newSeasonVisibility)
            toast.success("Started new reading season!")
            setShowNewSeasonDialog(false)
            await loadJourneys()
        } catch (error) {
            toast.error("Failed to start new season")
        } finally {
            setIsStarting(false)
        }
    }

    const canStartNewSeason = currentStatus === 'completed' || !journeys.some(j => j.status === 'active')

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Reading History</h3>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={loadJourneys} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    {canStartNewSeason && (
                        <Button size="sm" onClick={() => setShowNewSeasonDialog(true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Start New Season
                        </Button>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                    Loading journeys...
                </div>
            ) : journeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <p>No reading journeys yet.</p>
                    <p className="text-sm mt-2">Start reading to create your first journey!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {journeys.map((journey) => (
                        <JourneyCard
                            key={journey.id}
                            journey={journey}
                            isActive={selectedJourney === journey.id}
                            isOwner={isOwner}
                            onSelect={() => setSelectedJourney(journey.id)}
                        />
                    ))}
                </div>
            )}

            {/* New Season Dialog */}
            <Dialog open={showNewSeasonDialog} onOpenChange={setShowNewSeasonDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Start New Reading Season</DialogTitle>
                        <DialogDescription>
                            Begin a fresh reading journey for this book. Your previous sessions and notes will be preserved in the archive.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Who can see this reading season?</Label>
                            <RadioGroup value={newSeasonVisibility} onValueChange={(v: any) => setNewSeasonVisibility(v)}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="public" id="public" />
                                    <Label htmlFor="public" className="font-normal cursor-pointer">
                                        Public - Everyone can see
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="connections" id="connections" />
                                    <Label htmlFor="connections" className="font-normal cursor-pointer">
                                        Connections - Only friends and followers
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="private" id="private" />
                                    <Label htmlFor="private" className="font-normal cursor-pointer">
                                        Private - Only me
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNewSeasonDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleStartNewSeason} disabled={isStarting}>
                            {isStarting ? "Starting..." : "Start Reading"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
