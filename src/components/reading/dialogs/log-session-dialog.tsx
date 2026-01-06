"use client"

import { useState, useEffect } from "react"
import { addReadingSession } from "@/app/actions/reading-sessions"
import { Button } from "@/components/ui/button"
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
import { Calendar } from "lucide-react"
import { format } from "date-fns"

interface LogSessionDialogProps {
    bookId: string
    journeyId?: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    lastEndPage?: number
}

const MOOD_OPTIONS = [
    { value: "great", label: "😊 Great", emoji: "😊" },
    { value: "good", label: "📚 Good", emoji: "📚" },
    { value: "okay", label: "😐 Okay", emoji: "😐" },
    { value: "slow", label: "😴 Slow", emoji: "😴" },
    { value: "intense", label: "🔥 Intense", emoji: "🔥" },
]

export function LogSessionDialog({
    bookId,
    journeyId,
    open,
    onOpenChange,
    onSuccess,
    lastEndPage = 0
}: LogSessionDialogProps) {
    const [sessionDate, setSessionDate] = useState(format(new Date(), "yyyy-MM-dd"))
    const [startPage, setStartPage] = useState((lastEndPage + 1).toString())
    const [endPage, setEndPage] = useState("")
    const [durationMinutes, setDurationMinutes] = useState("")
    const [mood, setMood] = useState<string>("")
    const [notes, setNotes] = useState("")
    const [isLogging, setIsLogging] = useState(false)

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setSessionDate(format(new Date(), "yyyy-MM-dd"))
            setStartPage((lastEndPage + 1).toString())
            setEndPage("")
            setDurationMinutes("")
            setMood("")
            setNotes("")
        }
    }, [open, lastEndPage])

    const handleLogSession = async () => {
        // Validation
        if (!endPage || !startPage) {
            toast.error("Please enter start and end pages")
            return
        }

        const start = parseInt(startPage)
        const end = parseInt(endPage)

        if (end <= start) {
            toast.error("End page must be greater than start page")
            return
        }

        // Check for future date
        const selectedDate = new Date(sessionDate)
        const today = new Date()
        today.setHours(23, 59, 59, 999)

        if (selectedDate > today) {
            toast.error("Cannot log sessions with future dates")
            return
        }

        setIsLogging(true)
        try {
            const result = await addReadingSession(bookId, {
                session_date: new Date(sessionDate),
                start_page: start,
                end_page: end,
                pages_read: end - start,
                time_spent_minutes: durationMinutes ? parseInt(durationMinutes) : undefined,
                mood: mood || undefined,
                notes: notes.trim() || undefined
            }, journeyId)

            if (result.success) {
                toast.success(`Logged ${end - start} pages!`)
                onOpenChange(false)
                onSuccess?.()
            } else {
                toast.error("Failed to log session")
            }
        } catch (error) {
            toast.error("Failed to log reading session")
        } finally {
            setIsLogging(false)
        }
    }

    const pagesRead = endPage && startPage ? parseInt(endPage) - parseInt(startPage) : 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Log Reading Session</DialogTitle>
                    <DialogDescription>
                        Record your reading progress for today
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Session Date */}
                    <div className="space-y-2">
                        <Label htmlFor="session-date">Date</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="session-date"
                                type="date"
                                value={sessionDate}
                                onChange={(e) => setSessionDate(e.target.value)}
                                max={format(new Date(), "yyyy-MM-dd")}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {/* Pages */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start-page">Start Page</Label>
                            <Input
                                id="start-page"
                                type="number"
                                min="1"
                                value={startPage}
                                onChange={(e) => setStartPage(e.target.value)}
                                placeholder="e.g., 1"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-page">End Page *</Label>
                            <Input
                                id="end-page"
                                type="number"
                                min="1"
                                value={endPage}
                                onChange={(e) => setEndPage(e.target.value)}
                                placeholder="e.g., 25"
                            />
                        </div>
                    </div>

                    {/* Pages read indicator */}
                    {pagesRead > 0 && (
                        <div className="text-sm text-muted-foreground bg-accent/50 rounded-lg p-3">
                            📖 <span className="font-medium">{pagesRead}</span> pages read
                        </div>
                    )}

                    {/* Duration */}
                    <div className="space-y-2">
                        <Label htmlFor="duration">Reading Time (minutes)</Label>
                        <Input
                            id="duration"
                            type="number"
                            min="1"
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(e.target.value)}
                            placeholder="e.g., 60"
                        />
                    </div>

                    {/* Mood */}
                    <div className="space-y-2">
                        <Label htmlFor="mood">How was it?</Label>
                        <Select value={mood} onValueChange={setMood}>
                            <SelectTrigger id="mood">
                                <SelectValue placeholder="Select mood..." />
                            </SelectTrigger>
                            <SelectContent>
                                {MOOD_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Quick Notes (optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Brief thoughts about today's reading..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            maxLength={500}
                            rows={3}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {notes.length}/500
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLogging}>
                        Cancel
                    </Button>
                    <Button onClick={handleLogSession} disabled={isLogging || !endPage}>
                        {isLogging ? "Logging..." : "Save Session"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
