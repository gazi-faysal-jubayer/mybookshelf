"use client"

import { useState, useEffect } from "react"
import { ReadingJourney, getAllJourneys } from "@/app/actions/journeys"
import { Calendar, Plus, Globe, Users, Lock, CheckCircle, PlayCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SessionsTimelineProps {
    bookId: string
    userId: string
    onSessionSelect: (session: ReadingJourney | null) => void
    activeSessionId: string | null
}

export function SessionsTimeline({
    bookId,
    userId,
    onSessionSelect,
    activeSessionId
}: SessionsTimelineProps) {
    const [sessions, setSessions] = useState<ReadingJourney[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadSessions()
    }, [bookId])

    async function loadSessions() {
        setLoading(true)
        try {
            const data = await getAllJourneys(bookId, userId)
            // Sort by start date
            const sorted = data.sort((a, b) =>
                new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
            )
            setSessions(sorted)

            // Auto-select active session or most recent
            if (sorted.length > 0 && !activeSessionId) {
                const active = sorted.find(s => s.status === 'active') || sorted[sorted.length - 1]
                onSessionSelect(active)
            }
        } catch (error) {
            console.error("Error loading sessions:", error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <PlayCircle className="w-4 h-4 text-emerald-400" />
            case 'completed': return <CheckCircle className="w-4 h-4 text-blue-400" />
            case 'abandoned': return <AlertCircle className="w-4 h-4 text-gray-400" />
            case 'archived': return <CheckCircle className="w-4 h-4 text-purple-400" />
            default: return null
        }
    }

    const getPrivacyIcon = (visibility: string) => {
        switch (visibility) {
            case 'public': return <Globe className="w-3 h-3" />
            case 'connections': return <Users className="w-3 h-3" />
            case 'private': return <Lock className="w-3 h-3" />
            default: return null
        }
    }

    if (loading) {
        return <div className="text-center py-8 text-gray-400">Loading sessions...</div>
    }

    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-amber-400" />
                        Reading Sessions
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                        Select a session to view its progress, notes, and reviews
                    </p>
                </div>
                <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700"
                    onClick={() => {/* TODO: Open new session modal */ }}
                >
                    <Plus className="w-4 h-4 mr-1" />
                    New Session
                </Button>
            </div>

            {sessions.length === 0 ? (
                <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No reading sessions yet</p>
                    <Button className="bg-amber-600 hover:bg-amber-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Start Your First Reading Session
                    </Button>
                </div>
            ) : (
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-700" />

                    {/* Sessions */}
                    <div className="relative flex gap-4 overflow-x-auto pb-4">
                        {sessions.map((session, index) => (
                            <button
                                key={session.id}
                                onClick={() => onSessionSelect(session)}
                                className={cn(
                                    "flex-shrink-0 w-48 relative",
                                    "transition-all duration-200"
                                )}
                            >
                                {/* Timeline node */}
                                <div className="flex flex-col items-center">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full border-4 bg-gray-900 flex items-center justify-center mb-3 relative z-10",
                                        activeSessionId === session.id
                                            ? "border-amber-500 ring-4 ring-amber-500/20"
                                            : "border-gray-700 hover:border-gray-600"
                                    )}>
                                        {getStatusIcon(session.status)}
                                    </div>

                                    {/* Session card */}
                                    <div className={cn(
                                        "w-full p-3 rounded-lg border transition-all",
                                        activeSessionId === session.id
                                            ? "bg-amber-900/20 border-amber-700/50 shadow-lg"
                                            : "bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600"
                                    )}>
                                        <div className="text-xs text-gray-400 mb-1">
                                            {new Date(session.started_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </div>
                                        <div className="text-sm font-medium text-gray-200 mb-2 truncate">
                                            Session #{index + 1}
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                                                <div
                                                    className="bg-amber-500 h-1.5 rounded-full transition-all"
                                                    style={{
                                                        width: `${session.status === 'completed' ? 100 :
                                                            session.status === 'active' ? 50 : 35}%`
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-400">
                                                {session.status === 'completed' ? '100' :
                                                    session.status === 'active' ? '50' : '35'}%
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className={cn(
                                                "text-xs px-2 py-0.5 rounded",
                                                session.status === 'active' && "bg-emerald-500/20 text-emerald-300",
                                                session.status === 'completed' && "bg-blue-500/20 text-blue-300",
                                                session.status === 'abandoned' && "bg-gray-500/20 text-gray-400"
                                            )}>
                                                {session.status}
                                            </span>
                                            <span className="text-gray-500">
                                                {getPrivacyIcon(session.visibility)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
