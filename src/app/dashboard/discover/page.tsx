import { Suspense } from "react"
import { getUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { discoverBooks, getTrendingBooks, getNearbyBooks, getRecommendedBooks } from "@/app/actions/discover"
import { BookGrid } from "./book-grid"
import { SearchForm } from "./search-form"
import { TrendingSection } from "./trending-section"
import { NearbySection } from "./nearby-section"
import { BookCardSkeleton } from "@/components/books/book-card-skeleton"

interface DiscoverPageProps {
    searchParams: Promise<{
        q?: string
        genre?: string
        available?: string
        nearby?: string
        sort?: string
        page?: string
    }>
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
    const user = await getUser()
    if (!user) redirect("/login")

    const params = await searchParams
    const hasSearchQuery = params.q || params.genre || params.available || params.nearby

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Discover Books</h1>
                <p className="text-muted-foreground mt-2">
                    Find books in your community and connect with fellow readers
                </p>
            </div>

            {/* Search Form */}
            <SearchForm 
                defaultQuery={params.q}
                defaultGenre={params.genre}
                defaultAvailable={params.available === 'true'}
                defaultNearby={params.nearby === 'true'}
                defaultSort={params.sort as any}
            />

            {/* Results or Discovery Sections */}
            {hasSearchQuery ? (
                <Suspense fallback={<SearchResultsSkeleton />}>
                    <SearchResults params={params} />
                </Suspense>
            ) : (
                <div className="space-y-10">
                    {/* Nearby Books */}
                    <Suspense fallback={<SectionSkeleton title="Books Near You" />}>
                        <NearbyBooksSection />
                    </Suspense>

                    {/* Trending */}
                    <Suspense fallback={<SectionSkeleton title="Trending This Week" />}>
                        <TrendingBooksSection />
                    </Suspense>

                    {/* Recommendations */}
                    <Suspense fallback={<SectionSkeleton title="Recommended for You" />}>
                        <RecommendedBooksSection />
                    </Suspense>
                </div>
            )}
        </div>
    )
}

async function SearchResults({ params }: { params: any }) {
    const { books, total } = await discoverBooks({
        query: params.q,
        genre: params.genre,
        availableOnly: params.available === 'true',
        nearbyOnly: params.nearby === 'true',
        sortBy: params.sort,
        page: parseInt(params.page || '1')
    })

    if (books.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No books found matching your criteria.</p>
                <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your filters or search terms.
                </p>
            </div>
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                    Found {total} book{total !== 1 ? 's' : ''}
                </p>
            </div>
            <BookGrid books={books} />
        </div>
    )
}

async function NearbyBooksSection() {
    const books = await getNearbyBooks(25, 8)

    if (books.length === 0) {
        return null
    }

    return <NearbySection books={books} />
}

async function TrendingBooksSection() {
    const books = await getTrendingBooks(8)

    if (books.length === 0) {
        return null
    }

    return <TrendingSection books={books} />
}

async function RecommendedBooksSection() {
    const books = await getRecommendedBooks(8)

    if (books.length === 0) {
        return null
    }

    return (
        <section>
            <h2 className="text-xl font-semibold mb-4">Recommended for You</h2>
            <BookGrid books={books} />
        </section>
    )
}

function SearchResultsSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <BookCardSkeleton key={i} />
            ))}
        </div>
    )
}

function SectionSkeleton({ title }: { title: string }) {
    return (
        <section>
            <h2 className="text-xl font-semibold mb-4">{title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <BookCardSkeleton key={i} />
                ))}
            </div>
        </section>
    )
}
