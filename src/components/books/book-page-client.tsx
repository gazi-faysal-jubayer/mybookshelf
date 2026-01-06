"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { BookOpen, Tag, Calendar, Building2, Hash, Layers, MapPin, DollarSign, PenLine } from "lucide-react"
import { format } from "date-fns"

import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookDetailHeader } from "@/components/books/book-detail-header"
import { JourneyTimeline } from "@/components/reading/journey-timeline"
import { SessionViewer } from "@/components/reading/session-viewer"
import { BookReviewSection } from "@/components/books/book-review-section"
import { QuickNotesCardWithJourney } from "@/components/books/quick-notes-card-journey"
import { ReadingProgressCardWithJourney } from "@/components/books/reading-progress-card-journey"
import { ReadingJourney, getJourneyStats } from "@/app/actions/journeys"
import { createClient } from "@/lib/supabase/client"
import { TabLoader, ReadingProgressSkeleton, QuickNotesSkeleton, SessionViewerSkeleton } from "@/components/ui/loaders"

interface BookPageClientProps {
    book: any
    userId: string
    thoughts: any[]
    finalReview: any
    initialJourneyId?: string
    defaultTab?: string
}

export function BookPageClient({
    book,
    userId,
    thoughts,
    finalReview,
    initialJourneyId,
    defaultTab = "overview"
}: BookPageClientProps) {
    const [selectedJourney, setSelectedJourney] = useState<ReadingJourney | null>(null)
    const [journeyThoughts, setJourneyThoughts] = useState<any[]>([])
    const [journeyPagesRead, setJourneyPagesRead] = useState<number>(0)
    const [refreshKey, setRefreshKey] = useState(0)
    const [isJourneyLoading, setIsJourneyLoading] = useState(false)
    const [isTabLoading, setIsTabLoading] = useState(false)
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    
    const currentTab = searchParams.get('tab') || defaultTab

    // Load journey data when journey changes
    useEffect(() => {
        if (selectedJourney) {
            setIsJourneyLoading(true)
            Promise.all([
                loadJourneyThoughts(selectedJourney.id),
                loadJourneyStats(selectedJourney.id)
            ]).finally(() => {
                setIsJourneyLoading(false)
            })
        } else {
            setJourneyThoughts([])
            setJourneyPagesRead(0)
        }
    }, [selectedJourney?.id, refreshKey])

    async function loadJourneyStats(journeyId: string) {
        const stats = await getJourneyStats(journeyId)
        if (stats) {
            setJourneyPagesRead(stats.totalPagesRead)
        }
    }

    async function loadJourneyThoughts(journeyId: string) {
        const supabase = createClient()
        const { data } = await supabase
            .from('reading_thoughts')
            .select('*')
            .eq('journey_id', journeyId)
            .order('created_at', { ascending: false })
        
        setJourneyThoughts(data || [])
    }

    // Update URL when journey is selected
    const handleJourneySelect = useCallback((journey: ReadingJourney | null) => {
        setSelectedJourney(journey)
        
        if (journey) {
            const params = new URLSearchParams(searchParams.toString())
            params.set('journey', journey.id)
            router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        }
    }, [router, pathname, searchParams])

    const handleTabChange = (value: string) => {
        setIsTabLoading(true)
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', value)
        if (selectedJourney) {
            params.set('journey', selectedJourney.id)
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        // Short delay to show loading state
        setTimeout(() => setIsTabLoading(false), 150)
    }

    const handleUpdate = () => {
        setRefreshKey(prev => prev + 1)
        router.refresh()
    }

    // Calculate progress based on selected journey or book
    const currentPage = selectedJourney ? journeyPagesRead : (book.current_page ?? 0)
    const totalPages = book.pages || 0
    const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0

    // Use journey-specific thoughts if a journey is selected, otherwise use all thoughts
    const displayThoughts = selectedJourney ? journeyThoughts : thoughts

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
            {/* Header Section */}
            <BookDetailHeader book={book} />

            <Separator />

            {/* Main Content */}
            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="reading">Reading</TabsTrigger>
                    <TabsTrigger value="review">Reviews</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <div className="grid gap-6 lg:grid-cols-3 mt-6">
                    {/* Left/Main Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <TabsContent value="overview" className="mt-0 space-y-6">
                            {/* Description Card */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <BookOpen className="h-5 w-5" />
                                        Synopsis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {book.description || "No description added yet."}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Reading Progress - Journey aware */}
                            {book.reading_status === "currently_reading" && (
                                isJourneyLoading ? (
                                    <ReadingProgressSkeleton />
                                ) : (
                                    <ReadingProgressCardWithJourney 
                                        book={book} 
                                        journey={selectedJourney}
                                        journeyPagesRead={journeyPagesRead}
                                        onUpdate={handleUpdate}
                                    />
                                )
                            )}
                        </TabsContent>

                        <TabsContent value="reading" className="mt-0 space-y-6">
                            <JourneyTimeline
                                key={`timeline-${refreshKey}`}
                                bookId={book.id}
                                userId={userId}
                                isOwner={true}
                                totalPages={book.pages}
                                onJourneySelect={handleJourneySelect}
                                initialJourneyId={initialJourneyId}
                            />

                            <SessionViewer
                                key={`viewer-${refreshKey}-${selectedJourney?.id}`}
                                journey={selectedJourney}
                                book={{
                                    id: book.id,
                                    title: book.title || '',
                                    pages: book.pages || null
                                }}
                                onUpdate={handleUpdate}
                            />
                        </TabsContent>

                        <TabsContent value="review" className="mt-0 space-y-6">
                            <BookReviewSection
                                thoughts={displayThoughts}
                                finalReview={finalReview}
                                bookId={book.id}
                                currentPage={currentPage}
                            />
                        </TabsContent>

                        <TabsContent value="details" className="mt-0 space-y-6">
                            <div className="space-y-6">
                                {/* Physical Details */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Physical Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="text-muted-foreground">Format</div>
                                            <div className="capitalize">{book.format || "-"}</div>

                                            <div className="text-muted-foreground">Pages</div>
                                            <div>{book.pages || "-"}</div>

                                            <div className="text-muted-foreground">Language</div>
                                            <div>{book.language || "-"}</div>

                                            <div className="text-muted-foreground">Dimensions</div>
                                            <div>-</div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Metadata */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm text-muted-foreground">Metadata</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                                        <div className="flex justify-between">
                                            <span>ISBN</span>
                                            <span className="font-mono select-all">{book.isbn || "-"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Added</span>
                                            <span>{format(new Date(book.created_at), "PPP")}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Database ID</span>
                                            <span className="font-mono text-xs">{book.id}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </div>

                    {/* Right Column - Always Visible */}
                    <div className="space-y-6">
                        {/* Quick Notes - Journey aware */}
                        {isJourneyLoading ? (
                            <QuickNotesSkeleton />
                        ) : (
                            <QuickNotesCardWithJourney 
                                bookId={book.id} 
                                journeyId={selectedJourney?.id}
                                thoughts={displayThoughts}
                                onUpdate={handleUpdate}
                            />
                        )}

                        {/* Ownership Info */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Ownership</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {book.ownership_status === "owned" && (
                                    <>
                                        {book.purchase_date && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Purchased
                                                </span>
                                                <span>{format(new Date(book.purchase_date), "PP")}</span>
                                            </div>
                                        )}
                                        {book.purchase_price && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground flex items-center gap-1">
                                                    <DollarSign className="h-3 w-3" />
                                                    Price
                                                </span>
                                                <span>{book.purchase_currency}{book.purchase_price}</span>
                                            </div>
                                        )}
                                        {book.purchase_location && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    Store
                                                </span>
                                                <span className="truncate max-w-[120px]" title={book.purchase_location}>
                                                    {book.purchase_location}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}

                                {book.ownership_status === "borrowed_from_others" && (
                                    <div className="text-sm p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-900">
                                        Borrowed from {book.borrowed_owner_name || "Unknown"}
                                        {book.borrowed_due_date && (
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                Due: {format(new Date(book.borrowed_due_date), "PP")}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </Tabs>
        </div>
    )
}
