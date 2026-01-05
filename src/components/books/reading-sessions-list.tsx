"use client"

import { useState } from "react"
import { Clock, BookOpen, Trash2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { deleteReadingSession } from "@/app/actions/reading-sessions"
import { AddReadingSessionDialog } from "./add-reading-session-dialog"
import { format } from "date-fns"

interface ReadingSession {
    id: string
    session_date: string
    start_page: number | null
    end_page: number | null
    pages_read: number
    time_spent_minutes: number | null
    notes: string | null
    mood: string | null
    session_rating: number | null
    created_at: string
}

interface ReadingSessionsListProps {
    sessions: ReadingSession[]
    bookId: string
}

const moodEmojis: Record<string, string> = {
    relaxed: "😌",
    focused: "🎯",
    rushed: "⚡",
    tired: "😴",
    excited: "🤩",
    emotional: "🥺",
}

export function ReadingSessionsList({ sessions, bookId }: ReadingSessionsListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async (sessionId: string) => {
        setDeletingId(sessionId)
        try {
            await deleteReadingSession(sessionId)
            toast.success("Session deleted")
        } catch {
            toast.error("Failed to delete session")
        } finally {
            setDeletingId(null)
        }
    }

    const totalPagesRead = sessions.reduce((acc, s) => acc + s.pages_read, 0)
    const totalTimeSpent = sessions.reduce((acc, s) => acc + (s.time_spent_minutes || 0), 0)

    if (sessions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Reading Sessions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6 text-muted-foreground">
                        <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>No reading sessions logged yet.</p>
                        <p className="text-sm mb-4">Use the "Log Session" button to track your progress!</p>
                        <AddReadingSessionDialog bookId={bookId} />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Reading Sessions
                    </CardTitle>
                    <CardDescription>
                        {sessions.length} sessions • {totalPagesRead} pages read
                        {totalTimeSpent > 0 && ` • ${Math.round(totalTimeSpent / 60)}h ${totalTimeSpent % 60}m total`}
                    </CardDescription>
                </div>
                <AddReadingSessionDialog bookId={bookId} />
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className="flex items-start justify-between p-3 rounded-lg border bg-muted/30"
                        >
                            <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">
                                        {format(new Date(session.session_date), "PPP")}
                                    </span>
                                    {session.mood && (
                                        <span title={session.mood}>
                                            {moodEmojis[session.mood] || session.mood}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                    <Badge variant="outline" className="font-normal">
                                        {session.pages_read} pages
                                    </Badge>
                                    {session.start_page && session.end_page && (
                                        <Badge variant="outline" className="font-normal">
                                            p.{session.start_page} → p.{session.end_page}
                                        </Badge>
                                    )}
                                    {session.time_spent_minutes && (
                                        <Badge variant="outline" className="font-normal">
                                            {session.time_spent_minutes} min
                                        </Badge>
                                    )}
                                </div>
                                {session.notes && (
                                    <div className="flex items-start gap-1 mt-2 text-sm">
                                        <MessageSquare className="h-3 w-3 mt-0.5 text-muted-foreground" />
                                        <span className="text-muted-foreground line-clamp-2">
                                            {session.notes}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete this reading session.
                                            This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleDelete(session.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            {deletingId === session.id ? "Deleting..." : "Delete"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
