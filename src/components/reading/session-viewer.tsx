"use client"

import { useState, useEffect } from "react"
import { ReadingJourney, getJourneyStats, JourneyStats } from "@/app/actions/journeys"
import { createClient } from "@/lib/supabase/client"
import { Calendar, BookOpen, MessageSquare, StickyNote, Star, PlayCircle, CheckCircle, XCircle, RotateCcw, Share2, Award, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReadingSessionsList } from "@/components/books/reading-sessions-list"
import { QuickNotesCard } from "@/components/books/quick-notes-card"
import { cn } from "@/lib/utils"
import { CompleteSessionDialog } from "./complete-session-dialog"
import { NewSessionDialog } from "./new-session-dialog"
import { toast } from "sonner"

interface SessionViewerProps {
    session: ReadingJourney | null
    bookId: string
    book: any
    onUpdate: () => void
}

export function SessionViewer({ session, bookId, book, onUpdate }: SessionViewerProps) {
    const [stats, setStats] = useState<JourneyStats | null>(null)
    const [sessions, setSessions] = useState<any[]>([])
    const [thoughts, setThoughts] = useState<any[]>([])
    const [reviews, setReviews] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Dialog states
    const [showCompleteDialog, setShowCompleteDialog] = useState(false)
    const [showNewSessionDialog, setShowNewSessionDialog] = useState(false)

    useEffect(() => {
        if (session) {
            loadSessionData()
        }
    }, [session?.id])

    async function loadSessionData() {
        if (!session) return

        setLoading(true)
        const supabase = createClient()

        try {
            // Fetch stats
            const statsResult = await getJourneyStats(session.id)
            if (statsResult?.success && statsResult.stats) {
                setStats(statsResult.stats)
            }

            // Fetch sessions
            const { data: sessionsData } = await supabase
                .from('reading_sessions')
                .select('*')
                .eq('journey_id', session.id)
                .order('session_date', { ascending: false })

            // Fetch thoughts
            const { data: thoughtsData } = await supabase
                .from('reading_thoughts')
                .select('*')
                .eq('journey_id', session.id)
                .order('created_at', { ascending: false })

            // Fetch reviews
            const { data: reviewsData } = await supabase
                .from('book_reviews')
                .select('*')
                .eq('journey_id', session.id)

            setSessions(sessionsData || [])
            setThoughts(thoughtsData || [])
            setReviews(reviewsData || [])
        } catch (error) {
            console.error("Error loading session data:", error)
        } finally {
            setLoading(false)
        }
    }

    if (!session) {
        return (
            <div className="text-center py-24 text-gray-500 bg-gray-900/10 border border-gray-800 rounded-lg border-dashed">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                <p>Select a reading session from the timeline above</p>
                <p className="text-sm text-gray-600 mt-2">or start a new one to begin tracking</p>
            </div>
        )
    }

    const totalPagesRead = stats?.total_pages_read || sessions.reduce((sum, s) => sum + (s.pages_read || 0), 0)
    const progress = book.pages ? Math.round((totalPagesRead / book.pages) * 100) : 0
    const isActive = session.status === 'active'

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Session Header Card */}
            <div className="bg-gradient-to-br from-amber-950/40 to-gray-900 border border-amber-900/30 rounded-xl p-6 shadow-xl relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={cn(
                                "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                session.status === 'active' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                session.status === 'completed' && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                session.status === 'abandoned' && "bg-gray-500/10 text-gray-400 border-gray-500/20"
                            )}>
                                {session.status.toUpperCase()}
                            </div>
                            <span className="text-xs text-gray-500 border-l border-gray-700 pl-3">
                                {session.visibility.charAt(0).toUpperCase() + session.visibility.slice(1)} Session
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-100">
                            {session.session_name || "Reading Journey"}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-amber-500/70" />
                                Started {new Date(session.started_at).toLocaleDateString()}
                            </span>
                            {session.finished_at && (
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle className="w-4 h-4 text-blue-500/70" />
                                    Finished {new Date(session.finished_at).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        {isActive && (
                            <>
                                <Button
                                    variant="outline"
                                    className="flex-1 md:flex-none border-amber-900/50 hover:bg-amber-900/20 text-amber-200"
                                    onClick={() => setShowCompleteDialog(true)}
                                >
                                    <TrophyIcon className="w-4 h-4 mr-2 text-amber-500" />
                                    Complete
                                </Button>
                            </>
                        )}
                        {session.status === 'completed' && (
                            <Button
                                className="flex-1 md:flex-none bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-900/20"
                                onClick={() => setShowNewSessionDialog(true)}
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Start Again
                            </Button>
                        )}
                    </div>
                </div>

                {/* Progress Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Main Progress - Circular-ish representation via flex layout */}
                    <div className="col-span-2 bg-gray-900/50 rounded-lg p-4 border border-gray-800 flex items-center gap-4">
                        <div className="relative w-16 h-16 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="32" cy="32" r="28"
                                    stroke="currentColor" strokeWidth="6" fill="transparent"
                                    className="text-gray-800"
                                />
                                <circle
                                    cx="32" cy="32" r="28"
                                    stroke="currentColor" strokeWidth="6" fill="transparent"
                                    strokeDasharray={175.9}
                                    strokeDashoffset={175.9 - (Math.min(progress, 100) / 100) * 175.9}
                                    className={cn(
                                        "transition-all duration-1000 ease-out",
                                        progress >= 100 ? "text-emerald-500" : "text-amber-500"
                                    )}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-200">
                                {progress}%
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="text-sm text-gray-400 mb-1">Pages Read</div>
                            <div className="text-2xl font-bold text-gray-100">
                                {totalPagesRead} <span className="text-sm font-normal text-gray-500">of {book.pages || '?'}</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2 overflow-hidden">
                                <div
                                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 hover:border-amber-900/50 transition-colors">
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                            <BookOpen className="w-4 h-4 text-blue-400" />
                            Sessions
                        </div>
                        <div className="text-2xl font-bold text-gray-100">{stats?.sessions_count || 0}</div>
                        <div className="text-xs text-gray-500 mt-1">
                            {stats?.avg_pages_per_session || 0} pages/session
                        </div>
                    </div>

                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 hover:border-amber-900/50 transition-colors">
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                            <Clock className="w-4 h-4 text-purple-400" />
                            Time
                        </div>
                        <div className="text-2xl font-bold text-gray-100">
                            {stats?.reading_days || 0}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            Days active
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading session details...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Logs & Thoughts */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Reading Sessions Log */}
                        <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-5">
                            <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-amber-500" />
                                Reading Log
                            </h3>
                            <ReadingSessionsList sessions={sessions} bookId={bookId} />
                        </div>

                        {/* Reading Thoughts */}
                        {thoughts.length > 0 && (
                            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-5">
                                <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-amber-500" />
                                    Thoughts & Notes
                                </h3>
                                <div className="space-y-4">
                                    {thoughts.map(thought => (
                                        <div key={thought.id} className="p-4 bg-gray-800/40 border border-gray-700/50 rounded-lg hover:bg-gray-800/60 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                {thought.page_number && (
                                                    <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                                                        Page {thought.page_number}
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-500">
                                                    {new Date(thought.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{thought.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Quick Notes & Review */}
                    <div className="space-y-6">
                        <QuickNotesCard bookId={bookId} thoughts={thoughts} />

                        {/* Review Section */}
                        {(reviews.length > 0 || session.status === 'completed') && (
                            <div className="bg-gradient-to-b from-gray-900 to-gray-900/50 border border-gray-800 rounded-xl p-5">
                                <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                                    <Star className="w-5 h-5 text-amber-500" />
                                    Review
                                </h3>

                                {reviews.length > 0 ? (
                                    reviews.map(review => (
                                        <div key={review.id} className="space-y-3">
                                            {review.rating && (
                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={cn(
                                                                "w-5 h-5",
                                                                i < review.rating
                                                                    ? "fill-amber-400 text-amber-400"
                                                                    : "text-gray-700"
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                            {review.title && (
                                                <h4 className="font-medium text-gray-100">{review.title}</h4>
                                            )}
                                            {review.review_text && (
                                                <p className="text-sm text-gray-300 italic">"{review.review_text}"</p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6">
                                        <p className="text-sm text-gray-400 mb-3">No review written yet.</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-gray-700 text-gray-300 hover:text-white"
                                            onClick={() => setShowCompleteDialog(true)}
                                            disabled={session.status !== 'completed'}
                                        >
                                            Write Review
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <CompleteSessionDialog
                journeyId={session.id}
                open={showCompleteDialog}
                onOpenChange={setShowCompleteDialog}
                onSuccess={() => {
                    onUpdate()
                    loadSessionData()
                }}
            />

            <NewSessionDialog
                bookId={bookId}
                open={showNewSessionDialog}
                onOpenChange={setShowNewSessionDialog}
                onSuccess={() => {
                    onUpdate()
                }}
            />
        </div>
    )
}

function TrophyIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
    )
}
