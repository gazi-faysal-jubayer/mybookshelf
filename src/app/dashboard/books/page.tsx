import Link from "next/link"
import { Filter, Grid, List, Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { createClient, getUserWithProfile } from "@/lib/supabase/server"
import { BookCard } from "@/components/books/book-card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function BooksPage() {
    const supabase = await createClient()
    const userWithProfile = await getUserWithProfile()

    // Fetch all books for the current user
    const { data: books } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', userWithProfile?.id || '')
        .order('created_at', { ascending: false })

    const booksList = books || []

    // Group books by status
    const ownedBooks = booksList.filter((b: any) => b.ownership_status === 'owned')
    const wishlistBooks = booksList.filter((b: any) => b.ownership_status === 'wishlist')
    const borrowedBooks = booksList.filter((b: any) => b.ownership_status === 'borrowed_from_others')
    const currentlyReading = booksList.filter((b: any) => b.reading_status === 'currently_reading')
    const lentOutBooks = booksList.filter((b: any) => b.lending_status === 'lent_out')

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Books</h1>
                    <p className="text-muted-foreground">
                        {booksList.length} books in your library
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" asChild className="h-9 gap-1">
                        <Link href="/dashboard/books/add">
                            <Plus className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Add Book
                            </span>
                        </Link>
                    </Button>
                </div>
            </div>

            <Separator />

            {/* Tabs for different views */}
            <Tabs defaultValue="all" className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="all">All ({booksList.length})</TabsTrigger>
                        <TabsTrigger value="owned">Owned ({ownedBooks.length})</TabsTrigger>
                        <TabsTrigger value="reading">Reading ({currentlyReading.length})</TabsTrigger>
                        <TabsTrigger value="lent">Lent Out ({lentOutBooks.length})</TabsTrigger>
                        <TabsTrigger value="wishlist">Wishlist ({wishlistBooks.length})</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="all">
                    <BookGrid books={booksList} />
                </TabsContent>

                <TabsContent value="owned">
                    <BookGrid books={ownedBooks} emptyMessage="No owned books yet" />
                </TabsContent>

                <TabsContent value="reading">
                    <BookGrid books={currentlyReading} emptyMessage="No books currently being read" />
                </TabsContent>

                <TabsContent value="lent">
                    <BookGrid books={lentOutBooks} emptyMessage="No books currently lent out" />
                </TabsContent>

                <TabsContent value="wishlist">
                    <BookGrid books={wishlistBooks} emptyMessage="Your wishlist is empty" />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function BookGrid({ books, emptyMessage = "No books found" }: { books: any[], emptyMessage?: string }) {
    if (books.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">{emptyMessage}</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                    Add books to your collection to see them here.
                </p>
                <Button asChild>
                    <Link href="/dashboard/books/add">Add a book</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {books.map((book) => (
                <BookCard key={book.id} book={{ ...book, _id: book.id }} />
            ))}
        </div>
    )
}
