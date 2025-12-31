import { searchBooks } from "@/app/actions/search"
import { BookCard } from "@/components/books/book-card"
import { SearchX } from "lucide-react"

export async function SearchResults({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const query = typeof searchParams.q === "string" ? searchParams.q : undefined
    const genre = typeof searchParams.genre === "string" ? searchParams.genre : undefined
    const status = typeof searchParams.status === "string" ? searchParams.status : undefined
    const minRating = typeof searchParams.minRating === "string" ? Number(searchParams.minRating) : undefined
    const sort = typeof searchParams.sort === "string" ? searchParams.sort : undefined

    const books = await searchBooks({ query, genre, status, minRating, sort })

    if (books.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 border border-dashed rounded-lg bg-muted/50">
                <SearchX className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No books found</h3>
                <p className="text-muted-foreground">
                    Try adjusting your filters or search terms.
                </p>
            </div>
        )
    }

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {books.map((book: any) => (
                <BookCard key={book._id} book={book} />
            ))}
        </div>
    )
}
