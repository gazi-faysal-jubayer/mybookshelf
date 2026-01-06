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
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const handleUpdate = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    return (
        <div className="space-y-6">
            <SessionsTimeline
                key={refreshTrigger}
                bookId={bookId}
                userId={userId}
                onSessionSelect={setSelectedSession}
                activeSessionId={selectedSession?.id || null}
            />

            <SessionViewer
                session={selectedSession}
                bookId={bookId}
                book={book}
                onUpdate={handleUpdate}
            />
        </div>
    )
}
