"use client"

import { useState, useEffect } from "react"
import { ReadingJourney } from "@/app/actions/journeys"
import { createClient } from "@/lib/supabase/client"
import { Calendar, BookOpen, MessageSquare, StickyNote, Star, PlayCircle, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReadingSessionsList } from "@/components/books/reading-sessions-list"
import { QuickNotesCard } from "@/components/books/quick-notes-card"
import { cn } from "@/lib/utils"

interface SessionViewerProps {
    session: ReadingJourney | null
    bookId: string
    book: any
    onUpdate: () => void
}

export function SessionViewer({ session, bookId, book, onUpdate }: SessionViewerProps) {
    const [sessions, setSessions] = useState<any[]>([])
    const [thoughts, setThoughts] = useState<any[]>([])
    const [reviews, setReviews] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

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
            // Fetch sessions for this journey
            const { data: sessionsData } = await supabase
                .from('reading_sessions')
                .select('*')
                .eq('journey_id', session.id)
                .order('session_date', { ascending: false })

            // Fetch thoughts for this journey
            const { data: thoughtsData } = await supabase
                .from('reading_thoughts')
                .select('*')
                .eq('journey_id', session.id)
                .order('created_at', { ascending: false })

            // Fetch reviews for this journey
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
            <div className="text-center py-16 text-gray-400">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p>Select a reading session from the timeline above</p>
            </div>
        )
    }

    const totalPagesRead = sessions.reduce((sum, s) => sum + (s.pages_read || 0), 0)
    const progress = book.pages ? Math.round((totalPagesRead / book.pages) * 100) : 0

    return (
        <div className="space-y-6">
            {/* Session Header */}
            <div className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 border border-amber-700/30 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-amber-100 mb-2">
                            Reading Session
                        </h2>
                        <div className="flex items-center gap-3 text-sm text-amber-300/70">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Started: {new Date(session.started_at).toLocaleDateString()}
                            </span>
                            {session.finished_at && (
                                <span className="flex items-center gap-1">
                                    → Finished: {new Date(session.finished_at).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium",
                        session.status === 'active' && "bg-emerald-500/20 text-emerald-300",
                        session.status === 'completed' && "bg-blue-500/20 text-blue-300",
                        session.status === 'abandoned' && "bg-gray-500/20 text-gray-400"
                    )}>
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </div>
                </div>

                {/* Progress */}
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-gray-200 font-medium">{totalPagesRead} / {book.pages || '?'} pages</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                            className="bg-amber-500 h-3 rounded-full transition-all flex items-center justify-end pr-2"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        >
                            {progress > 10 && (
                                <span className="text-xs font-bold text-gray-900">{progress}%</span>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center p-3 bg-black/20 rounded-lg">
                            <div className="text-2xl font-bold text-amber-100">{sessions.length}</div>
                            <div className="text-xs text-gray-400">Sessions</div>
                        </div>
                        <div className="text-center p-3 bg-black/20 rounded-lg">
                            <div className="text-2xl font-bold text-amber-100">{thoughts.length}</div>
                            <div className="text-xs text-gray-400">Thoughts</div>
                        </div>
                        <div className="text-center p-3 bg-black/20 rounded-lg">
                            <div className="text-2xl font-bold text-amber-100">{reviews.length}</div>
                            <div className="text-xs text-gray-400">Reviews</div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                {session.status === 'completed' && (
                    <div className="mt-4 pt-4 border-t border-amber-700/30">
                        <Button className="w-full bg-amber-600 hover:bg-amber-700">
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Start Again (New Session)
                        </Button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="text-center py-8 text-gray-400">Loading session data...</div>
            ) : (
                <>
                    {/* Reading Sessions Log */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-amber-400" />
                            Reading Sessions ({sessions.length})
                        </h3>
                        <ReadingSessionsList sessions={sessions} bookId={bookId} />
                    </div>

                    {/* Reading Thoughts */}
                    {thoughts.length > 0 && (
                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-amber-400" />
                                Reading Thoughts ({thoughts.length})
                            </h3>
                            <div className="space-y-3">
                                {thoughts.map(thought => (
                                    <div key={thought.id} className="p-3 bg-gray-900/50 rounded-lg">
                                        {thought.page_number && (
                                            <div className="text-xs text-gray-500 mb-1">Page {thought.page_number}</div>
                                        )}
                                        <p className="text-sm text-gray-300">{thought.content}</p>
                                        <div className="text-xs text-gray-500 mt-2">
                                            {new Date(thought.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Notes */}
                    <QuickNotesCard bookId={bookId} thoughts={thoughts} />

                    {/* Review */}
                    {reviews.length > 0 && (
                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                                <Star className="w-5 h-5 text-amber-400" />
                                My Review
                            </h3>
                            {reviews.map(review => (
                                <div key={review.id}>
                                    {review.rating && (
                                        <div className="flex items-center gap-1 mb-3">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={cn(
                                                        "w-5 h-5",
                                                        i < review.rating
                                                            ? "fill-amber-400 text-amber-400"
                                                            : "text-gray-600"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    {review.title && (
                                        <h4 className="font-medium text-gray-200 mb-2">{review.title}</h4>
                                    )}
                                    {review.review_text && (
                                        <p className="text-sm text-gray-300 leading-relaxed">{review.review_text}</p>
                                    )}
                                    <div className="text-xs text-gray-500 mt-3">
                                        Reviewed on {new Date(review.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
