import { notFound } from "next/navigation"
import Image from "next/image"
import { BookOpen, Tag, Calendar, Building2, Hash, Layers, MapPin, DollarSign } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
import { BookActionsBar } from "@/components/books/book-actions-bar"

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

    const ownershipLabels: Record<string, string> = {
        owned: "Owned",
        borrowed_from_others: "Borrowed",
        wishlist: "Wishlist",
        sold: "Sold",
        lost: "Lost",
    }

    const readingLabels: Record<string, string> = {
        to_read: "To Read",
        currently_reading: "Currently Reading",
        completed: "Completed",
        abandoned: "Abandoned",
    }

    const formatLabels: Record<string, string> = {
        hardcover: "Hardcover",
        paperback: "Paperback",
        ebook: "E-Book",
        audiobook: "Audiobook",
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Cover Image */}
                <div className="shrink-0">
                    {book.cover_image ? (
                        <div className="relative w-[180px] h-[270px] rounded-lg overflow-hidden shadow-lg">
                            <Image
                                src={book.cover_image}
                                alt={book.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-[180px] h-[270px] rounded-lg bg-muted flex items-center justify-center shadow-lg">
                            <BookOpen className="h-16 w-16 text-muted-foreground" />
                        </div>
                    )}
                </div>

                {/* Title and Meta */}
                <div className="flex-1 space-y-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
                        <p className="text-xl text-muted-foreground mt-1">{book.author}</p>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                        <Badge variant={book.ownership_status === "owned" ? "default" : "secondary"}>
                            {ownershipLabels[book.ownership_status] || book.ownership_status}
                        </Badge>
                        <Badge variant={book.reading_status === "currently_reading" ? "default" : "outline"}>
                            {readingLabels[book.reading_status] || book.reading_status}
                        </Badge>
                        {book.format && (
                            <Badge variant="outline">
                                {formatLabels[book.format] || book.format}
                            </Badge>
                        )}
                        {book.genre && (
                            <Badge variant="outline" className="gap-1">
                                <Tag className="h-3 w-3" />
                                {Array.isArray(book.genre) ? book.genre[0] : book.genre}
                            </Badge>
                        )}
                    </div>

                    {/* Quick Stats */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {book.total_pages && (
                            <div className="flex items-center gap-1">
                                <Layers className="h-4 w-4" />
                                <span>{book.total_pages} pages</span>
                            </div>
                        )}
                        {book.publication_year && (
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{book.publication_year}</span>
                            </div>
                        )}
                        {book.publisher && (
                            <div className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                <span>{book.publisher}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions Bar */}
                    <BookActionsBar book={book} />
                </div>
            </div>

            <Separator />

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Reading Progress */}
                    <ReadingProgressCard book={book} />

                    {/* Reading Sessions */}
                    <ReadingSessionsList sessions={sessions || []} bookId={book.id} />

                    {/* Reviews Section */}
                    <BookReviewSection
                        thoughts={thoughts || []}
                        finalReview={finalReview || null}
                        bookId={book.id}
                        currentPage={book.current_page || 0}
                    />
                </div>

                {/* Right Column - Details */}
                <div className="space-y-6">
                    {/* Book Details Card */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Book Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {book.isbn && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1">
                                        <Hash className="h-4 w-4" />
                                        ISBN
                                    </span>
                                    <span className="font-mono">{book.isbn}</span>
                                </div>
                            )}
                            {book.publisher && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1">
                                        <Building2 className="h-4 w-4" />
                                        Publisher
                                    </span>
                                    <span>{book.publisher}</span>
                                </div>
                            )}
                            {book.publication_year && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        Year
                                    </span>
                                    <span>{book.publication_year}</span>
                                </div>
                            )}
                            {book.total_pages && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1">
                                        <Layers className="h-4 w-4" />
                                        Pages
                                    </span>
                                    <span>{book.total_pages}</span>
                                </div>
                            )}
                            {book.language && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Language</span>
                                    <span>{book.language}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Purchase Info Card */}
                    {(book.purchase_date || book.purchase_price || book.purchase_location) && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Purchase Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {book.purchase_date && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            Purchased
                                        </span>
                                        <span>{format(new Date(book.purchase_date), "PPP")}</span>
                                    </div>
                                )}
                                {book.purchase_price && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <DollarSign className="h-4 w-4" />
                                            Price
                                        </span>
                                        <span>
                                            {book.purchase_currency || "$"}{book.purchase_price}
                                        </span>
                                    </div>
                                )}
                                {book.purchase_location && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            Location
                                        </span>
                                        <span>{book.purchase_location}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Borrowed Info Card */}
                    {book.ownership_status === "borrowed_from_others" && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Borrowed From</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {book.borrowed_owner_name && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Owner</span>
                                        <span>{book.borrowed_owner_name}</span>
                                    </div>
                                )}
                                {book.borrowed_borrow_date && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Borrowed</span>
                                        <span>{format(new Date(book.borrowed_borrow_date), "PPP")}</span>
                                    </div>
                                )}
                                {book.borrowed_due_date && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Due Date</span>
                                        <span className={
                                            new Date(book.borrowed_due_date) < new Date()
                                                ? "text-destructive font-medium"
                                                : ""
                                        }>
                                            {format(new Date(book.borrowed_due_date), "PPP")}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Description Card */}
                    {book.description && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {book.description}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Quick Notes Card */}
                    {book.review && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Quick Notes</CardTitle>
                                <CardDescription>From your book form</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm italic text-muted-foreground">
                                    "{book.review}"
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Timestamps */}
                    <div className="text-xs text-muted-foreground space-y-1">
                        {book.created_at && (
                            <p>Added: {format(new Date(book.created_at), "PPP")}</p>
                        )}
                        {book.updated_at && book.updated_at !== book.created_at && (
                            <p>Updated: {format(new Date(book.updated_at), "PPP")}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
