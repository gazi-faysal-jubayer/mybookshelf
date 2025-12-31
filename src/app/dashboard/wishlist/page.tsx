import { auth } from "@/auth"
import connectDB from "@/lib/db"
import Book from "@/models/Book"
import { BookCard } from "@/components/books/book-card"
import { SearchX } from "lucide-react"

export default async function WishlistPage() {
    const session = await auth()
    if (!session?.user?.id) return null

    await connectDB()

    // Fetch wishlist books
    const books = await Book.find({
        user_id: session.user.id,
        ownership_status: "wishlist"
    }).sort({ createdAt: -1 }).lean()

    // Parse to avoid serialization issues with ObjectIds if any
    const wishlistBooks = JSON.parse(JSON.stringify(books))

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">My Wishlist</h1>

            {wishlistBooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg bg-muted/50 text-center p-8">
                    <SearchX className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
                    <p className="text-muted-foreground max-w-sm">
                        Books you mark as "Wishlist" will appear here. Add books you want to read or buy later.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {wishlistBooks.map((book: any) => (
                        <BookCard key={book._id} book={book} />
                    ))}
                </div>
            )}
        </div>
    )
}
