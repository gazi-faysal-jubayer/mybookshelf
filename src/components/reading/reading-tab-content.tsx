"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ReadingJourney } from "@/app/actions/journeys"
import { JourneyTimeline } from "@/components/reading/journey-timeline"
import { SessionViewer } from "@/components/reading/session-viewer"

interface ReadingTabContentProps {
    bookId: string
    userId: string
    book: any
    isOwner?: boolean
    initialJourneyId?: string
}

export function ReadingTabContent({ 
    bookId, 
    userId, 
    book, 
    isOwner = false,
    initialJourneyId 
}: ReadingTabContentProps) {
    const [selectedJourney, setSelectedJourney] = useState<ReadingJourney | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Update URL when journey is selected
    const handleJourneySelect = useCallback((journey: ReadingJourney | null) => {
        setSelectedJourney(journey)
        
        // Update URL with journey ID
        if (journey) {
            const params = new URLSearchParams(searchParams.toString())
            params.set('journey', journey.id)
            params.set('tab', 'reading')
            router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        }
    }, [router, pathname, searchParams])

    return (
        <div className="space-y-6">
            <JourneyTimeline
                bookId={bookId}
                userId={userId}
                isOwner={isOwner}
                totalPages={book?.pages}
                onJourneySelect={handleJourneySelect}
                initialJourneyId={initialJourneyId}
            />

            <SessionViewer
                key={refreshKey}
                journey={selectedJourney}
                book={{
                    id: bookId,
                    title: book?.title || '',
                    pages: book?.pages || null
                }}
                onUpdate={() => {
                    setRefreshKey(prev => prev + 1)
                    router.refresh()
                }}
            />
        </div>
    )
}
