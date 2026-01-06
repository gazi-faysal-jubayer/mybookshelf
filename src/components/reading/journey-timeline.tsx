"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ReadingJourney, getAllJourneys } from "@/app/actions/journeys"
import { createClient } from "@/lib/supabase/client"
import { JourneyTimelineCard } from "./journey-timeline-card"
import { NewJourneyCard } from "./new-journey-card"
import { JourneyCardMenu } from "./journey-card-menu"
import { CreateJourneyDialog } from "./dialogs/create-journey-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { JourneyCardSkeleton } from "@/components/ui/loaders"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface JourneyTimelineProps {
    bookId: string
    userId: string
    isOwner: boolean
    totalPages?: number
    onJourneySelect?: (journey: ReadingJourney | null) => void
    initialJourneyId?: string
}

type FilterType = 'all' | 'active' | 'completed' | 'abandoned' | 'archived'

interface JourneyWithProgress extends ReadingJourney {
    progress: number
}

export function JourneyTimeline({
    bookId,
    userId,
    isOwner,
    totalPages,
    onJourneySelect,
    initialJourneyId
}: JourneyTimelineProps) {
    const router = useRouter()
    const [journeys, setJourneys] = useState<JourneyWithProgress[]>([])
    const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(initialJourneyId || null)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState<FilterType>('all')

    useEffect(() => {
        loadJourneys()
    }, [bookId, userId])

    const loadJourneys = async () => {
        setIsLoading(true)
        try {
            const data = await getAllJourneys(bookId, userId)

            // Calculate progress for each journey
            const supabase = createClient()
            const journeysWithProgress = await Promise.all(
                data.map(async (journey) => {
                    // Get max end_page from sessions for this journey
                    const { data: sessions } = await supabase
                        .from('reading_sessions')
                        .select('end_page')
                        .eq('journey_id', journey.id)
                        .order('end_page', { ascending: false })
                        .limit(1) as { data: { end_page: number }[] | null }

                    const currentPage = sessions?.[0]?.end_page || 0
                    const progress = totalPages ? Math.min((currentPage / totalPages) * 100, 100) : 0

                    return {
                        ...journey,
                        progress
                    }
                })
            )

            setJourneys(journeysWithProgress)

            // Auto-select journey: prioritize initialJourneyId, then active journey, then first journey
            // If initialJourneyId was provided and exists, select it
            if (initialJourneyId) {
                const targetJourney = journeysWithProgress.find(j => j.id === initialJourneyId)
                if (targetJourney) {
                    setSelectedJourneyId(targetJourney.id)
                    onJourneySelect?.(targetJourney)
                    return
                }
            }
            
            // Otherwise, select active journey or first journey (only on initial load)
            if (!selectedJourneyId || !journeysWithProgress.find(j => j.id === selectedJourneyId)) {
                const active = journeysWithProgress.find(j => j.status === 'active')
                if (active) {
                    setSelectedJourneyId(active.id)
                    onJourneySelect?.(active)
                } else if (journeysWithProgress.length > 0) {
                    setSelectedJourneyId(journeysWithProgress[0].id)
                    onJourneySelect?.(journeysWithProgress[0])
                }
            }
        } catch (error) {
            toast.error("Failed to load journeys")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSelectJourney = (journey: JourneyWithProgress) => {
        setSelectedJourneyId(journey.id)
        onJourneySelect?.(journey)
    }

    const filteredJourneys = journeys.filter(j => {
        if (filter === 'all') return true
        return j.status === filter
    })

    const getFilterCount = (status: FilterType) => {
        if (status === 'all') return journeys.length
        return journeys.filter(j => j.status === status).length
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">Reading Journeys</h3>
                    {journeys.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                            {journeys.length}
                        </Badge>
                    )}
                </div>

                <div className="flex gap-2">
                    {/* Filter */}
                    {journeys.length > 1 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Filter className="h-4 w-4 mr-1" />
                                    {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuRadioGroup value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
                                    <DropdownMenuRadioItem value="all">
                                        All ({getFilterCount('all')})
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="active">
                                        Active ({getFilterCount('active')})
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="completed">
                                        Completed ({getFilterCount('completed')})
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="abandoned">
                                        Abandoned ({getFilterCount('abandoned')})
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="archived">
                                        Archived ({getFilterCount('archived')})
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* Refresh */}
                    <Button variant="outline" size="sm" onClick={loadJourneys} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Horizontal Timeline */}
            <div className="relative">
                <div className="overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                    {isLoading ? (
                        <div className="flex gap-4">
                            {/* Loading skeletons */}
                            {[1, 2, 3].map(i => (
                                <JourneyCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex gap-4 min-w-max">
                            {/* New Journey Card */}
                            <NewJourneyCard onClick={() => setShowCreateDialog(true)} />

                            {/* Journey Cards */}
                            {filteredJourneys.map((journey) => (
                                <div key={journey.id} className="relative">
                                    <JourneyTimelineCard
                                        journey={journey}
                                        isActive={selectedJourneyId === journey.id}
                                        progress={journey.progress}
                                        totalPages={totalPages}
                                        onClick={() => handleSelectJourney(journey)}
                                    />
                                    {/* Menu positioned on top of the card */}
                                    <div className="absolute top-3 right-3 z-10">
                                        <JourneyCardMenu
                                            journey={journey}
                                            isOwner={isOwner}
                                            onUpdate={loadJourneys}
                                        />
                                    </div>
                                </div>
                            ))}

                            {/* Empty State - No filtered journeys */}
                            {filteredJourneys.length === 0 && filter !== 'all' && (
                                <div className="flex-shrink-0 w-[280px] h-[200px] flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                                    <div className="text-center text-muted-foreground p-6">
                                        <p className="text-sm">No {filter} journeys</p>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            onClick={() => setFilter('all')}
                                            className="mt-2"
                                        >
                                            Show all journeys
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Empty State - No journeys at all */}
            {!isLoading && journeys.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    <p>No reading journeys yet</p>
                    <p className="text-sm mt-2">Click the "+ New Journey" card to start!</p>
                </div>
            )}

            {/* Create Journey Dialog */}
            <CreateJourneyDialog
                bookId={bookId}
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onSuccess={async () => {
                    // Reload journeys and refresh router
                    await loadJourneys()
                    router.refresh()
                }}
                activeJourneyId={journeys.find(j => j.status === 'active')?.id}
            />
        </div>
    )
}
