import { createClient, getUser } from "@/lib/supabase/server"
import { BookCard } from "@/components/books/book-card"
import { SearchX } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

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
                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed rounded-lg bg-muted/10 text-center p-8 gap-6">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <SearchX className="h-10 w-10 text-primary" />
                    </div>
                    <div className="space-y-2 max-w-sm">
                        <h3 className="text-xl font-semibold">Your wishlist is empty</h3>
                        <p className="text-muted-foreground">
                            Keep track of books you want to read. Search for any book and click "Add to Wishlist".
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/dashboard/discover">
                            Browse Books
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {wishlistBooks.map((book: any) => (
                        <BookCard key={book.id} book={{ ...book, _id: book.id }} />
                    ))}
                </div>
            )
            }
        </div >
    )
}
