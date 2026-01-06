"use client"

import { useState, useEffect } from "react"
import { ReadingJourney, getJourneyStats } from "@/app/actions/journeys"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import {
    BookOpen,
    Calendar,
    Clock,
    TrendingUp,
    FileText,
    Star,
    ChevronDown,
    ChevronUp,
    Plus,
    MessageSquare,
    AlertTriangle,
    CheckCircle,
    PauseCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { LogSessionDialog } from "./dialogs/log-session-dialog"
import { AddThoughtDialog } from "./dialogs/add-thought-dialog"
import { CompleteJourneyDialog } from "./dialogs/complete-journey-dialog"
import { AbandonJourneyDialog } from "./dialogs/abandon-journey-dialog"

interface SessionViewerProps {
    journey: ReadingJourney | null
    book: {
        id: string
        title: string
        pages: number | null
    }
    onUpdate?: () => void
}

interface ReadingSessionEntry {
    id: string
    session_date: string
    start_page: number
    end_page: number
    pages_read: number
    duration_minutes: number | null
    notes: string | null
    mood: string | null
}

interface ReadingThought {
    id: string
    content: string
    page_number: number | null
    chapter: string | null
    contains_spoilers: boolean
    created_at: string
}

interface JourneyStatistics {
    totalSessions: number
    totalPagesRead: number
    totalTimeSpent: number
    totalThoughts: number
    averagePagesPerSession: number
    averageTimePerSession: number
}

// Circular Progress Component
function CircularProgress({
    value,
    size = 120,
    strokeWidth = 8
}: {
    value: number
    size?: number
    strokeWidth?: number
}) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (value / 100) * circumference

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-muted/30"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="text-primary transition-all duration-500"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{Math.round(value)}%</span>
            </div>
        </div>
    )
}

// Stat Card Component
function StatCard({
    icon: Icon,
    label,
    value,
    subvalue
}: {
    icon: any
    label: string
    value: string | number
    subvalue?: string
}) {
    return (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-semibold">{value}</p>
                {subvalue && <p className="text-xs text-muted-foreground">{subvalue}</p>}
            </div>
        </div>
    )
}

