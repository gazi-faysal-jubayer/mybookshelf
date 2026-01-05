"use client"

import { useState, useEffect } from "react"
import { ReadingJourney, getAllJourneys } from "@/app/actions/journeys"
import { Calendar, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface JourneyContextSwitcherProps {
    bookId: string
    userId: string
    onJourneyChange: (journeyId: string | null) => void
    currentJourneyId: string | null
}

export function JourneyContextSwitcher({
    bookId,
    userId,
    onJourneyChange,
    currentJourneyId
}: JourneyContextSwitcherProps) {
    const [journeys, setJourneys] = useState<ReadingJourney[]>([])
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        loadJourneys()
    }, [bookId])

    async function loadJourneys() {
        try {
            const data = await getAllJourneys(bookId, userId)
            setJourneys(data)
        } catch (error) {
            console.error("Error loading journeys:", error)
        }
    }

    const selectedJourney = journeys.find(j => j.id === currentJourneyId)

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-emerald-400'
            case 'completed': return 'text-blue-400'
            case 'abandoned': return 'text-gray-400'
            case 'archived': return 'text-purple-400'
            default: return 'text-gray-400'
        }
    }

    if (journeys.length === 0) {
        return null
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 transition flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div className="text-left">
                        {selectedJourney ? (
                            <>
                                <div className="text-sm font-medium text-gray-200">
                                    {new Date(selectedJourney.started_at).toLocaleDateString()}
                                    {selectedJourney.finished_at && ` - ${new Date(selectedJourney.finished_at).toLocaleDateString()}`}
                                </div>
                                <div className={cn("text-xs", getStatusColor(selectedJourney.status))}>
                                    {selectedJourney.status.charAt(0).toUpperCase() + selectedJourney.status.slice(1)} Reading Season
                                </div>
                            </>
                        ) : (
                            <div className="text-sm text-gray-400">All Reading Seasons</div>
                        )}
                    </div>
                </div>
                <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
                        <button
                            onClick={() => {
                                onJourneyChange(null)
                                setIsOpen(false)
                            }}
                            className={cn(
                                "w-full px-4 py-3 text-left hover:bg-gray-800 transition border-b border-gray-800",
                                !currentJourneyId && "bg-gray-800"
                            )}
                        >
                            <div className="text-sm font-medium text-gray-200">All Reading Seasons</div>
                            <div className="text-xs text-gray-400">View combined data from all journeys</div>
                        </button>

                        {journeys.map((journey) => (
                            <button
                                key={journey.id}
                                onClick={() => {
                                    onJourneyChange(journey.id)
                                    setIsOpen(false)
                                }}
                                className={cn(
                                    "w-full px-4 py-3 text-left hover:bg-gray-800 transition border-b border-gray-800 last:border-b-0",
                                    currentJourneyId === journey.id && "bg-gray-800"
                                )}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="text-sm font-medium text-gray-200">
                                        {new Date(journey.started_at).toLocaleDateString()}
                                        {journey.finished_at && ` - ${new Date(journey.finished_at).toLocaleDateString()}`}
                                    </div>
                                    <span className={cn("text-xs px-2 py-0.5 rounded", getStatusColor(journey.status))}>
                                        {journey.status}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-400">
                                    {journey.sessions_count || 0} sessions · {journey.thoughts_count || 0} notes
                                    {journey.rating && ` · ${journey.rating}★`}
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
