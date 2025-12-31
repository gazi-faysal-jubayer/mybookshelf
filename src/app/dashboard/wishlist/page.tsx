import { createClient, getUser } from "@/lib/supabase/server"
import { BookCard } from "@/components/books/book-card"
import { SearchX } from "lucide-react"

export default async function WishlistPage() {
    const user = await getUser()
    if (!user) return null

    const supabase = await createClient()

    // Fetch wishlist books
    const { data: books } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .eq('ownership_status', 'wishlist')
        .order('created_at', { ascending: false })

    const wishlistBooks = books || []

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
                        <BookCard key={book.id} book={{ ...book, _id: book.id }} />
                    ))}
                </div>
            )}
        </div>
    )
}