export function SessionViewer({ journey, book, onUpdate }: SessionViewerProps) {
    const [stats, setStats] = useState<JourneyStatistics | null>(null)
    const [sessions, setSessions] = useState<ReadingSessionEntry[]>([])
    const [thoughts, setThoughts] = useState<ReadingThought[]>([])
    const [loading, setLoading] = useState(false)

    // Dialog states
    const [showLogSessionDialog, setShowLogSessionDialog] = useState(false)
    const [showAddThoughtDialog, setShowAddThoughtDialog] = useState(false)
    const [showCompleteDialog, setShowCompleteDialog] = useState(false)
    const [showAbandonDialog, setShowAbandonDialog] = useState(false)

    // Collapsible states
    const [sessionsExpanded, setSessionsExpanded] = useState(true)
    const [thoughtsExpanded, setThoughtsExpanded] = useState(true)

    useEffect(() => {
        if (journey) {
            loadJourneyData()
        }
    }, [journey?.id])

    async function loadJourneyData() {
        if (!journey) return
        setLoading(true)

        try {
            const journeyStats = await getJourneyStats(journey.id)
            if (journeyStats) {
                setStats(journeyStats)
            }

            const supabase = createClient()

            const { data: sessionsData } = await supabase
                .from('reading_sessions')
                .select('*')
                .eq('journey_id', journey.id)
                .order('session_date', { ascending: false })

            const { data: thoughtsData } = await supabase
                .from('reading_thoughts')
                .select('*')
                .eq('journey_id', journey.id)
                .order('created_at', { ascending: false })

            setSessions(sessionsData || [])
            setThoughts(thoughtsData || [])
        } catch (error) {
            console.error("Error loading journey data:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDialogSuccess = () => {
        loadJourneyData()
        onUpdate?.()
    }

    if (!journey) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a reading journey from the timeline above to view details</p>
                </CardContent>
            </Card>
        )
    }

    const totalPagesRead = stats?.totalPagesRead || 0
    const progress = book.pages ? Math.min(Math.round((totalPagesRead / book.pages) * 100), 100) : 0
    const lastSession = sessions[0]
    const lastEndPage = lastSession?.end_page || 0

    const getMoodEmoji = (mood: string | null) => {
        const moods: Record<string, string> = {
            great: '😊',
            good: '📚',
            okay: '😐',
            slow: '😴',
            intense: '🔥'
        }
        return mood ? moods[mood] || '📖' : '📖'
    }

    return (
        <div className="space-y-4">
            {/* Journey Header */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant={journey.status === 'active' ? 'default' : 'secondary'}>
                                    {journey.status}
                                </Badge>
                                <Badge variant="outline">{journey.visibility}</Badge>
                            </div>
                            <CardTitle className="text-xl">
                                {journey.session_name || "Unnamed Journey"}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Started {format(new Date(journey.started_at), "MMMM d, yyyy")}
                                {journey.finished_at && (
                                    <> · Finished {format(new Date(journey.finished_at), "MMMM d, yyyy")}</>
                                )}
                            </p>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {loading ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        Loading journey data...
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* 📊 Reading Progress - Always Expanded */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Reading Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                <div className="flex flex-col items-center">
                                    <CircularProgress value={progress} />
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {totalPagesRead} / {book.pages || '?'} pages
                                    </p>
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                                    <StatCard
                                        icon={BookOpen}
                                        label="Sessions"
                                        value={stats?.totalSessions || 0}
                                        subvalue={`${Math.round(stats?.averagePagesPerSession || 0)} pages avg`}
                                    />
                                    <StatCard
                                        icon={Clock}
                                        label="Time Spent"
                                        value={`${stats?.totalTimeSpent || 0} min`}
                                        subvalue={`${Math.round(stats?.averageTimePerSession || 0)} min avg`}
                                    />
                                    <StatCard
                                        icon={FileText}
                                        label="Pages Read"
                                        value={totalPagesRead}
                                        subvalue={
                                            book.pages ? `${book.pages - totalPagesRead} remaining` : undefined
                                        }
                                    />
                                    <StatCard
                                        icon={MessageSquare}
                                        label="Thoughts"
                                        value={stats?.totalThoughts || thoughts.length}
                                    />
                                </div>
                            </div>
                            <div className="mt-4">
                                <Progress value={progress} className="h-2" />
                            </div>

                            {/* Action Buttons */}
                            {journey.status === 'active' && (
                                <div className="flex flex-wrap gap-2 mt-6">
                                    <Button onClick={() => setShowLogSessionDialog(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Log Today's Reading
                                    </Button>
                                    <Button variant="secondary" onClick={() => setShowCompleteDialog(true)}>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Mark as Completed
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowAbandonDialog(true)}
                                    >
                                        <PauseCircle className="h-4 w-4 mr-2" />
                                        Abandon
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 📖 Daily Reading Sessions - Collapsible */}
                    <Collapsible open={sessionsExpanded} onOpenChange={setSessionsExpanded}>
                        <Card>
                            <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Calendar className="h-5 w-5" />
                                            Daily Reading Sessions
                                            <Badge variant="secondary" className="ml-2">
                                                {sessions.length}
                                            </Badge>
                                        </CardTitle>
                                        {sessionsExpanded ? (
                                            <ChevronUp className="h-5 w-5" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5" />
                                        )}
                                    </div>
                                </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="pt-0">
                                    {journey.status === 'active' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowLogSessionDialog(true)}
                                            className="mb-4"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Log Today's Reading
                                        </Button>
                                    )}

                                    {sessions.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No reading sessions logged yet
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {sessions.map((session) => (
                                                <div
                                                    key={session.id}
                                                    className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                                                >
                                                    <div className="text-2xl">
                                                        {getMoodEmoji(session.mood)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-medium">
                                                                {format(new Date(session.session_date), "MMM d, yyyy")}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <span>{session.pages_read} pages</span>
                                                                {session.duration_minutes && (
                                                                    <span>• {session.duration_minutes} min</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-0.5">
                                                            Pages {session.start_page}-{session.end_page}
                                                        </p>
                                                        {session.notes && (
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {session.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </CollapsibleContent>
                        </Card>
                    </Collapsible>

                    {/* 💭 Reading Thoughts - Collapsible */}
                    <Collapsible open={thoughtsExpanded} onOpenChange={setThoughtsExpanded}>
                        <Card>
                            <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <MessageSquare className="h-5 w-5" />
                                            Reading Thoughts
                                            <Badge variant="secondary" className="ml-2">
                                                {thoughts.length}
                                            </Badge>
                                        </CardTitle>
                                        {thoughtsExpanded ? (
                                            <ChevronUp className="h-5 w-5" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5" />
                                        )}
                                    </div>
                                </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="pt-0">
                                    {journey.status === 'active' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowAddThoughtDialog(true)}
                                            className="mb-4"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Reading Thought
                                        </Button>
                                    )}

                                    {thoughts.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No thoughts recorded yet
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {thoughts.map((thought) => (
                                                <div key={thought.id} className="p-3 bg-muted/30 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        {thought.page_number && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Page {thought.page_number}
                                                            </Badge>
                                                        )}
                                                        {thought.chapter && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {thought.chapter}
                                                            </Badge>
                                                        )}
                                                        {thought.contains_spoilers && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                                Spoiler
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p
                                                        className={cn(
                                                            "text-sm",
                                                            thought.contains_spoilers &&
                                                                "blur-sm hover:blur-none transition-all cursor-pointer"
                                                        )}
                                                    >
                                                        {thought.content}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        {format(
                                                            new Date(thought.created_at),
                                                            "MMM d, yyyy 'at' h:mm a"
                                                        )}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </CollapsibleContent>
                        </Card>
                    </Collapsible>

                    {/* ⭐ My Review - if completed */}
                    {journey.status === 'completed' && journey.review && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Star className="h-5 w-5" />
                                    Final Review
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {journey.rating && (
                                    <div className="flex items-center gap-1 mb-3">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                className={cn(
                                                    "h-5 w-5",
                                                    i < journey.rating!
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "text-gray-300"
                                                )}
                                            />
                                        ))}
                                    </div>
                                )}
                                <p className="text-sm">{journey.review}</p>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {/* Dialogs */}
            <LogSessionDialog
                bookId={book.id}
                open={showLogSessionDialog}
                onOpenChange={setShowLogSessionDialog}
                onSuccess={handleDialogSuccess}
                lastEndPage={lastEndPage}
            />

            <AddThoughtDialog
                bookId={book.id}
                open={showAddThoughtDialog}
                onOpenChange={setShowAddThoughtDialog}
                onSuccess={handleDialogSuccess}
            />

            <CompleteJourneyDialog
                journeyId={journey.id}
                open={showCompleteDialog}
                onOpenChange={setShowCompleteDialog}
                onSuccess={handleDialogSuccess}
                currentProgress={progress}
            />

            <AbandonJourneyDialog
                journeyId={journey.id}
                open={showAbandonDialog}
                onOpenChange={setShowAbandonDialog}
                onSuccess={handleDialogSuccess}
            />
        </div>
    )
}
