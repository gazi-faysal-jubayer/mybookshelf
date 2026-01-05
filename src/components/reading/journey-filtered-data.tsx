"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { JourneyContextSwitcher } from "@/components/reading/journey-context-switcher"
import { ReadingSessionsList } from "@/components/books/reading-sessions-list"
import { BookReviewSection } from "@/components/books/book-review-section"
import { QuickNotesCard } from "@/components/books/quick-notes-card"
import { ReadingProgressCard } from "@/components/books/reading-progress-card"

interface JourneyFilteredDataProps {
    bookId: string
    userId: string
    book: any
}

export function JourneyFilteredData({ bookId, userId, book }: JourneyFilteredDataProps) {
    const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null)
    const [sessions, setSessions] = useState<any[]>([])
    const [thoughts, setThoughts] = useState<any[]>([])
    const [reviews, setReviews] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadData()
    }, [selectedJourneyId, bookId])

    async function loadData() {
        setLoading(true)
        const supabase = createClient()

        try {
            // Build query for sessions
            let sessionsQuery = supabase
                .from('reading_sessions')
                .select('*')
                .eq('book_id', bookId)
                .eq('user_id', userId)

            if (selectedJourneyId) {
                sessionsQuery = sessionsQuery.eq('journey_id', selectedJourneyId)
            }

            const { data: sessionsData } = await sessionsQuery.order('session_date', { ascending: false })

            // Build query for thoughts
            let thoughtsQuery = supabase
                .from('reading_thoughts')
                .select('*')
                .eq('book_id', bookId)
                .eq('user_id', userId)

            if (selectedJourneyId) {
                thoughtsQuery = thoughtsQuery.eq('journey_id', selectedJourneyId)
            }

            const { data: thoughtsData } = await thoughtsQuery.order('page_number', { ascending: true, nullsFirst: false })

            // Build query for reviews
            let reviewsQuery = supabase
                .from('book_reviews')
                .select('*')
                .eq('book_id', bookId)
                .eq('user_id', userId)

            if (selectedJourneyId) {
                reviewsQuery = reviewsQuery.eq('journey_id', selectedJourneyId)
            }

            const { data: reviewsData } = await reviewsQuery

            setSessions(sessionsData || [])
            setThoughts(thoughtsData || [])
            setReviews(reviewsData || [])
        } catch (error) {
            console.error("Error loading filtered data:", error)
        } finally {
            setLoading(false)
        }
    }

    // Calculate journey-specific progress
    const totalPagesRead = sessions.reduce((sum, session) => sum + (session.pages_read || 0), 0)
    const journeyProgress = book.pages ? Math.round((totalPagesRead / book.pages) * 100) : 0

    return (
        <div className="space-y-6">
            {/* Journey Context Switcher */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <div className="mb-2">
                    <h3 className="text-sm font-medium text-gray-300 mb-1">Viewing</h3>
                    <p className="text-xs text-gray-500">
                        {selectedJourneyId
                            ? "Switch between different reading seasons to view their specific data"
                            : "Showing combined data from all reading seasons"}
                    </p>
                </div>
                <JourneyContextSwitcher
                    bookId={bookId}
                    userId={userId}
                    onJourneyChange={setSelectedJourneyId}
                    currentJourneyId={selectedJourneyId}
                />
                {selectedJourneyId && (
                    <div className="mt-3 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg">
                        <p className="text-sm text-amber-200">
                            📚 Journey Progress: <span className="font-semibold">{totalPagesRead} pages</span> read
                            {book.pages && ` (${journeyProgress}%)`}
                        </p>
                        <p className="text-xs text-amber-300/70 mt-1">
                            {sessions.length} sessions · {thoughts.length} notes · {reviews.length} reviews
                        </p>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="text-center py-8 text-gray-400">Loading data...</div>
            ) : (
                <>
                    {/* Reading Progress - Journey Specific */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-200 mb-3">Reading Progress</h3>
                        {selectedJourneyId ? (
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Pages Read (This Journey)</span>
                                    <span className="text-gray-200 font-medium">{totalPagesRead} / {book.pages || '?'}</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-amber-500 h-2 rounded-full transition-all"
                                        style={{ width: `${Math.min(journeyProgress, 100)}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <ReadingProgressCard book={book} />
                        )}
                    </div>

                    {/* Reading Sessions */}
                    <ReadingSessionsList sessions={sessions} bookId={bookId} />

                    {/* Quick Notes */}
                    <QuickNotesCard bookId={bookId} thoughts={thoughts} />

                    {/* Reviews */}
                    {reviews.length > 0 && (
                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-200 mb-3">Reviews for This Journey</h3>
                            {reviews.map((review) => (
                                <div key={review.id} className="border-b border-gray-700 last:border-0 pb-4 last:pb-0 mb-4 last:mb-0">
                                    {review.title && (
                                        <h4 className="font-medium text-gray-200 mb-2">{review.title}</h4>
                                    )}
                                    {review.rating && (
                                        <div className="flex items-center gap-1 mb-2">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <span key={i} className={i < review.rating ? "text-amber-400" : "text-gray-600"}>
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {review.review_text && (
                                        <p className="text-sm text-gray-300">{review.review_text}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-2">
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
