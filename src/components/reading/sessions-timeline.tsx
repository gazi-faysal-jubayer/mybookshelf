"use client"

import { useState, useEffect } from "react"
import { ReadingJourney, getAllJourneys } from "@/app/actions/journeys"
import { Calendar, Plus, Globe, Users, Lock, CheckCircle, PlayCircle, AlertCircle, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { NewSessionDialog } from "./new-session-dialog"
import { Badge } from "@/components/ui/badge"

interface SessionsTimelineProps {
    bookId: string
    userId: string
    onSessionSelect: (session: ReadingJourney | null) => void
    activeSessionId: string | null
}

type FilterType = 'all' | 'active' | 'completed' | 'abandoned'

export function SessionsTimeline({
    bookId,
    userId,
    onSessionSelect,
    activeSessionId
}: SessionsTimelineProps) {
    const [sessions, setSessions] = useState<ReadingJourney[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<FilterType>('all')
    const [showNewSessionDialog, setShowNewSessionDialog] = useState(false)

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

    const filteredSessions = sessions.filter(s => {
        if (filter === 'all') return true
        return s.status === filter
    })

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
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-amber-400" />
                        Reading Sessions
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                        Select a session to view its progress, notes, and reviews
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                        onClick={() => {/* Toggle sort maybe? For now just filter is enough */ }}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                    <Button
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={() => setShowNewSessionDialog(true)}
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        New Session
                    </Button>
                </div>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {(['all', 'active', 'completed', 'abandoned'] as const).map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                            filter === type
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-gray-300"
                        )}
                    >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                        <span className="ml-2 opacity-50">
                            {type === 'all'
                                ? sessions.length
                                : sessions.filter(s => s.status === type).length}
                        </span>
                    </button>
                ))}
            </div>

            {sessions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-800 rounded-lg">
                    <Calendar className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No reading sessions yet</p>
                    <Button
                        onClick={() => setShowNewSessionDialog(true)}
                        className="bg-amber-600 hover:bg-amber-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Start Your First Reading Session
                    </Button>
                </div>
            ) : filteredSessions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    No {filter} sessions found.
                </div>
            ) : (
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute top-[2.25rem] left-0 right-0 h-0.5 bg-gray-800" />

                    {/* Sessions */}
                    <div className="relative flex gap-4 overflow-x-auto pb-6 pt-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-base px-1">
                        {filteredSessions.map((session, index) => (
                            <button
                                key={session.id}
                                onClick={() => onSessionSelect(session)}
                                className={cn(
                                    "flex-shrink-0 w-56 relative group text-left",
                                    "transition-all duration-200"
                                )}
                            >
                                {/* Timeline node */}
                                <div className="flex flex-col items-center mb-3">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full border-4 flex items-center justify-center relative z-10 transition-colors",
                                        activeSessionId === session.id
                                            ? "bg-gray-900 border-amber-500 ring-4 ring-amber-500/20"
                                            : "bg-gray-900 border-gray-700 group-hover:border-gray-600"
                                    )}>
                                        {getStatusIcon(session.status)}
                                    </div>
                                </div>

                                {/* Session card */}
                                <div className={cn(
                                    "w-full p-4 rounded-xl border transition-all h-full",
                                    activeSessionId === session.id
                                        ? "bg-amber-950/30 border-amber-500/50 shadow-[0_0_15px_-3px_rgba(245,158,11,0.15)]"
                                        : "bg-gray-800/40 border-gray-700 hover:bg-gray-800/60 hover:border-gray-600"
                                )}>
                                    <div className="flex items-start justify-between mb-2">
                                        <Badge variant="outline" className={cn(
                                            "text-[10px] px-1.5 py-0 h-5 bg-transparent",
                                            session.status === 'active' && "text-emerald-400 border-emerald-400/30",
                                            session.status === 'completed' && "text-blue-400 border-blue-400/30",
                                            session.status === 'abandoned' && "text-gray-400 border-gray-400/30"
                                        )}>
                                            {session.status}
                                        </Badge>
                                        <span className="text-gray-500" title={session.visibility}>
                                            {getPrivacyIcon(session.visibility)}
                                        </span>
                                    </div>

                                    <div className="mb-3">
                                        <h4 className={cn(
                                            "font-semibold truncate",
                                            activeSessionId === session.id ? "text-amber-100" : "text-gray-200"
                                        )}>
                                            {session.session_name || `Session #${index + 1}`}
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                            {new Date(session.started_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <div className="flex-1 bg-gray-700/50 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all",
                                                        session.status === 'completed' ? "bg-blue-500" :
                                                            session.status === 'abandoned' ? "bg-gray-500" : "bg-emerald-500"
                                                    )}
                                                    style={{
                                                        width: `${session.status === 'completed' ? 100 :
                                                            session.status === 'active' ? 50 : 35}%`
                                                    }}
                                                />
                                            </div>
                                            <span>
                                                {session.status === 'completed' ? '100%' :
                                                    session.status === 'active' ? 'In Progress' : 'Stopped'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <NewSessionDialog
                bookId={bookId}
                open={showNewSessionDialog}
                onOpenChange={setShowNewSessionDialog}
                onSuccess={loadSessions}
            />
        </div>
    )
}
