"use client"

import { useState } from "react"
import { ReadingJourney } from "@/app/actions/journeys"
import { JourneyTimeline } from "@/components/reading/journey-timeline"
import { SessionViewer } from "@/components/reading/session-viewer"

interface ReadingTabContentProps {
    bookId: string
    userId: string
    book: any
    isOwner?: boolean
}

export function ReadingTabContent({ bookId, userId, book, isOwner = false }: ReadingTabContentProps) {
    const [selectedJourney, setSelectedJourney] = useState<ReadingJourney | null>(null)

    return (
        <div className="space-y-6">
            <JourneyTimeline
                bookId={bookId}
                userId={userId}
                isOwner={isOwner}
                totalPages={book?.pages}
                onJourneySelect={setSelectedJourney}
            />

            <SessionViewer
                journey={selectedJourney}
                book={{
                    id: bookId,
                    title: book?.title || '',
                    pages: book?.pages || null
                }}
                onUpdate={() => setSelectedJourney(null)}
            />
        </div>
    )
}
