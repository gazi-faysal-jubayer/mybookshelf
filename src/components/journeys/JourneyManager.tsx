"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    ReadingJourney,
    VisibilityLevel,
    getAllJourneys,
    getActiveJourney,
    createNewJourney,
    completeJourney,
    archiveJourney,
    reopenJourney,
    deleteJourney,
    hideJourneyFromOwner,
    updateJourneyVisibility,
    getJourneyStats
} from "@/app/actions/journeys"
import { BookOpen, Plus, Archive, Trash2, Eye, EyeOff, RefreshCw, Users, Lock, Globe } from "lucide-react"

interface JourneyManagerProps {
    bookId: string
    userId: string
    isBookOwner: boolean
}

export default function JourneyManager({ bookId, userId, isBookOwner }: JourneyManagerProps) {
    const router = useRouter()
    const [activeJourney, setActiveJourney] = useState<ReadingJourney | null>(null)
    const [allJourneys, setAllJourneys] = useState<ReadingJourney[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewJourneyDialog, setShowNewJourneyDialog] = useState(false)
    const [selectedVisibility, setSelectedVisibility] = useState<VisibilityLevel>('public')

    useEffect(() => {
        loadJourneys()
    }, [bookId])

    async function loadJourneys() {
        setLoading(true)
        try {
            const [active, all] = await Promise.all([
                getActiveJourney(bookId),
                getAllJourneys(bookId, userId)
            ])
            setActiveJourney(active)
            setAllJourneys(all)
        } catch (error) {
            console.error("Error loading journeys:", error)
        } finally {
            setLoading(false)
        }
    }

    async function handleCreateJourney() {
        const result = await createNewJourney(bookId, selectedVisibility)
        if (result.success) {
            setShowNewJourneyDialog(false)
            loadJourneys()
            router.refresh()
        } else {
            alert(result.error || "Failed to create journey")
        }
    }

    async function handleCompleteJourney(journeyId: string) {
        const rating = prompt("Rate this journey (0-5):")
        const review = prompt("Add a review (optional):")

        const result = await completeJourney(
            journeyId,
            rating ? parseFloat(rating) : undefined,
            review || undefined
        )

        if (result.success) {
            loadJourneys()
            router.refresh()
        } else {
            alert(result.error || "Failed to complete journey")
        }
    }

    async function handleArchiveJourney(journeyId: string) {
        if (!confirm("Archive this journey?")) return

        const result = await archiveJourney(journeyId)
        if (result.success) {
            loadJourneys()
            router.refresh()
        } else {
            alert(result.error || "Failed to archive journey")
        }
    }

    async function handleReopenJourney(journeyId: string) {
        if (!confirm("Reopen this journey? This will make it your active reading session.")) return

        const result = await reopenJourney(journeyId)
        if (result.success) {
            loadJourneys()
            router.refresh()
        } else {
            alert(result.error || "Failed to reopen journey")
        }
    }

    async function handleDeleteJourney(journeyId: string) {
        if (!confirm("Delete this journey? This will also delete all associated sessions and notes.")) return

        const result = await deleteJourney(journeyId)
        if (result.success) {
            loadJourneys()
            router.refresh()
        } else {
            alert(result.error || "Failed to delete journey")
        }
    }

    async function handleHideJourney(journeyId: string, hide: boolean) {
        const result = await hideJourneyFromOwner(journeyId, hide)
        if (result.success) {
            loadJourneys()
            router.refresh()
        } else {
            alert(result.error || "Failed to update journey visibility")
        }
    }

    async function handleUpdateVisibility(journeyId: string, visibility: VisibilityLevel) {
        const result = await updateJourneyVisibility(journeyId, visibility)
        if (result.success) {
            loadJourneys()
            router.refresh()
        } else {
            alert(result.error || "Failed to update visibility")
        }
    }

    const getVisibilityIcon = (visibility: VisibilityLevel) => {
        switch (visibility) {
            case 'public': return <Globe className="w-4 h-4" />
            case 'connections': return <Users className="w-4 h-4" />
            case 'private': return <Lock className="w-4 h-4" />
        }
    }

    const getStatusBadge = (status: string) => {
        const colors = {
            active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            completed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            abandoned: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
            archived: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        }
        return (
            <span className={`px-2 py-1 text-xs rounded-full border ${colors[status as keyof typeof colors]}`}>
                {status}
            </span>
        )
    }

    if (loading) {
        return <div className="text-center py-8 text-gray-400">Loading journeys...</div>
    }

    return (
        <div className="space-y-6">
            {/* Active Journey */}
            {activeJourney && (
                <div className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 border border-amber-700/30 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <BookOpen className="w-6 h-6 text-amber-400" />
                            <div>
                                <h3 className="text-xl font-semibold text-amber-100">Current Reading Journey</h3>
                                <p className="text-sm text-amber-300/70">
                                    Started {new Date(activeJourney.started_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {getVisibilityIcon(activeJourney.visibility)}
                            {getStatusBadge(activeJourney.status)}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-black/20 rounded p-3">
                            <p className="text-xs text-gray-400">Sessions</p>
                            <p className="text-2xl font-bold text-amber-100">{activeJourney.sessions_count || 0}</p>
                        </div>
                        <div className="bg-black/20 rounded p-3">
                            <p className="text-xs text-gray-400">Notes</p>
                            <p className="text-2xl font-bold text-amber-100">{activeJourney.thoughts_count || 0}</p>
                        </div>
                    </div>

                    {activeJourney.user_id === userId && (
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleCompleteJourney(activeJourney.id)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition"
                            >
                                Complete Journey
                            </button>
                            <select
                                value={activeJourney.visibility}
                                onChange={(e) => handleUpdateVisibility(activeJourney.id, e.target.value as VisibilityLevel)}
                                className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg text-sm"
                            >
                                <option value="public">Public</option>
                                <option value="connections">Connections</option>
                                <option value="private">Private</option>
                            </select>
                        </div>
                    )}
                </div>
            )}

            {/* Start New Journey Button */}
            {(!activeJourney || allJourneys.some(j => j.status === 'completed')) && (
                <button
                    onClick={() => setShowNewJourneyDialog(true)}
                    className="w-full py-4 border-2 border-dashed border-amber-700/50 hover:border-amber-600 rounded-lg text-amber-300 hover:text-amber-200 transition flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Start New Reading Season
                </button>
            )}

            {/* All Journeys List */}
            {allJourneys.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                        <Archive className="w-5 h-5" />
                        All Reading Seasons
                    </h3>
                    <div className="space-y-3">
                        {allJourneys.map((journey) => (
                            <div
                                key={journey.id}
                                className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 hover:border-gray-600 transition"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {getStatusBadge(journey.status)}
                                            {getVisibilityIcon(journey.visibility)}
                                        </div>
                                        <p className="text-sm text-gray-400">
                                            {new Date(journey.started_at).toLocaleDateString()}
                                            {journey.finished_at && ` - ${new Date(journey.finished_at).toLocaleDateString()}`}
                                        </p>
                                        {journey.rating && (
                                            <p className="text-sm text-amber-400 mt-1">
                                                {"⭐".repeat(Math.round(journey.rating))}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {journey.user_id === userId && (
                                            <>
                                                {journey.status === 'completed' && (
                                                    <button
                                                        onClick={() => handleReopenJourney(journey.id)}
                                                        className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200"
                                                        title="Reopen"
                                                    >
                                                        <RefreshCw className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {(journey.status === 'completed' || journey.status === 'abandoned') && (
                                                    <button
                                                        onClick={() => handleArchiveJourney(journey.id)}
                                                        className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200"
                                                        title="Archive"
                                                    >
                                                        <Archive className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteJourney(journey.id)}
                                                    className="p-2 hover:bg-red-700 rounded text-gray-400 hover:text-red-200"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        {isBookOwner && journey.user_id !== userId && (
                                            <button
                                                onClick={() => handleHideJourney(journey.id, !journey.is_hidden_by_owner)}
                                                className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200"
                                                title={journey.is_hidden_by_owner ? "Unhide" : "Hide"}
                                            >
                                                {journey.is_hidden_by_owner ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {journey.review && (
                                    <p className="text-sm text-gray-300 line-clamp-2">{journey.review}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* New Journey Dialog */}
            {showNewJourneyDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-semibold text-gray-100 mb-4">Start New Reading Season</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Create a new reading journey for this book. All your notes and sessions will be organized separately.
                        </p>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Privacy</label>
                            <select
                                value={selectedVisibility}
                                onChange={(e) => setSelectedVisibility(e.target.value as VisibilityLevel)}
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg"
                            >
                                <option value="public">Public - Everyone can see</option>
                                <option value="connections">Connections - Friends & Followers only</option>
                                <option value="private">Private - Only you can see</option>
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCreateJourney}
                                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition"
                            >
                                Create Journey
                            </button>
                            <button
                                onClick={() => setShowNewJourneyDialog(false)}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
