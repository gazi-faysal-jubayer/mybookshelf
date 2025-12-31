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
import Book from "@/models/Book"
import connectDB from "@/lib/db"
import { BookCard } from "@/components/books/book-card"
import { auth } from "@/auth"
import { RecentActivity } from "@/components/dashboard/recent-activity"

export default async function BooksPage() {
    await connectDB()
    const session = await auth()

    // Fetch books for the current user
    const books = await Book.find({ user_id: session?.user?.id }).sort({ createdAt: -1 }).lean()

    return (
        <div className="flex flex-col gap-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <RecentActivity />
                <div className="col-span-4 lg:col-span-4 flex flex-col justify-center p-6 border rounded-lg bg-card shadow-sm">
                    <h3 className="text-lg font-medium">Welcome back, {session?.user?.name || "Reader"}!</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        You have {books.length} books in your collection.
                        {books.filter((b: any) => b.reading_status === "currently_reading").length > 0
                            ? ` You are currently reading ${books.filter((b: any) => b.reading_status === "currently_reading").length} books.`
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

            {books.length === 0 ? (
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
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {books.map((book) => (
                        <BookCard key={book._id.toString()} book={{ ...book, _id: book._id.toString() }} />
                    ))}
                </div>
            )}
        </div>
    )
}
