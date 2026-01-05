"use client"

import { useState } from "react"
import { ReadingJourney } from "@/app/actions/journeys"
import { SessionsTimeline } from "@/components/reading/sessions-timeline"
import { SessionViewer } from "@/components/reading/session-viewer"

interface ReadingTabContentProps {
    bookId: string
    userId: string
    book: any
}

export function ReadingTabContent({ bookId, userId, book }: ReadingTabContentProps) {
    const [selectedSession, setSelectedSession] = useState<ReadingJourney | null>(null)

    return (
        <div className="space-y-6">
            <SessionsTimeline
                bookId={bookId}
                userId={userId}
                onSessionSelect={setSelectedSession}
                activeSessionId={selectedSession?.id || null}
            />

            <SessionViewer
                session={selectedSession}
                bookId={bookId}
                book={book}
                onUpdate={() => {/* Refresh sessions if needed */ }}
            />
        </div>
    )
}
