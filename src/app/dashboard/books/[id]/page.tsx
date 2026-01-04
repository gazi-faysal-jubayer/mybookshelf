import { notFound } from "next/navigation"
import { BookOpen, Tag, Calendar, Building2, Hash, Layers, MapPin, DollarSign, PenLine } from "lucide-react"

import { Separator } from "@/components/ui/separator"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { createClient, getUser } from "@/lib/supabase/server"
import { format } from "date-fns"
import { ReadingProgressCard } from "@/components/books/reading-progress-card"
import { ReadingSessionsList } from "@/components/books/reading-sessions-list"
import { BookReviewSection } from "@/components/books/book-review-section"
import { BookDetailHeader } from "@/components/books/book-detail-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function BookPage({ params }: { params: { id: string } }) {
    const user = await getUser()
    if (!user) return notFound()

    const supabase = await createClient()

    // Await the params object before accessing properties
    const { id } = await params

    // Fetch book with related data
    const { data: book, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (error || !book) {
        notFound()
    }

    // Fetch reading sessions
    const { data: sessions } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('book_id', id)
        .eq('user_id', user.id)
        .order('session_date', { ascending: false })

    // Fetch reading thoughts (during-reading notes)
    const { data: thoughts } = await supabase
        .from('reading_thoughts')
        .select('*')
        .eq('book_id', id)
        .eq('user_id', user.id)
        .order('page_number', { ascending: true, nullsFirst: false })

    // Fetch final review from book_reviews
    const { data: finalReview } = await supabase
        .from('book_reviews')
        .select('*')
        .eq('book_id', id)
        .eq('user_id', user.id)
        .single()

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
            {/* Header Section with Inline Editing */}
            <BookDetailHeader book={book} />

            <Separator />

            {/* Main Content Areas */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="reading">Reading</TabsTrigger>
                    <TabsTrigger value="review">Reviews</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <div className="grid gap-6 lg:grid-cols-3 mt-6">
                    {/* Left/Main Column - Varies by Tab */}
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

                            {/* Recent Progress (if reading) */}
                            {book.reading_status === "currently_reading" && (
                                <ReadingProgressCard book={book} />
                            )}
                        </TabsContent>

                        <TabsContent value="reading" className="mt-0 space-y-6">
                            <ReadingProgressCard book={book} />
                            <ReadingSessionsList sessions={sessions || []} bookId={book.id} />
                        </TabsContent>

                        <TabsContent value="review" className="mt-0 space-y-6">
                            <BookReviewSection
                                thoughts={thoughts || []}
                                finalReview={finalReview || null}
                                bookId={book.id}
                                currentPage={book.current_page || 0}
                            />
                        </TabsContent>

                        <TabsContent value="details" className="mt-0 space-y-6">
                            <div className="space-y-6">
                                {/* Basic Details */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Physical Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="text-muted-foreground">Format</div>
                                            <div className="capitalize">{book.format || "-"}</div>

                                            <div className="text-muted-foreground">Pages</div>
                                            <div>{book.total_pages || "-"}</div>

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

                    {/* Right Column - Always Visible Context or Additional Info */}
                    <div className="space-y-6">
                        {/* Quick Notes */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center justify-between">
                                    Quick Notes
                                    <PenLine className="h-4 w-4 text-muted-foreground" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm italic text-muted-foreground min-h-[60px]">
                                    {book.review || "No quick notes."}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Purchase/Ownership Info */}
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
