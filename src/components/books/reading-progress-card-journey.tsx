"use client"

import { useState } from "react"
import { BookOpen, Clock, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { addReadingSession, finishReading } from "@/app/actions/reading-sessions"
import { ReadingJourney } from "@/app/actions/journeys"
import { format } from "date-fns"

interface ReadingProgressCardWithJourneyProps {
    book: {
        id: string
        title: string
        pages: number | null
        current_page: number | null
        reading_status: string
        reading_started_at: string | null
    }
    journey: ReadingJourney | null
    journeyPagesRead?: number
    onUpdate?: () => void
}

export function ReadingProgressCardWithJourney({ 
    book, 
    journey,
    journeyPagesRead = 0,
    onUpdate 
}: ReadingProgressCardWithJourneyProps) {
    const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Use journey's progress if available, otherwise use book's progress
    const currentPage = journey ? journeyPagesRead : (book.current_page ?? 0)
    const totalPages = book.pages || 0
    const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0
    const pagesRemaining = totalPages - currentPage

    // Determine started date - use journey's started_at if available
    const startedAt = journey?.started_at || book.reading_started_at

    const handleAddSession = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        const formData = new FormData(e.currentTarget)

        const sessionData = {
            start_page: formData.get("startPage") ? parseInt(formData.get("startPage") as string) : undefined,
            end_page: parseInt(formData.get("endPage") as string),
            pages_read: parseInt(formData.get("pagesRead") as string),
            time_spent_minutes: formData.get("timeSpent") ? parseInt(formData.get("timeSpent") as string) : undefined,
            notes: formData.get("notes") as string || undefined,
            mood: formData.get("mood") as string || undefined,
        }

        try {
            // Pass journeyId if a journey is selected
            await addReadingSession(book.id, sessionData, journey?.id)
            toast.success("Reading session added!")
            setIsSessionDialogOpen(false)
            onUpdate?.()
        } catch {
            toast.error("Failed to add session")
        } finally {
            setIsLoading(false)
        }
    }

    const handleFinishReading = async () => {
        setIsLoading(true)
        try {
            await finishReading(book.id)
            toast.success("Congratulations on finishing the book!")
            onUpdate?.()
        } catch {
            toast.error("Failed to mark book as finished")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Reading Progress
                        {journey && (
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                                ({journey.session_name || "Reading Journey"})
                            </span>
                        )}
                    </CardTitle>
                    {startedAt && (
                        <CardDescription>
                            Started reading on {format(new Date(startedAt), "dd/MM/yyyy")}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            Page {currentPage} of {totalPages || "?"}
                        </span>
                        <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    
                    {pagesRemaining > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{pagesRemaining} pages remaining</span>
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsSessionDialogOpen(true)}
                        >
                            Update Pages
                        </Button>
                        <Button 
                            size="sm"
                            onClick={() => setIsSessionDialogOpen(true)}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Log Session
                        </Button>
                        {progress >= 90 && (
                            <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={handleFinishReading}
                                disabled={isLoading}
                            >
                                <Check className="h-4 w-4 mr-1" />
                                Mark Finished
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Add Session Dialog */}
            <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleAddSession}>
                        <DialogHeader>
                            <DialogTitle>Log Reading Session</DialogTitle>
                            <DialogDescription>
                                Record your reading progress
                                {journey && (
                                    <span className="block mt-1 text-primary">
                                        Adding to: {journey.session_name || "Reading Journey"}
                                    </span>
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startPage">Start Page</Label>
                                    <Input
                                        id="startPage"
                                        name="startPage"
                                        type="number"
                                        defaultValue={currentPage + 1}
                                        min={1}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endPage">End Page *</Label>
                                    <Input
                                        id="endPage"
                                        name="endPage"
                                        type="number"
                                        required
                                        min={1}
                                        max={totalPages || undefined}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pagesRead">Pages Read *</Label>
                                <Input
                                    id="pagesRead"
                                    name="pagesRead"
                                    type="number"
                                    required
                                    min={1}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="timeSpent">Time Spent (minutes)</Label>
                                <Input
                                    id="timeSpent"
                                    name="timeSpent"
                                    type="number"
                                    min={1}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mood">How was it?</Label>
                                <Select name="mood">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select mood..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="great">😊 Great</SelectItem>
                                        <SelectItem value="good">📚 Good</SelectItem>
                                        <SelectItem value="okay">😐 Okay</SelectItem>
                                        <SelectItem value="slow">😴 Slow</SelectItem>
                                        <SelectItem value="intense">🔥 Intense</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes (optional)</Label>
                                <Textarea
                                    id="notes"
                                    name="notes"
                                    placeholder="Brief thoughts about this session..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsSessionDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Saving..." : "Save Session"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
