"use client"

import { useState } from "react"
import { BookOpen, Target, Calendar, Clock, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { updateProgress, updateTotalPages, addReadingSession, finishReading } from "@/app/actions/reading-sessions"

interface ReadingProgressCardProps {
    book: {
        id: string
        title: string
        pages: number | null
        current_page: number | null
        reading_status: string
        reading_started_at: string | null
        reading_finished_at: string | null
        reading_goal_pages_per_day: number | null
        reading_goal_finish_by: string | null
    }
}

export function ReadingProgressCard({ book }: ReadingProgressCardProps) {
    const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false)
    const [isPagesDialogOpen, setIsPagesDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const currentPage = book.current_page || 0
    const totalPages = book.pages || 0
    const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0

    const handleUpdateTotalPages = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        const formData = new FormData(e.currentTarget)
        const pages = parseInt(formData.get("totalPages") as string)

        try {
            await updateTotalPages(book.id, pages)
            toast.success("Total pages updated!")
            setIsPagesDialogOpen(false)
        } catch {
            toast.error("Failed to update pages")
        } finally {
            setIsLoading(false)
        }
    }

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
            await addReadingSession(book.id, sessionData)
            toast.success("Reading session added!")
            setIsSessionDialogOpen(false)
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
        } catch {
            toast.error("Failed to mark as finished")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Reading Progress
                </CardTitle>
                {book.reading_status === "currently_reading" && book.reading_started_at && (
                    <CardDescription>
                        Started reading on {new Date(book.reading_started_at).toLocaleDateString()}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                            Page {currentPage} of {totalPages || "?"}
                        </span>
                        <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Reading Goal Info */}
                {book.reading_goal_pages_per_day && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Target className="h-4 w-4" />
                        <span>Goal: {book.reading_goal_pages_per_day} pages/day</span>
                    </div>
                )}

                {book.reading_goal_finish_by && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Finish by: {new Date(book.reading_goal_finish_by).toLocaleDateString()}</span>
                    </div>
                )}

                {/* Pages remaining */}
                {totalPages > 0 && currentPage < totalPages && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{totalPages - currentPage} pages remaining</span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                    {/* Update Total Pages Dialog */}
                    <Dialog open={isPagesDialogOpen} onOpenChange={setIsPagesDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                {totalPages > 0 ? "Update Pages" : "Set Total Pages"}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleUpdateTotalPages}>
                                <DialogHeader>
                                    <DialogTitle>Set Total Pages</DialogTitle>
                                    <DialogDescription>
                                        Enter the total number of pages in this book.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <Label htmlFor="totalPages">Total Pages</Label>
                                    <Input
                                        id="totalPages"
                                        name="totalPages"
                                        type="number"
                                        min="1"
                                        defaultValue={totalPages || ""}
                                        className="mt-2"
                                        required
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? "Saving..." : "Save"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Add Reading Session Dialog */}
                    <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-1" />
                                Log Session
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <form onSubmit={handleAddSession}>
                                <DialogHeader>
                                    <DialogTitle>Log Reading Session</DialogTitle>
                                    <DialogDescription>
                                        Record your reading progress for today.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="startPage">Start Page</Label>
                                            <Input
                                                id="startPage"
                                                name="startPage"
                                                type="number"
                                                min="0"
                                                defaultValue={currentPage}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="endPage">End Page *</Label>
                                            <Input
                                                id="endPage"
                                                name="endPage"
                                                type="number"
                                                min="1"
                                                className="mt-1"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="pagesRead">Pages Read *</Label>
                                            <Input
                                                id="pagesRead"
                                                name="pagesRead"
                                                type="number"
                                                min="1"
                                                className="mt-1"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="timeSpent">Time (minutes)</Label>
                                            <Input
                                                id="timeSpent"
                                                name="timeSpent"
                                                type="number"
                                                min="1"
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="mood">Mood</Label>
                                        <Select name="mood">
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="How did you feel?" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="relaxed">Relaxed</SelectItem>
                                                <SelectItem value="focused">Focused</SelectItem>
                                                <SelectItem value="rushed">Rushed</SelectItem>
                                                <SelectItem value="tired">Tired</SelectItem>
                                                <SelectItem value="excited">Excited</SelectItem>
                                                <SelectItem value="emotional">Emotional</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="notes">Notes</Label>
                                        <Textarea
                                            id="notes"
                                            name="notes"
                                            placeholder="Any thoughts or highlights?"
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? "Saving..." : "Save Session"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Mark as Finished Button */}
                    {book.reading_status === "currently_reading" && (
                        <Button
                            size="sm"
                            variant="secondary"
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
    )
}
