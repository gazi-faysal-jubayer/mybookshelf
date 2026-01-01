import Link from "next/link"
import { Filter, Plus } from "lucide-react"

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
import { RecentActivity } from "@/components/dashboard/recent-activity"

export default async function BooksPage() {
    const supabase = await createClient()
    const userWithProfile = await getUserWithProfile()

    // Fetch books for the current user
    const { data: books } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', userWithProfile?.id || '')
        .order('created_at', { ascending: false })

    const booksList = books || []

    return (
        <div className="flex flex-col gap-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
                <RecentActivity />
                <div className="col-span-1 md:col-span-1 lg:col-span-7 flex flex-col justify-center p-6 border rounded-lg bg-card shadow-sm">
                    <h3 className="text-lg font-medium">Welcome back, {userWithProfile?.profile?.full_name || userWithProfile?.email?.split('@')[0] || "Reader"}!</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        You have {booksList.length} books in your collection.
                        {booksList.filter((b: any) => b.reading_status === "currently_reading").length > 0
                            ? ` You are currently reading ${booksList.filter((b: any) => b.reading_status === "currently_reading").length} books.`
                            : " Ready to start a new adventure?"}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Books</h1>
                    <p className="text-muted-foreground">
                        Manage your library, track reading, and handle lending.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 gap-1">
                                <Filter className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                    Filter
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked>
                                Owned
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem>Wishlist</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem>Lent Out</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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

            {booksList.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                        <Plus className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold">No books added yet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        You havent added any books to your library. Start building your collection now.
                    </p>
                    <Button asChild>
                        <Link href="/dashboard/books/add">Add your first book</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {booksList.map((book) => (
                        <BookCard key={book.id} book={{ ...book, _id: book.id }} />
                    ))}
                </div>
            )}
        </div>
    )
}
