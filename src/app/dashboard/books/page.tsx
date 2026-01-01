import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { createClient, getUserWithProfile } from "@/lib/supabase/server"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BooksClientWrapper } from "@/components/books/books-client-wrapper"

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
                <div className="flex items-center justify-between mb-4 overflow-x-auto scrollbar-hide pb-1">
                    <TabsList className="inline-flex h-auto min-w-max">
                        <TabsTrigger value="all" className="text-xs sm:text-sm">All ({booksList.length})</TabsTrigger>
                        <TabsTrigger value="owned" className="text-xs sm:text-sm">Owned ({ownedBooks.length})</TabsTrigger>
                        <TabsTrigger value="reading" className="text-xs sm:text-sm">Reading ({currentlyReading.length})</TabsTrigger>
                        <TabsTrigger value="lent" className="text-xs sm:text-sm">Lent ({lentOutBooks.length})</TabsTrigger>
                        <TabsTrigger value="wishlist" className="text-xs sm:text-sm">Wishlist ({wishlistBooks.length})</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="all">
                    <BooksClientWrapper books={booksList} />
                </TabsContent>

                <TabsContent value="owned">
                    <BooksClientWrapper books={ownedBooks} emptyMessage="No owned books yet" />
                </TabsContent>

                <TabsContent value="reading">
                    <BooksClientWrapper books={currentlyReading} emptyMessage="No books currently being read" />
                </TabsContent>

                <TabsContent value="lent">
                    <BooksClientWrapper books={lentOutBooks} emptyMessage="No books currently lent out" />
                </TabsContent>

                <TabsContent value="wishlist">
                    <BooksClientWrapper books={wishlistBooks} emptyMessage="Your wishlist is empty" />
                </TabsContent>
            </Tabs>
        </div>
    )
}
